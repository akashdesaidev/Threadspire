"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/lib/auth-context";
import { userAPI } from "@/lib/api";
import Link from "next/link";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        // Set initial values
        setName(user.name || "");
        setBio(user.bio || "");
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError("");
    setLoading(true);

    try {
      await userAPI.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
      });
      setSuccess(true);

      // Refresh the page after a delay to get updated user data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("Failed to update profile", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="animate-pulse max-w-xl mx-auto">
            <div className="h-10 bg-secondary rounded mb-4"></div>
            <div className="h-40 bg-secondary rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <Link href={`/users/${user?._id}`} className="text-primary">
              View Profile
            </Link>
          </div>

          {error && (
            <div className="bg-destructive/20 text-destructive p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 text-green-500 p-4 rounded-lg mb-6">
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border rounded-md bg-background"
                  disabled={loading}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 border rounded-md bg-background min-h-[120px]"
                  disabled={loading}
                  placeholder="Tell others about yourself..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <div className="bg-card border rounded-lg p-6">
              <Link
                href="/settings/account"
                className="block px-4 py-3 hover:bg-secondary rounded-md"
              >
                Account Security
              </Link>
              <Link
                href="/settings/notifications"
                className="block px-4 py-3 hover:bg-secondary rounded-md"
              >
                Notification Preferences
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
