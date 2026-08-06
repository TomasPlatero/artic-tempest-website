import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/tailwind/tailwind-utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-sans font-semibold  active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40",
        glow: "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]",
        glass:
          "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground",
        outline:
          "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        landingPrimary:
          "rounded-full border border-blue-400/30 bg-blue-600 text-white shadow-[0_14px_40px_rgba(30,64,175,0.32)] hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-blue-500 hover:shadow-[0_18px_48px_rgba(30,64,175,0.38)]",
        landingSecondary:
          "rounded-full border border-white/70 bg-white text-zinc-950 shadow-[0_14px_40px_rgba(15,23,42,0.22)] hover:-translate-y-0.5 hover:border-white hover:bg-zinc-100 hover:text-zinc-950 hover:shadow-[0_18px_48px_rgba(15,23,42,0.26)]",
        landingTinted:
          "rounded-full border border-white/10 bg-blue-400/12 text-white backdrop-blur-md shadow-[0_14px_36px_rgba(8,47,73,0.26)] hover:-translate-y-0.5 hover:border-blue-200/25 hover:bg-blue-400/18 hover:text-white hover:shadow-[0_18px_44px_rgba(8,47,73,0.32)]",
        publicGhost:
          "rounded-full border border-white/12 bg-white/[0.03] text-white/78 backdrop-blur-md shadow-[0_10px_24px_rgba(2,6,23,0.14)] hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.08] hover:text-white",
      },
      size: {
        xs: "h-7 px-2.5 text-[10px]",
        default: "h-10 px-6",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        publicSm:
          "min-h-9 px-4 py-2 text-[10px] uppercase tracking-[0.14em] leading-none",
        public:
          "min-h-10 px-5 py-2.5 text-[10.5px] uppercase tracking-[0.16em] leading-none sm:min-h-11 sm:px-6",
        publicLg:
          "min-h-11 px-6 py-2.5 text-[10.5px] uppercase tracking-[0.16em] leading-none sm:min-h-12 sm:px-7",
        landing:
          "min-h-10 px-5 py-2.5 text-[10.5px] uppercase tracking-[0.16em] leading-none sm:min-h-11",
        landingLg:
          "min-h-11 px-6 py-2.5 text-[10.5px] uppercase tracking-[0.16em] leading-none sm:min-h-12 sm:px-7",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  leftSection,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    leftSection?: React.ReactNode;
    href?: string;
  }) {
  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      data-slot="button"
      type={props.type ?? "button"}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {leftSection}
      {children}
    </button>
  );
}

export { Button };
