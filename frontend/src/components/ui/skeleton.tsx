import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "avatar" | "button" | "card" | "tag";
}

export function Skeleton({ className, variant = "default" }: SkeletonProps) {
  const variants = {
    default: "w-full h-4",
    avatar: "h-10 w-10 rounded-full",
    button: "h-9 w-20 rounded-md",
    card: "w-full h-32",
    tag: "h-6 w-16 rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-secondary/50 rounded",
        variants[variant],
        className
      )}
    />
  );
}
