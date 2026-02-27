/*
  # Add Chat Threads and Link Messages

  1. New Tables
    - `chat_threads`
      - `id` (uuid, primary key)
      - `agent_id` (text) - "titus", "looty", or "bolt"
      - `title` (text) - thread display name
      - `pinned` (boolean, default false) - whether thread is pinned to top
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last activity timestamp

  2. Modified Tables
    - `chat_messages`
      - Added `thread_id` (uuid, FK to chat_threads.id, ON DELETE CASCADE)

  3. Security
    - Enable RLS on `chat_threads`
    - Anon policies for SELECT, INSERT, UPDATE, DELETE on chat_threads
    - Anon DELETE policy on chat_messages (for hard delete)
    - Anon UPDATE policy on chat_messages (for linking to threads)

  4. Seed Data
    - One default thread per agent: "General" for Titus, "Revenue" for Looty, "Build Log" for Mini Bolt
    - Existing chat_messages are linked to matching threads via agent_name
*/

-- Create chat_threads table
CREATE TABLE IF NOT EXISTS chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on chat_threads"
  ON chat_threads FOR SELECT
  TO anon
  USING (agent_id IS NOT NULL);

CREATE POLICY "Allow anon insert on chat_threads"
  ON chat_threads FOR INSERT
  TO anon
  WITH CHECK (agent_id IS NOT NULL AND title IS NOT NULL);

CREATE POLICY "Allow anon update on chat_threads"
  ON chat_threads FOR UPDATE
  TO anon
  USING (agent_id IS NOT NULL)
  WITH CHECK (agent_id IS NOT NULL);

CREATE POLICY "Allow anon delete on chat_threads"
  ON chat_threads FOR DELETE
  TO anon
  USING (agent_id IS NOT NULL);

-- Add thread_id column to chat_messages with FK cascade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN thread_id uuid REFERENCES chat_threads(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add delete policy on chat_messages
CREATE POLICY "Allow anon delete on chat_messages"
  ON chat_messages FOR DELETE
  TO anon
  USING (agent_name IS NOT NULL);

-- Add update policy on chat_messages
CREATE POLICY "Allow anon update on chat_messages"
  ON chat_messages FOR UPDATE
  TO anon
  USING (agent_name IS NOT NULL)
  WITH CHECK (agent_name IS NOT NULL);

-- Seed default threads
INSERT INTO chat_threads (agent_id, title, pinned) VALUES
  ('titus', 'General', true),
  ('looty', 'Revenue', true),
  ('bolt', 'Build Log', true);

-- Link existing messages to threads
UPDATE chat_messages
SET thread_id = (SELECT id FROM chat_threads WHERE agent_id = 'titus' LIMIT 1)
WHERE agent_name IN ('Titus') AND thread_id IS NULL;

UPDATE chat_messages
SET thread_id = (SELECT id FROM chat_threads WHERE agent_id = 'looty' LIMIT 1)
WHERE agent_name IN ('Looty') AND thread_id IS NULL;

UPDATE chat_messages
SET thread_id = (SELECT id FROM chat_threads WHERE agent_id = 'bolt' LIMIT 1)
WHERE agent_name IN ('Mini Bolt') AND thread_id IS NULL;

-- Link User messages to titus thread by default
UPDATE chat_messages
SET thread_id = (SELECT id FROM chat_threads WHERE agent_id = 'titus' LIMIT 1)
WHERE agent_name = 'User' AND thread_id IS NULL;