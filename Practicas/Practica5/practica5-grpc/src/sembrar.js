const { grpc, paquete } = require("./carga");

const cliente = new paquete.EstudianteService(
  process.env.GRPC_ADDR || "localhost:50051",
  grpc.credentials.createInsecure()
);

const carreras = ["Sistemas", "Redes", "Industrial"];
let pendientes = 500;

for (let i = 1; i <= 500; i++) {
  const e = {
    ci: String(1000000 + i),
    nombres: "Estudiante " + i,
    apellidos: "Prueba",
    carrera: carreras[i % 3]
  };
  cliente.AgregarEstudiante(e, (err) => {
    if (err) return console.error(err.code, err.details);
    if (--pendientes === 0) console.log("Sembrados 500 estudiantes");
  });
}
