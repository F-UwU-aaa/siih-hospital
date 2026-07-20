import pool from "./db";

export async function verificarPermiso(
  usuario_id: number,
  modulo: string,
  accion: string
): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1
     FROM usuario u
     JOIN rol_permiso rp ON rp.rol_id = u.rol_id
     JOIN permiso p ON rp.permiso_id = p.id
     WHERE u.id = $1
       AND u.activo = TRUE
       AND p.modulo = $2
       AND p.accion = $3
     LIMIT 1`,
    [usuario_id, modulo, accion]
  );
  return rows.length > 0;
}
