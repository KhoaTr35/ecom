import { MobileScreenHeader } from "@/components/shop/mobile/mobile-screen-header";
import { MobileInfoTabs } from "@/components/shop/mobile/mobile-info-tabs";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="lg:hidden">
        <MobileScreenHeader backHref="/wall" title="Information" />
        <MobileInfoTabs />
      </div>
      {children}
    </>
  );
}
