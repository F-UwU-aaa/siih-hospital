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
    if (!await verificarPermiso(sesion.usuario_id, "SEGURIDAD", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email, u.ultimo_acceso, u.activo, u.creado_por,
              r.nombre AS rol_nombre,
              COALESCE(m.nombre || ' ' || m.apellido,
                       e.nombre || ' ' || e.apellido,
                       f.nombre || ' ' || f.apellido,
                       tl.nombre || ' ' || tl.apellido,
                       a.nombre || ' ' || a.apellido,
                       fa.nombre || ' ' || fa.apellido,
                       p.nombre || ' ' || p.apellido, '') AS nombre_completo
       FROM usuario u
       JOIN rol r ON u.rol_id = r.id
       LEFT JOIN medico m ON u.medico_id = m.id
       LEFT JOIN enfermera e ON u.enfermera_id = e.id
       LEFT JOIN farmaceutico f ON u.farmaceutico_id = f.id
       LEFT JOIN tecnico_laboratorio tl ON u.tecnico_lab_id = tl.id
       LEFT JOIN admisionista a ON u.admisionista_id = a.id
       LEFT JOIN facturador fa ON u.facturador_id = fa.id
       LEFT JOIN paciente p ON u.paciente_id = p.id
       ORDER BY u.id`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
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
    if (!await verificarPermiso(sesion.usuario_id, "SEGURIDAD", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const {
      username, password, email,
      rol_nombre,
      // Datos del actor
      ci, nombre, apellido,
      especialidad, turno, telefono,
      horario_atencion,
    } = body;

    if (!username || !password || !rol_nombre) {
      return NextResponse.json(
        { error: "username, password y rol_nombre son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el rol existe
    const { rows: rolRows } = await pool.query(
      "SELECT id FROM rol WHERE nombre = $1",
      [rol_nombre]
    );
    if (rolRows.length === 0) {
      return NextResponse.json(
        { error: `Rol '${rol_nombre}' no existe` },
        { status: 400 }
      );
    }
    const rol_id = rolRows[0].id;

    // Verificar username único
    const { rows: existente } = await pool.query(
      "SELECT id FROM usuario WHERE username = $1",
      [username]
    );
    if (existente.length > 0) {
      return NextResponse.json(
        { error: "El username ya existe" },
        { status: 409 }
      );
    }

    const password_hash = await hashPassword(password);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let actorId: number | null = null;
      let actorColumn: string | null = null;

      // Crear tabla de actor según el rol (excepto PACIENTE y DIRECTOR)
      const actorMap: Record<string, { table: string; column: string; extraFields: string[] }> = {
        MEDICO:        { table: "medico",                column: "medico_id",        extraFields: ["especialidad", "horario_atencion"] },
        ENFERMERA:     { table: "enfermera",             column: "enfermera_id",     extraFields: ["turno"] },
        FARMACEUTICO:  { table: "farmaceutico",          column: "farmaceutico_id",  extraFields: [] },
        TECNICO_LAB:   { table: "tecnico_laboratorio",   column: "tecnico_lab_id",   extraFields: [] },
        ADMISIONISTA:  { table: "admisionista",          column: "admisionista_id",  extraFields: [] },
        FACTURADOR:    { table: "facturador",            column: "facturador_id",    extraFields: [] },
      };

      const actorInfo = actorMap[rol_nombre];

      if (actorInfo) {
        if (!ci || !nombre || !apellido) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "ci, nombre y apellido son requeridos para este rol" },
            { status: 400 }
          );
        }

        // Construir INSERT dinámico para el actor
        const fields = ["ci", "nombre", "apellido", "telefono", "email"];
        const values: (string | null)[] = [ci, nombre, apellido, telefono ?? null, email ?? null];
        let paramIdx = 1;
        const fieldClauses: string[] = [];

        for (const f of fields) {
          fieldClauses.push(`${f} = $${paramIdx}`);
          paramIdx++;
        }

        for (const f of actorInfo.extraFields) {
          if (body[f] !== undefined) {
            fieldClauses.push(`${f} = $${paramIdx}`);
            values.push(body[f]);
            paramIdx++;
          }
        }

        const insertActorQuery = `
          INSERT INTO ${actorInfo.table} (ci, nombre, apellido, telefono, email${actorInfo.extraFields.filter(f => body[f] !== undefined).map(f => `, ${f}`).join('')})
          VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
          RETURNING id`;

        const actorResult = await client.query(insertActorQuery, values);
        actorId = actorResult.rows[0].id;
        actorColumn = actorInfo.column;
      }

      // Crear usuario
      const usuarioFields = ["username", "password_hash", "email", "rol_id", "creado_por"];
      const usuarioValues: (string | number | null)[] = [username, password_hash, email ?? null, rol_id, sesion.usuario_id];
      let paramIdx = 1;

      if (actorColumn && actorId) {
        usuarioFields.push(actorColumn);
        usuarioValues.push(actorId);
      }

      const insertUsuarioQuery = `
        INSERT INTO usuario (${usuarioFields.join(', ')})
        VALUES (${usuarioValues.map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING id`;

      const usuarioResult = await client.query(insertUsuarioQuery, usuarioValues);
      const nuevoUsuarioId = usuarioResult.rows[0].id;

      await client.query("COMMIT");

      return NextResponse.json(
        {
          mensaje: "Usuario creado exitosamente",
          usuario_id: nuevoUsuarioId,
          actor_id: actorId,
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
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
