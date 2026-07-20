import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ modulo: "seguridad", mensaje: "API en desarrollo" });
}
