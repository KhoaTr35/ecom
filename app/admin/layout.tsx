import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser(await headers());
  if (!user) redirect("/login?callbackUrl=/admin");
  if (user.role !== "STAFF" && user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-5 py-12 sm:px-8">
      <AdminHeader />
      <div className="flex gap-12">
        <aside className="w-48 shrink-0">
          <AdminNav />
        </aside>
        <main className="flex-1">{children}</main>
      </div>
      <AdminCommandPalette />
    </div>
  );
}
