/** Bottom-pinned CTA bar for product detail / bag / checkout on mobile,
 * sitting above the fixed tab bar (`bottom-20`, the tab bar's own height). */
export function MobileStickyActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-20 z-30 flex items-center gap-3 border-t border-border bg-background px-5 py-3 lg:hidden">
      {children}
    </div>
  );
}
