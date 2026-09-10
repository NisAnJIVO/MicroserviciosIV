const CIUDADES_VALIDAS = [
  "sucre",
  "la paz",
  "cochabamba",
  "santa cruz",
  "oruro",
  "potosi",
  "tarija",
  "beni",
  "pando",
];

const ESTADOS_VALIDOS = ["pendiente", "enviado", "entregado", "cancelado"];
const CODIGO_ITEM_REGEX = /^[A-Z]{3}-\d{3}$/;
const CORREO_REGEX = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

function validarPedido(cuerpo = {}, esParcial = false) {
  const d = [];

  // Regla 1: cliente (obligatorio y min 3 letras)
  if (!esParcial || cuerpo.cliente !== undefined) {
    if (!cuerpo.cliente || String(cuerpo.cliente).trim().length < 3) {
      d.push({ campo: "cliente", problema: "obligatorio, mínimo 3 caracteres alfabéticos" });
    }
  }

  // Regla 2: correoCliente (formato de correo válido)
  if (!esParcial || cuerpo.correoCliente !== undefined) {
    if (!CORREO_REGEX.test(String(cuerpo.correoCliente || ""))) {
      d.push({ campo: "correoCliente", problema: "debe ser un correo electrónico válido" });
    }
  }

  // Regla 3: ciudad (debe pertenecer al dominio nacional)
  if (!esParcial || cuerpo.ciudad !== undefined) {
    const ciudad = String(cuerpo.ciudad || "").trim().toLowerCase();
    if (!CIUDADES_VALIDAS.includes(ciudad)) {
      d.push({
        campo: "ciudad",
        problema: `ciudad no soportada. Permitidas: ${CIUDADES_VALIDAS.join(", ")}`,
      });
    }
  }

  // Regla 4: estado (enum restringido)
  if (!esParcial || cuerpo.estado !== undefined) {
    const estado = String(cuerpo.estado || "").trim().toLowerCase();
    if (!ESTADOS_VALIDOS.includes(estado)) {
      d.push({
        campo: "estado",
        problema: `estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`,
      });
    }
  }

  // Regla 5: fecha (formato ISO y fecha no futura)
  if (!esParcial || cuerpo.fecha !== undefined) {
    if (!cuerpo.fecha) {
      d.push({ campo: "fecha", problema: "la fecha es obligatoria" });
    } else {
      const fechaMs = Date.parse(cuerpo.fecha);
      if (isNaN(fechaMs)) {
        d.push({ campo: "fecha", problema: "formato de fecha inválido (use ISO 8601, ej. 2026-09-03T12:00:00Z)" });
      } else {
        const fecha = new Date(fechaMs);
        const hoy = new Date();
        // Margen de 5 minutos por desfase de reloj
        if (fecha.getTime() > hoy.getTime() + 300000) {
          d.push({ campo: "fecha", problema: "la fecha del pedido no puede ser futura" });
        }
      }
    }
  }

  // Regla 6: items (arreglo no vacio con codigo, cantidad > 0, precio > 0)
  if (!esParcial || cuerpo.items !== undefined) {
    if (!Array.isArray(cuerpo.items) || cuerpo.items.length === 0) {
      d.push({ campo: "items", problema: "debe incluir al menos un item en el pedido" });
    } else {
      let sumaCalculada = 0;
      cuerpo.items.forEach((item, index) => {
        if (!item.codigo || !CODIGO_ITEM_REGEX.test(String(item.codigo))) {
          d.push({
            campo: `items[${index}].codigo`,
            problema: "código inválido, debe tener formato de catálogo ej. ART-001 o ALM-003",
          });
        }
        if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
          d.push({
            campo: `items[${index}].cantidad`,
            problema: "la cantidad debe ser un entero mayor que 0",
          });
        }
        if (typeof item.precio !== "number" || item.precio <= 0) {
          d.push({
            campo: `items[${index}].precio`,
            problema: "el precio debe ser un número positivo mayor a 0",
          });
        } else if (Number.isInteger(item.cantidad) && item.cantidad > 0) {
          sumaCalculada += item.precio * item.cantidad;
        }
      });

      // Regla 7: Coherencia contable de total
      if (cuerpo.total !== undefined) {
        if (typeof cuerpo.total !== "number" || Math.abs(cuerpo.total - sumaCalculada) > 0.01) {
          d.push({
            campo: "total",
            problema: `el total (${cuerpo.total}) no coincide con la suma calculada de items (${sumaCalculada})`,
          });
        }
      }
    }
  }

  return d;
}

function validarItem(item = {}) {
  const d = [];
  if (!item.codigo || !CODIGO_ITEM_REGEX.test(String(item.codigo))) {
    d.push({
      campo: "codigo",
      problema: "código inválido, formato requerido: 3 letras mayúsculas, guion y 3 dígitos (ej. ART-001)",
    });
  }
  if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
    d.push({ campo: "cantidad", problema: "la cantidad debe ser un entero mayor que 0" });
  }
  if (typeof item.precio !== "number" || item.precio <= 0) {
    d.push({ campo: "precio", problema: "el precio debe ser un número positivo mayor que 0" });
  }
  return d;
}

module.exports = { validarPedido, validarItem, CIUDADES_VALIDAS, ESTADOS_VALIDOS };
