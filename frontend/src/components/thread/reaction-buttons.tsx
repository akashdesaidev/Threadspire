"use client";

import { cn } from "@/lib/utils";

interface ReactionButtonsProps {
  reactions: {
    [key: string]: {
      count: number;
      users: string[];
    };
  };
  onReact: (reaction: string) => void;
  userId?: string;
  disabled?: boolean;
  className?: string;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
}

export function ReactionButtons({
  reactions,
  onReact,
  userId,
  disabled,
  className,
  requiresAuth = false,
  onAuthRequired,
}: ReactionButtonsProps) {
  const getIsActive = (emoji: string) => {
    return userId && reactions[emoji]?.users.includes(userId);
  };

  const reactionEmojis = ["🤯", "💡", "😌", "🔥", "🫶"];

  const handleReaction = (emoji: string) => {
    if (requiresAuth && !userId && onAuthRequired) {
      onAuthRequired();
      return;
    }
    onReact(emoji);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {reactionEmojis.map((emoji) => {
        const isActive = getIsActive(emoji);
        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={disabled}
            className={cn(
              "reaction-button transition-all flex flex-col items-center px-2 py-1 rounded-md border",
              isActive
                ? "bg-primary/10 text-primary border-primary/30"
                : "hover:bg-secondary/80 border-transparent",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
            aria-label={`React with ${emoji}`}
          >
            <span className="text-xl">{emoji}</span>
            <span
              className={cn(
                "text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {reactions[emoji]?.count || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
