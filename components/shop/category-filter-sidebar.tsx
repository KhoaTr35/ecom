"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import type { Facet } from "@/lib/catalog/facets";

/** Multi-select facet checkboxes, grouped in collapsible sections, driving
 * the category page's query string directly (no local filter state). */
export function CategoryFilterSidebar({ facets }: { facets: Facet[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (facets.length === 0) return null;

  function toggleValue(key: string, value: string, checked: boolean) {
    const params = new URLSearchParams(searchParams);
    const selected = new Set((params.get(key) ?? "").split(",").filter(Boolean));

    if (checked) selected.add(value);
    else selected.delete(value);

    if (selected.size > 0) params.set(key, [...selected].join(","));
    else params.delete(key);
    params.delete("page");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Accordion multiple defaultValue={facets.map((facet) => facet.key)}>
      {facets.map((facet) => {
        const selected = new Set((searchParams.get(facet.key) ?? "").split(",").filter(Boolean));

        return (
          <AccordionItem key={facet.key} value={facet.key}>
            <AccordionTrigger className="label-eyebrow text-foreground hover:no-underline">
              {facet.label}
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3 pt-1">
                {facet.values.map(({ value, count }) => {
                  const id = `${facet.key}-${value}`;
                  return (
                    <li key={value} className="flex items-center gap-2.5">
                      <Checkbox
                        id={id}
                        checked={selected.has(value)}
                        onCheckedChange={(checked) => toggleValue(facet.key, value, checked === true)}
                      />
                      <label htmlFor={id} className="flex-1 cursor-pointer text-sm">
                        {value}
                      </label>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
