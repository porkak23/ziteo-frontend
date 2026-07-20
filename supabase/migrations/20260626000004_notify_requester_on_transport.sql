-- Trigger que notifica al solicitante cuando el chofer acepta o completa su transporte
CREATE OR REPLACE FUNCTION public.notify_requester_on_transport()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      NEW.requester_id,
      'transport',
      'Solicitud aceptada',
      'Un transportista aceptó tu solicitud de transporte.'
    );
  ELSIF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      NEW.requester_id,
      'transport',
      'Transporte completado',
      'Tu solicitud de transporte fue completada.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_requester_on_transport ON public.transport_requests;

CREATE TRIGGER trg_notify_requester_on_transport
  AFTER UPDATE ON public.transport_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_requester_on_transport();
