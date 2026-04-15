import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, isAbortError, type AppRole } from "@/lib/auth";

type AuthReadyState = {
  isReady: boolean;
  session: Session | null;
  role: AppRole | null;
};

export function useAuthReady() {
  const [state, setState] = useState<AuthReadyState>({
    isReady: false,
    session: null,
    role: null,
  });

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (session: Session | null) => {
      if (!isMounted) return;

      if (!session?.user) {
        setState({ isReady: true, session: null, role: null });
        return;
      }

      setState((prev) => ({ ...prev, session, isReady: false }));

      try {
        const role = await getUserRole(session.user.id);
        if (!isMounted) return;
        setState({ isReady: true, session, role });
      } catch (error) {
        if (!isMounted) return;
        if (!isAbortError(error)) {
          console.error("Auth role sync error:", error);
        }
        setState({ isReady: true, session, role: null });
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

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

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
