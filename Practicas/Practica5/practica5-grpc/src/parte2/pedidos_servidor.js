const { grpc, paquete } = require("./carga_pedidos");

const pedidos = new Map();

// Semilla inicial
const pedidoInicial = {
  id: "ORD-1001",
  cliente_id: "CLI-901",
  items: [
    { producto_id: "PROD-A", nombre: "Laptop ThinkPad", cantidad: 1, precio_unitario: 1200.0 },
    { producto_id: "PROD-B", nombre: "Mouse Inalámbrico", cantidad: 2, precio_unitario: 25.0 }
  ],
  total: 1250.0,
  estado: 0, // PENDIENTE
  fecha_creacion: new Date().toISOString(),
  direccion_envio: "Av. Hernando Siles 450, Sucre",
  metodo_pago: "QR_TRANSFER"
};
pedidos.set(pedidoInicial.id, pedidoInicial);

const servicio = {
  CrearPedido: (llamada, responder) => {
    const req = llamada.request;
    if (!req.cliente_id || req.cliente_id.trim() === "") {
      return responder({
        code: grpc.status.INVALID_ARGUMENT,
        message: "El campo cliente_id es obligatorio para registrar un pedido"
      });
    }

    if (!req.items || req.items.length === 0) {
      return responder({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Un pedido debe contener al menos un item válido"
      });
    }

    // Generar ID único
    const nuevoId = "ORD-" + (1000 + pedidos.size + 1);
    if (pedidos.has(nuevoId)) {
      return responder({
        code: grpc.status.ALREADY_EXISTS,
        message: `El pedido con identificador ${nuevoId} ya existe en el sistema`
      });
    }

    let totalCalculado = 0;
    for (const it of req.items) {
      if (!it.cantidad || it.cantidad <= 0) {
        return responder({
          code: grpc.status.INVALID_ARGUMENT,
          message: `Cantidad inválida para producto ${it.producto_id || 'desconocido'}`
        });
      }
      totalCalculado += (it.cantidad * (it.precio_unitario || 0));
    }

    const nuevoPedido = {
      id: nuevoId,
      cliente_id: req.cliente_id,
      items: req.items,
      total: totalCalculado,
      estado: 0, // PENDIENTE
      fecha_creacion: new Date().toISOString(),
      direccion_envio: req.direccion_envio || "Dirección por defecto",
      metodo_pago: req.metodo_pago || "EFECTIVO"
    };

    pedidos.set(nuevoId, nuevoPedido);
    console.log(`[gRPC Pedidos] Pedido creado: ${nuevoId} para cliente: ${req.cliente_id}`);
    responder(null, { pedido: nuevoPedido });
  },

  ObtenerPedido: (llamada, responder) => {
    const id = llamada.request.id;
    const pedido = pedidos.get(id);
    if (!pedido) {
      return responder({
        code: grpc.status.NOT_FOUND,
        message: `No se encontró ningún pedido con el ID: ${id}`
      });
    }
    responder(null, { pedido });
  },

  ActualizarEstado: (llamada, responder) => {
    const { id, nuevo_estado } = llamada.request;
    const pedido = pedidos.get(id);
    if (!pedido) {
      return responder({
        code: grpc.status.NOT_FOUND,
        message: `Pedido ${id} inexistente para actualizar estado`
      });
    }

    if (pedido.estado === 4) { // CANCELADO
      return responder({
        code: grpc.status.FAILED_PRECONDITION,
        message: `No se puede modificar el estado de un pedido que ya está CANCELADO`
      });
    }

    pedido.estado = nuevo_estado;
    pedidos.set(id, pedido);
    responder(null, { pedido });
  },

  CancelarPedido: (llamada, responder) => {
    const { id, motivo } = llamada.request;
    const pedido = pedidos.get(id);
    if (!pedido) {
      return responder({
        code: grpc.status.NOT_FOUND,
        message: `Pedido ${id} no encontrado para cancelación`
      });
    }

    if (pedido.estado === 3) { // ENTREGADO
      return responder({
        code: grpc.status.FAILED_PRECONDITION,
        message: `No es posible cancelar un pedido que ya fue ENTREGADO al destinatario`
      });
    }

    pedido.estado = 4; // CANCELADO
    pedidos.set(id, pedido);
    responder(null, {
      exito: true,
      mensaje: `Pedido cancelado exitosamente. Motivo: ${motivo || 'Solicitud de usuario'}`,
      pedido
    });
  },

  ListarPedidosStream: (llamada) => {
    const cliente_id = llamada.request.cliente_id;
    let contador = 0;
    for (const p of pedidos.values()) {
      if (cliente_id && cliente_id.trim() !== "" && p.cliente_id !== cliente_id) {
        continue;
      }
      llamada.write(p);
      contador++;
    }
    console.log(`[gRPC Stream] Enviados ${contador} pedidos por el canal de flujo`);
    llamada.end();
  }
};

const servidor = new grpc.Server();
servidor.addService(paquete.PedidoService.service, servicio);

const PUERTO = process.env.GRPC_ADDR || "0.0.0.0:50052";
servidor.bindAsync(PUERTO, grpc.ServerCredentials.createInsecure(), (err, puerto) => {
  if (err) return console.error("Error al iniciar PedidoService:", err);
  console.log(`=================================================`);
  console.log(` Servidor gRPC PedidoService iniciado en ${PUERTO}`);
  console.log(`=================================================`);
});
