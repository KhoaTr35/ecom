"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatIsoDate as isoDate } from "@/lib/utils";

/** Drives `?from=&to=` so the KPI tiles and chart re-query server-side for
 * the selected range, instead of filtering already-fetched data client-side. */
export function AnalyticsDateRangePicker({ from, to }: { from: Date; to: Date }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({ from, to });

  function onSelect(next: DateRange | undefined) {
    setRange(next);
    if (!next?.from || !next?.to) return;

    const params = new URLSearchParams();
    params.set("from", isoDate(next.from));
    params.set("to", isoDate(next.to));
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <CalendarIcon data-icon="inline-start" />
            {isoDate(from)} – {isoDate(to)}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-2" align="end">
        <Calendar mode="range" selected={range} onSelect={onSelect} numberOfMonths={2} disabled={{ after: new Date() }} />
      </PopoverContent>
    </Popover>
  );
}
