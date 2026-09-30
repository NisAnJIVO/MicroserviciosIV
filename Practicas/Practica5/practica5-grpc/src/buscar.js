const { grpc, paquete } = require("./carga");

const cliente = new paquete.EstudianteService(
  process.env.GRPC_ADDR || "localhost:50051",
  grpc.credentials.createInsecure()
);

cliente.ObtenerEstudiante(
  { ci: process.argv[2] || "0000000" },
  (err, res) => {
    if (err) {
      console.error("código :", err.code, "=", grpc.status[err.code]);
      console.error("detalle:", err.details);
      return;
    }
    console.log("Encontrado:", res.estudiante);
  }
);
