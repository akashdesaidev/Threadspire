"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        // Redirect to profile settings by default
        router.push("/settings/profile");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="container py-8">
      <div className="flex justify-center">
        <div className="animate-pulse w-full max-w-xl">
          <div className="h-10 bg-secondary rounded mb-4"></div>
          <div className="h-40 bg-secondary rounded"></div>
        </div>
      </div>
    </div>
  );
}
