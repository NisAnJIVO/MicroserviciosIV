const { grpc, paquete } = require("./carga_pedidos");

const DIR = process.env.GRPC_ADDR || "localhost:50052";
const cliente = new paquete.PedidoService(DIR, grpc.credentials.createInsecure());

const CLIENTES = ["CLI-100", "CLI-200", "CLI-300", "CLI-400", "CLI-500"];
const PRODUCTOS = [
  { producto_id: "P-1", nombre: "Impresora Láser", precio_unitario: 250.0 },
  { producto_id: "P-2", nombre: "Tóner Negro", precio_unitario: 45.0 },
  { producto_id: "P-3", nombre: "Resma Papel Carta", precio_unitario: 8.5 },
  { producto_id: "P-4", nombre: "Cable HDMI 2m", precio_unitario: 12.0 }
];

const TOTAL_A_SEMBRAR = 600;
let pendientes = TOTAL_A_SEMBRAR;

console.log(`Sembrando ${TOTAL_A_SEMBRAR} pedidos en PedidoService...`);
const tInicio = Date.now();

for (let i = 1; i <= TOTAL_A_SEMBRAR; i++) {
  const clienteId = CLIENTES[i % CLIENTES.length];
  const prod = PRODUCTOS[i % PRODUCTOS.length];

  const pedido = {
    cliente_id: clienteId,
    direccion_envio: `Calle Ficticia #${i}, Sucre`,
    metodo_pago: i % 2 === 0 ? "TARJETA_CREDITO" : "TRANSFERENCIA",
    items: [
      { producto_id: prod.producto_id, nombre: prod.nombre, cantidad: (i % 5) + 1, precio_unitario: prod.precio_unitario }
    ]
  };

  cliente.CrearPedido(pedido, (err) => {
    if (err) return console.error(`Error en sembrado pedido ${i}:`, err.code, err.details);
    pendientes--;
    if (pendientes === 0) {
      const duracion = Date.now() - tInicio;
      console.log(`=================================================`);
      console.log(` Sembrado completado: ${TOTAL_A_SEMBRAR} pedidos cargados en ${duracion} ms`);
      console.log(`=================================================`);
    }
  });
}
