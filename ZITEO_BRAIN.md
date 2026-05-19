# 🧠 Ziteo Brain - Base de Conocimiento Centralizada

Este documento contiene la arquitectura, reglas de negocio y estructura del proyecto **Ziteo**, sirviendo como memoria a largo plazo para los agentes de IA y desarrolladores.

## 1. 🏗️ Arquitectura General
*   **Frontend**: React (Vite) + TypeScript + Tailwind CSS
*   **Gestión de Estado**: Zustand (`authStore`, `navStore`)
*   **Autenticación y Backend**: Supabase (PostgreSQL, Auth, RLS)
*   **Despliegue**: Vercel (Frontend)
*   **PWA**: Sí (`InstallPWA` configurado)

## 2. 🗄️ Schema de Base de Datos y Constraints Clave
La base de datos utiliza PostgreSQL en Supabase, fuertemente protegida mediante **Row Level Security (RLS)**.
*   **`profiles`**: Almacena datos del usuario, vinculado a `auth.users`. (Campos: `user_id`, `name`, `phone`, `city`, `active_role`, `avatar_url`, `email`).
*   **`user_roles`**: Define los roles de los usuarios (tabla relacional).
*   **`orders`**: Pedidos realizados a proveedores.
*   **`contracts`**: Contratos entre constructores y maestros.
*   **`licitaciones`**: Sistema de licitaciones (Tenders) publicadas por constructores y respondidas por maestros.
*   **`reviews`**: Evaluaciones de usuarios.
*   **`deliveries`**: Gestión de envíos de materiales, vinculados a órdenes y a un `chofer`.

*Nota: Las transiciones de estado de órdenes, contratos y licitaciones están protegidas a nivel de base de datos.*

## 3. 👥 Roles, Rutas y Lógica de Navegación (`App.tsx`)
Ziteo maneja un sistema multi-rol dinámico donde el componente `App.tsx` renderiza las pantallas en función del `active_role` del usuario.

| Rol | Vistas / Rutas Principales | Descripción |
| :--- | :--- | :--- |
| **Constructor** | `home`, `proyectos`, `contratar`, `tienda`, `licitaciones`, `mis-pedidos` | Crea proyectos, licita trabajos, contrata maestros y compra materiales. |
| **Maestro** | `trabajos`, `contratar`, `licitaciones` (Feed), `habilidades`, `mi-perfil` | Postula a licitaciones, acepta contratos y gestiona sus habilidades. |
| **Proveedor** | `pedidos`, `inventario`, `intel` | Gestiona su catálogo, recibe pedidos de constructores y evalúa inteligencia de negocio. |
| **Chofer** | `viajes`, `historial`, `billetera` | **No usa 'home'**. Aterriza directamente en `viajes` (TransportistaScreen). Acepta envíos, actualiza estado de rutas y cobra fletes. |

## 4. ⚡ Supabase RPCs (En lugar de Edge Functions)
Ziteo prefiere usar **PostgreSQL RPCs (Functions)** con Triggers para manejar la lógica transaccional compleja y mantener la integridad, en lugar de Edge Functions externas:

*   **`place_order()`**: Transacción atómica que crea una orden basada en el carrito y el total.
*   **`accept_delivery(uuid)`**: Asigna a un chofer un delivery específico, verificando que esté en estado 'pending'.
*   **`update_delivery_status()`**: Maneja las transiciones de los envíos (ej. de `accepted` a `picked_up` a `delivered`).
*   **`send_notification()`**: Inserta registros en la tabla `notifications` (usado para alertar a proveedores, constructores, etc.).
*   **Triggers Automáticos**:
    *   `auto_create_delivery_on_processing()`: Crea un envío logístico automáticamente cuando una orden cambia su estado a `processing`.
    *   `decrement_stock_on_order()`: Reduce el inventario del proveedor de manera segura al confirmar una compra.
*   **Validadores de Estado (Constraints de flujo)**:
    *   `validate_order_status_transition()`
    *   `validate_contract_status_transition()`
    *   `validate_licitacion_status_transition()`
    *   `validate_delivery_status_transition()`

## 5. 💡 Decisiones de Diseño y Patrones Clave
1.  **Tab Navigation Lazy Loaded**: `App.tsx` importa las vistas con `React.lazy()` y un `Suspense` fallback (Esqueleto).
2.  **Auth Flow**: Flujo robusto (Splash -> Welcome -> Login/Register -> OTP -> Onboarding/OAuth -> App).
3.  **Restauración de Sesión Fuerte**: `useEffect` en `App.tsx` fuerza a `supabase.auth.setSession()` desde los tokens guardados en Zustand para evitar desconexiones de RLS.
4.  **Notificaciones**: Guardadas en BD y consultadas vía hook local (sin webhooks complejos, inserción directa al mutar).

## 6. 🌍 Cobertura Geográfica
Actualmente, Ziteo operará inicialmente solo en 3 ciudades: **Sucre, Potosí y Santa Cruz**. El resto de las ciudades en Bolivia están desactivadas hasta que la plataforma expanda su alcance para llegar a ellas.
