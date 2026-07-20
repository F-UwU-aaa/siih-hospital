import pool from "./db";

export async function crearNotificacion(params: {
  paciente_id?: number | null;
  medico_id?: number | null;
  cita_id?: number | null;
  tipo: string;
  asunto?: string | null;
  mensaje: string;
}): Promise<number> {
  const { paciente_id, medico_id, cita_id, tipo, asunto, mensaje } = params;

  const { rows } = await pool.query(
    `INSERT INTO notificacion
       (paciente_id, medico_id, cita_id, tipo, asunto, mensaje, estado, creado_en)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', NOW())
     RETURNING id`,
    [paciente_id ?? null, medico_id ?? null, cita_id ?? null, tipo, asunto ?? null, mensaje]
  );

  return rows[0].id;
}

export async function marcarEnviada(id: number): Promise<void> {
  await pool.query(
    `UPDATE notificacion SET estado = 'ENVIADA', fecha_envio = NOW() WHERE id = $1`,
    [id]
  );
}

export async function marcarFallida(id: number): Promise<void> {
  await pool.query(
    `UPDATE notificacion SET estado = 'FALLIDA' WHERE id = $1`,
    [id]
  );
}

export async function marcarTodasEnviadas(usuarioId: number, rol: string): Promise<number> {
  let query: string;
  let params: unknown[];

  if (rol === "ADMIN" || rol === "DIRECTOR") {
    query = `UPDATE notificacion SET estado = 'ENVIADA', fecha_envio = NOW()
             WHERE estado = 'PENDIENTE'`;
    params = [];
  } else {
    query = `UPDATE notificacion SET estado = 'ENVIADA', fecha_envio = NOW()
             WHERE estado = 'PENDIENTE' AND (paciente_id IS NOT NULL OR medico_id IS NOT NULL)
             AND (
               paciente_id = (SELECT paciente_id FROM usuario WHERE id = $1 AND paciente_id IS NOT NULL)
               OR medico_id = (SELECT medico_id FROM usuario WHERE id = $1 AND medico_id IS NOT NULL)
             )`;
    params = [usuarioId];
  }

  const result = await pool.query(query, params);
  return result.rowCount ?? 0;
}

export async function contarPendientes(usuarioId: number, rol: string): Promise<number> {
  let query: string;
  let params: unknown[];

  if (rol === "ADMIN" || rol === "DIRECTOR") {
    query = `SELECT COUNT(*)::int AS total FROM notificacion WHERE estado = 'PENDIENTE'`;
    params = [];
  } else {
    query = `SELECT COUNT(*)::int AS total FROM notificacion
             WHERE estado = 'PENDIENTE'
             AND (
               paciente_id = (SELECT paciente_id FROM usuario WHERE id = $1 AND paciente_id IS NOT NULL)
               OR medico_id = (SELECT medico_id FROM usuario WHERE id = $1 AND medico_id IS NOT NULL)
             )`;
    params = [usuarioId];
  }

  const { rows } = await pool.query(query, params);
  return rows[0]?.total ?? 0;
}
