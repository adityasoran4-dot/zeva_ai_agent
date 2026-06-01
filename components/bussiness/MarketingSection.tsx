import type { ReactElement } from "react";

import CustomSolutionsSection from "./CustomSolutionsSection";

function ShareIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.6 13.5l6.8 3.9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.4 6.6L8.6 10.5" />
    </svg>
  );
}

function SearchIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function StarIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2l3.1 6.3 7 1-5.1 5 1.2 7-6.2-3.3L5.8 21l1.2-7-5.1-5 7-1L12 2z"
      />
    </svg>
  );
}

function MegaphoneIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11v2a2 2 0 002 2h1l4 4V7L6 11H5a2 2 0 00-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 9l7-3v12l-7-3V9z" />
    </svg>
  );
}

function LinkIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.07 0l2.12-2.12a5 5 0 10-7.07-7.07L10.5 3.43" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.07 0L4.81 13.12a5 5 0 007.07 7.07L13.5 20.57" />
    </svg>
  );
}

function MessageIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
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

type MarketingCardProps = {
  icon: ReactElement;
  title: string;
  subtitle: string;
  // price: string;
  items: string[];
  delayMs?: number;
};

function MarketingCard({ icon, title, subtitle, items, delayMs = 0 }: MarketingCardProps): ReactElement {
  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className={[
        "zeva-mkt-card w-full max-w-[380px] rounded-2xl border border-gray-200 bg-white",
        "shadow-[0_14px_40px_-26px_rgba(0,0,0,0.35)]",
        "transition-transform transition-shadow duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_20px_52px_-32px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-50">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-pink-100 text-pink-600">
              {icon}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-lg font-extrabold text-gray-900">{title}</div>
          <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          {items.map((it) => (
            <li key={it} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-600" />
              <span>{it}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={[
            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors",
            "border-pink-600 bg-pink-600 text-gray-900 hover:bg-pink-600 hover:text-white",
          ].join(" ")}
        >
          Coming Soon 
        </button>
      </div>
    </div>
  );
}

export default function MarketingSection(): ReactElement {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-2 sm:pb-14">
          <div className="text-center">
            <div className="mt-3 flex items-center justify-center gap-6 text-2xl font-extrabold text-blue-700 sm:text-3xl">
              <span className="h-[3px] w-12 rounded-full bg-pink-500" />
              <span>Marketing &amp; Visibility</span>
              <span className="h-[3px] w-12 rounded-full bg-pink-500" />
            </div>

            <div className="mt-2 text-sm text-gray-500 sm:text-base">
              Grow your online presence and patient base
            </div>
          </div>

          <div className="mt-10 grid justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
            <MarketingCard
              delayMs={0}
              icon={<ShareIcon className="h-6 w-6" />}
              title="Social Media Tools"
              subtitle="Grow online presence"
              // price="$59"
              items={["Content scheduler", "HIPAA templates", "Analytics", "Multi-platform"]}
            />

            <MarketingCard
              delayMs={80}
              icon={<SearchIcon className="h-6 w-6" />}
              title="SEO & Local Listings"
              subtitle="Get found locally"
              // price="$49"
              items={["Google profile sync", "Keyword insights", "Local citations", "Landing pages"]}
            />

            <MarketingCard
              delayMs={160}
              icon={<StarIcon className="h-6 w-6" />}
              title="Reviews & Reputation"
              subtitle="Build trust at scale"
              // price="$39"
              items={["Review requests", "Auto follow-ups", "Reputation dashboard", "Response templates"]}
            />

            <MarketingCard
              delayMs={240}
              icon={<MegaphoneIcon className="h-6 w-6" />}
              title="Campaign Manager"
              subtitle="Launch promotions"
              // price="$—"
              items={["Email campaigns", "SMS campaigns", "Audience segments", "A/B testing"]}
            />

            <MarketingCard
              delayMs={320}
              icon={<LinkIcon className="h-6 w-6" />}
              title="Referral Program"
              subtitle="Grow via partners"
              // price="$—"
              items={["Referral links", "Rewards rules", "Partner portal", "Conversion tracking"]}
            />

            <MarketingCard
              delayMs={400}
              icon={<MessageIcon className="h-6 w-6" />}
              title="Patient Outreach"
              subtitle="Stay connected"
              // price="$—"
              items={["Broadcast messages", "Recall reminders", "Newsletter builder", "Engagement analytics"]}
            />
          </div>
        </div>

        <style jsx>{`
          .zeva-mkt-card {
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
            .zeva-mkt-card {
              animation: none;
            }
          }
        `}</style>
      </section>

      {/* Merge custom CTA at the bottom of Marketing */}
      <CustomSolutionsSection />
    </>
    
  );
}


