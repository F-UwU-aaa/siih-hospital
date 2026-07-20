import { NextResponse } from "next/server";
import { eliminarSesion } from "@/lib/session";

export async function POST() {
  await eliminarSesion();
  return NextResponse.json({ mensaje: "Sesión cerrada" });
}
