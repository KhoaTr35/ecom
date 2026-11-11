"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth/client";
import { AddressManager } from "@/components/shop/address-manager";
import { ProfileForm } from "@/components/shop/profile-form";
import { INFO_LINKS } from "@/components/shop/nav-links";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace("/login?callbackUrl=/account/settings");
  }, [isPending, session, router]);

  return (
    <>
      <h1 className="font-heading text-5xl leading-tight">Settings</h1>

      {isPending || !session ? (
        <div className="mt-12 space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : (
        <>
          <section className="mt-12">
            <h2 className="label-eyebrow border-b border-border pb-4 text-foreground">Profile</h2>
            <div className="mt-5">
              <ProfileForm initialName={session.user.name} email={session.user.email} />
            </div>
          </section>

          <section className="mt-12">
            <AddressManager />
          </section>

          <section className="mt-12">
            <h2 className="label-eyebrow border-b border-border pb-4 text-foreground">Information</h2>
            <ul className="mt-2">
              {INFO_LINKS.map((link) => (
                <li key={link.href} className="border-b border-border/60 last:border-b-0">
                  <Link href={link.href} className="flex min-h-12 items-center justify-between text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
