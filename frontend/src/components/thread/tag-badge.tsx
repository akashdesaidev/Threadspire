"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function TagBadge({ tag, className, onClick, selected }: TagBadgeProps) {
  const baseClasses = "tag-badge transition-colors";
  const selectedClasses = selected ? "bg-primary/10 text-primary" : "";
  const hoverClasses = "hover:bg-primary/10 hover:text-primary";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(baseClasses, selectedClasses, hoverClasses, className)}
      >
        #{tag}
      </button>
    );
  }

  return (
    <Link
      href={`/explore?tags=${tag}`}
      className={cn(baseClasses, hoverClasses, className)}
    >
      #{tag}
    </Link>
  );
}
