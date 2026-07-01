"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserRole, type UserRole } from "@/lib/users/queries";

export type { UserRole } from "@/lib/users/queries";

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

    let cancelled = false;

    getUserRole(user.id)
      .then((nextRole) => {
        if (cancelled) return;
        setRole(nextRole);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRole("free");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { role, loading, isAdmin: role === "admin" };
}
