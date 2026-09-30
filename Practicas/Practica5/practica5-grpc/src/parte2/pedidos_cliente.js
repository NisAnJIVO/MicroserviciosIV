const { grpc, paquete } = require("./carga_pedidos");

const DIR = process.env.GRPC_ADDR || "localhost:50052";
const cliente = new paquete.PedidoService(DIR, grpc.credentials.createInsecure());

function ejecutarPruebas() {
  console.log("=================================================");
  console.log(" 1. PRUEBA DE CASO EXITOSO: CREAR PEDIDO (OK)");
  console.log("=================================================");

  const nuevoPedido = {
    cliente_id: "CLI-777",
    direccion_envio: "Calle Calvo 120, Sucre",
    metodo_pago: "TARJETA_DEBITO",
    items: [
      { producto_id: "P-101", nombre: "Monitor 27 Pulgadas 4K", cantidad: 1, precio_unitario: 350.0 },
      { producto_id: "P-102", nombre: "Teclado Mecánico RGB", cantidad: 1, precio_unitario: 85.0 }
    ]
  };

  cliente.CrearPedido(nuevoPedido, (err, res) => {
    if (err) {
      console.error(`[ERROR gRPC ${err.code}] ${grpc.status[err.code]}:`, err.details);
    } else {
      console.log("-> Pedido creado exitosamente:", res.pedido);
    }

    // 2. PRUEBA DE ERROR 1: INVALID_ARGUMENT (Código 3)
    console.log("\n=================================================");
    console.log(" 2. PRUEBA DE ERROR: INVALID_ARGUMENT (Código 3)");
    console.log("=================================================");
    cliente.CrearPedido({ cliente_id: "", items: [] }, (err2, res2) => {
      if (err2) {
        console.log(`-> Capturado error esperado [Código ${err2.code} - ${grpc.status[err2.code]}]`);
        console.log(`   Detalle del servidor: "${err2.details}"`);
      } else {
        console.log("Respuesta inesperada:", res2);
      }

      // 3. PRUEBA DE ERROR 2: NOT_FOUND (Código 5)
      console.log("\n=================================================");
      console.log(" 3. PRUEBA DE ERROR: NOT_FOUND (Código 5)");
      console.log("=================================================");
      cliente.ObtenerPedido({ id: "ORD-99999" }, (err3, res3) => {
        if (err3) {
          console.log(`-> Capturado error esperado [Código ${err3.code} - ${grpc.status[err3.code]}]`);
          console.log(`   Detalle del servidor: "${err3.details}"`);
        } else {
          console.log("Respuesta inesperada:", res3);
        }

        // 4. PRUEBA DE ERROR 3: FAILED_PRECONDITION (Código 9)
        console.log("\n=================================================");
        console.log(" 4. PRUEBA DE ERROR: FAILED_PRECONDITION (Código 9)");
        console.log("=================================================");
        // Primero actualizamos ORD-1001 a ENTREGADO (estado 3)
        cliente.ActualizarEstado({ id: "ORD-1001", nuevo_estado: 3 }, (err4a, res4a) => {
          if (err4a) return console.error("Error al actualizar:", err4a);
          console.log("   Estado de ORD-1001 actualizado a ENTREGADO (3)");

          // Ahora intentamos cancelarlo
          cliente.CancelarPedido({ id: "ORD-1001", motivo: "Arrepentimiento" }, (err4b, res4b) => {
            if (err4b) {
              console.log(`-> Capturado error esperado [Código ${err4b.code} - ${grpc.status[err4b.code]}]`);
              console.log(`   Detalle del servidor: "${err4b.details}"`);
            } else {
              console.log("Respuesta:", res4b);
            }
            console.log("\n[FIN DE PRUEBAS DE CÓDIGOS DE ESTADO gRPC]");
          });
        });
      });
    });
  });
}

ejecutarPruebas();
