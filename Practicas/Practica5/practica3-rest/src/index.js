const express = require("express");
const { obtenerEstudiante } = require("./estudiantes.cliente");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const usuarios = [
  { id: "1", nombre: "Ana Torres", email: "ana.torres@usfx.bo", ci: "9876543" },
  { id: "2", nombre: "Juan Perez", email: "juan.perez@usfx.bo", ci: "1234567" },
  { id: "3", nombre: "Carlos Gomez", email: "carlos.gomez@usfx.bo", ci: "5556677" }
];

app.get("/usuarios", (req, res) => {
  res.status(200).json(usuarios);
});

app.get("/usuarios/:id", (req, res) => {
  const user = usuarios.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.status(200).json(user);
});

app.get("/usuarios/:id/expediente", async (req, res) => {
  const user = usuarios.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado en servicio REST" });
  }

  try {
    const expediente = await obtenerEstudiante(user.ci);
    res.status(200).json({
      usuario: user,
      expediente: expediente
    });
  } catch (err) {
    if (err.code === 5) {
      // 5: NOT_FOUND
      return res.status(404).json({
        error: "Expediente no encontrado en servicio gRPC",
        grpcCode: err.code,
        detalle: err.details
      });
    } else if (err.code === 14) {
      // 14: UNAVAILABLE
      return res.status(503).json({
        error: "Servicio interno gRPC no disponible",
        grpcCode: err.code,
        detalle: err.details
      });
    } else {
      return res.status(500).json({
        error: "Error interno al comunicarse con gRPC",
        grpcCode: err.code,
        detalle: err.details
      });
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servicio REST escuchando en puerto ${PORT}`);
});
