
-- Enum for request status
CREATE TYPE public.request_status AS ENUM ('pending','approved','denied','expired');

-- Access requests
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  industry TEXT NOT NULL,
  linkedin TEXT,
  reason TEXT NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by TEXT,
  decision_note TEXT
);
CREATE INDEX access_requests_status_idx ON public.access_requests(status, created_at DESC);
CREATE INDEX access_requests_email_idx ON public.access_requests(email);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_requests TO authenticated;
GRANT INSERT ON public.access_requests TO anon;
GRANT ALL ON public.access_requests TO service_role;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (anon insert)
CREATE POLICY "anyone can submit access request"
  ON public.access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

-- Reads/updates restricted to service_role (server functions enforce owner check)
-- No SELECT/UPDATE/DELETE policies for anon/authenticated => denied by default.

-- Invite tokens
CREATE TABLE public.invite_tokens (
  token TEXT PRIMARY KEY,
  request_id UUID REFERENCES public.access_requests(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE INDEX invite_tokens_email_idx ON public.invite_tokens(email);

GRANT SELECT ON public.invite_tokens TO anon, authenticated;
GRANT ALL ON public.invite_tokens TO service_role;
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;
-- Public can look up by exact token (needed for activation page)
CREATE POLICY "anyone can read invite by token"
  ON public.invite_tokens FOR SELECT
  TO anon, authenticated
  USING (true);

-- Audit events
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  ip TEXT,
  user_agent TEXT
);
CREATE INDEX audit_events_ts_idx ON public.audit_events(ts DESC);
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
-- Reads only through service role; no policies.
