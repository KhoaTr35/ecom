"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const STAGE_LABELS: Record<string, string> = {
  product_view: "Viewed product",
  add_to_cart: "Added to cart",
  begin_checkout: "Began checkout",
  purchase: "Purchased",
};

const chartConfig: ChartConfig = {
  sessions: { label: "Sessions", color: "var(--primary)" },
};

export function FunnelChart({ data }: { data: { stage: string; sessions: number }[] }) {
  const labeled = data.map((d) => ({ ...d, label: STAGE_LABELS[d.stage] ?? d.stage }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart data={labeled}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="sessions" fill="var(--color-sessions)" radius={2} />
      </BarChart>
    </ChartContainer>
  );
}
