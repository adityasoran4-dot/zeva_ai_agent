import type { ReactElement } from "react";

function BagIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1 14H5L6 7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V6a3 3 0 016 0v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 10h.01M14.5 10h.01" />
    </svg>
  );
}

// function ArrowRightIcon(props: { className?: string }) {
//   return (
//     <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
//       <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
//       <path strokeLinecap="round" strokeLinejoin="round" d="M13 6l6 6-6 6" />
//     </svg>
//   );
// }

type MarketplaceCardProps = {
  title: string;
  subtitle: string;
  // price: string;
  items: string[];
  delayMs?: number;
};

function MarketplaceCard({ title, subtitle,  items, delayMs = 0 }: MarketplaceCardProps): ReactElement {
  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className={[
        "zeva-market-card w-full max-w-[380px] rounded-2xl border border-gray-200 bg-white",
        "shadow-[0_14px_40px_-26px_rgba(0,0,0,0.35)]",
        "transition-transform transition-shadow duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_20px_52px_-32px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-50">
            <BagIcon className="h-7 w-7 text-yellow-600" />
          </div>
</div>
          {/* <div className="text-right">
            <div className="text-[11px] font-bold tracking-wide text-gray-500">FROM</div>
            <div className="text-xl font-extrabold text-blue-700">
              {price}
              <span className="text-xs font-semibold text-gray-500">/mo</span>
            </div>
          </div>
        </div> */}

        <div className="mt-5">
          <div className="text-lg font-extrabold text-gray-900">{title}</div>
          <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          {items.map((it) => (
            <li key={it} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
              <span>{it}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={[
            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors",
            "border-yellow-500/40 bg-yellow-500 text-gray-900 hover:bg-yellow-500 hover:text-gray-900",
          ].join(" ")}
        >
            Coming Soon 
        </button>
      </div>
    </div>
  );
}

export default function MarketplaceSection(): ReactElement {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-2 sm:pb-14">
        <div className="text-center">
          <div className="mt-10 flex items-center justify-center gap-6 text-2xl font-extrabold text-blue-700 sm:text-3xl">
            <span className="h-[3px] w-12 rounded-full bg-yellow-400" />
            <span>Marketplace</span>
            <span className="h-[3px] w-12 rounded-full bg-yellow-400" />
          </div>

          <div className="mt-2 text-sm text-gray-500 sm:text-base">
            Buy, sell, franchise, or invest in opportunities
          </div>
        </div>

        <div className="mt-10 grid justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
          <MarketplaceCard
            delayMs={0}
            title="Business Listings"
            subtitle="Expand your opportunities"
            // price="$49"
            items={["List your business", "Browse opportunities", "Secure transactions", "Due diligence tools"]}
          />

          <MarketplaceCard
            delayMs={80}
            title="Franchise Opportunities"
            subtitle="Grow with proven models"
            // price="$—"
            items={["Verified franchise listings", "Territory insights", "Cost breakdowns", "Application flow"]}
          />

          <MarketplaceCard
            delayMs={160}
            title="Investors & Funding"
            subtitle="Find capital & partners"
            // price="$—"
            items={["Investor matching", "Pitch-ready profiles", "Deal rooms", "Milestone tracking"]}
          />

          <MarketplaceCard
            delayMs={240}
            title="Vendor Marketplace"
            subtitle="Tools & services for your business"
            // price="$—"
            items={["Compare vendors", "Request quotes", "Ratings & reviews", "Contract templates"]}
          />

          <MarketplaceCard
            delayMs={320}
            title="Partnerships"
            subtitle="Collaborate & cross-refer"
            // price="$—"
            items={["Partner directory", "Referral tracking", "Co-marketing kits", "Shared leads"]}
          />

          <MarketplaceCard
            delayMs={400}
            title="Resources & Templates"
            subtitle="Docs to move faster"
            // price="$—"
            items={["SOP templates", "Policy docs", "Finance sheets", "Launch checklists"]}
          />
        </div>
      </div>

      <style jsx>{`
        .zeva-market-card {
          animation: zevaFadeUp 600ms ease-out both;
        }

        @keyframes zevaFadeUp {
          from {
            opacity: 0;
            transform: translate3d(0, 14px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .zeva-market-card {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}


