import type { ReactElement } from "react";

import HealthcareSection from "./HealthcareSection";
import MarketingSection from "./MarketingSection";

function DocIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 13H8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17H8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9H8" />
    </svg>
  );
}

function ClockIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v6l4 2" />
    </svg>
  );
}

function ChartIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 19V9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 19V11" />
    </svg>
  );
}

function BankIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10V20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10V20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10V20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10V20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 20h20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 7H3l9-7z" />
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

type FinanceCardProps = {
  icon: ReactElement;
  title: string;
  subtitle: string;
  // price: string;
  items: string[];
  delayMs?: number;
};

function FinanceCard({ icon, title, subtitle, items, delayMs = 0 }: FinanceCardProps): ReactElement {
  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className={[
        "zeva-fin-card w-full max-w-[380px] rounded-2xl border border-gray-200 bg-white",
        "shadow-[0_14px_40px_-26px_rgba(0,0,0,0.35)]",
        "transition-transform transition-shadow duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_20px_52px_-32px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-50">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-100 text-purple-700">
              {icon}
            </div>
          </div>
          </div>

          {/* <div className="text-right">
            <div className="text-[11px] font-bold tracking-wide text-gray-500">FROM</div>
            <div className="text-xl font-extrabold text-blue-700">
              {price}
              <span className="text-xs font-semibold text-gray-500">/mo</span>
            </div>
          </div> */}
        {/* </div> */}

        <div className="mt-5">
          <div className="text-lg font-extrabold text-gray-900">{title}</div>
          <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          {items.map((it) => (
            <li key={it} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-700" />
              <span>{it}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={[
            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors",
            "border-purple-700 bg-purple-600 text-gray-900 hover:bg-purple-700 hover:text-white",
          ].join(" ")}
        >
      Coming Soon 
        </button>
      </div>
    </div>
  );
}

export default function FinanceSection(): ReactElement {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-2 sm:pb-14">
          <div className="text-center">
            <div className="mt-3 flex items-center justify-center gap-6 text-2xl font-extrabold text-blue-700 sm:text-3xl">
              <span className="h-[3px] w-12 rounded-full bg-purple-600" />
              <span>Finance &amp; Compliance</span>
              <span className="h-[3px] w-12 rounded-full bg-purple-600" />
            </div>

            <div className="mt-2 text-sm text-gray-500 sm:text-base">
              Stay compliant and financially organized
            </div>
          </div>

          <div className="mt-10 grid justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
            <FinanceCard
              delayMs={0}
              icon={<DocIcon className="h-6 w-6" />}
              title="Billing & Invoices"
              subtitle="Professional invoicing"
              // price="
              // $39"
              items={["Custom templates", "Auto billing", "Payment tracking", "Receipt generation"]}
            />

            <FinanceCard
              delayMs={80}
              icon={<ClockIcon className="h-6 w-6" />}
              title="VAT & Tax Filing"
              subtitle="Stay compliant"
              // price="$49"
              items={["Auto calculations", "Tax reports", "Filing assistance", "Audit trails"]}
            />

            <FinanceCard
              delayMs={160}
              icon={<DocIcon className="h-6 w-6" />}
              title="Reports & Analytics"
              subtitle="Real-time insights"
              // price="$59"
              items={["Custom dashboards", "Financial reports", "Performance metrics", "Export tools"]}
            />

            <FinanceCard
              delayMs={240}
              icon={<BankIcon className="h-6 w-6" />}
              title="Clinic Financing"
              subtitle="Flexible payment options"
              // price="$99"
              items={["Installment plans", "Patient financing", "Eligibility checks", "Auto reminders"]}
            />

            <FinanceCard
              delayMs={320}
              icon={<DocIcon className="h-6 w-6" />}
              title="Compliance Center"
              subtitle="Policies & documentation"
              // price="$—"
              items={["Policy templates", "Consent forms", "Document vault", "Renewal alerts"]}
            />

            <FinanceCard
              delayMs={400}
              icon={<ChartIcon className="h-6 w-6" />}
              title="Revenue Optimization"
              subtitle="Increase margins"
              // price="$—"
              items={["Pricing insights", "Charge capture", "Forecasting", "Growth tracking"]}
            />
          </div>
        </div>

        <style jsx>{`
          .zeva-fin-card {
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
            .zeva-fin-card {
              animation: none;
            }
          }
        `}</style>
      </section>

      {/* Merge Healthcare + Marketing at the bottom of Finance */}
      <HealthcareSection />
      <MarketingSection />
    </>
  );
}


