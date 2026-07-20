# Chofer v2 — Pool unificado deliveries + transporte (2026-06-26)

## Qué se hizo
Activado el tab Transporte del chofer con rediseño completo (F4 de la auditoría 2026-06-11). El rol Chofer ahora muestra un pool unificado de entregas de la Tienda y solicitudes de transporte directo en una sola UI.

## Problema anterior
La pestaña Transporte del chofer mostraba un placeholder "Próximamente" aunque la tabla transport_requests, el RPC accept_transport_request, y los hooks del cliente ya existían. El selector de modo Entregas/Transporte en TransportistaScreen dividía el pool artificialmente y nunca conectaba la pestaña Transporte.

## Solución (commits 92c7b26 + 97e8a32)

### Backend
- RPC advance_transport_request(p_request_id uuid, p_new_status text) SECURITY DEFINER: valida ownership (driver_id = auth.uid()), transiciones de estado (accepted→in_transit→completed), setea completed_at. GRANT a authenticated.
- Trigger trg_notify_requester_on_transport → función notify_requester_on_transport() SECURITY DEFINER: inserta en notifications al requester cuando status cambia a accepted o completed. Mismo patrón que notify_provider_on_new_order.
- Migraciones aplicadas en prod (proyecto yvqbubjfhmuztknmhyvd) y archivos en supabase/migrations/.

### Frontend — nuevos archivos
- transportista/types/jobTypes.ts: tipo discriminado UnifiedJob ('delivery' | 'transport') y ActiveJob
- transportista/hooks/useUnifiedPool.ts: agrega usePendingDeliveries + usePendingTransportRequests, ordena por distancia GPS luego recencia, dispatch por kind al RPC correcto
- transportista/components/JobFocusCard.tsx: tarjeta grande del mejor trabajo próximo, botón Aceptar 72px zona pulgar, botón "Ver siguiente"
- transportista/components/ActiveJobsList.tsx: lista unificada de trabajos activos (deliveries + transportes) con avance de estado
- transportista/components/VehicleIcons.tsx: iconos SVG de vehículo extraídos de TransportistaScreen
- transportista/components/RadarActive.tsx: radar SVG animado extraído de TransportistaScreen

### Frontend — modificados
- transportista/components/TransportistaScreen.tsx: descompuesto de 735 → 261 líneas. Elimina selector de modo y placeholder "Próximamente". Usa useUnifiedPool + JobFocusCard + ActiveJobsList.
- transporte/hooks/useTransportRequests.ts: añadidos useMyTransportRequests() (mis transportes activos, con realtime UPDATE) y useAdvanceTransportRequest() (llama advance_transport_request RPC).

## Patrón establecido
El pool del chofer usa kind para despachar: 'delivery' → accept_delivery, 'transport' → accept_transport_request. Para un tercer tipo de trabajo futuro, añadir variante a UnifiedJob y rama en useUnifiedPool.accept(). Las notificaciones al solicitante son responsabilidad del trigger de BD, no del frontend.

## Componentes del sistema afectados

### Frontend
- TransportistaScreen: orquestador ≤350 líneas, usa pool unificado
- useUnifiedPool: hook agregador con dispatch por kind
- JobFocusCard: UI principal del pool, una decisión por pantalla
- ActiveJobsList: gestión de trabajos en curso (ambos tipos)
- useMyTransportRequests: mis transportes activos con realtime
- useAdvanceTransportRequest: avanzar estado de transporte

### Backend
- RPC advance_transport_request: máquina de estados con ownership check
- Trigger trg_notify_requester_on_transport: notificación SECURITY DEFINER
- Tabla transport_requests: status ahora fluye pending→accepted→in_transit→completed

## Limitación conocida
transport_requests no tiene columna de tarifa → feeLabel = "A convenir". No alimenta useDriverEarnings. Se negocia offline.
