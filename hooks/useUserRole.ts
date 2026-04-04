"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export type UserRole = "free" | "premium";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    (async () => {
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        setRole((data?.role as UserRole) ?? "free");
      } catch (e) {
        setRole("free");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  return { role, loading, isPremium: role === "premium" };
}
