const express = require("express");
const router = express.Router();
const { getRepository } = require("typeorm");
const bcrypt = require("bcrypt");
const { Usuario } = require("../entity/Usuario");
const controlador = require("../controller/usuarioController");

router.get("/", async (req, res) => {
 controlador.obtenerUsuarios(req, res);
});

// Página para crear un usuario
router.get("/crear", (req, res) => {
  res.render("usuarios/crear");
});

router.post("/crear", async (req, res) => {
  const { correo, contraseña, nombre, rol } = req.body;
  const hashedPassword = await bcrypt.hash(contraseña, 10);
  const nuevoUsuario = getRepository(Usuario).create({
    correo,
    contraseña: hashedPassword,
    nombre,
    rol,
  });
  await getRepository(Usuario).save(nuevoUsuario);
  res.redirect("/usuarios");
});

// Página para editar un usuario
router.get("/editar/:id", async (req, res) => {
    
   const usuario = await getRepository(Usuario).findOneBy({id:req.params.id});
      if (!usuario) return res.status(404).send("Usuario no encontrado");
  
      res.render("usuarios/editar", { usuario });
});

router.post("/editar/:id", async (req, res) => {
  console.log("entro");
  const { correo, nombre, rol } = req.body;
  const usuario = await getRepository(Usuario).findOneBy({id:req.params.id});
  console.log(usuario);
  if (usuario) {
    usuario.correo = correo;
    usuario.nombre = nombre;
    usuario.rol = rol;
    await getRepository(Usuario).save(usuario);
  }
  res.redirect("/usuarios");
});

// Eliminar un usuario
router.post("/eliminar/:id", async (req, res) => {
  await getRepository(Usuario).delete(req.params.id);
  res.redirect("/usuarios");
});

module.exports = router;
