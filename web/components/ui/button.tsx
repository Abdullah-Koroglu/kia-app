import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-emerald-800 text-white hover:bg-emerald-900": variant === "primary",
          "bg-stone-100 text-stone-800 hover:bg-stone-200":
            variant === "secondary",
          "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50":
            variant === "outline",
          "text-stone-600 hover:bg-stone-100 hover:text-stone-950":
            variant === "ghost",
          "bg-red-700 text-white hover:bg-red-800": variant === "danger",
          "h-9 px-3 text-sm": size === "sm",
          "h-11 px-4 text-sm": size === "md",
          "size-9 p-0": size === "icon",
        },
        className,
      )}
      {...props}
    />
  );
}

