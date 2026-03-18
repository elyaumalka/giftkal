
-- Create a function that calls the guest-webhook edge function
CREATE OR REPLACE FUNCTION public.notify_guest_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload jsonb;
  edge_function_url text;
  service_role_key text;
BEGIN
  edge_function_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', CASE WHEN TG_OP = 'DELETE' THEN null ELSE to_jsonb(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN null ELSE to_jsonb(OLD) END
  );

  PERFORM net.http_post(
    url := concat(
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1),
      '/functions/v1/guest-webhook'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', concat('Bearer ', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1))
    ),
    body := payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers on guests table
CREATE TRIGGER guest_insert_webhook
  AFTER INSERT ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_guest_webhook();

CREATE TRIGGER guest_update_webhook
  AFTER UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_guest_webhook();
