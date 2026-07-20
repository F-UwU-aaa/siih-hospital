import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ modulo: "farmacia", mensaje: "API en desarrollo" });
}
