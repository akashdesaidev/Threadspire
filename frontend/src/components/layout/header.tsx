"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ModeToggle } from "../ui/mode-toggle";
import { UserCircle, Menu, X, PenSquare, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // This ensures hydration matching by not rendering auth-dependent UI until client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="border-b sticky top-0 bg-background z-10">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <Link href="/" className="font-bold text-xl">
          ThreadSpire
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <Link href="/explore" className="hover:text-primary">
              Explore
            </Link>
            {isClient && user && (
              <>
                <Link href="/bookmarks" className="hover:text-primary">
                  Bookmarks
                </Link>
                <Link href="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {!isClient || loading ? (
              // Show loading skeleton
              <div className="flex items-center gap-4">
                <div className="w-24 h-9 bg-secondary/50 animate-pulse rounded-md"></div>
                <div className="w-10 h-9 bg-secondary/50 animate-pulse rounded-full"></div>
              </div>
            ) : user ? (
              <>
                <Link
                  href="/threads/create"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2"
                >
                  <PenSquare className="h-4 w-4" />
                  <span>Create</span>
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 hover:text-primary">
                    <UserCircle className="h-6 w-6" />
                    <span>{user.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg overflow-hidden z-20 border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-2">
                      <Link
                        href={`/users/${user._id}`}
                        className="block px-4 py-2 hover:bg-primary/10 rounded-md w-full text-left"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 hover:bg-primary/10 rounded-md w-full text-left"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={logout}
                        className="block px-4 py-2 hover:bg-destructive/10 text-destructive rounded-md w-full text-left"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-primary">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                >
                  Register
                </Link>
              </>
            )}
            <ModeToggle />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-4 md:hidden">
          <ModeToggle />
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-secondary rounded-md"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 bg-background pt-16 transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="flex flex-col p-4 gap-4">
          <Link
            href="/explore"
            className="px-4 py-3 hover:bg-secondary rounded-md"
            onClick={toggleMobileMenu}
          >
            Explore
          </Link>

          {!isClient || loading ? (
            // Loading skeleton for mobile menu
            <div className="flex flex-col gap-4">
              <div className="h-12 bg-secondary/50 animate-pulse rounded-md"></div>
              <div className="h-12 bg-secondary/50 animate-pulse rounded-md"></div>
            </div>
          ) : user ? (
            <>
              <Link
                href="/bookmarks"
                className="px-4 py-3 hover:bg-secondary rounded-md"
                onClick={toggleMobileMenu}
              >
                Bookmarks
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-3 hover:bg-secondary rounded-md"
                onClick={toggleMobileMenu}
              >
                Dashboard
              </Link>
              <Link
                href="/threads/create"
                className="px-4 py-3 bg-primary text-primary-foreground rounded-md"
                onClick={toggleMobileMenu}
              >
                Create Thread
              </Link>
              <Link
                href={`/users/${user._id}`}
                className="px-4 py-3 hover:bg-secondary rounded-md"
                onClick={toggleMobileMenu}
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="px-4 py-3 hover:bg-secondary rounded-md"
                onClick={toggleMobileMenu}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  toggleMobileMenu();
                }}
                className="px-4 py-3 text-left text-destructive hover:bg-destructive/10 rounded-md"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-3 hover:bg-secondary rounded-md"
                onClick={toggleMobileMenu}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-3 bg-primary text-primary-foreground rounded-md"
                onClick={toggleMobileMenu}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
