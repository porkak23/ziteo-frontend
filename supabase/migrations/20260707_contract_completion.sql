-- F2 Dashboard Maestro: destraba el estado 'completed' para contratos aceptados.
-- Reemplaza validate_contract_status_transition (definida en 20260417_rls_all_tables.sql)
-- agregando la rama accepted → completed. El trigger trg_contract_status ya apunta a esta
-- función (CREATE TRIGGER ... EXECUTE FUNCTION validate_contract_status_transition), así
-- que basta con CREATE OR REPLACE FUNCTION — no se recrea el trigger.

CREATE OR REPLACE FUNCTION validate_contract_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN RETURN NEW; END IF;
  IF OLD.status = 'accepted' AND NEW.status = 'completed' THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Transición de estado inválida: % → %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;
