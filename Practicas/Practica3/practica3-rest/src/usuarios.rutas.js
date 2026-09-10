const { Router } = require("express");
const router = Router();
const repo = require("./repositorio");
const { validarUsuario } = require("./usuarios.validacion");
const { fallo } = require("./errores");

const TOPE = 100;

// GET /v1/usuarios - Listado paginado con filtro y orden
router.get("/", async (req, res) => {
  try {
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const limite = Math.min(TOPE, Number(req.query.limite) || 20);
    const filtro = {};

    if (req.query.edadMin) {
      filtro.edad = { $gte: Number(req.query.edadMin) };
    }

    const orden = {
      [req.query.ordenPor || "nombre"]: req.query.orden === "desc" ? -1 : 1,
    };

    const { datos, total } = await repo.listar(filtro, orden, pagina, limite);

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
    fallo(res, 500, "ERROR_INTERNO", "Error al listar usuarios");
  }
});

// POST /v1/usuarios - Crear usuario
router.post("/", async (req, res) => {
  try {
    const d = validarUsuario(req.body);
    if (d.length > 0) {
      return fallo(res, 400, "VALIDACION", "La solicitud tiene campos inválidos", d);
    }

    const { nombre, correo, edad } = req.body;
    const existente = await repo.porCorreo(correo);
    if (existente) {
      return fallo(res, 409, "CONFLICTO", "El correo ya está registrado");
    }

    const nuevoUsuario = { nombre: String(nombre).trim(), correo: String(correo).trim().toLowerCase(), edad: Number(edad) };
    const resultado = await repo.crear(nuevoUsuario);
    nuevoUsuario._id = resultado.insertedId;

    res
      .status(201)
      .location(`/v1/usuarios/${resultado.insertedId}`)
      .json(nuevoUsuario);
  } catch (error) {
    if (error.code === 11000) {
      return fallo(res, 409, "CONFLICTO", "El correo ya está registrado");
    }
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al crear usuario");
  }
});

// GET /v1/usuarios/:id - Obtener un usuario
router.get("/:id", async (req, res) => {
  try {
    const usuario = await repo.obtener(req.params.id);
    if (!usuario) {
      return fallo(res, 404, "NO_ENCONTRADO", "Usuario no encontrado");
    }
    res.json(usuario);
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al obtener usuario");
  }
});

// PUT /v1/usuarios/:id - Reemplazar usuario completo
router.put("/:id", async (req, res) => {
  try {
    const d = validarUsuario(req.body);
    if (d.length > 0) {
      return fallo(res, 400, "VALIDACION", "La solicitud tiene campos inválidos", d);
    }

    const { nombre, correo, edad } = req.body;
    const usuarioData = { nombre: String(nombre).trim(), correo: String(correo).trim().toLowerCase(), edad: Number(edad) };

    const actualizado = await repo.reemplazar(req.params.id, usuarioData);
    if (!actualizado) {
      return fallo(res, 404, "NO_ENCONTRADO", "No encontrado");
    }
    res.json(actualizado);
  } catch (error) {
    if (error.code === 11000) {
      return fallo(res, 409, "CONFLICTO", "El correo ya está registrado");
    }
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al actualizar usuario");
  }
});

// DELETE /v1/usuarios/:id - Eliminar usuario
router.delete("/:id", async (req, res) => {
  try {
    const resultado = await repo.borrar(req.params.id);
    if (!resultado || resultado.deletedCount === 0) {
      return fallo(res, 404, "NO_ENCONTRADO", "No encontrado");
    }
    res.status(204).end();
  } catch (error) {
    console.error(error);
    fallo(res, 500, "ERROR_INTERNO", "Error al eliminar usuario");
  }
});

module.exports = { router };
