const { grpc, paquete } = require("./carga");

const cliente = new paquete.EstudianteService(
  process.env.GRPC_ADDR || "localhost:50051",
  grpc.credentials.createInsecure()
);

const inicio = process.hrtime.bigint();
const flujo = cliente.ListarEstudiantes({ carrera: process.argv[2] || "" });

flujo.on("data", (e) => {
  const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
  console.log(ms.toFixed(1), "ms ->", e.ci, e.nombres, e.carrera || e.carrera_actual || "");
});

flujo.on("end", () => console.log("fin del flujo"));
flujo.on("error", (err) => console.error(err.code, err.details));
