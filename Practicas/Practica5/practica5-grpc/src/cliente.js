const { grpc, paquete } = require("./carga");

const DIR = process.env.GRPC_ADDR || "localhost:50051";
const cliente = new paquete.EstudianteService(DIR, grpc.credentials.createInsecure());

const ana = {
  ci: "9876543",
  nombres: "Ana",
  apellidos: "Torres",
  carrera: "Sistemas"
};

cliente.AgregarEstudiante(ana, (err, res) => {
  if (err) return console.error("Falló:", err.code, err.details);
  console.log("Agregado:", res.estudiante);

  cliente.ObtenerEstudiante({ ci: ana.ci }, (err2, res2) => {
    if (err2) return console.error("Falló:", err2.code, err2.details);
    console.log("Obtenido:", res2.estudiante);
  });
});
