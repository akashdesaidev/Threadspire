"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  return (
    <Link
      href={`/explore?tags=${tag}`}
      className={cn(
        "tag-badge hover:bg-primary/10 hover:text-primary transition-colors",
        className
      )}
    >
      #{tag}
    </Link>
  );
}
