"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Address } from "@/components/shop/address-manager";

type AddressFormValues = { recipient: string; phone: string; line: string; ward: string; province: string };

const EMPTY: AddressFormValues = { recipient: "", phone: "", line: "", ward: "", province: "" };

/** `Address` carries extra fields (`id`, `isDefault`) beyond the form's 5 —
 * widening it straight into `AddressFormValues` type-checks (structural
 * typing lets a wider object flow into a narrower-typed variable), but at
 * runtime `isDefault` is a boolean, which breaks the `.trim()` validation
 * below. Extract only the fields the form actually owns. */
function toFormValues(address: Address | undefined): AddressFormValues {
  if (!address) return EMPTY;
  const { recipient, phone, line, ward, province } = address;
  return { recipient, phone, line, ward, province };
}

/** Shared create/edit dialog — passing `address` edits it via PATCH, omitting
 * it creates a new one via POST. */
export function AddressFormDialog({
  address,
  trigger,
  onSaved,
}: {
  address?: Address;
  trigger: React.ReactElement;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<AddressFormValues>(() => toFormValues(address));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the form to the latest address each time the dialog opens
    if (open) setValues(toFormValues(address));
  }, [open, address]);

  const complete = Object.values(values).every((v) => v.trim().length > 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(address ? `/api/addresses/${address.id}` : "/api/addresses", {
        method: address ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not save address");
      toast.success(address ? "Address updated" : "Address added");
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{address ? "Edit address" : "Add address"}</DialogTitle>
          <DialogDescription>Used for delivery at checkout.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="address-recipient">Recipient</FieldLabel>
              <Input
                id="address-recipient"
                required
                value={values.recipient}
                onChange={(e) => setValues((v) => ({ ...v, recipient: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="address-phone">Phone</FieldLabel>
              <Input
                id="address-phone"
                required
                value={values.phone}
                onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="address-line">Address</FieldLabel>
              <Input
                id="address-line"
                required
                value={values.line}
                onChange={(e) => setValues((v) => ({ ...v, line: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="address-ward">Ward</FieldLabel>
                <Input
                  id="address-ward"
                  required
                  value={values.ward}
                  onChange={(e) => setValues((v) => ({ ...v, ward: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="address-province">Province</FieldLabel>
                <Input
                  id="address-province"
                  required
                  value={values.province}
                  onChange={(e) => setValues((v) => ({ ...v, province: e.target.value }))}
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={submitting || !complete}>
              {submitting && <Spinner data-icon="inline-start" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
