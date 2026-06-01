# ZITEO — Informe de Funcionamiento de la Aplicación
### Para presentación a usuarios potenciales · Mayo 2026

---

## ¿Qué es Ziteo?

**Ziteo** es un marketplace de construcción hecho en Bolivia, para Bolivia. Conecta en un solo lugar a todos los actores del sector: constructores que necesitan materiales y mano de obra, proveedores que quieren vender sus productos, maestros de obra que buscan trabajo y transportistas que ofrecen su servicio de entrega.

Disponible como **aplicación móvil (PWA)** — se instala directamente desde el navegador, sin pasar por tiendas de aplicaciones. Funciona en Android e iOS, con soporte completo para modo claro y oscuro.

**Ciudades activas:** Sucre, Potosí y Santa Cruz.

---

## Los 4 Roles de Usuario

Ziteo reconoce que la construcción involucra distintos tipos de profesionales. Al registrarse, cada usuario elige su rol:

| Rol | ¿Quién es? | ¿Qué hace en Ziteo? |
|---|---|---|
| **Constructor** | Empresa constructora o contratista independiente | Pide materiales, contrata maestros, gestiona proyectos, licita |
| **Proveedor** | Ferretería, distribuidora o vendedor de materiales | Publica productos, recibe pedidos, gestiona inventario |
| **Maestro de Obra** | Trabajador calificado (albanil, electricista, plomero, etc.) | Postula a proyectos, ofrece sus servicios, administra contratos |
| **Transportista (Chofer)** | Conductor de camión, volqueta o motocicleta | Recibe solicitudes de entrega, gestiona sus rutas y ganancias |

Un mismo usuario puede registrarse con múltiples roles y cambiar entre ellos.

---

## Cómo Funciona: Pantalla por Pantalla

### Registro e Inicio de Sesión

- El usuario ingresa su **número de teléfono** y una **contraseña de 8 dígitos**.
- Se verifica la identidad mediante un código **OTP** enviado al celular.
- Opción de registro con **Google** o **Apple** (OAuth).
- Al primer ingreso, un **asistente de onboarding** guía al usuario según su rol.

---

### CONSTRUCTOR

El constructor tiene acceso a cuatro módulos principales desde su barra de navegación:

#### Home
- Saludo personalizado con nombre, ciudad y rol.
- **Resumen en tiempo real**: proyectos activos, contratos pendientes, total invertido en Bs.
- **Acciones rápidas**: crear nuevo proyecto, contratar maestro, ver mis proyectos.
- **Actividad reciente**: últimas notificaciones (contratos, pedidos, pagos, mensajes).
- **Botones de acceso directo** a Tienda, Transporte Pesado y Transporte Ligero.
- Barra de búsqueda global: proyectos, personas, productos.

#### Tienda
- Catálogo de materiales organizado por **etapa de construcción**: Fundaciones, Muros, Techos, Terminaciones.
- Filtros por categoría, precio, ciudad y disponibilidad.
- **Surtido Rápido**: ordena un conjunto de materiales para una etapa completa con un solo toque.
- Carrito de compras con resumen y **checkout integrado**.
- Pago mediante **código QR** generado en la app.
- Seguimiento del estado del pedido.

#### Proyectos
- Crear y gestionar **proyectos de construcción**: nombre, ciudad, presupuesto, estado.
- Ver el historial de proyectos: activos, en pausa, completados.
- Acceso al detalle de cada proyecto con contratistas y proveedores asociados.
- Formulario para **publicar un nuevo proyecto** directamente desde la app.

#### Licitaciones
- El constructor puede **publicar una licitación** describiendo el trabajo que necesita.
- Recibe postulaciones de maestros calificados.
- Compara perfiles y selecciona al trabajador más adecuado.

#### Transporte
- **Transporte pesado**: solicitar camiones o volquetas para cemento, acero, arena.
- **Transporte ligero**: motos o mensajería para herramientas o insumos pequeños.

---

### PROVEEDOR (Vendedor)

El proveedor gestiona su negocio desde cuatro pestañas:

#### Home / Resumen
- Panel con métricas clave: ventas del día, pedidos pendientes, productos activos.
- Acceso rápido a las funciones más usadas.
- Confirmación de pagos QR recibidos.

#### Inventario
- Listado completo de productos publicados con foto, precio, stock y categoría.
- Agregar, editar o desactivar productos.
- Categorías de construcción: cemento, hierro, ladrillo, pintura, sanitarios, herramientas, etc.
- Carga de fotos de producto.

#### Pedidos
- Bandeja de pedidos entrantes desde constructores.
- Estados: pendiente, confirmado, en preparación, listo para entrega.
- Actualizar el estado de cada pedido con un toque.

#### Cotizaciones
- Recibir y responder solicitudes de cotización de constructores.
- Historial de cotizaciones enviadas.

#### Logística
- Coordinación de entregas: asignar transportista o seguimiento de entrega.

---

### MAESTRO DE OBRA

El maestro dispone de cuatro pestañas adaptadas a su flujo de trabajo:

#### Home
- Resumen de contratos activos, ofertas pendientes y total ganado en Bs.
- Acceso rápido a buscar trabajo, ver contratos y revisar ganancias.

#### Trabajos (Licitaciones)
- Feed de licitaciones publicadas por constructores.
- Filtros por especialidad, ciudad y tipo de trabajo.
- **Postularse** a proyectos directamente desde la app.
- Ver el estado de cada postulación.

#### Proyectos
- Historial de proyectos en los que ha participado.
- Detalles del contrato: duración, pago, empleador.

#### Mi Perfil
- Perfil público visible para constructores: foto, especialidades, experiencia (en años), tarifa (por día o por metro cuadrado), disponibilidad.
- **Asistente de onboarding** guiado para completar el perfil al registrarse por primera vez.
- Actualizar habilidades y disponibilidad.

---

### TRANSPORTISTA (Chofer / Repartidor)

El transportista tiene una interfaz diseñada para operar desde el vehículo:

#### Radar
- Mapa en tiempo real mostrando **solicitudes de entrega cercanas**.
- Alertas instantáneas cuando llega una nueva solicitud: tipo de carga, distancia, pago en Bs.
- Aceptar o rechazar solicitudes con un botón.

#### Mis Pedidos
- Lista de entregas activas, completadas e historial.
- Detalle de cada entrega: origen, destino, producto, kilometraje y pago.

#### Ganancias
- Resumen de ingresos del día, la semana y el mes.
- Historial de pagos recibidos.

#### Perfil
- Información del vehículo, documentación, zona de operación.
- Billetera y método de cobro.

---

## Comunicación en la App

- **Notificaciones en tiempo real**: contratos, pedidos, mensajes, pagos.
- **Chat integrado**: comunicación directa entre constructor ↔ maestro, constructor ↔ proveedor y constructor ↔ transportista.
- **Notificaciones push** cuando la app está en segundo plano o cerrada.

---

## Pagos

- Integración de pago mediante **código QR** (flujo nativo en Bolivia).
- Confirmación automática del pago en la app del proveedor.
- Historial de transacciones por rol.

---

## Seguridad y Privacidad

- Autenticación por teléfono + contraseña de 8 dígitos o biometría OAuth.
- Verificación OTP en cada registro.
- Los datos personales se almacenan de forma segura en Supabase.
- Política de privacidad y términos de uso disponibles dentro de la app.
- Conformidad con normativa de protección de datos.

---

## Tecnología

| Componente | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + TailwindCSS |
| Backend / BD | Supabase (PostgreSQL + Edge Functions) |
| Despliegue | Vercel (PWA, sin tienda de apps) |
| Tiempo real | Supabase Realtime |
| Pagos QR | Integración nativa QR boliviana |

---

## ¿Cómo descargar la app?

1. Abrir el navegador en el celular y entrar a **ziteo-frontend.vercel.app**
2. Tocar el botón **"Instalar"** que aparece en el navegador (o desde el menú del navegador → "Agregar a pantalla de inicio")
3. La app se instala como cualquier aplicación nativa, sin pasar por Google Play ni App Store.

---

## En Resumen

Ziteo elimina las llamadas, los intermediarios y el desorden del proceso de construcción boliviano. Todo — materiales, mano de obra, transporte y pagos — en una sola app, diseñada para profesionales que valoran su tiempo.

> *"Conecta con proveedores, maestros de obra y transportistas. Todo lo que necesitas para construir, en un solo lugar."*

---

*Informe generado el 21 de mayo de 2026 · Versión Beta · Operando en Sucre, Potosí y Santa Cruz*
