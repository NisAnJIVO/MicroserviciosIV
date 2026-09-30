const { grpc, paquete, definicion } = require("./carga_pedidos");

const DIR = process.env.GRPC_ADDR || "localhost:50052";
const cliente = new paquete.PedidoService(DIR, grpc.credentials.createInsecure());
const svcDef = definicion["pedidos.PedidoService"];

const tiempos = [];
const TOTAL_REPETICIONES = 10;
let contador = 0;

console.log("=================================================");
console.log(` EJECUTANDO BENCHMARK gRPC (${TOTAL_REPETICIONES} REPETICIONES)`);
console.log("=================================================");

function ejecutarMedicion() {
  const t0 = process.hrtime.bigint();
  cliente.ObtenerPedido({ id: "ORD-1001" }, (err, res) => {
    if (err) return console.error("Error en benchmark:", err.code, err.details);
    const duracionMs = Number(process.hrtime.bigint() - t0) / 1e6;
    tiempos.push(duracionMs);
    contador++;

    console.log(` Muestra #${contador.toString().padStart(2, "0")}: ${duracionMs.toFixed(3)} ms`);

    if (contador < TOTAL_REPETICIONES) {
      ejecutarMedicion();
    } else {
      // Calcular mediana y tamaño
      tiempos.sort((a, b) => a - b);
      const mediana = (tiempos[4] + tiempos[5]) / 2;
      const promedio = tiempos.reduce((acc, v) => acc + v, 0) / tiempos.length;
      
      const serializedProtobuf = svcDef.ObtenerPedido.responseSerialize(res);
      const sizeProtobuf = serializedProtobuf.length;
      const sizeJson = Buffer.byteLength(JSON.stringify(res));
      const ahorroPorcentaje = (((sizeJson - sizeProtobuf) / sizeJson) * 100).toFixed(2);

      console.log("=================================================");
      console.log(" RESULTADOS ESTADÍSTICOS DEL BENCHMARK");
      console.log("=================================================");
      console.log(` Tiempo Promedio : ${promedio.toFixed(3)} ms`);
      console.log(` Mediana         : ${mediana.toFixed(3)} ms`);
      console.log(` Tamaño Protobuf : ${sizeProtobuf} bytes`);
      console.log(` Tamaño JSON     : ${sizeJson} bytes`);
      console.log(` Ahorro de carga : ${ahorroPorcentaje}%`);
      console.log("=================================================");
    }
  });
}

ejecutarMedicion();
