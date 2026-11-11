import Link from "next/link";

/** The Wall's Instagram-profile-style header (design page 05) — avatar
 * monogram, three derived stats, bio, two CTAs. No fabricated bio beyond
 * what's already on the homepage hero. */
export function WallProfileHeader({
  stats,
  tagline,
}: {
  stats: { pieces: number; collections: number; season: string };
  tagline: string;
}) {
  return (
    <section className="flex flex-col gap-3 px-4 pt-2 lg:hidden">
      <div className="flex items-center gap-5">
        <div className="flex size-[84px] shrink-0 items-center justify-center rounded-full border-2 border-foreground p-[3px]">
          <div className="flex size-full items-center justify-center rounded-full bg-foreground font-heading text-[34px] text-background">
            A
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 text-center">
          <Stat value={stats.pieces} label="pieces" />
          <Stat value={stats.collections} label="collections" />
          <Stat value={stats.season} label="season" />
        </div>
      </div>

      <div>
        <p className="font-heading text-xl">Atelier</p>
        <p className="mt-1 text-sm leading-relaxed">{tagline}</p>
        <p className="mt-1 text-xs text-muted-foreground">10 a.m - 9 p.m | District 1, Ho Chi Minh City</p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/c/new-arrivals"
          className="flex h-11 flex-1 items-center justify-center rounded-md bg-foreground text-[12px] font-semibold uppercase tracking-[0.08em] text-background"
        >
          Shop the collection
        </Link>
        <Link
          href="/return-policy"
          className="flex h-11 flex-1 items-center justify-center rounded-md bg-muted text-[12px] font-semibold uppercase tracking-[0.08em]"
        >
          Information
        </Link>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
