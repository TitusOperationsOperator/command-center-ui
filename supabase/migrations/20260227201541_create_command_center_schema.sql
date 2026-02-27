/*
  # Command Center Database Schema

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `agent_name` (text) - "Titus", "Looty", "Mini Bolt", or "User"
      - `content` (text) - message body
      - `created_at` (timestamptz) - timestamp of message
    - `memory_files`
      - `id` (uuid, primary key)
      - `filename` (text) - name of the markdown file
      - `content` (text) - file content in markdown
      - `updated_at` (timestamptz) - last modified timestamp
    - `metrics`
      - `id` (uuid, primary key)
      - `metric_name` (text) - name of the metric
      - `metric_value` (numeric) - value
      - `recorded_at` (timestamptz) - timestamp of recording
    - `finops_costs`
      - `id` (uuid, primary key)
      - `model_name` (text) - AI model name
      - `cost` (numeric) - cost in dollars
      - `revenue` (numeric) - revenue in dollars
      - `period` (text) - time period label
      - `recorded_at` (timestamptz) - timestamp of recording

  2. Security
    - Enable RLS on all tables
    - Add anon read/write policies for demo purposes (no auth required)
*/

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on chat_messages"
  ON chat_messages FOR SELECT
  TO anon
  USING (agent_name IS NOT NULL);

CREATE POLICY "Allow anon insert on chat_messages"
  ON chat_messages FOR INSERT
  TO anon
  WITH CHECK (agent_name IS NOT NULL AND content IS NOT NULL);

-- Memory Files
CREATE TABLE IF NOT EXISTS memory_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE memory_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on memory_files"
  ON memory_files FOR SELECT
  TO anon
  USING (filename IS NOT NULL);

CREATE POLICY "Allow anon update on memory_files"
  ON memory_files FOR UPDATE
  TO anon
  USING (filename IS NOT NULL)
  WITH CHECK (filename IS NOT NULL);

CREATE POLICY "Allow anon insert on memory_files"
  ON memory_files FOR INSERT
  TO anon
  WITH CHECK (filename IS NOT NULL);

-- Metrics
CREATE TABLE IF NOT EXISTS metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL DEFAULT '',
  metric_value numeric NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on metrics"
  ON metrics FOR SELECT
  TO anon
  USING (metric_name IS NOT NULL);

-- FinOps Costs
CREATE TABLE IF NOT EXISTS finops_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL DEFAULT '',
  cost numeric NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT '',
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finops_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on finops_costs"
  ON finops_costs FOR SELECT
  TO anon
  USING (model_name IS NOT NULL);
