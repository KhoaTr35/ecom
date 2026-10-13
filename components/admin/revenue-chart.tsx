"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatVnd } from "@/lib/utils";

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--primary)" },
};

function formatTick(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatTick} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => formatTick(String(label))}
              formatter={(value) => formatVnd(Number(value))}
            />
          }
        />
        <Area
          dataKey="revenue"
          type="monotone"
          fill="var(--color-revenue)"
          fillOpacity={0.2}
          stroke="var(--color-revenue)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
