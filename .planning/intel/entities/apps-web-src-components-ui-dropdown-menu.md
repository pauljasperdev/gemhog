---
path: /home/lima/repo/apps/web/src/components/ui/dropdown-menu.tsx
type: component
updated: 2025-01-21
status: active
---

# dropdown-menu.tsx

## Purpose

Comprehensive dropdown menu component system built on Base UI Menu primitives. Provides full-featured menus with items, checkboxes, radio groups, submenus, labels, separators, and keyboard shortcuts. Supports positioning, animations, and destructive item variants for consistent menu UX.

## Exports

- `DropdownMenu({ ...props }): JSX.Element` - Root menu component
- `DropdownMenuPortal({ ...props }): JSX.Element` - Portal for rendering outside DOM tree
- `DropdownMenuTrigger({ ...props }): JSX.Element` - Element that opens the menu
- `DropdownMenuContent({ ...props }): JSX.Element` - Positioned menu popup
- `DropdownMenuGroup({ ...props }): JSX.Element` - Logical grouping of items
- `DropdownMenuLabel({ className, inset, ...props }): JSX.Element` - Non-interactive label
- `DropdownMenuItem({ className, inset, variant, ...props }): JSX.Element` - Clickable item
- `DropdownMenuCheckboxItem({ ...props }): JSX.Element` - Toggleable checkbox item
- `DropdownMenuRadioGroup({ ...props }): JSX.Element` - Radio button group
- `DropdownMenuRadioItem({ ...props }): JSX.Element` - Radio button item
- `DropdownMenuSeparator({ ...props }): JSX.Element` - Visual divider
- `DropdownMenuShortcut({ ...props }): JSX.Element` - Keyboard shortcut display
- `DropdownMenuSub({ ...props }): JSX.Element` - Submenu root
- `DropdownMenuSubTrigger({ ...props }): JSX.Element` - Submenu trigger
- `DropdownMenuSubContent({ ...props }): JSX.Element` - Submenu content

## Dependencies

- [[apps-web-src-lib-utils]] - cn utility for class merging
- @base-ui/react/menu - Base UI menu primitives
- lucide-react - Check and chevron icons

## Used By

TBD
