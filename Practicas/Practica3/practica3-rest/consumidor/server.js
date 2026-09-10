const express = require("express");
const app = express();

const PORT = process.env.PORT || 3001;
const API_URL = process.env.API_URL || "http://api:3000";

app.use(express.json());

// Endpoint de salud del consumidor
app.get("/salud", (_req, res) => {
  res.json({ servicio: "consumidor-reportes", estado: "arriba" });
});

// Endpoint que consume la API principal y devuelve una respuesta compuesta
app.get("/reporte-compuesto", async (_req, res) => {
  try {
    const inicio = Date.now();
    const [resPedidos, resUsuarios] = await Promise.all([
      fetch(`${API_URL}/v1/pedidos?limite=3`),
      fetch(`${API_URL}/v1/usuarios?limite=3`),
    ]);

    if (!resPedidos.ok || !resUsuarios.ok) {
      return res.status(502).json({
        error: {
          codigo: "ERROR_COMUNICACION_SERVICIO",
          mensaje: "Fallo al comunicar con la API principal en la red interna",
        },
      });
    }

    const pedidosData = await resPedidos.json();
    const usuariosData = await resUsuarios.json();
    const duracionMs = Date.now() - inicio;

    res.json({
      servicioOrigen: "consumidor-reportes",
      comunicacionInterna: `Conectado a ${API_URL}`,
      tiempoRespuestaMs: duracionMs,
      timestamp: new Date().toISOString(),
      resumenCompuesto: {
        totalPedidosRegistrados: pedidosData.paginacion ? pedidosData.paginacion.total : 0,
        totalUsuariosRegistrados: usuariosData.paginacion ? usuariosData.paginacion.total : 0,
        muestraPedidos: (pedidosData.datos || []).map((p) => ({
          numeroPedido: p.numeroPedido,
          cliente: p.cliente,
          total: p.total,
          estado: p.estado,
        })),
        muestraUsuarios: (usuariosData.datos || []).map((u) => ({
          nombre: u.nombre,
          correo: u.correo,
          edad: u.edad,
        })),
      },
    });
  } catch (err) {
    console.error("Error al consumir API:", err.message);
    res.status(500).json({
      error: {
        codigo: "ERROR_INTERNO_CONSUMIDOR",
        mensaje: err.message,
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`Microservicio consumidor activo en el puerto ${PORT}`);
  console.log(`Apuntando al servicio principal en: ${API_URL}`);
});
