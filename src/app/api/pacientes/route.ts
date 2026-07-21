import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { hashPassword } from "@/lib/hash";

export async function GET(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";

    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre, u.paciente_id FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;

    // RN-20: PACIENTE solo puede ver su propio registro; el resto necesita PACIENTES READ
    if (rol !== "PACIENTE" && !await verificarPermiso(sesion.usuario_id, "PACIENTES", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    let query: string;
    let params: (string | number)[];

    if (rol === "PACIENTE") {
      const pacienteId = rolRows[0].paciente_id;
      if (!pacienteId) {
        return NextResponse.json([]);
      }
      query = `
        SELECT p.*, u.username AS usuario_username
        FROM paciente p
        LEFT JOIN usuario u ON u.paciente_id = p.id
        WHERE p.id = $1
        ORDER BY p.apellido, p.nombre`;
      params = [pacienteId];
    } else if (busqueda) {
      query = `
        SELECT p.*, u.username AS usuario_username
        FROM paciente p
        LEFT JOIN usuario u ON u.paciente_id = p.id
        WHERE (p.ci ILIKE $1 OR p.nombre ILIKE $1 OR p.apellido ILIKE $1)
        ORDER BY p.apellido, p.nombre`;
      params = [`%${busqueda}%`];
    } else {
      query = `
        SELECT p.*, u.username AS usuario_username
        FROM paciente p
        LEFT JOIN usuario u ON u.paciente_id = p.id
        ORDER BY p.apellido, p.nombre`;
      params = [];
    }

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar pacientes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "PACIENTES", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const {
      ci, nombre, apellido, fecha_nacimiento,
      sexo, direccion, telefono, email, seguro_medico,
      alergias,
      crear_usuario, password,
    } = body;

    // Validación de campos obligatorios
    if (!ci || !nombre || !apellido || !fecha_nacimiento) {
      return NextResponse.json(
        { error: "ci, nombre, apellido y fecha_nacimiento son requeridos" },
        { status: 400 }
      );
    }

    // RN-01: Verificar CI único
    const { rows: existente } = await pool.query(
      "SELECT id, ci, nombre, apellido FROM paciente WHERE ci = $1",
      [ci]
    );
    if (existente.length > 0) {
      return NextResponse.json(
        { error: "Ya existe un paciente con esta CI", paciente: existente[0] },
        { status: 409 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Crear PACIENTE (RN-22: registrado_por)
      const { rows: pacienteRows } = await client.query(
        `INSERT INTO paciente
           (ci, nombre, apellido, fecha_nacimiento, sexo, direccion, telefono, email, seguro_medico, registrado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          ci, nombre, apellido, fecha_nacimiento,
          sexo ?? null, direccion ?? null, telefono ?? null,
          email ?? null, seguro_medico ?? null, sesion.usuario_id,
        ]
      );
      const paciente = pacienteRows[0];

      // RN-02: Crear HISTORIAL_CLINICO automáticamente
      const { rows: historialRows } = await client.query(
        "INSERT INTO historial_clinico (paciente_id) VALUES ($1) RETURNING id",
        [paciente.id]
      );
      const historialId = historialRows[0].id;

      // Opcional: Registrar alergias iniciales (RN-24)
      let alergiasCreadas = 0;
      if (alergias && Array.isArray(alergias) && alergias.length > 0) {
        for (const alergia of alergias) {
          if (!alergia.sustancia) continue;
          await client.query(
            `INSERT INTO alergia (historial_id, sustancia, reaccion, severidad, usuario_id, fecha_registro)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              historialId,
              alergia.sustancia,
              alergia.reaccion ?? null,
              alergia.severidad ?? null,
              sesion.usuario_id,
            ]
          );
          alergiasCreadas++;
        }
      }

      // Opcional: Crear USUARIO con rol PACIENTE
      let usuarioCreado = false;
      if (crear_usuario && password) {
        const { rows: rolRows } = await client.query(
          "SELECT id FROM rol WHERE nombre = 'PACIENTE'"
        );
        if (rolRows.length > 0) {
          const password_hash = await hashPassword(password);
          // Username = ci del paciente
          await client.query(
            `INSERT INTO usuario (username, password_hash, rol_id, paciente_id, creado_por, activo)
             VALUES ($1, $2, $3, $4, $5, TRUE)`,
            [ci, password_hash, rolRows[0].id, paciente.id, sesion.usuario_id]
          );
          usuarioCreado = true;
        }
      }

      await client.query("COMMIT");

      return NextResponse.json(
        {
          mensaje: "Paciente registrado exitosamente",
          paciente,
          historial_clinico_id: historialId,
          alergias_creadas: alergiasCreadas,
          usuario_creado: usuarioCreado,
        },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al registrar paciente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
