const DataLoader = require('dataloader');
const { q } = require('./db');

function crearCargadores() {
  const detallePorVenta = new DataLoader(async (ids) => {
    const filas = await q(
      'SELECT id, venta_id, producto, cantidad, '
      + 'precio_unitario AS precioUnitario '
      + 'FROM detalle_venta WHERE venta_id IN (?)', [ids]);
    return ids.map(id => filas.filter(f => f.venta_id === id));
  });

  return { detallePorVenta };
}

module.exports = { crearCargadores };
