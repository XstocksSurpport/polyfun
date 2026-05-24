import Link from "next/link";
import { ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "yes" | "no";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  primary: "btn-accent",
  secondary: "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
  ghost: "text-zinc-950 hover:bg-zinc-100",
  yes: "bg-[#16a34a] text-white hover:bg-[#15803d]",
  no: "bg-[#dc2626] text-white hover:bg-[#b91c1c]",
} as const;

const sizeStyles = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-10 px-8 text-sm rounded-md",
} as const;

export const buttonClassName = (
  variant: ButtonProps["variant"] = "primary",
  size: ButtonProps["size"] = "md",
  className?: string
) =>
  cn(
    "inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-40",
    variantStyles[variant ?? "primary"],
    sizeStyles[size ?? "md"],
    className
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName(variant, size, className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

interface LinkButtonProps {
  href: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  children: ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClassName(variant, size, className)}>
      {children}
    </Link>
  );
}
