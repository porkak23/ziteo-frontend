-- F2 Dashboard Maestro: registro de eventos de contacto (clicks WhatsApp / vistas de perfil).
-- El insert se hace exclusivamente vía RPC SECURITY DEFINER (log_contact_event) para que
-- actor_id quede fijado por el servidor (auth.uid()) y no sea manipulable por el cliente.

CREATE TABLE public.contact_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  maestro_id  uuid        NOT NULL REFERENCES public.profiles(user_id),
  actor_id    uuid        REFERENCES public.profiles(user_id),
  event_type  text        NOT NULL CHECK (event_type IN ('whatsapp_click', 'profile_view')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;

-- Solo el maestro dueño de las filas puede leer sus propias estadísticas de contacto.
CREATE POLICY "contact_events_select_own" ON public.contact_events
  FOR SELECT USING (maestro_id = auth.uid());

-- No hay policy de INSERT: los inserts van únicamente vía log_contact_event (SECURITY DEFINER).

CREATE INDEX ON public.contact_events (maestro_id, created_at DESC);

-- ─── RPC: log_contact_event ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_contact_event(
  p_maestro_id uuid,
  p_event_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_event_type NOT IN ('whatsapp_click', 'profile_view') THEN
    RAISE EXCEPTION 'event_type inválido: %', p_event_type;
  END IF;

  INSERT INTO public.contact_events (maestro_id, actor_id, event_type)
  VALUES (p_maestro_id, auth.uid(), p_event_type);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_contact_event(uuid, text) TO authenticated;
