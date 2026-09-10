const { MongoClient, ObjectId } = require("mongodb");

let colUsuarios;
let colPedidos;
let clienteDb;

async function conectar() {
  const url = process.env.MONGO_URL || "mongodb://localhost:27017";
  const dbName = process.env.MONGO_DB || "practica3";
  const cliente = await new MongoClient(url).connect();
  clienteDb = cliente.db(dbName);

  colUsuarios = clienteDb.collection("usuarios");
  await colUsuarios.createIndex({ correo: 1 }, { unique: true });

  colPedidos = clienteDb.collection("pedidos");
  await colPedidos.createIndex({ numeroPedido: 1 }, { unique: true });
  await colPedidos.createIndex({ correoCliente: 1 });
  await colPedidos.createIndex({ fecha: -1 });

  return cliente;
}

const aId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

module.exports = {
  conectar,
  // --- Metodos para Usuarios (Parte 1) ---
  crear: (u) => colUsuarios.insertOne(u),
  obtener: (id) => (aId(id) ? colUsuarios.findOne({ _id: aId(id) }) : null),
  reemplazar: (id, u) => (aId(id) ? colUsuarios.findOneAndReplace({ _id: aId(id) }, u, { returnDocument: "after" }) : null),
  borrar: (id) => (aId(id) ? colUsuarios.deleteOne({ _id: aId(id) }) : { deletedCount: 0 }),
  porCorreo: (correo) => colUsuarios.findOne({ correo }),
  listar: async (filtro = {}, orden = {}, pagina = 1, limite = 20) => {
    const [datos, total] = await Promise.all([
      colUsuarios
        .find(filtro)
        .sort(orden)
        .skip((pagina - 1) * limite)
        .limit(limite)
        .toArray(),
      colUsuarios.countDocuments(filtro),
    ]);
    return { datos, total };
  },

  // --- Metodos para Pedidos y sus Items (Parte 2 - Proyecto Integrador Tienda) ---
  crearPedido: (p) => colPedidos.insertOne(p),
  obtenerPedido: (id) => (aId(id) ? colPedidos.findOne({ _id: aId(id) }) : null),
  porNumeroPedido: (numeroPedido) => colPedidos.findOne({ numeroPedido }),
  reemplazarPedido: async (id, p) => {
    if (!aId(id)) return null;
    return colPedidos.findOneAndReplace({ _id: aId(id) }, p, { returnDocument: "after" });
  },
  modificarPedido: async (id, p) => {
    if (!aId(id)) return null;
    return colPedidos.findOneAndUpdate({ _id: aId(id) }, { $set: p }, { returnDocument: "after" });
  },
  borrarPedido: (id) => (aId(id) ? colPedidos.deleteOne({ _id: aId(id) }) : { deletedCount: 0 }),
  listarPedidos: async (filtro = {}, orden = {}, pagina = 1, limite = 20) => {
    const [datos, total] = await Promise.all([
      colPedidos
        .find(filtro)
        .sort(orden)
        .skip((pagina - 1) * limite)
        .limit(limite)
        .toArray(),
      colPedidos.countDocuments(filtro),
    ]);
    return { datos, total };
  },

  // Subrecurso: Items de un pedido
  obtenerItems: async (pedidoId) => {
    if (!aId(pedidoId)) return null;
    const p = await colPedidos.findOne({ _id: aId(pedidoId) });
    return p ? p.items || [] : null;
  },
  agregarItem: async (pedidoId, item) => {
    if (!aId(pedidoId)) return null;
    const res = await colPedidos.findOneAndUpdate(
      { _id: aId(pedidoId) },
      {
        $push: { items: item },
        $inc: { total: item.subtotal || item.precio * item.cantidad },
      },
      { returnDocument: "after" }
    );
    return res;
  },
  borrarItem: async (pedidoId, itemId) => {
    if (!aId(pedidoId)) return null;
    const p = await colPedidos.findOne({ _id: aId(pedidoId) });
    if (!p) return null;
    const item = (p.items || []).find((it) => it.idItem === itemId || it._id?.toString() === itemId);
    if (!item) return false;
    const resta = item.subtotal || item.precio * item.cantidad;
    await colPedidos.updateOne(
      { _id: aId(pedidoId) },
      {
        $pull: { items: { idItem: itemId } },
        $inc: { total: -resta },
      }
    );
    return true;
  },
};
