import { NextResponse } from "next/server";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";

export async function GET() {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "LABORATORIO", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    return NextResponse.json({
      modulo: "laboratorio",
      endpoints: {
        examenes: "/api/laboratorio/examenes",
        carga: "/api/laboratorio/carga",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
