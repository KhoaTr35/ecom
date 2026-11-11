"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signUpError } = await signUp.email({ name, email, password });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message ?? "Sign up failed");
      return;
    }
    router.push("/");
  }

  return (
    <div className="flex min-h-[85vh] flex-col px-5 py-16">
      <Link href="/login" className="self-start text-sm text-muted-foreground lg:hidden">
        Cancel
      </Link>
      <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-sm font-medium uppercase tracking-[0.3em]">
          Atelier
        </Link>
        <h1 className="mt-8 text-center font-heading text-4xl leading-tight">Create account</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground lg:hidden">
          Track orders, save addresses and check out faster.
        </p>

        <form onSubmit={onSubmit} className="mt-10">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name" className="label-eyebrow text-muted-foreground">
                Full name
              </FieldLabel>
              <Input
                id="name"
                required
                autoComplete="name"
                className="h-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
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
                minLength={8}
                autoComplete="new-password"
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" size="lg" className="label-eyebrow h-12 w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}
