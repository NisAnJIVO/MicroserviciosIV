require("dotenv").config();
const express = require("express");
const { conectar, publicar } = require("./cola");

const app = express();
app.use(express.json());
const inscripciones = [];

app.post("/inscripciones", (req, res) => {
  const { estudiante, correo, curso } = req.body;
  if (!estudiante || !correo || !curso) {
    return res.status(400).json({ error: "faltan datos obligatorios" });
  }
  const registro = { id: "INS-" + Date.now(), estudiante, correo, curso };
  inscripciones.push(registro);
  publicar(process.env.CLAVE, { tipo: "InscripcionConfirmada", ...registro });
  res.status(201).json(registro);
});

app.get("/inscripciones", (_req, res) => res.json(inscripciones));

conectar()
  .then(() =>
    app.listen(process.env.PORT, () =>
      console.log("[inscripciones] API en el puerto " + process.env.PORT)
    )
  )
  .catch((e) => {
    console.error("no se pudo conectar al broker:", e.message);
    process.exit(1);
  });
