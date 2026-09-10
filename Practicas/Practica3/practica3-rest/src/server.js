require("dotenv").config();
const app = require("./app");
const { conectar } = require("./repositorio");

const PORT = process.env.PORT || 3000;

async function iniciar() {
  try {
    await conectar();
    console.log("Conectado a MongoDB exitosamente");
    app.listen(PORT, () => {
      console.log(`Servidor REST escuchando en http://localhost:${PORT}`);
      console.log(`Documentación disponible en http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error.message);
    process.exit(1);
  }
}

iniciar();
