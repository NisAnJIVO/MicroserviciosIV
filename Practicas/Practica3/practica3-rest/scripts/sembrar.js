require("dotenv").config();
const { MongoClient } = require("mongodb");

(async () => {
  const url = process.env.MONGO_URL || "mongodb://localhost:27017";
  const dbName = process.env.MONGO_DB || "practica3";
  const c = await new MongoClient(url).connect();
  const col = c.db(dbName).collection("usuarios");

  const total = 10000;
  const batchSize = 2500;
  console.log(`Sembrando ${total} usuarios en la colección...`);

  for (let i = 0; i < total; i += batchSize) {
    const lote = Array.from({ length: batchSize }, (_, idx) => {
      const id = i + idx;
      return {
        nombre: "Usuario " + id,
        correo: "usuario" + id + "@usfx.bo",
        edad: 18 + (id % 45),
      };
    });

    try {
      await col.insertMany(lote, { ordered: false });
    } catch (err) {
      // Si ya existen registros, continuar
    }
  }

  console.log("documentos:", await col.countDocuments());
  await c.close();
})();
