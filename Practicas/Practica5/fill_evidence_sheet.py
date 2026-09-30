import docx

doc = docx.Document('Practica 5. Comunicacion de alto rendimiento con gRPC - Hoja de Evidencias.docx')

# Mark Table 2 checklist with 'X'
t2 = doc.tables[2]
for row in t2.rows[1:]:
    row.cells[3].text = 'X'

# Pregunta 1 -> Table 4
t4 = doc.tables[4]
t4.rows[0].cells[0].text = (
    "En nuestro proyecto integrador (Plataforma de Comercio Electrónico y Gestión de Pedidos), "
    "el servicio de Procesamiento de Pedidos (Order Service) necesita comunicarse intensivamente "
    "con el servicio de Inventario y Validación de Stock (Inventory Service).\n\n"
    "• Quién llama a quién: El servicio de Pedidos llama al servicio de Inventario de manera síncrona "
    "en cada transacción de checkout para verificar existencias y reservar unidades en tiempo real.\n"
    "• Cada cuánto: Decenas a cientos de llamadas por segundo durante picos de demanda o eventos de venta masiva.\n"
    "• Volumen de datos: Cargas pequeñas a medianas (listas de 5 a 20 items con IDs y cantidades), pero con "
    "una restricción estricta de latencia ultra baja (< 3 ms) y tipado binario riguroso.\n"
    "• Justificación: Agregar gRPC como tercer estilo de comunicación está plenamente justificado porque "
    "elimina la sobrecarga de serialización/deserialización de JSON en texto plano y las cabeceras redundantes "
    "de HTTP/1.1 de REST, aprovechando la multiplexación de HTTP/2 y la serialización binaria compacta de "
    "Protocol Buffers para optimizar el throughput y reducir el consumo de CPU en el backend interno."
)

# Pregunta 2 -> Table 8
t8 = doc.tables[8]
t8.rows[0].cells[0].text = (
    "1. Consecuencia favorable:\n"
    "• Eficiencia y reducción de payload: Al no transmitir los nombres de los campos como cadenas de texto "
    '(como "ci", "nombres", "carrera"), el tamaño del mensaje se reduce drásticamente ahorrando ancho de banda.\n'
    "• Flexibilidad de refactorización: Permite que el equipo de desarrollo renombre campos en el archivo .proto "
    '(por ejemplo, renombrar "nombres" por "primer_nombre") sin romper la compatibilidad con clientes existentes '
    "que ya utilicen el mismo número de campo.\n\n"
    "2. Consecuencia peligrosa:\n"
    "• Riesgo de corrupción silenciosa de datos: Si un desarrollador cambia o reutiliza el número de un campo "
    'previamente asignado a otro dato (por ejemplo, reutilizar el tag 4 para "correo" cuando antes correspondía a '
    '"carrera"), el deserializador inyectará los datos del nuevo tipo en la propiedad antigua del cliente sin '
    "generar ningún error ni excepción en tiempo de ejecución. Esto provoca datos inconsistentes o corruptos "
    'difíciles de detectar en producción a menos que se declare "reserved".'
)

# Pregunta 3 -> Table 11
t11 = doc.tables[11]
t11.rows[0].cells[0].text = (
    "• Causa de la diferencia: La API REST utiliza formatos de texto auto-descriptivos (JSON sobre HTTP/1.1), "
    "donde las claves y valores viajan explícitos en texto plano legible por humanos, permitiendo a clientes "
    "genéricos como curl inspeccionar e interactuar sin esquemas previos. En contraste, gRPC serializa los "
    "datos en formato binario compacto (Protocol Buffers) donde solo viajan números de campo (tags) y valores binarios; "
    "por ende, herramientas como grpcurl o clientes gRPC requieren obligatoriamente el archivo de contrato .proto "
    "para saber cómo empaquetar y deserializar los bytes.\n\n"
    "• Qué se gana:\n"
    "  1. Rendimiento superior: payloads binarios significativamente más livianos y serialización ultra rápida.\n"
    "  2. Contrato estricto y tipado formal garantizado en tiempo de compilación entre microservicios, eliminando ambigüedades.\n\n"
    "• Qué se pierde:\n"
    "  1. Depuración e inspección directa en texto plano: no es posible probar endpoints directamente desde un "
    "navegador web estándar o con curl básico sin el esquema o reflexión habilitada.\n"
    "  2. Mayor acoplamiento operacional al requerir sincronizar el contrato .proto entre todos los clientes."
)

# Pregunta 4 -> Table 14
t14 = doc.tables[14]
t14.rows[0].cells[0].text = (
    "• Diferencia fundamental de reintento:\n"
    "  - UNAVAILABLE (14): Significa que el canal de comunicación no se pudo establecer (servidor caído, en reinicio "
    "o error de red previo). La petición NUNCA llegó al servidor B ni fue procesada, por lo que reintentar la llamada "
    "es completamente seguro e idempotente.\n"
    "  - DEADLINE_EXCEEDED (4): Significa que el cliente agotó su tiempo de espera límite (timeout), pero la petición "
    "SÍ pudo haber alcanzado al servidor B y este podría estar todavía procesándola o haber completado la transacción.\n\n"
    "• Ejemplo y daño real en el proyecto integrador:\n"
    '  En nuestro microservicio de Facturación y Cobros, al invocar la operación "CobrarTransaccionQR" o "DescontarSaldo": '
    "si la llamada falla con DEADLINE_EXCEEDED debido a lentitud en la pasarela de pagos y el cliente reintenta "
    "automáticamente la petición a ciegas, causará un DOBLE COBRO o débito duplicado al usuario, generando perjuicio "
    "financiero real e inconsistencia grave de saldos."
)

# Pregunta 5 -> Table 18
t18 = doc.tables[18]
t18.rows[0].cells[0].text = (
    "• Caso donde el flujo del servidor (Streaming) es una MEJORA REAL:\n"
    "  - Operación: Consulta y sincronización masiva de catálogo histórico de pedidos o inventario (ej. listar 5,000 "
    "o más registros para auditoría o exportación).\n"
    "  - Justificación: Con streaming, el servidor envía los registros de inmediato por el canal HTTP/2 y el cliente "
    "recibe el primer elemento en ~1.8 ms (Time To First Byte muy bajo). Mientras los demás elementos continúan "
    "transfiriéndose, el cliente ya puede procesar, indexar o renderizar progresivamente en memoria sin esperar a "
    "que el servidor arme un payload gigante ni agotar la memoria RAM.\n\n"
    "• Caso donde el flujo del servidor es una COMPLICACIÓN SIN BENEFICIO:\n"
    "  - Operación: Consulta del detalle de un pedido específico por su ID (que contiene de 1 a 5 productos).\n"
    "  - Justificación: El volumen de datos es mínimo (< 500 bytes) y el cliente necesita obligatoriamente tener "
    "todos los datos completos del pedido para calcular y mostrar el total de la compra antes de continuar. "
    "Utilizar streaming en este escenario solo añade complejidad innecesaria de manejo de eventos (data, end, error) "
    "y sobrecarga de framing sin ningún beneficio de rendimiento."
)

# Pregunta 6 -> Table 21
t21 = doc.tables[21]
t21.rows[0].cells[0].text = (
    '• En la API REST (JSON): Si se renombra un campo (ej. "carrera" a "correo"), el cliente que intente acceder '
    'a "res.carrera" recibirá "undefined". Esto produce inmediatamente un fallo explícito y visible '
    '(ej. "TypeError: Cannot read properties of undefined" o campos vacíos en pruebas unitarias), lo cual se '
    "detecta en segundos durante el desarrollo o pruebas automatizadas.\n\n"
    "• En gRPC (Protobuf): Al reordenar o intercambiar números de campo (tags), el deserializador del cliente "
    'viejo asigna el nuevo valor (la dirección de correo) a la propiedad "carrera" sin disparar ningún error '
    "sintáctico, excepción de red ni advertencia en consola. La aplicación sigue funcionando normalmente en apariencia, "
    "pero mostrando un correo en la columna de carreras.\n\n"
    "• Conclusión: La falla en REST es MUCHO MÁS FÁCIL DE DETECTAR porque falla de forma ruidosa y explícita. "
    "La falla en gRPC es una CORRUPCIÓN SILENCIOSA DE DATOS, lo cual es sumamente peligroso porque contamina bases "
    "de datos y reportes sin ser percibida de inmediato."
)

# Pregunta 7 -> Table 23
t23 = doc.tables[23]
t23.rows[0].cells[0].text = (
    "• Regla para el README:\n"
    '  "Nunca modifique ni reutilice el número de un campo existente en un archivo .proto; si un campo deja de '
    'utilizarse, márquelo obligatoriamente con reserved <número>; reserved \\"<nombre>\\"; y asigne siempre un '
    'nuevo número secuencial a cualquier nuevo campo."\n\n'
    "• Quién debe revisarla: El Tech Lead / Revisor de Código (Peer Reviewer) o un linter automatizado de contratos "
    "(como buf lint / buf breaking).\n"
    "• En qué momento: En la etapa de diseño de la interfaz y de manera obligatoria durante la revisión del "
    "Pull Request antes de fusionar código a la rama principal."
)

# Pregunta 8 -> Table 27
t27 = doc.tables[27]
t27.rows[0].cells[0].text = (
    "1. ¿Por qué sería un error exponer gRPC directamente al navegador final?\n"
    "Porque los navegadores estándar no soportan el control nativo de tramas HTTP/2 requerido por gRPC sin utilizar "
    "proxies intermediarios como gRPC-Web / Envoy. Además, se perdería la facilidad de consumo estándar de la web "
    "(fetch/JSON) y la capacidad de inspección sencilla en herramientas de desarrollador, perjudicando la "
    "interoperabilidad con clientes heterogéneos y de terceros.\n\n"
    "2. ¿Por qué sería un error usar REST entre servicios internos si ya se tiene el contrato gRPC?\n"
    "Porque REST introduce una sobrecarga innecesaria de serialización/deserialización de cadenas de texto JSON, "
    "mayor consumo de ancho de banda por nombres de claves repetitivas y mayor latencia por la falta de multiplexación "
    "eficiente de conexiones persistentes. gRPC optimiza el rendimiento interno al utilizar un formato binario compacto "
    "y provee un contrato fuertemente tipado que previene inconsistencias entre microservicios."
)

# Cierre de la Parte 1 -> Tables 30, 31, 32
doc.tables[30].rows[0].cells[0].text = (
    "La comprensión profunda de la evolución de contratos y el mecanismo de ruptura silenciosa de datos. "
    "Fue sumamente ilustrativo observar cómo un simple intercambio de números de campo (tags) produce datos "
    "erróneos sin que el compilador o runtime emita ninguna advertencia, destacando la importancia crítica "
    'del uso de "reserved".'
)

doc.tables[31].rows[0].cells[0].text = (
    "La configuración de la dirección de enlace de red (GRPC_ADDR=0.0.0.0:50051) para que el servicio gRPC fuera "
    "alcanzable dentro de la red privada de Docker por parte del servicio REST consumidor (evitando el error común "
    "de escuchar únicamente en 127.0.0.1 / localhost dentro del contenedor)."
)

doc.tables[32].rows[0].cells[0].text = (
    "Implementaría desde el primer momento herramientas de linting automatizado de contratos Protocol Buffers "
    "(como el CLI de Buf) en el flujo de integración continua (CI) para detectar automáticamente campos rotos "
    "o falta de cláusulas reserved antes de compilar los servicios."
)

doc.save('Practica 5. Comunicacion de alto rendimiento con gRPC - Hoja de Evidencias.docx')
print('Document successfully updated!')
