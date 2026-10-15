import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./useAuth";

// Same check as RequireAdmin, shared here so nav links can show/hide for
// admins without duplicating the query.
export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return setIsAdmin(false);
    let active = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsAdmin(data?.role === "admin");
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  return isAdmin;
}
