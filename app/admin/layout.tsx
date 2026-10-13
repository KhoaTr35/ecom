import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser(await headers());
  if (!user) redirect("/login?callbackUrl=/admin");
  if (user.role !== "STAFF" && user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-12 px-5 py-12 sm:px-8">
      <aside className="w-48 shrink-0">
        <Link
          href="/"
          className="mb-8 block text-sm font-medium uppercase tracking-[0.3em]"
        >
          Atelier
        </Link>
        <AdminNav />
      </aside>
      <main className="flex-1">{children}</main>
      <AdminCommandPalette />
    </div>
  );
}
