const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");

const { router: usuariosRouter } = require("./usuarios.rutas");
const { router: pedidosRouter } = require("./pedidos.rutas");

const app = express();

app.use(express.json());

// Endpoint de salud (fuera de versionado, usado por Docker healthcheck)
app.get("/salud", (_req, res) => res.json({ estado: "arriba" }));

// Documentacion interactiva Swagger / OpenAPI
try {
  const doc = yaml.load(path.join(__dirname, "../openapi.yaml"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(doc));
} catch (err) {
  console.error("No se pudo cargar openapi.yaml para /docs:", err.message);
}

// Rutas versionadas v1
app.use("/v1/usuarios", usuariosRouter);
app.use("/v1/pedidos", pedidosRouter);

// Manejador centralizado para rutas no encontradas (404 en JSON)
app.use((_req, res) => {
  res.status(404).json({
    error: { codigo: "RUTA_NO_ENCONTRADA", mensaje: "Ruta inexistente" },
  });
});

// Manejador central de errores (JSON malformado o error 500 en JSON)
app.use((err, _req, res, _next) => {
  const malJson = err.type === "entity.parse.failed";
  if (!malJson) {
    console.error("Excepción en el servidor:", err);
  }
  res.status(malJson ? 400 : 500).json({
    error: {
      codigo: malJson ? "JSON_INVALIDO" : "ERROR_INTERNO",
      mensaje: malJson ? "El cuerpo no es JSON válido" : "Error interno",
    },
  });
});

module.exports = app;
