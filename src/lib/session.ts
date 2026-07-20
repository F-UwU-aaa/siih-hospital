import { cookies } from "next/headers";
import { createHmac, randomBytes } from "crypto";

const COOKIE_NAME = "siih_session";
const MAX_AGE = 60 * 60 * 8; // 8 horas

export interface SesionData {
  usuario_id: number;
  rol_id: number;
  username: string;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET no está definido en .env.local");
  return secret;
}

export function signSession(data: SesionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySession(token: string): SesionData | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.usuario_id || !data.rol_id || !data.username) return null;
    return data as SesionData;
  } catch {
    return null;
  }
}

export async function crearSesion(data: SesionData): Promise<string> {
  const token = signSession(data);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
  return token;
}

export async function getSesionActual(): Promise<SesionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function eliminarSesion(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
