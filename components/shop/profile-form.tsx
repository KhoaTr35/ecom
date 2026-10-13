"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateUser } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await updateUser({ name: name.trim() });
    setSubmitting(false);
    if (error) toast.error(error.message ?? "Could not update profile");
    else toast.success("Profile updated");
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="profile-name" className="label-eyebrow text-muted-foreground">
            Name
          </FieldLabel>
          <Input id="profile-name" required value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-email" className="label-eyebrow text-muted-foreground">
            Email
          </FieldLabel>
          {/* Changing email needs a verification flow this app doesn't have yet — read-only for now. */}
          <Input id="profile-email" value={email} disabled className="h-11" />
        </Field>
        <Button type="submit" disabled={submitting || !name.trim()} className="w-fit">
          {submitting && <Spinner data-icon="inline-start" />}
          Save
        </Button>
      </FieldGroup>
    </form>
  );
}
