"use client";

import Link from "next/link";
import { User } from "lucide-react";

interface AuthorLinkProps {
  author: {
    _id: string;
    name: string;
  };
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AuthorLink({
  author,
  className = "",
  showIcon = true,
  size = "md",
}: AuthorLinkProps) {
  // Guard against invalid author object
  if (!author || !author._id || !author.name) {
    return <span className={className}>Unknown author</span>;
  }

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <span
      className={`inline-flex items-center align-middle gap-1 ${className}`}
    >
      {showIcon && (
        <User
          className={`${
            size === "sm"
              ? "h-3 w-3"
              : size === "md"
              ? "h-3.5 w-3.5"
              : "h-4 w-4"
          } relative ${size === "md" ? "top-px" : "top-0"}`}
        />
      )}
      <Link
        href={`/users/${author._id}`}
        className={`hover:text-primary ${sizeClasses[size]}`}
      >
        {author.name}
      </Link>
    </span>
  );
}
