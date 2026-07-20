import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";

const DIAS_ES: Record<string, string> = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miercoles",
  4: "jueves",
  5: "viernes",
  6: "sabado",
};

function generarSlots(horarios: string[]): string[] {
  const slots: string[] = [];
  for (const rango of horarios) {
    const [inicio, fin] = rango.split("-");
    if (!inicio || !fin) continue;
    const [hInicio, mInicio] = inicio.split(":").map(Number);
    const [hFin, mFin] = fin.split(":").map(Number);
    let h = hInicio;
    let m = mInicio;
    while (h < hFin || (h === hFin && m < mFin)) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 30;
      if (m >= 60) {
        h++;
        m = 0;
      }
    }
  }
  return slots;
}

export async function GET(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "CITAS", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const medico_id = searchParams.get("medico_id");
    const fecha = searchParams.get("fecha");

    if (!medico_id || !fecha) {
      return NextResponse.json(
        { error: "medico_id y fecha son requeridos" },
        { status: 400 }
      );
    }

    const { rows: medicoRows } = await pool.query(
      "SELECT id, horario_atencion FROM medico WHERE id = $1 AND activo = TRUE",
      [parseInt(medico_id)]
    );
    if (medicoRows.length === 0) {
      return NextResponse.json(
        { error: "Médico no encontrado o inactivo" },
        { status: 404 }
      );
    }

    const medico = medicoRows[0];
    let horarioObj: Record<string, string[]> = {};

    if (medico.horario_atencion) {
      try {
        horarioObj = JSON.parse(medico.horario_atencion);
      } catch {
        return NextResponse.json(
          { error: "Horario del médico con formato inválido" },
          { status: 500 }
        );
      }
    }

    const fechaDate = new Date(`${fecha}T12:00:00`);
    const diaSemana = fechaDate.getDay();
    const diaNombre = DIAS_ES[diaSemana];

    const horariosDia = horarioObj[diaNombre] || [];
    const todosLosSlots = generarSlots(horariosDia);

    if (todosLosSlots.length === 0) {
      return NextResponse.json({
        medico_id: parseInt(medico_id),
        fecha,
        slots_disponibles: [],
        slots_ocupados: [],
      });
    }

    const { rows: ocupados } = await pool.query(
      `SELECT hora::text FROM cita
       WHERE medico_id = $1 AND fecha = $2
       AND estado NOT IN ('CANCELADA')`,
      [parseInt(medico_id), fecha]
    );

    const horasOcupadas = new Set(ocupados.map((r) => r.hora.substring(0, 5)));
    const slotsDisponibles = todosLosSlots.filter((s) => !horasOcupadas.has(s));
    const slotsOcupados = todosLosSlots.filter((s) => horasOcupadas.has(s));

    return NextResponse.json({
      medico_id: parseInt(medico_id),
      fecha,
      dia_semana: diaNombre,
      slots_disponibles: slotsDisponibles,
      slots_ocupados: slotsOcupados,
    });
  } catch (error) {
    console.error("Error al obtener disponibilidad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
