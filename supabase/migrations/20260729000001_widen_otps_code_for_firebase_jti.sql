-- Ensancha otps.code para el jti del adaptador Firebase.
--
-- El adaptador Firebase (_shared/otp-firebase-adapter.ts) registra el token ya
-- consumido como `sub:auth_time` (~39 chars) para bloquear replays. Con la
-- columna en varchar(6) ese insert fallaba, y como el error no se chequeaba,
-- la verificación seguía adelante sin dejar rastro: el mismo ID token de
-- Firebase se podía reusar dentro de su ventana de 10 minutos.
--
-- Aditivo: el proveedor whatsapp sigue guardando códigos de 6 dígitos.

alter table public.otps alter column code type varchar(128);
