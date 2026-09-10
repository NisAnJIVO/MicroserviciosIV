const { Router } = require("express");
const router = Router();
const repo = require("./repositorio");
const { validarPedido, validarItem } = require("./pedidos.validacion");
const { fallo } = require("./errores");

const TOPE = 100;

// GET /v1/pedidos - Coleccion paginada con filtros y ordenacion
router.get("/", async (req, res) => {
  try {
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const limite = Math.min(TOPE, Number(req.query.limite) || 20);
    const filtro = {};

    if (req.query.estado) {
      filtro.estado = String(req.query.estado).trim().toLowerCase();
    }
    if (req.query.ciudad) {
      filtro.ciudad = String(req.query.ciudad).trim().toLowerCase();
    }
    if (req.query.totalMin) {
      filtro.total = { $gte: Number(req.query.totalMin) };
    }

    const campoOrden = req.query.ordenPor || "fecha";
    const direccionOrden = req.query.orden === "asc" ? 1 : -1;
    const orden = { [campoOrden]: direccionOrden };

    const { datos, total } = await repo.listarPedidos(filtro, orden, pagina, limite);

    res.json({
      datos,
      paginacion: {
        pagina,
        limite,
        total,
        paginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al consultar pedidos");
  }
});

// POST /v1/pedidos - Crear pedido
router.post("/", async (req, res) => {
  try {
    const erroresValidacion = validarPedido(req.body);
    if (erroresValidacion.length > 0) {
      return fallo(res, 400, "VALIDACION", "La solicitud contiene campos inválidos", erroresValidacion);
    }

    const { numeroPedido, cliente, correoCliente, ciudad, estado, items, total, fecha } = req.body;

    // Regla de conflicto 409: numeroPedido debe ser único
    if (numeroPedido) {
      const existente = await repo.porNumeroPedido(numeroPedido);
      if (existente) {
        return fallo(res, 409, "CONFLICTO", `El pedido con número '${numeroPedido}' ya existe en el sistema`);
      }
    }

    const nuevoPedido = {
      numeroPedido: numeroPedido || `PED-${Date.now()}`,
      cliente: String(cliente).trim(),
      correoCliente: String(correoCliente).trim().toLowerCase(),
      ciudad: String(ciudad).trim().toLowerCase(),
      estado: String(estado).trim().toLowerCase(),
      items: items.map((it, idx) => ({
        idItem: `ITM-${idx + 1}`,
        codigo: it.codigo,
        cantidad: Number(it.cantidad),
        precio: Number(it.precio),
        subtotal: Number(it.cantidad) * Number(it.precio),
      })),
      total: Number(total),
      fecha: new Date(fecha),
      creadoEn: new Date(),
    };

    const resultado = await repo.crearPedido(nuevoPedido);
    nuevoPedido._id = resultado.insertedId;

    res
      .status(201)
      .location(`/v1/pedidos/${resultado.insertedId}`)
      .json(nuevoPedido);
  } catch (error) {
    if (error.code === 11000) {
      return fallo(res, 409, "CONFLICTO", "Conflicto de clave única en la base de datos");
    }
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al crear pedido");
  }
});

// GET /v1/pedidos/:id - Obtener un pedido por id
router.get("/:id", async (req, res) => {
  try {
    const pedido = await repo.obtenerPedido(req.params.id);
    if (!pedido) {
      return fallo(res, 404, "NO_ENCONTRADO", "Pedido no encontrado");
    }
    res.json(pedido);
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al consultar pedido");
  }
});

// PUT /v1/pedidos/:id - Reemplazo completo (Idempotente)
router.put("/:id", async (req, res) => {
  try {
    const erroresValidacion = validarPedido(req.body);
    if (erroresValidacion.length > 0) {
      return fallo(res, 400, "VALIDACION", "La solicitud contiene campos inválidos para reemplazo", erroresValidacion);
    }

    const pedidoActual = await repo.obtenerPedido(req.params.id);
    if (!pedidoActual) {
      return fallo(res, 404, "NO_ENCONTRADO", "No encontrado");
    }

    // Regla de conflicto de dominio 409: no se puede reemplazar una orden ya entregada
    if (pedidoActual.estado === "entregado") {
      return fallo(res, 409, "CONFLICTO", "No se puede reemplazar un pedido que ya ha sido entregado");
    }

    const datosReemplazo = {
      numeroPedido: req.body.numeroPedido || pedidoActual.numeroPedido,
      cliente: String(req.body.cliente).trim(),
      correoCliente: String(req.body.correoCliente).trim().toLowerCase(),
      ciudad: String(req.body.ciudad).trim().toLowerCase(),
      estado: String(req.body.estado).trim().toLowerCase(),
      items: req.body.items.map((it, idx) => ({
        idItem: it.idItem || `ITM-${idx + 1}`,
        codigo: it.codigo,
        cantidad: Number(it.cantidad),
        precio: Number(it.precio),
        subtotal: Number(it.cantidad) * Number(it.precio),
      })),
      total: Number(req.body.total),
      fecha: new Date(req.body.fecha),
      actualizadoEn: new Date(),
    };

    const actualizado = await repo.reemplazarPedido(req.params.id, datosReemplazo);
    res.json(actualizado);
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al reemplazar pedido");
  }
});

// PATCH /v1/pedidos/:id - Modificacion parcial
router.patch("/:id", async (req, res) => {
  try {
    const erroresValidacion = validarPedido(req.body, true);
    if (erroresValidacion.length > 0) {
      return fallo(res, 400, "VALIDACION", "Campos parciales inválidos", erroresValidacion);
    }

    const pedidoActual = await repo.obtenerPedido(req.params.id);
    if (!pedidoActual) {
      return fallo(res, 404, "NO_ENCONTRADO", "No encontrado");
    }

    if (req.body.estado && pedidoActual.estado === "cancelado") {
      return fallo(res, 409, "CONFLICTO", "Un pedido cancelado no puede cambiar de estado nuevamente");
    }

    const parche = { ...req.body, actualizadoEn: new Date() };
    if (parche.fecha) parche.fecha = new Date(parche.fecha);
    delete parche._id;

    const actualizado = await repo.modificarPedido(req.params.id, parche);
    res.json(actualizado);
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al modificar pedido");
  }
});

// DELETE /v1/pedidos/:id - Eliminacion de pedido (Idempotente)
router.delete("/:id", async (req, res) => {
  try {
    const pedidoActual = await repo.obtenerPedido(req.params.id);
    if (!pedidoActual) {
      return fallo(res, 404, "NO_ENCONTRADO", "No encontrado");
    }

    // Regla de conflicto 409: no se puede eliminar un pedido si ya fue entregado
    if (pedidoActual.estado === "entregado") {
      return fallo(res, 409, "CONFLICTO", "Conflicto: No se puede eliminar un pedido con estado 'entregado'");
    }

    const resultado = await repo.borrarPedido(req.params.id);
    if (!resultado || resultado.deletedCount === 0) {
      return fallo(res, 404, "NO_ENCONTRADO", "No encontrado");
    }

    res.status(204).end();
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al eliminar pedido");
  }
});

// --- SUBRECURSO: Items del pedido (/v1/pedidos/:id/items) ---

// GET /v1/pedidos/:id/items - Listar items de un pedido
router.get("/:id/items", async (req, res) => {
  try {
    const items = await repo.obtenerItems(req.params.id);
    if (items === null) {
      return fallo(res, 404, "NO_ENCONTRADO", "Pedido no encontrado");
    }
    res.json(items);
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al obtener items del pedido");
  }
});

// POST /v1/pedidos/:id/items - Agregar item al subrecurso
router.post("/:id/items", async (req, res) => {
  try {
    const errores = validarItem(req.body);
    if (errores.length > 0) {
      return fallo(res, 400, "VALIDACION", "Datos del item inválidos", errores);
    }

    const nuevoItem = {
      idItem: `ITM-${Date.now()}`,
      codigo: req.body.codigo,
      cantidad: Number(req.body.cantidad),
      precio: Number(req.body.precio),
      subtotal: Number(req.body.cantidad) * Number(req.body.precio),
    };

    const actualizado = await repo.agregarItem(req.params.id, nuevoItem);
    if (!actualizado) {
      return fallo(res, 404, "NO_ENCONTRADO", "Pedido no encontrado");
    }

    res
      .status(201)
      .location(`/v1/pedidos/${req.params.id}/items/${nuevoItem.idItem}`)
      .json(nuevoItem);
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al agregar item al pedido");
  }
});

// DELETE /v1/pedidos/:id/items/:itemId - Eliminar un item del subrecurso
router.delete("/:id/items/:itemId", async (req, res) => {
  try {
    const ok = await repo.borrarItem(req.params.id, req.params.itemId);
    if (ok === null) {
      return fallo(res, 404, "NO_ENCONTRADO", "Pedido no encontrado");
    }
    if (ok === false) {
      return fallo(res, 404, "NO_ENCONTRADO", "Item no encontrado en este pedido");
    }
    res.status(204).end();
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al eliminar item");
  }
});

module.exports = { router };
