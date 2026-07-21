const { Pool } = require("pg");
const p = new Pool({ host: "localhost", port: 5432, user: "postgres", password: "123456", database: "siih_db" });

async function run() {
  const r1 = await p.query("SELECT COUNT(*) AS total FROM examen_laboratorio");
  const cnt = r1.rows[0].total;
  console.log("COUNT(*) result:", JSON.stringify(cnt), "type:", typeof cnt);

  const q = "SELECT el.tipo_examen, el.estado, COUNT(*) AS total, SUM(CASE WHEN rl.es_critico = TRUE THEN 1 ELSE 0 END) AS criticos FROM examen_laboratorio el LEFT JOIN resultado_laboratorio rl ON rl.examen_id = el.id GROUP BY el.tipo_examen, el.estado ORDER BY total DESC";
  const r2 = await p.query(q);
  console.log("Report rows:", r2.rows.length);
  r2.rows.forEach((row, i) => {
    console.log("  row" + i + ": total=" + JSON.stringify(row.total) + " (" + typeof row.total + ") criticos=" + JSON.stringify(row.criticos) + " (" + typeof row.criticos + ")");
  });

  const rows = r2.rows;
  const totalExamenes = rows.reduce((s, r) => s + r.total, 0);
  const totalCriticos = rows.reduce((s, r) => s + r.criticos, 0);
  console.log("totalExamenes:", JSON.stringify(totalExamenes), "type:", typeof totalExamenes, "isNaN:", Number.isNaN(totalExamenes));
  console.log("totalCriticos:", JSON.stringify(totalCriticos), "type:", typeof totalCriticos, "isNaN:", Number.isNaN(totalCriticos));

  const emptyTotal = [].reduce((s, r) => s + r.total, 0);
  console.log("Empty rows reduce:", JSON.stringify(emptyTotal), "type:", typeof emptyTotal);

  await p.end();
}

run().catch(e => { console.error(e); process.exit(1); });
