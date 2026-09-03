ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS rsvp_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS gift_sms_sent_at timestamp with time zone;

UPDATE public.events
SET share_token_general = encode(gen_random_bytes(9), 'hex')
WHERE share_token_general IS NULL OR share_token_general = '';

CREATE OR REPLACE FUNCTION public.self_rsvp_join(
  _token text,
  _full_name text,
  _phone text,
  _number_of_guests integer,
  _children_count integer,
  _side text,
  _relationship text,
  _rsvp_status text
)
RETURNS TABLE(guest_id uuid, event_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _guest_id uuid;
  _clean_phone text;
  _status text;
  _guests int;
  _children int;
BEGIN
  IF _token IS NULL OR length(trim(_token)) < 6 THEN
    RAISE EXCEPTION 'invalid token';
  END IF;

  SELECT id INTO _event_id FROM public.events WHERE share_token_general = _token LIMIT 1;
  IF _event_id IS NULL THEN
    RAISE EXCEPTION 'event not found';
  END IF;

  IF _full_name IS NULL OR length(trim(_full_name)) < 2 OR length(_full_name) > 100 THEN
    RAISE EXCEPTION 'invalid name';
  END IF;

  _clean_phone := regexp_replace(coalesce(_phone, ''), '[^0-9+]', '', 'g');
  IF length(_clean_phone) < 9 OR length(_clean_phone) > 15 THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;

  _status := CASE WHEN _rsvp_status IN ('confirmed','declined','maybe') THEN _rsvp_status ELSE 'pending' END;
  _guests := LEAST(GREATEST(coalesce(_number_of_guests, 1), 0), 50);
  _children := LEAST(GREATEST(coalesce(_children_count, 0), 0), 50);

  SELECT g.id INTO _guest_id
  FROM public.guests g
  WHERE g.event_id = _event_id
    AND regexp_replace(coalesce(g.phone, ''), '[^0-9+]', '', 'g') = _clean_phone
  LIMIT 1;

  IF _guest_id IS NULL THEN
    INSERT INTO public.guests (event_id, full_name, phone, side, relationship, number_of_guests, children_count, rsvp_status, rsvp_date, rsvp_source)
    VALUES (_event_id, trim(_full_name), _clean_phone, coalesce(nullif(trim(coalesce(_side,'')),''), 'general'),
            nullif(trim(coalesce(_relationship,'')),''), _guests, _children, _status, now(), 'self')
    RETURNING id INTO _guest_id;
  ELSE
    UPDATE public.guests
    SET full_name = trim(_full_name),
        phone = _clean_phone,
        side = coalesce(nullif(trim(coalesce(_side,'')),''), side),
        relationship = coalesce(nullif(trim(coalesce(_relationship,'')),''), relationship),
        number_of_guests = _guests,
        children_count = _children,
        rsvp_status = _status,
        rsvp_date = now(),
        rsvp_source = 'self'
    WHERE id = _guest_id;
  END IF;

  RETURN QUERY SELECT _guest_id, _event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.self_rsvp_join(text,text,text,integer,integer,text,text,text) TO anon, authenticated;
