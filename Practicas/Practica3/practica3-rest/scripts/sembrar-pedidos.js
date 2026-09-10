require("dotenv").config();
const { MongoClient } = require("mongodb");

(async () => {
  const url = process.env.MONGO_URL || "mongodb://localhost:27017";
  const dbName = process.env.MONGO_DB || "practica3";
  const c = await new MongoClient(url).connect();
  const col = c.db(dbName).collection("pedidos");

  // Crear indices para rendimiento (Ejercicio 4)
  await col.createIndex({ numeroPedido: 1 }, { unique: true });
  await col.createIndex({ estado: 1 });
  await col.createIndex({ correoCliente: 1 });
  await col.createIndex({ fecha: -1 });

  const ciudades = ["sucre", "la paz", "cochabamba", "santa cruz", "oruro", "potosi", "tarija", "beni", "pando"];
  const estados = ["pendiente", "enviado", "entregado", "cancelado"];
  const productos = [
    { codigo: "ART-001", precio: 850 },
    { codigo: "ALM-003", precio: 45 },
    { codigo: "CER-012", precio: 120 },
    { codigo: "TEL-005", precio: 340 },
    { codigo: "ESC-008", precio: 560 },
  ];

  const total = 10000;
  const batchSize = 2500;
  console.log(`Sembrando ${total} pedidos para el Ejercicio 4...`);

  for (let i = 0; i < total; i += batchSize) {
    const lote = Array.from({ length: batchSize }, (_, idx) => {
      const num = i + idx + 1;
      const prod = productos[num % productos.length];
      const cantidad = 1 + (num % 5);
      const subtotal = prod.precio * cantidad;
      const fecha = new Date(Date.now() - num * 3600000);

      return {
        numeroPedido: `PED-${String(num).padStart(6, "0")}`,
        cliente: `Cliente ${num}`,
        correoCliente: `cliente${num}@usfx.bo`,
        ciudad: ciudades[num % ciudades.length],
        estado: estados[num % estados.length],
        items: [
          {
            idItem: "ITM-1",
            codigo: prod.codigo,
            cantidad,
            precio: prod.precio,
            subtotal,
          },
        ],
        total: subtotal,
        fecha,
        creadoEn: fecha,
      };
    });

    try {
      await col.insertMany(lote, { ordered: false });
    } catch (err) {
      // Ignorar duplicados
    }
  }

  console.log("Pedidos sembrados. Conteo total:", await col.countDocuments());
  await c.close();
})();
