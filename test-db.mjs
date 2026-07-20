import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    const { rows } = await pool.query("SELECT id, username, password_hash, rol_id, activo FROM usuario WHERE username = 'admin'");
    console.log("Usuario admin:", JSON.stringify(rows, null, 2));
    
    // Test bcrypt
    const bcrypt = await import("bcrypt");
    if (rows.length > 0) {
      const valid = await bcrypt.default.compare("admin123", rows[0].password_hash);
      console.log("Password admin123 válida:", valid);
    }
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await pool.end();
  }
}

test();
