import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { CookieConsentBanner } from "@/components/shop/cookie-consent-banner";
import { FaqChatWidget } from "@/components/shop/faq-chat-widget";
import { PageViewTracker } from "@/components/shop/page-view-tracker";
import { MobileTabBar } from "@/components/shop/mobile/mobile-tab-bar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageViewTracker />
      <div className="hidden lg:block">
        <Header />
      </div>
      {/* pb-20 clears the fixed mobile tab bar; desktop resets to 0 (decision 4) */}
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <MobileTabBar />
      <CookieConsentBanner />
      <FaqChatWidget />
    </>
  );
}
