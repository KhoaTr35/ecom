import { getDailyRevenue, getFunnel, getKpis } from "@/lib/analytics";
import { AnalyticsDateRangePicker } from "@/components/admin/analytics-date-range-picker";
import { FunnelChart } from "@/components/admin/funnel-chart";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { Card, CardContent } from "@/components/ui/card";
import { formatIsoDate, formatVnd } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseDateParam(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

/** `?to=` is a plain "YYYY-MM-DD" day pick from the calendar, which parses to
 * UTC midnight *start* of that day — an inclusive query bound needs the last
 * instant of that day instead, or it'd exclude nearly the whole day. Only
 * applied to the query copy: the display value (button label, calendar
 * `selected`) keeps the plain start-of-day instant, which already renders as
 * the correct local calendar day. */
function endOfDayUtc(d: Date): Date {
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const defaultTo = new Date();
  const defaultFrom = new Date(defaultTo.getTime() - 30 * 86_400_000);
  const toParam = firstValue(sp.to);
  const to = parseDateParam(toParam, defaultTo);
  const from = parseDateParam(firstValue(sp.from), defaultFrom);
  const queryTo = toParam ? endOfDayUtc(to) : to;

  const [kpis, dailyRevenue, funnel] = await Promise.all([
    getKpis({ from, to: queryTo }).catch(() => ({
      visits: 0,
      conversionRate: 0,
      revenue: 0,
      averageOrderValue: 0,
      orderCount: 0,
    })),
    getDailyRevenue({ from, to: queryTo }).catch(() => []),
    getFunnel({ from, to: queryTo }).catch(() => []),
  ]);

  const tiles = [
    { label: `Visits (${formatIsoDate(from)} – ${formatIsoDate(to)})`, value: kpis.visits },
    { label: "Conversion rate", value: `${(kpis.conversionRate * 100).toFixed(1)}%` },
    { label: "Revenue", value: formatVnd(kpis.revenue) },
    { label: "Average order value", value: formatVnd(kpis.averageOrderValue) },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium">Analytics</h1>
        <AnalyticsDateRangePicker from={from} to={to} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="mt-1 text-xl font-medium text-primary">{t.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-medium">Revenue trend</p>
          <RevenueChart data={dailyRevenue} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-medium">Funnel</p>
          <FunnelChart data={funnel} />
        </CardContent>
      </Card>
    </div>
  );
}
