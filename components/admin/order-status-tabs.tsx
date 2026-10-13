"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Drives the `?tab=` query param so the status filter is a real navigation,
 * not client-only state — consistent with the shop's category filter pattern. */
export function OrderStatusTabs({
  tabs,
  active,
}: {
  tabs: readonly { value: string; label: string }[];
  active: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onValueChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete("tab");
    else params.set("tab", value);

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Tabs value={active} onValueChange={onValueChange}>
      <TabsList>
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
