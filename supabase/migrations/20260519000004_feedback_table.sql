CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  user_role text,
  current_url text,
  description text NOT NULL CHECK (length(description) >= 10),
  category text CHECK (category IN ('bug', 'mejora', 'pregunta', 'otro')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- Solo el propio usuario puede insertar, nadie puede leer (solo service-role)
CREATE POLICY "users can insert feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
