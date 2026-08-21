// practica1-TUAPELLIDO.js
// COM-600 · Microservicios · Práctica 1 — MongoDB CRUD
// Estudiante: [Tu nombre y apellido]
// Fecha:      [Fecha de entrega]
//
// Instrucciones:
//   1. Renombrá este archivo reemplazando TUAPELLIDO por tu apellido real.
//   2. Escribí cada comando debajo del comentario de su enunciado.
//   3. Antes de entregar, probá que corre entero sin errores:
//        mongosh < practica1-TUAPELLIDO.js

use("tienda");
load("seed.js"); // restaura 12 productos y 6 pedidos

// ─────────────────────────────────────────────────────────
// PARTE B · CONSULTAS  (B1 – B18)
// ─────────────────────────────────────────────────────────

// B1. Mostrá los productos de la categoría 2 o 7,
//     con el nombre y el precio únicamente, sin el _id.
// RESPUESTA:


// B2. Mostrá los productos cuyo precio esté entre 100 y 300, incluidos los extremos.
// RESPUESTA:


// B3. Mostrá los productos que no están activos.
// RESPUESTA:


// B4. Mostrá los productos cuyo nombre empiece con la letra A o con la letra C.
// RESPUESTA:


// B5. Mostrá los productos que tienen el campo variantes.
// RESPUESTA:


// B6. Encontrá los productos donde stock_minimo se cargó como texto en vez de número.
// RESPUESTA:


// B7. Mostrá los 4 productos con más stock, con el nombre y el stock únicamente.
// RESPUESTA:


// B8. Mostrá la segunda página de un listado ordenado por nombre ascendente, de 4 en 4.
//     (la primera página serían los 4 primeros; la segunda empieza en el quinto)
// RESPUESTA:


// B9. Mostrá los productos que tengan la etiqueta "organico" o la etiqueta "artesania".
//     (una sola condición alcanza; no hace falta $or)
// RESPUESTA:


// B10. Mostrá los productos cuyo array categorias tenga exactamente un elemento.
// RESPUESTA:


// B11. Mostrá los productos con menos de 10 unidades en el almacén de La Paz.
//      Escribí las dos versiones y anotá cuántos documentos devuelve cada una y por qué son distintas.
// SIN $elemMatch:

// CON $elemMatch:

// EXPLICACIÓN: // ...


// B12. Mostrá los productos cuya primera categoría del array categorias sea 1.
// RESPUESTA:


// B13. Mostrá los productos registrados durante el año 2025.
// RESPUESTA:


// B14. Averiguá cuántos productos están activos. Se pide el número, no la lista.
// RESPUESTA:


// B15. Mostrá los pedidos de la ciudad de Sucre cuyo total sea mayor a 300.
// RESPUESTA:


// B16. Mostrá los pedidos que incluyan el producto de código "ALM-005".
//      (el código está dentro de un array de subdocumentos)
// RESPUESTA:


// B17. Mostrá los pedidos que tengan más de un ítem.
//      (pensá en la posición 1 del array)
// RESPUESTA:


// B18. Mostrá la lista de clientes distintos que hicieron pedidos.
// RESPUESTA:


// ─────────────────────────────────────────────────────────
// PARTE B · CREACIÓN  (B19 – B22)
// ─────────────────────────────────────────────────────────

load("seed.js"); // restaura antes de modificar

// B19. Insertá un producto nuevo con: array de textos, subdocumento y array de subdocumentos.
// RESPUESTA:


// B20. Insertá tres productos más en una sola instrucción.
// RESPUESTA:


// B21. Insertá un pedido con _id 7, de un cliente nuevo, con dos ítems.
// RESPUESTA:


// B22. Insertá un producto sin el campo precio.
//      Después contá cuántos productos no tienen precio y explicá el número que sale.
// RESPUESTA (insertar):

// RESPUESTA (contar):

// EXPLICACIÓN: // ...


// ─────────────────────────────────────────────────────────
// PARTE B · ACTUALIZACIÓN  (B23 – B28)
// ─────────────────────────────────────────────────────────

load("seed.js"); // restaura antes de actualizar

// B23. Subí un 10 % el precio de los productos de la categoría 4.
//      Después mirá el precio del poncho de vicuña (TEX-012) y explicá qué le pasó y por qué.
// RESPUESTA (actualizar):

// RESPUESTA (verificar poncho):

// EXPLICACIÓN: // ...


// B24. Pasá a "entregado" todos los pedidos que estén en "enviado",
//      y dejales la fecha de entrega con la hora del servidor. Una sola instrucción.
// RESPUESTA:


// B25. Agregá la etiqueta "liquidacion" a todos los productos inactivos,
//      de manera que no se duplique si alguno ya la tuviera.
// RESPUESTA:


// B26. Borrá el campo stock_minimo únicamente donde está cargado como texto.
//      Verificá después que no queda ninguno así.
// RESPUESTA (borrar campo):

// RESPUESTA (verificar):


// B27. Agregá al café de los Yungas (ALM-011) un almacén nuevo: "Camiri" con 5 unidades,
//      sin tocar los almacenes que ya tiene.
// RESPUESTA:


// B28. Con una sola instrucción, actualizá "BEB-030" si existe y creálo si no existe,
//      con un nombre, precio 40 y stock 25.
// RESPUESTA:


// ─────────────────────────────────────────────────────────
// PARTE B · ELIMINACIÓN  (B29 – B32)
// ─────────────────────────────────────────────────────────

load("seed.js"); // restaura antes de eliminar

// B29. Contá cuántos pedidos están cancelados y recién después borralos.
//      Entregá los dos comandos, en ese orden.
// RESPUESTA (contar):

// RESPUESTA (borrar):


// B30. Eliminá un solo producto que tenga la etiqueta "textil".
//      (hay más de uno; el comando tiene que borrar exactamente uno)
// RESPUESTA:


// B31. Eliminá los productos con stock menor a 5.
// RESPUESTA:


// B32. Restaurá la base al punto de partida y verificá que quedaron 12 productos y 6 pedidos.
// RESPUESTA:

