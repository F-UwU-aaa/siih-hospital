const { Pool } = require("pg");
const p = new Pool({ host: "localhost", port: 5432, user: "postgres", password: "123456", database: "siih_db" });

async function run() {
  // 1. List all tables
  const tables = await p.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log("=== ALL TABLES (" + tables.rows.length + ") ===");
  tables.rows.forEach(r => console.log("  " + r.table_name));

  // 2. Count rows in every table
  console.log("\n=== ROW COUNTS ===");
  for (const t of tables.rows) {
    const cnt = await p.query("SELECT COUNT(*) AS c FROM " + t.table_name);
    console.log(t.table_name + ": " + cnt.rows[0].c);
  }

  // 3. Columns + constraints for every table
  console.log("\n=== TABLE DETAILS ===");
  for (const t of tables.rows) {
    const cols = await p.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 ORDER BY ordinal_position
    `, [t.table_name]);
    const pk = await p.query(`
      SELECT conname, pg_get_constraintdef(oid) AS def 
      FROM pg_constraint WHERE conrelid = $1::regclass AND contype IN ('p','u','c','f')
    `, [t.table_name]);
    console.log("\n--- " + t.table_name + " ---");
    cols.rows.forEach(c => {
      const nn = c.is_nullable === "NO" ? " NOT NULL" : "";
      const df = c.column_default ? " DEFAULT " + c.column_default : "";
      console.log("  " + c.column_name + " " + c.data_type + nn + df);
    });
    if (pk.rows.length > 0) {
      pk.rows.forEach(k => console.log("  CONSTRAINT " + k.conname + ": " + k.def));
    }
  }

  await p.end();
}

run().catch(e => { console.error(e); process.exit(1); });
