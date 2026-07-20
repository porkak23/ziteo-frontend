CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL, -- formato: sorted(user_id_a, user_id_b) joined con '_'
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- opcional: producto adjunto
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_receiver_unread_idx ON messages(receiver_id, read_at) WHERE read_at IS NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Solo los participantes de la conversación pueden ver sus mensajes
CREATE POLICY "participants_read_messages"
ON messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Solo el remitente puede insertar
CREATE POLICY "sender_insert_message"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Solo el receptor puede marcar como leído
CREATE POLICY "receiver_mark_read"
ON messages FOR UPDATE
TO authenticated
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());
