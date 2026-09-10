const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'practica4_ventas',
  connectionLimit: 10,
});

let n = 0;

async function q(sql, params = []) {
  n++;
  console.log('[SQL %d] %s', n, sql.replace(/\s+/g, ' ').trim());
  const [filas] = await pool.query(sql, params);
  return filas;
}

const contador = {
  leer: () => n,
  reiniciar: () => { n = 0; }
};

module.exports = { q, contador };
