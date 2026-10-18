"use client";

import { useState } from "react";
import { Code2, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const MOBILE_WIDTH = 390;

/** Dev-only layout preview: toggles the current route into an iframe whose
 * width can switch between desktop and a phone width. A plain CSS resize of
 * the real page wouldn't work here — Tailwind's `sm:`/`lg:` classes are
 * driven by the actual browser viewport, not a parent element's width, so
 * only an iframe (its own independent viewport) genuinely re-triggers
 * mobile breakpoints. Toggling width only changes the iframe's `style`, no
 * reload — the same document stays mounted, so its own state survives the
 * desktop/mobile switch. Never rendered in production.
 *
 * Reads the current URL from `window.location` rather than
 * `usePathname`/`useSearchParams` — those hooks force the whole subtree
 * they're called in to opt out of static rendering, and this component
 * wraps the entire app from the root layout. Safe here because the iframe
 * branch only ever renders after a client click (`enabled` starts false),
 * by which point `window` is guaranteed to exist. */
export function DevModeFrame({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [device, setDevice] = useState("mobile");

  if (process.env.NODE_ENV === "production") return <>{children}</>;

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-lg">
        <Button
          variant={enabled ? "default" : "outline"}
          size="icon-sm"
          aria-label={enabled ? "Exit layout preview" : "Open layout preview"}
          onClick={() => setEnabled((v) => !v)}
        >
          <Code2 />
        </Button>
        {enabled && (
          <ToggleGroup
            value={[device]}
            onValueChange={(value) => {
              const next = value[0];
              if (next) setDevice(next);
            }}
          >
            <ToggleGroupItem value="desktop" aria-label="Desktop width">
              <Monitor />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Mobile width">
              <Smartphone />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      {enabled ? (
        <div className="flex min-h-svh justify-center bg-muted p-6 pt-10">
          <iframe
            src={window.location.pathname + window.location.search}
            title="Layout preview"
            className="h-[calc(100svh-4rem)] rounded-lg border border-border bg-background shadow-xl transition-[width,max-width] duration-200"
            style={{
              width: "100%",
              maxWidth: device === "mobile" ? MOBILE_WIDTH : 1280,
            }}
          />
        </div>
      ) : (
        children
      )}
    </>
  );
}
