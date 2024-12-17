import React from "react";
import { cn } from "@/app/lib/utils";

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  variant = "default",
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const variantClasses = {
    default: "text-primary",
    secondary: "text-secondary",
    destructive: "text-destructive",
    outline: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      role="status"
      {...props}
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
};
