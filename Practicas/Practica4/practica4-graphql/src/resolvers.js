const { q } = require('./db');

const resolvers = {
  Query: {
    ventas: () => q('SELECT id, cliente_id, fecha, total FROM ventas ORDER BY id'),
    venta: (_p, { id }) =>
      q('SELECT id, cliente_id, fecha, total FROM ventas WHERE id = ?', [id])
        .then(f => f[0] || null),
  },
  Venta: {
    fecha: (venta) => {
      if (venta.fecha instanceof Date) {
        return venta.fecha.toISOString().split('T')[0];
      }
      return String(venta.fecha);
    },
    clienteId: (venta) => venta.cliente_id,
    cliente: async (venta) => {
      const base = process.env.URL_USUARIOS || 'http://localhost:3000';
      const r = await fetch(base + '/usuarios/' + venta.cliente_id);
      if (r.status === 404) return null;
      if (!r.ok) {
        throw new Error('Usuarios respondió ' + r.status);
      }
      return r.json();
    },
    detalle: (venta, _a, { cargadores }) => {
      if (cargadores && cargadores.detallePorVenta && !process.env.DISABLE_DATALOADER) {
        return cargadores.detallePorVenta.load(venta.id);
      }
      return q(
        'SELECT id, producto, cantidad, precio_unitario AS precioUnitario '
        + 'FROM detalle_venta WHERE venta_id = ?', [venta.id]);
    },
  },
  Mutation: {
    crearVenta: async (_p, { input }) => {
      const total = input.detalle.reduce(
        (s, d) => s + d.cantidad * d.precioUnitario, 0);
      const r = await q(
        'INSERT INTO ventas (cliente_id, fecha, total) VALUES (?, ?, ?)',
        [input.clienteId, input.fecha, total]);
      for (const d of input.detalle) {
        await q('INSERT INTO detalle_venta (venta_id, producto, '
          + 'cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [r.insertId, d.producto, d.cantidad, d.precioUnitario]);
      }
      return { id: r.insertId, fecha: input.fecha, total, cliente_id: input.clienteId };
    },
    cambiarCantidad: async (_p, { detalleId, cantidad }) => {
      if (cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor que cero');
      }
      await q('UPDATE detalle_venta SET cantidad = ? WHERE id = ?',
        [cantidad, detalleId]);
      const filas = await q(
        'SELECT id, producto, cantidad, precio_unitario AS '
        + 'precioUnitario FROM detalle_venta WHERE id = ?', [detalleId]);
      if (!filas[0]) throw new Error('No existe el ítem ' + detalleId);
      return filas[0];
    },
  },
};

module.exports = resolvers;
