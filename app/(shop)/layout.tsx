import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { CookieConsentBanner } from "@/components/shop/cookie-consent-banner";
import { FaqChatWidget } from "@/components/shop/faq-chat-widget";
import { PageViewTracker } from "@/components/shop/page-view-tracker";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageViewTracker />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieConsentBanner />
      <FaqChatWidget />
    </>
  );
}
