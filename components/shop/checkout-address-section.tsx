import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import type { Address } from "@/components/shop/address-manager";
import { cn } from "cn";

export type ManualAddress = { recipient: string; phone: string; line: string; ward: string; province: string };

export const EMPTY_MANUAL_ADDRESS: ManualAddress = { recipient: "", phone: "", line: "", ward: "", province: "" };

/** Picker over the signed-in user's saved address book, with a manual-entry
 * fallback — for guests mid-sync, or anyone with no saved address yet, only
 * the manual form shows (no pointless single-option radio list). */
export function CheckoutAddressSection({
  loading,
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  manualAddress,
  onManualAddressChange,
}: {
  loading: boolean;
  savedAddresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  manualAddress: ManualAddress;
  onManualAddressChange: (patch: Partial<ManualAddress>) => void;
}) {
  if (loading) {
    return (
      <div className="mt-5 space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5">
      {savedAddresses.length > 0 && (
        <RadioGroup
          value={selectedAddressId}
          onValueChange={(value) => value && onSelectAddress(String(value))}
          className="gap-2"
        >
          {savedAddresses.map((a) => {
            const checked = selectedAddressId === a.id;
            return (
              <label
                key={a.id}
                htmlFor={`address-${a.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-4 border p-4 text-sm transition-colors",
                  checked ? "border-foreground" : "border-border hover:border-muted-foreground",
                )}
              >
                <RadioGroupItem id={`address-${a.id}`} value={a.id} className="mt-0.5" />
                <span>
                  <span className="font-medium">{a.recipient}</span> · {a.phone}
                  <br />
                  <span className="text-muted-foreground">
                    {a.line}, {a.ward}, {a.province}
                  </span>
                </span>
              </label>
            );
          })}
          <label
            htmlFor="address-new"
            className={cn(
              "flex cursor-pointer items-center gap-4 border p-4 text-sm transition-colors",
              selectedAddressId === "new" ? "border-foreground" : "border-border hover:border-muted-foreground",
            )}
          >
            <RadioGroupItem id="address-new" value="new" />
            Use a new address
          </label>
        </RadioGroup>
      )}

      {(savedAddresses.length === 0 || selectedAddressId === "new") && (
        <FieldGroup className={savedAddresses.length > 0 ? "mt-5" : undefined}>
          <Field>
            <FieldLabel htmlFor="recipient" className="label-eyebrow text-muted-foreground">
              Recipient
            </FieldLabel>
            <Input
              id="recipient"
              required
              autoComplete="name"
              value={manualAddress.recipient}
              onChange={(e) => onManualAddressChange({ recipient: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone" className="label-eyebrow text-muted-foreground">
              Phone
            </FieldLabel>
            <Input
              id="phone"
              required
              autoComplete="tel"
              value={manualAddress.phone}
              onChange={(e) => onManualAddressChange({ phone: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="line" className="label-eyebrow text-muted-foreground">
              Address
            </FieldLabel>
            <Input
              id="line"
              required
              autoComplete="street-address"
              value={manualAddress.line}
              onChange={(e) => onManualAddressChange({ line: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="ward" className="label-eyebrow text-muted-foreground">
                Ward
              </FieldLabel>
              <Input id="ward" required value={manualAddress.ward} onChange={(e) => onManualAddressChange({ ward: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="province" className="label-eyebrow text-muted-foreground">
                Province
              </FieldLabel>
              <Input
                id="province"
                required
                autoComplete="address-level1"
                value={manualAddress.province}
                onChange={(e) => onManualAddressChange({ province: e.target.value })}
              />
            </Field>
          </div>
        </FieldGroup>
      )}
    </div>
  );
}
