import * as React from "react"
import { cn } from "@/lib/utils"

const Empty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="empty"
    className={cn(
      "flex flex-col items-center justify-center gap-4 text-center py-12 px-6",
      className
    )}
    {...props}
  />
))
Empty.displayName = "Empty"

const EmptyHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="empty-header"
    className={cn("flex flex-col items-center gap-2", className)}
    {...props}
  />
))
EmptyHeader.displayName = "EmptyHeader"

const EmptyMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="empty-media"
    className={cn(
      "flex items-center justify-center text-muted-foreground [&>svg]:size-12",
      className
    )}
    {...props}
  />
))
EmptyMedia.displayName = "EmptyMedia"

const EmptyTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-slot="empty-title"
    className={cn("font-heading text-lg font-semibold uppercase tracking-wide", className)}
    {...props}
  />
))
EmptyTitle.displayName = "EmptyTitle"

const EmptyContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="empty-content"
    className={cn("flex flex-col items-center gap-3", className)}
    {...props}
  />
))
EmptyContent.displayName = "EmptyContent"

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="empty-description"
    className={cn("text-muted-foreground text-sm max-w-sm", className)}
    {...props}
  />
))
EmptyDescription.displayName = "EmptyDescription"

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
}
