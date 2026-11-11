"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn.email({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message ?? "Login failed");
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <div className="flex min-h-[85vh] flex-col px-5 py-16">
      <Link href="/cart" className="self-start text-sm text-muted-foreground lg:hidden">
        Cancel
      </Link>
      <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-sm font-medium uppercase tracking-[0.3em]">
          Atelier
        </Link>
        <h1 className="mt-8 text-center font-heading text-4xl leading-tight">Sign in</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground lg:hidden">
          Your bag is saved. You&apos;ll be back right after.
        </p>

        <form onSubmit={onSubmit} className="mt-10">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email" className="label-eyebrow text-muted-foreground">
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password" className="label-eyebrow text-muted-foreground">
                Password
              </FieldLabel>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" size="lg" className="label-eyebrow h-12 w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}
