import pool from "./db";

export async function registrarAuditoria(params: {
  usuario_id: number;
  tabla_afectada: string;
  accion: string;
  registro_id?: number;
  detalle?: string;
  ip_origen?: string;
}): Promise<void> {
  const { usuario_id, tabla_afectada, accion, registro_id, detalle, ip_origen } = params;
  await pool.query(
    `INSERT INTO auditoria (usuario_id, tabla_afectada, accion, registro_id, detalle, ip_origen)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuario_id, tabla_afectada, accion, registro_id ?? null, detalle ?? null, ip_origen ?? null]
  );
}
