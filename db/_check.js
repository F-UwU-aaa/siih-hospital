const {Pool} = require('pg');
const p = new Pool({host:'localhost',port:5432,user:'postgres',password:'123456',database:'siih_db'});
async function main() {
  const {rows} = await p.query("SELECT u.username, r.nombre as rol FROM usuario u JOIN rol r ON u.rol_id=r.id WHERE r.nombre = 'FACTURADOR'");
  console.log(JSON.stringify(rows, null, 2));
  await p.end();
}
main();
