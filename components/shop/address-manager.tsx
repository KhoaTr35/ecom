"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressFormDialog } from "@/components/shop/address-form-dialog";

export type Address = {
  id: string;
  recipient: string;
  phone: string;
  line: string;
  ward: string;
  province: string;
  isDefault: boolean;
};

export function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    fetch("/api/addresses")
      .then((res) => res.json())
      .then((json) => setAddresses(json.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, no query lib in this skeleton
    refresh();
  }, []);

  async function setDefault(id: string) {
    const res = await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (!res.ok) {
      toast.error("Could not set default address");
      return;
    }
    refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete address");
      return;
    }
    toast.success("Address removed");
    refresh();
  }

  return (
    <div>
      <h2 className="label-eyebrow border-b border-border pb-4 text-foreground">Addresses</h2>

      {loading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="mt-5 divide-y divide-border border-y border-border">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-6 py-5">
              <div className="min-w-0 text-sm">
                <p className="flex items-center gap-2">
                  {a.recipient}
                  {a.isDefault && <Badge variant="secondary">Default</Badge>}
                </p>
                <p className="mt-1 text-muted-foreground">{a.phone}</p>
                <p className="mt-1 text-muted-foreground">
                  {a.line}, {a.ward}, {a.province}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!a.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => setDefault(a.id)}>
                    Set default
                  </Button>
                )}
                <AddressFormDialog
                  address={a}
                  onSaved={refresh}
                  trigger={
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  }
                />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="outline" size="sm">
                        Delete
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this address?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(a.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {addresses.length === 0 && <p className="py-8 text-sm text-muted-foreground">No saved addresses yet.</p>}
        </div>
      )}

      <AddressFormDialog
        onSaved={refresh}
        trigger={
          <Button variant="outline" size="sm" className="mt-5">
            Add address
          </Button>
        }
      />
    </div>
  );
}
