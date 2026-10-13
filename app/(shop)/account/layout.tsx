import { AccountNav } from "@/components/shop/account-nav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <AccountNav />
      {children}
    </div>
  );
}
