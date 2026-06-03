import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "dark" | "light" | "danger";
};

export function Button({ children, variant = "dark", className = "", type = "button", ...props }: ButtonProps) {
  const styles = {
    dark: "bg-zinc-950 text-white hover:bg-zinc-800",
    light: "border border-zinc-100 bg-white text-zinc-700 hover:bg-zinc-50",
    danger: "bg-rose-600 text-white hover:bg-rose-500"
  };

  return (
    <button
      {...props}
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
