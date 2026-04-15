import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, isAbortError, type AppRole } from "@/lib/auth";

type AuthReadyState = {
  isReady: boolean;
  session: Session | null;
  role: AppRole | null;
};

const ABORT_RETRY_DELAY_MS = 250;

export function useAuthReady() {
  const [state, setState] = useState<AuthReadyState>({
    isReady: false,
    session: null,
    role: null,
  });
  const syncRunRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const clearRetry = () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    const syncSession = async (session: Session | null) => {
      const runId = ++syncRunRef.current;
      clearRetry();

      if (!isMounted) return;

      if (!session?.user) {
        setState({ isReady: true, session: null, role: null });
        return;
      }

      setState((prev) => {
        if (prev.session?.access_token === session.access_token && prev.role) {
          return { isReady: true, session, role: prev.role };
        }

        return { ...prev, session, isReady: false };
      });

      try {
        const role = await getUserRole(session.user.id);
        if (!isMounted || runId !== syncRunRef.current) return;
        setState({ isReady: true, session, role });
      } catch (error) {
        if (!isMounted || runId !== syncRunRef.current) return;

        if (isAbortError(error)) {
          retryTimeoutRef.current = window.setTimeout(() => {
            void syncSession(session);
          }, ABORT_RETRY_DELAY_MS);
          return;
        }

        console.error("Auth role sync error:", error);
        setState({ isReady: true, session, role: null });
      }
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        void syncSession(session);
      })
      .catch((error) => {
        if (!isMounted) return;
        if (!isAbortError(error)) {
          console.error("Auth session restore error:", error);
        }
        setState({ isReady: true, session: null, role: null });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      isMounted = false;
      syncRunRef.current += 1;
      clearRetry();
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
