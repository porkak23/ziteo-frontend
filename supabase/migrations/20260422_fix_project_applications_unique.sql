-- Prevent a maestro from applying to the same project more than once.
-- Without this constraint, duplicate rows can silently accumulate when
-- the user taps "Postularse" multiple times (e.g. slow network).
ALTER TABLE project_applications
  ADD CONSTRAINT IF NOT EXISTS project_applications_unique_application
  UNIQUE (project_id, applicant_id);
