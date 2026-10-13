import type { PriceRuleLike, Segment } from "@/lib/pricing/types";

/** Price windows are authored in Vietnamese local time; `now` is a UTC instant. */
const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type VariantFacts = { stock: number; categoryId: string };

/** Wall-clock minute-of-day and weekday in Vietnam for a given instant. */
export function vietnamWallClock(now: Date): { minutesOfDay: number; dayOfWeek: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VN_TIME_ZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  // Some engines render midnight as "24" under hour12:false.
  const hour = Number(read("hour")) % 24;
  const minute = Number(read("minute"));

  return {
    minutesOfDay: hour * 60 + minute,
    dayOfWeek: WEEKDAY_INDEX[read("weekday")] ?? 0,
  };
}

/** "HH:MM" -> minutes since midnight, or null when malformed. */
function parseClock(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function asRecord(condition: unknown): Record<string, unknown> {
  return condition && typeof condition === "object" ? (condition as Record<string, unknown>) : {};
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const strings = value.filter((entry): entry is string => typeof entry === "string");
  return strings.length > 0 ? strings : null;
}

/** Optional `categoryIds` narrows any rule to a subset of the catalogue. */
function matchesCategory(condition: Record<string, unknown>, variant: VariantFacts): boolean {
  const categoryIds = asStringArray(condition.categoryIds);
  return categoryIds === null || categoryIds.includes(variant.categoryId);
}

function matchesTimeWindow(
  condition: Record<string, unknown>,
  variant: VariantFacts,
  now: Date,
): boolean {
  if (!matchesCategory(condition, variant)) return false;

  const start = parseClock(condition.start);
  const end = parseClock(condition.end);
  if (start === null || end === null) return false;

  const { minutesOfDay, dayOfWeek } = vietnamWallClock(now);

  const daysOfWeek = Array.isArray(condition.daysOfWeek)
    ? condition.daysOfWeek.filter((day): day is number => typeof day === "number")
    : null;
  if (daysOfWeek && daysOfWeek.length > 0 && !daysOfWeek.includes(dayOfWeek)) return false;

  // A window whose end is before its start wraps past midnight (e.g. 22:00-02:00).
  return start <= end
    ? minutesOfDay >= start && minutesOfDay <= end
    : minutesOfDay >= start || minutesOfDay <= end;
}

function matchesStockLevel(condition: Record<string, unknown>, variant: VariantFacts): boolean {
  if (!matchesCategory(condition, variant)) return false;
  const minStock = condition.minStock;
  return typeof minStock === "number" && variant.stock >= minStock;
}

function matchesSegment(condition: Record<string, unknown>, segment: Segment): boolean {
  return condition.segment === segment;
}

/** Whether a single rule applies to one cart line. */
export function ruleApplies(
  rule: PriceRuleLike,
  variant: VariantFacts,
  segment: Segment,
  now: Date,
): boolean {
  if (!rule.active) return false;
  const condition = asRecord(rule.condition);

  switch (rule.type) {
    case "TIME_WINDOW":
      return matchesTimeWindow(condition, variant, now);
    case "STOCK_LEVEL":
      return matchesStockLevel(condition, variant);
    case "SEGMENT":
      return matchesSegment(condition, segment);
    default:
      return false;
  }
}

/**
 * The single best rule for a line: largest discount wins, ties break on
 * `priority`. Discounts never stack (plan section 5.1).
 */
export function pickBestRule(
  rules: PriceRuleLike[],
  variant: VariantFacts,
  segment: Segment,
  now: Date,
): PriceRuleLike | null {
  return rules
    .filter((rule) => ruleApplies(rule, variant, segment, now))
    .reduce<PriceRuleLike | null>((best, rule) => {
      if (!best) return rule;
      if (rule.percentOff !== best.percentOff) return rule.percentOff > best.percentOff ? rule : best;
      return rule.priority > best.priority ? rule : best;
    }, null);
}
