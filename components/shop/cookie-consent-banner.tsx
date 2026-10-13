"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CONSENT_COOKIE = "cookie_consent";
const SESSION_COOKIE = "analytics_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

function hasCookie(name: string): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith(`${name}=`));
}

/** Gates all analytics tracking (`lib/analytics/client.ts`) on consent, per
 * this project's own design: `analytics_sid` only exists after the visitor
 * accepts — decline (or never answering) means nothing gets recorded. */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from document.cookie, an external non-React source
    if (!hasCookie(CONSENT_COOKIE)) setVisible(true);
  }, []);

  function respond(accepted: boolean) {
    document.cookie = `${CONSENT_COOKIE}=${accepted ? "1" : "0"}; path=/; max-age=${ONE_YEAR}`;
    if (accepted) {
      document.cookie = `${SESSION_COOKIE}=${crypto.randomUUID()}; path=/; max-age=${ONE_YEAR}`;
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-between gap-4 border-t border-border bg-background p-5 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        We use cookies to understand how visitors use this site.
      </p>
      <div className="flex shrink-0 gap-3">
        <Button variant="outline" size="sm" onClick={() => respond(false)}>
          Decline
        </Button>
        <Button size="sm" onClick={() => respond(true)}>
          Accept
        </Button>
      </div>
    </div>
  );
}
