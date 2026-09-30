const { grpc, paquete } = require("./carga");

const estudiantes = new Map();

// Insert initial seed student for convenience
estudiantes.set("9876543", {
  ci: "9876543",
  nombres: "Ana",
  apellidos: "Torres",
  carrera: "Sistemas",
  carrera_actual: "Sistemas",
  correo: "ana.torres@usfx.bo"
});

const servicio = {
  AgregarEstudiante: (llamada, responder) => {
    const e = llamada.request;
    if (!e.ci) {
      return responder({
        code: grpc.status.INVALID_ARGUMENT,
        message: "El campo ci es obligatorio"
      });
    }
    // Support carrera / carrera_actual normalization
    if (e.carrera && !e.carrera_actual) e.carrera_actual = e.carrera;
    if (e.carrera_actual && !e.carrera) e.carrera = e.carrera_actual;
    
    estudiantes.set(e.ci, e);
    responder(null, { estudiante: e });
  },

  ObtenerEstudiante: (llamada, responder) => {
    const ci = llamada.request.ci;
    const e = estudiantes.get(ci);
    if (!e) {
      return responder({
        code: grpc.status.NOT_FOUND,
        message: "Estudiante no encontrado"
      });
    }
    responder(null, { estudiante: e });
  },

  ListarEstudiantes: (llamada) => {
    const carrera = llamada.request.carrera;
    let enviados = 0;
    for (const e of estudiantes.values()) {
      const matchCarrera = e.carrera || e.carrera_actual;
      if (carrera && matchCarrera !== carrera) continue;
      llamada.write(e);
      enviados++;
    }
    console.log("Enviados", enviados, "estudiantes por el flujo");
    llamada.end();
  }
};

const servidor = new grpc.Server();
servidor.addService(paquete.EstudianteService.service, servicio);

const DIR = process.env.GRPC_ADDR || "0.0.0.0:50051";
servidor.bindAsync(DIR, grpc.ServerCredentials.createInsecure(), (err, puerto) => {
  if (err) {
    return console.error("No se pudo abrir el puerto:", err);
  }
  console.log("Servicio gRPC escuchando en el puerto", puerto);
});
