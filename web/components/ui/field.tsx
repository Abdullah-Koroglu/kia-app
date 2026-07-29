import * as React from "react";
import { cn } from "@/lib/utils";

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn(
        "mb-1.5 block text-sm font-medium text-stone-700",
        props.className,
      )}
    />
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:bg-stone-100",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100",
        className,
      )}
      {...props}
    />
  );
});

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={cn(
        "h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100",
        props.className,
      )}
    />
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-red-700">{children}</p>;
}

