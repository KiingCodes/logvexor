CREATE TYPE public.organization_role AS ENUM (
  'owner',
  'admin',
  'analyst',
  'viewer'
);

CREATE TYPE public.asset_type AS ENUM (
  'domain',
  'subdomain',
  'ip',
  'host',
  'url',
  'cloud_resource'
);

CREATE TYPE public.asset_status AS ENUM (
  'pending_verification',
  'verified',
  'disabled'
);

CREATE TYPE public.verification_method AS ENUM (
  'dns_txt',
  'http_file',
  'email'
);

CREATE TYPE public.verification_status AS ENUM (
  'requested',
  'pending',
  'verified',
  'failed',
  'expired'
);

CREATE TYPE public.scan_status AS ENUM (
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE public.finding_severity AS ENUM (
  'informational',
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE public.finding_state AS ENUM (
  'open',
  'acknowledged',
  'resolved',
  'accepted_risk'
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text CHECK (
    display_name IS NULL OR pg_catalog.btrim(display_name) <> ''
  ),
  avatar_path text,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (
    pg_catalog.btrim(name) <> ''
    AND pg_catalog.length(pg_catalog.btrim(name)) <= 120
  ),
  slug text NOT NULL UNIQUE CHECK (
    slug = pg_catalog.lower(slug)
    AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND pg_catalog.length(slug) <= 63
  ),
  website_url text CHECK (
    website_url IS NULL
    OR (
      pg_catalog.btrim(website_url) = website_url
      AND pg_catalog.length(website_url) <= 2048
      AND website_url ~* '^https?://[^[:space:]]+$'
    )
  ),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  membership_lock_version bigint NOT NULL DEFAULT 0
    CHECK (membership_lock_version >= 0),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

COMMENT ON COLUMN public.organizations.membership_lock_version IS
  'Incremented by membership mutation functions to serialize owner changes.';

CREATE TABLE public.organization_memberships (
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  role public.organization_role NOT NULL,
  added_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  asset_type public.asset_type NOT NULL,
  canonical_value text NOT NULL CHECK (pg_catalog.btrim(canonical_value) <> ''),
  parent_asset_id uuid,
  status public.asset_status NOT NULL DEFAULT 'pending_verification',
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE (org_id, id),
  FOREIGN KEY (org_id, parent_asset_id)
    REFERENCES public.assets (org_id, id)
    ON DELETE RESTRICT,
  CHECK (parent_asset_id IS NULL OR parent_asset_id <> id),
  CHECK (
    (status <> 'pending_verification' OR verified_at IS NULL)
    AND (status <> 'verified' OR verified_at IS NOT NULL)
  )
);

CREATE TABLE public.asset_ownership_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  asset_id uuid NOT NULL,
  method public.verification_method NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'requested',
  challenge_hash text,
  requested_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  expires_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  FOREIGN KEY (org_id, asset_id)
    REFERENCES public.assets (org_id, id)
    ON DELETE CASCADE,
  CHECK (
    (status = 'verified' AND verified_at IS NOT NULL)
    OR (status <> 'verified' AND verified_at IS NULL)
  )
);

CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  requested_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  status public.scan_status NOT NULL DEFAULT 'queued',
  scan_config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (
    pg_catalog.jsonb_typeof(scan_config) = 'object'
  ),
  queued_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE (org_id, id)
);

CREATE TABLE public.scan_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  scan_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  FOREIGN KEY (org_id, scan_id)
    REFERENCES public.scans (org_id, id)
    ON DELETE CASCADE,
  FOREIGN KEY (org_id, asset_id)
    REFERENCES public.assets (org_id, id)
    ON DELETE CASCADE,
  UNIQUE (scan_id, asset_id),
  UNIQUE (org_id, scan_id, asset_id)
);

CREATE TABLE public.findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  scan_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  fingerprint text NOT NULL CHECK (pg_catalog.btrim(fingerprint) <> ''),
  title text NOT NULL CHECK (pg_catalog.btrim(title) <> ''),
  description text,
  severity public.finding_severity NOT NULL,
  state public.finding_state NOT NULL DEFAULT 'open',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (
    pg_catalog.jsonb_typeof(evidence) = 'object'
  ),
  first_seen_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  last_seen_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  FOREIGN KEY (org_id, scan_id, asset_id)
    REFERENCES public.scan_assets (org_id, scan_id, asset_id)
    ON DELETE CASCADE,
  UNIQUE (org_id, scan_id, asset_id, fingerprint),
  CHECK (last_seen_at >= first_seen_at)
);

CREATE INDEX organization_memberships_user_id_idx
  ON public.organization_memberships (user_id);

CREATE UNIQUE INDEX assets_org_canonical_value_idx
  ON public.assets (org_id, asset_type, pg_catalog.lower(canonical_value));

CREATE INDEX assets_org_parent_asset_idx
  ON public.assets (org_id, parent_asset_id)
  WHERE parent_asset_id IS NOT NULL;

CREATE INDEX asset_ownership_verifications_org_asset_created_idx
  ON public.asset_ownership_verifications (org_id, asset_id, created_at DESC);

CREATE UNIQUE INDEX asset_ownership_verifications_one_active_per_asset_idx
  ON public.asset_ownership_verifications (org_id, asset_id)
  WHERE status IN ('requested', 'pending');

CREATE INDEX scans_org_created_idx
  ON public.scans (org_id, created_at DESC);

CREATE INDEX scans_org_status_idx
  ON public.scans (org_id, status);

CREATE INDEX scan_assets_org_asset_idx
  ON public.scan_assets (org_id, asset_id);

CREATE INDEX findings_org_asset_created_idx
  ON public.findings (org_id, asset_id, created_at DESC);

CREATE INDEX findings_org_severity_state_idx
  ON public.findings (org_id, severity, state);

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.organization_memberships AS membership
      WHERE membership.org_id = p_org_id
        AND membership.user_id = auth.uid()
    );
$function$;

CREATE OR REPLACE FUNCTION public.has_org_role(
  p_org_id uuid,
  p_allowed_roles public.organization_role[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.organization_memberships AS membership
      WHERE membership.org_id = p_org_id
        AND membership.user_id = auth.uid()
        AND membership.role = ANY (p_allowed_roles)
    );
$function$;

CREATE OR REPLACE FUNCTION public.create_organization(
  p_name text,
  p_slug text,
  p_website_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_name text := pg_catalog.btrim(p_name);
  v_website_url text := NULLIF(pg_catalog.btrim(p_website_url), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF v_name IS NULL
     OR v_name = ''
     OR pg_catalog.length(v_name) > 120 THEN
    RAISE EXCEPTION 'Invalid organization name' USING ERRCODE = '22023';
  END IF;

  IF p_slug IS NULL
     OR pg_catalog.length(p_slug) > 63
     OR p_slug <> pg_catalog.lower(p_slug)
     OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid organization slug' USING ERRCODE = '22023';
  END IF;

  IF v_website_url IS NOT NULL
     AND (
       pg_catalog.length(v_website_url) > 2048
       OR v_website_url ~ '[[:space:]]'
       OR v_website_url !~* '^https?://[^[:space:]]+$'
     ) THEN
    RAISE EXCEPTION 'Invalid organization website URL'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.organizations (
    name,
    slug,
    website_url,
    created_by
  )
  VALUES (
    v_name,
    p_slug,
    v_website_url,
    v_user_id
  )
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_memberships (
    org_id,
    user_id,
    role,
    added_by
  )
  VALUES (
    v_org_id,
    v_user_id,
    'owner',
    v_user_id
  );

  RETURN v_org_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public._mutate_organization_membership(
  p_actor_id uuid,
  p_org_id uuid,
  p_target_user_id uuid,
  p_operation text,
  p_new_role public.organization_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_locked_org_id uuid;
  v_actor_role public.organization_role;
  v_target_role public.organization_role;
  v_other_owner_count bigint;
BEGIN
  IF p_actor_id IS NULL
     OR p_org_id IS NULL
     OR p_target_user_id IS NULL
     OR p_operation IS NULL
     OR p_operation NOT IN ('add', 'change_role', 'remove') THEN
    RAISE EXCEPTION 'Invalid membership operation' USING ERRCODE = '22023';
  END IF;

  IF (p_operation = 'remove' AND p_new_role IS NOT NULL)
     OR (p_operation <> 'remove' AND p_new_role IS NULL) THEN
    RAISE EXCEPTION 'Invalid role for membership operation'
      USING ERRCODE = '22023';
  END IF;

  IF p_target_user_id = p_actor_id THEN
    RAISE EXCEPTION 'Members cannot administer their own membership'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.organizations
  SET membership_lock_version = membership_lock_version + 1
  WHERE id = p_org_id
  RETURNING id INTO v_locked_org_id;

  IF v_locked_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found' USING ERRCODE = '22023';
  END IF;

  SELECT membership.role
  INTO v_actor_role
  FROM public.organization_memberships AS membership
  WHERE membership.org_id = p_org_id
    AND membership.user_id = p_actor_id;

  IF v_actor_role IS NULL
     OR v_actor_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient organization role' USING ERRCODE = '42501';
  END IF;

  IF p_operation = 'add' THEN
    IF v_actor_role = 'admin' AND p_new_role = 'owner' THEN
      RAISE EXCEPTION 'Admins cannot add owners' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.organization_memberships (
      org_id,
      user_id,
      role,
      added_by
    )
    VALUES (
      p_org_id,
      p_target_user_id,
      p_new_role,
      p_actor_id
    );

    RETURN;
  END IF;

  SELECT membership.role
  INTO v_target_role
  FROM public.organization_memberships AS membership
  WHERE membership.org_id = p_org_id
    AND membership.user_id = p_target_user_id
  FOR UPDATE;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Organization member not found' USING ERRCODE = '22023';
  END IF;

  IF v_actor_role = 'admin'
     AND (
       v_target_role = 'owner'
       OR (p_operation = 'change_role' AND p_new_role = 'owner')
     ) THEN
    RAISE EXCEPTION 'Admins cannot manage owner roles' USING ERRCODE = '42501';
  END IF;

  IF v_target_role = 'owner'
     AND (
       p_operation = 'remove'
       OR (p_operation = 'change_role' AND p_new_role <> 'owner')
     ) THEN
    SELECT pg_catalog.count(*)
    INTO v_other_owner_count
    FROM public.organization_memberships AS membership
    WHERE membership.org_id = p_org_id
      AND membership.role = 'owner'
      AND membership.user_id <> p_target_user_id;

    IF v_other_owner_count = 0 THEN
      RAISE EXCEPTION 'An organization must retain at least one owner'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF p_operation = 'change_role' THEN
    UPDATE public.organization_memberships
    SET role = p_new_role
    WHERE org_id = p_org_id
      AND user_id = p_target_user_id;
  ELSE
    DELETE FROM public.organization_memberships
    WHERE org_id = p_org_id
      AND user_id = p_target_user_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_organization_member(
  p_org_id uuid,
  p_user_id uuid,
  p_role public.organization_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  PERFORM public._mutate_organization_membership(
    auth.uid(),
    p_org_id,
    p_user_id,
    'add',
    p_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.change_organization_member_role(
  p_org_id uuid,
  p_user_id uuid,
  p_new_role public.organization_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  PERFORM public._mutate_organization_membership(
    auth.uid(),
    p_org_id,
    p_user_id,
    'change_role',
    p_new_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_organization_member(
  p_org_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  PERFORM public._mutate_organization_membership(
    auth.uid(),
    p_org_id,
    p_user_id,
    'remove',
    NULL
  );
END;
$function$;

-- The trusted backend must authenticate the user and derive p_actor_id from
-- that verified session. Never accept it from client input or expose service_role
-- credentials to the frontend.
CREATE OR REPLACE FUNCTION public.service_add_organization_member(
  p_actor_id uuid,
  p_org_id uuid,
  p_user_id uuid,
  p_role public.organization_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;

  PERFORM public._mutate_organization_membership(
    p_actor_id,
    p_org_id,
    p_user_id,
    'add',
    p_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.service_change_organization_member_role(
  p_actor_id uuid,
  p_org_id uuid,
  p_user_id uuid,
  p_new_role public.organization_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;

  PERFORM public._mutate_organization_membership(
    p_actor_id,
    p_org_id,
    p_user_id,
    'change_role',
    p_new_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.service_remove_organization_member(
  p_actor_id uuid,
  p_org_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;

  PERFORM public._mutate_organization_membership(
    p_actor_id,
    p_org_id,
    p_user_id,
    'remove',
    NULL
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER assets_set_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER asset_ownership_verifications_set_updated_at
  BEFORE UPDATE ON public.asset_ownership_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER scans_set_updated_at
  BEFORE UPDATE ON public.scans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON TYPE
  public.organization_role,
  public.asset_type,
  public.asset_status,
  public.verification_method,
  public.verification_status,
  public.scan_status,
  public.finding_severity,
  public.finding_state
FROM PUBLIC, anon, authenticated;

GRANT USAGE ON TYPE
  public.organization_role,
  public.asset_type,
  public.asset_status,
  public.verification_method,
  public.verification_status,
  public.scan_status,
  public.finding_severity,
  public.finding_state
TO authenticated, service_role;

REVOKE ALL ON TABLE
  public.profiles,
  public.organizations,
  public.organization_memberships,
  public.assets,
  public.asset_ownership_verifications,
  public.scans,
  public.scan_assets,
  public.findings
FROM PUBLIC, anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE
  public.profiles,
  public.organizations,
  public.organization_memberships,
  public.assets,
  public.asset_ownership_verifications,
  public.scans,
  public.scan_assets,
  public.findings
TO service_role;

REVOKE ALL ON TABLE public.organization_memberships FROM service_role;
GRANT SELECT ON TABLE public.organization_memberships TO service_role;

GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT INSERT (id, display_name, avatar_path)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_path)
  ON TABLE public.profiles TO authenticated;

GRANT SELECT ON TABLE public.organizations TO authenticated;
GRANT UPDATE (name, website_url)
  ON TABLE public.organizations TO authenticated;

GRANT SELECT ON TABLE public.organization_memberships TO authenticated;

GRANT SELECT ON TABLE public.assets TO authenticated;
GRANT INSERT (org_id, asset_type, canonical_value, parent_asset_id, created_by)
  ON TABLE public.assets TO authenticated;

GRANT SELECT (
  id,
  org_id,
  asset_id,
  method,
  status,
  requested_by,
  expires_at,
  verified_at,
  created_at,
  updated_at
)
  ON TABLE public.asset_ownership_verifications TO authenticated;
GRANT INSERT (org_id, asset_id, method, requested_by)
  ON TABLE public.asset_ownership_verifications TO authenticated;

GRANT SELECT ON TABLE public.scans TO authenticated;
GRANT INSERT (org_id, requested_by, scan_config)
  ON TABLE public.scans TO authenticated;

GRANT SELECT ON TABLE public.scan_assets TO authenticated;
GRANT INSERT (org_id, scan_id, asset_id)
  ON TABLE public.scan_assets TO authenticated;

GRANT SELECT ON TABLE public.findings TO authenticated;
GRANT UPDATE (state) ON TABLE public.findings TO authenticated;

REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_org_role(
  uuid,
  public.organization_role[]
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_organization(text, text, text)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_organization(text, text, text)
  FROM service_role;
REVOKE ALL ON FUNCTION public._mutate_organization_membership(
  uuid,
  uuid,
  uuid,
  text,
  public.organization_role
) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.add_organization_member(
  uuid,
  uuid,
  public.organization_role
) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.change_organization_member_role(
  uuid,
  uuid,
  public.organization_role
) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.remove_organization_member(uuid, uuid)
  FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.service_add_organization_member(
  uuid,
  uuid,
  uuid,
  public.organization_role
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.service_change_organization_member_role(
  uuid,
  uuid,
  uuid,
  public.organization_role
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.service_remove_organization_member(
  uuid,
  uuid,
  uuid
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.change_organization_member_role(
  uuid,
  uuid,
  public.organization_role
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_organization_member(uuid, uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(
  uuid,
  public.organization_role[]
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_organization_member(
  uuid,
  uuid,
  public.organization_role
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_organization_member_role(
  uuid,
  uuid,
  public.organization_role
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_organization_member(uuid, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.service_add_organization_member(
  uuid,
  uuid,
  uuid,
  public.organization_role
) TO service_role;
GRANT EXECUTE ON FUNCTION public.service_change_organization_member_role(
  uuid,
  uuid,
  uuid,
  public.organization_role
) TO service_role;
GRANT EXECUTE ON FUNCTION public.service_remove_organization_member(
  uuid,
  uuid,
  uuid
) TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_ownership_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self
  ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_insert_self
  ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_self
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY organizations_select_member
  ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(id));

CREATE POLICY organizations_update_owner_admin
  ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    public.has_org_role(
      id,
      ARRAY['owner', 'admin']::public.organization_role[]
    )
  )
  WITH CHECK (
    public.has_org_role(
      id,
      ARRAY['owner', 'admin']::public.organization_role[]
    )
  );

CREATE POLICY memberships_select_member
  ON public.organization_memberships
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY assets_select_member
  ON public.assets
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY assets_insert_owner_admin_analyst
  ON public.assets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(
      org_id,
      ARRAY['owner', 'admin', 'analyst']::public.organization_role[]
    )
    AND created_by = (SELECT auth.uid())
    AND status = 'pending_verification'
    AND verified_at IS NULL
  );

CREATE POLICY asset_verifications_select_member
  ON public.asset_ownership_verifications
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY asset_verifications_insert_owner_admin_analyst
  ON public.asset_ownership_verifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(
      org_id,
      ARRAY['owner', 'admin', 'analyst']::public.organization_role[]
    )
    AND requested_by = (SELECT auth.uid())
    AND status = 'requested'
    AND challenge_hash IS NULL
    AND verified_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.assets AS asset
      WHERE asset.org_id = asset_ownership_verifications.org_id
        AND asset.id = asset_ownership_verifications.asset_id
        AND asset.status <> 'verified'
    )
  );

CREATE POLICY scans_select_member
  ON public.scans
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY scans_insert_owner_admin_analyst
  ON public.scans
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(
      org_id,
      ARRAY['owner', 'admin', 'analyst']::public.organization_role[]
    )
    AND requested_by = (SELECT auth.uid())
    AND status = 'queued'
  );

CREATE POLICY scan_assets_select_member
  ON public.scan_assets
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY scan_assets_insert_verified_queued
  ON public.scan_assets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(
      org_id,
      ARRAY['owner', 'admin', 'analyst']::public.organization_role[]
    )
    AND EXISTS (
      SELECT 1
      FROM public.scans AS scan
      WHERE scan.org_id = scan_assets.org_id
        AND scan.id = scan_assets.scan_id
        AND scan.status = 'queued'
    )
    AND EXISTS (
      SELECT 1
      FROM public.assets AS asset
      WHERE asset.org_id = scan_assets.org_id
        AND asset.id = scan_assets.asset_id
        AND asset.status = 'verified'
    )
  );

CREATE POLICY findings_select_member
  ON public.findings
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY findings_update_triage
  ON public.findings
  FOR UPDATE TO authenticated
  USING (
    public.has_org_role(
      org_id,
      ARRAY['owner', 'admin', 'analyst']::public.organization_role[]
    )
  )
  WITH CHECK (
    public.has_org_role(
      org_id,
      ARRAY['owner', 'admin', 'analyst']::public.organization_role[]
    )
  );
