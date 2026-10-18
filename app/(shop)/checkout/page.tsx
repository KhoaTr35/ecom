"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGuestCart } from "@/components/shop/guest-cart-context";
import { useSession } from "@/lib/auth/client";
import { trackClient } from "@/lib/analytics/client";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { Address } from "@/components/shop/address-manager";
import { CheckoutAddressSection, EMPTY_MANUAL_ADDRESS, type ManualAddress } from "@/components/shop/checkout-address-section";
import { formatVnd } from "@/lib/utils";
import { cn } from "cn";

type ShippingMethod = { code: string; name: string; fee: number; etaDaysMin: number; etaDaysMax: number };

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { items, clear } = useGuestCart();

  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [shippingMethodCode, setShippingMethodCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "COD">("COD");

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [manualAddress, setManualAddress] = useState<ManualAddress>(EMPTY_MANUAL_ADDRESS);
  const [submitting, setSubmitting] = useState(false);

  const addressComplete =
    selectedAddressId !== "new" || Object.values(manualAddress).every((value) => value.trim().length > 0);

  useEffect(() => {
    trackClient("begin_checkout");
  }, []);

  // Not logged in -> login, then come straight back here (flow 7.1).
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login?callbackUrl=/checkout");
    }
  }, [isPending, session, router]);

  // Guest cart -> server cart, once we know who's logged in.
  useEffect(() => {
    if (!session || items.length === 0) return;
    fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).then(() => clear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    fetch("/api/shipping-methods")
      .then((res) => res.json())
      .then((json) => {
        setMethods(json.data);
        if (json.data[0]) setShippingMethodCode(json.data[0].code);
      })
      .finally(() => setMethodsLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    fetch("/api/addresses")
      .then((res) => res.json())
      .then((json) => {
        const list: Address[] = json.data ?? [];
        setSavedAddresses(list);
        const preselect = list.find((a) => a.isDefault) ?? list[0];
        if (preselect) setSelectedAddressId(preselect.id);
      })
      .finally(() => setAddressesLoading(false));
  }, [session]);

  async function placeOrder() {
    setSubmitting(true);
    try {
      let addressId = selectedAddressId;
      if (addressId === "new") {
        const addressRes = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manualAddress),
        });
        const addressJson = await addressRes.json();
        if (!addressRes.ok) throw new Error(addressJson.error?.message ?? "Could not save delivery address");
        addressId = addressJson.data.id;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId, shippingMethodCode, paymentMethod }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not place order");

      trackClient("purchase", { orderId: json.data.order.id, total: json.data.order.total });

      if (json.data.redirectUrl) {
        window.location.href = json.data.redirectUrl;
      } else {
        router.push("/checkout/result?order=" + json.data.order.code);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="font-heading text-5xl leading-tight">Checkout</h1>

      {isPending || !session ? (
        <CheckoutBodySkeleton />
      ) : (
        <>
          <section className="mt-12">
            <h2 className="label-eyebrow border-b border-border pb-4 text-foreground">Delivery address</h2>
            <CheckoutAddressSection
              loading={addressesLoading}
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={setSelectedAddressId}
              manualAddress={manualAddress}
              onManualAddressChange={(patch) => setManualAddress((a) => ({ ...a, ...patch }))}
            />
          </section>

          <section className="mt-12">
            <h2 className="label-eyebrow border-b border-border pb-4 text-foreground">Delivery</h2>
            {methodsLoading ? (
              <ShippingMethodRowsSkeleton count={3} />
            ) : (
              <RadioGroup
                value={shippingMethodCode}
                onValueChange={(value) => value && setShippingMethodCode(String(value))}
                className="mt-5 gap-2"
              >
                {methods.map((m) => {
                  const checked = shippingMethodCode === m.code;
                  return (
                    <label
                      key={m.code}
                      htmlFor={`shipping-${m.code}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-4 rounded-lg border p-4 text-sm transition-colors",
                        checked ? "border-foreground" : "border-border hover:border-muted-foreground",
                      )}
                    >
                      <RadioGroupItem id={`shipping-${m.code}`} value={m.code} />
                      <span className="flex-1">
                        {m.name}
                        <span className="text-muted-foreground">
                          {" "}
                          · {m.etaDaysMin}-{m.etaDaysMax} days
                        </span>
                      </span>
                      <span>{formatVnd(m.fee)}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            )}
          </section>

          <section className="mt-12">
            <h2 className="label-eyebrow border-b border-border pb-4 text-foreground">Payment</h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => value && setPaymentMethod(value as "VNPAY" | "COD")}
              className="mt-5 gap-2"
            >
              {(["COD", "VNPAY"] as const).map((pm) => {
                const checked = paymentMethod === pm;
                return (
                  <label
                    key={pm}
                    htmlFor={`payment-${pm}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-4 border p-4 text-sm transition-colors",
                      checked ? "border-foreground" : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <RadioGroupItem id={`payment-${pm}`} value={pm} />
                    {pm === "COD" ? "Cash on delivery (COD)" : "VNPay (sandbox)"}
                  </label>
                );
              })}
            </RadioGroup>
          </section>

          <Button
            size="lg"
            className="label-eyebrow mt-10 h-12 w-full"
            disabled={submitting || !shippingMethodCode || !addressComplete}
            onClick={placeOrder}
          >
            {submitting && <Spinner data-icon="inline-start" />}
            {submitting ? "Processing" : "Place order"}
          </Button>
        </>
      )}
    </div>
  );
}

function ShippingMethodRowsSkeleton({ count }: { count: number }) {
  return (
    <div className="mt-5 space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-4">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function CheckoutBodySkeleton() {
  return (
    <>
      <section className="mt-12">
        <Skeleton className="h-3 w-24 border-b border-transparent pb-4" />
        <div className="mt-5 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </section>
      <section className="mt-12">
        <Skeleton className="h-3 w-16 border-b border-transparent pb-4" />
        <ShippingMethodRowsSkeleton count={3} />
      </section>
      <section className="mt-12">
        <Skeleton className="h-3 w-16 border-b border-transparent pb-4" />
        <ShippingMethodRowsSkeleton count={2} />
      </section>
      <Skeleton className="mt-10 h-12 w-full" />
    </>
  );
}
