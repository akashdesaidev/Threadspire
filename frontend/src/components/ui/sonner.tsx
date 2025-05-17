"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error:
            "group-[.toaster]:bg-red-500/90 group-[.toaster]:text-white group-[.toaster]:border-red-600 group-[.toaster]:shadow-lg",
          success:
            "group-[.toaster]:bg-emerald-500/90 group-[.toaster]:text-white group-[.toaster]:border-emerald-600 group-[.toaster]:shadow-lg",
          warning:
            "group-[.toaster]:bg-amber-500/90 group-[.toaster]:text-white group-[.toaster]:border-amber-600 group-[.toaster]:shadow-lg",
          info: "group-[.toaster]:bg-blue-500/90 group-[.toaster]:text-white group-[.toaster]:border-blue-600 group-[.toaster]:shadow-lg",
        },
      }}
      richColors
      closeButton
      {...props}
    />
  );
}
