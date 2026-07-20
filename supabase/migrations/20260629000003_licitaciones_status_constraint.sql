-- Normaliza valores legacy y blinda la columna status de licitaciones.
-- Causa raíz: licitaciones.status no tenía CHECK constraint, y una fila quedó
-- en el valor huérfano 'active' (ningún código actual lo escribe), invisible para
-- maestros/proveedores que filtran por status='open'.

UPDATE public.licitaciones SET status = 'open' WHERE status = 'active';

ALTER TABLE public.licitaciones
  ADD CONSTRAINT licitaciones_status_check
  CHECK (status IN ('open', 'closed'));
