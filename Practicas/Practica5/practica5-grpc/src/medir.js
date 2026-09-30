const { grpc, paquete, definicion } = require("./carga");

const cliente = new paquete.EstudianteService(
  process.env.GRPC_ADDR || "localhost:50051",
  grpc.credentials.createInsecure()
);

const svc = definicion["estudiantes.EstudianteService"];
let n = 0, suma = 0;

(function medir() {
  const t0 = process.hrtime.bigint();
  cliente.ObtenerEstudiante({ ci: "9876543" }, (err, res) => {
    if (err) return console.error(err.code, err.details);
    suma += Number(process.hrtime.bigint() - t0) / 1e6;
    if (++n < 10) return medir();
    console.log("promedio de 10 llamadas:", (suma / n).toFixed(2), "ms");
    console.log(
      "protobuf:",
      svc.ObtenerEstudiante.responseSerialize(res).length,
      "bytes · JSON:",
      Buffer.byteLength(JSON.stringify(res))
    );
  });
})();
