import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const itemVariants = cva("flex items-center w-full", {
  variants: {
    variant: {
      default: "bg-transparent",
      outline: "border-2 border-border",
      muted: "bg-secondary",
    },
    size: {
      default: "p-4 gap-4",
      sm: "p-3 gap-3",
      xs: "p-2 gap-2",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof itemVariants> {
  asChild?: boolean;
}

function Item({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ItemProps) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="item"
      className={cn(itemVariants({ variant, size }), className)}
      {...props}
    />
  );
}

function ItemGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="item-group"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

function ItemSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="item-separator"
      className={cn("border-t-2 border-border", className)}
      {...props}
    />
  );
}

type ItemMediaVariant = "default" | "icon" | "image";

type ItemMediaProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: ItemMediaVariant;
};

function ItemMedia({
  className,
  variant = "default",
  ...props
}: ItemMediaProps) {
  return (
    <div
      data-slot="item-media"
      className={cn(
        "flex shrink-0 items-center justify-center",
        variant === "icon" &&
          "size-10 bg-secondary text-muted-foreground [&>svg]:size-5",
        variant === "image" &&
          "size-12 overflow-hidden bg-secondary [&>img]:size-full [&>img]:object-cover",
        className,
      )}
      {...props}
    />
  );
}

function ItemContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="item-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

function ItemTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="item-title"
      className={cn(
        "truncate font-body text-sm font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ItemDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="item-description"
      className={cn("truncate text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function ItemActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="item-actions"
      className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

function ItemHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="item-header"
      className={cn("flex flex-col gap-1 pb-2", className)}
      {...props}
    />
  );
}

function ItemFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="item-footer"
      className={cn("flex flex-col gap-1 pt-2", className)}
      {...props}
    />
  );
}

export {
  Item,
  ItemGroup,
  ItemSeparator,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemHeader,
  ItemFooter,
};
