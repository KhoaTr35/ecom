"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export type SidebarCategory = { id: string; slug: string; name: string; count: number };

/** Seasonal drops vs. the standing product-type sections — a real grouping
 * of the actual categories (by slug), not fabricated data. New seasonal
 * slugs just need adding here; everything else renders generically. */
const SEASONAL_SLUGS = new Set(["autumn", "winter", "spring", "christmas"]);

function CategoryMenu({ categories }: { categories: SidebarCategory[] }) {
  return (
    <SidebarMenu>
      {categories.map((c) => (
        <SidebarMenuItem key={c.id}>
          <SidebarMenuButton render={<Link href={`/c/${c.slug}`}>{c.name}</Link>} />
          <SidebarMenuBadge>{c.count}</SidebarMenuBadge>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function CollectionsSidebar({ categories }: { categories: SidebarCategory[] }) {
  const seasonal = categories.filter((c) => SEASONAL_SLUGS.has(c.slug));
  const byType = categories.filter((c) => !SEASONAL_SLUGS.has(c.slug));

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 py-5">
        <p className="label-eyebrow text-muted-foreground">Atelier</p>
        <p className="font-heading text-2xl">Collections</p>
      </SidebarHeader>
      <SidebarContent>
        {seasonal.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>By season</SidebarGroupLabel>
            <SidebarGroupContent>
              <CategoryMenu categories={seasonal} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {byType.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>By type</SidebarGroupLabel>
            <SidebarGroupContent>
              <CategoryMenu categories={byType} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
