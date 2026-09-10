const CORREO = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

function validarUsuario(cuerpo = {}) {
  const d = [];
  const { nombre, correo, edad } = cuerpo;
  if (!nombre || String(nombre).trim().length < 3) {
    d.push({ campo: "nombre", problema: "obligatorio, mínimo 3 caracteres" });
  }
  if (!CORREO.test(String(correo || ""))) {
    d.push({ campo: "correo", problema: "formato de correo inválido" });
  }
  if (!Number.isInteger(edad) || edad <= 0 || edad > 120) {
    d.push({ campo: "edad", problema: "entero entre 1 y 120" });
  }
  return d;
}

module.exports = { validarUsuario };
