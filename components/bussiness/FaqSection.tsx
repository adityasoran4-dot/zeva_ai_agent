import type { ReactElement } from "react";
import { useState } from "react";

type FaqItem = {
  q: string;
  a: string;
};

const FAQS: FaqItem[] = [
  {
    q: "How does the pricing work?",
    a: "ZEVA uses modular pricing — you only pay for the modules you activate. Start with a 14-day free trial, then choose modules starting at $29/month. Add or remove modules anytime.",
  },
  {
    q: "Is ZEVA HIPAA compliant?",
    a: "Yes, ZEVA is fully HIPAA compliant and SOC 2 certified. We use enterprise-grade encryption, secure data centers, and regular security audits to protect your patient data. All patient records are encrypted at rest and in transit.",
  },
  {
    q: "Can I cancel or change my modules anytime?",
    a: "Absolutely! There are no long-term contracts. You can add, remove, or modify your modules at any time. Changes take effect immediately, and your billing adjusts automatically for the next cycle.",
  },
  {
    q: "How long does implementation take?",
    a: "Most businesses are up and running in under 5 minutes. Our guided setup walks you through adding your business information, selecting modules, and importing any existing data. For larger practices, our dedicated onboarding team can help with custom setup within 24-48 hours.",
  },
  {
    q: "Do you support multi-location practices?",
    a: "Yes! ZEVA is built for scalability. You can manage multiple locations from a single dashboard, with separate or unified reporting, staff management, and inventory tracking. Each location can have its own modules enabled as needed.",
  },
  {
    q: "What integrations are available?",
    a: "ZEVA integrates with major insurance providers, payment processors (Stripe, Square, PayPal), accounting software (QuickBooks, Xero), marketing tools, and EMR/EHR systems. Our API allows for custom integrations as well.",
  },
  {
    q: "Is there a setup fee?",
    a: "No setup fees, no hidden costs. You only pay for the modules you use each month. The free trial gives you full access to test everything before committing.",
  },
  {
    q: "What kind of support do you provide?",
    a: "All plans include 24/7 email support and comprehensive documentation. Paid plans get priority support with live chat. Enterprise customers receive dedicated account managers and phone support.",
  },
  {
    q: "Can I import my existing data?",
    a: "Yes! ZEVA supports data import from most practice management systems. We provide CSV templates and our team can help with bulk imports. Patient records, appointments, and financial data can all be migrated securely.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Your data is always yours. If you cancel, you can export all your data in standard formats (CSV, PDF) before your account closes. We retain your data for 90 days after cancellation in case you want to return.",
  },
];

function PlusIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

function MinusIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

function ArrowRightIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 6l6 6-6 6" />
    </svg>
  );
}

export default function FaqSection(): ReactElement {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <div className="text-center">
          <div className="text-2xl font-extrabold text-blue-700 sm:text-3xl">
            Frequently Asked Questions
          </div>
          <div className="mt-2 text-xs text-gray-500">Everything you need to know about ZEVA</div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-2xl space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={item.q}
                className={[
                  "overflow-hidden rounded-xl border bg-white shadow-[0_12px_34px_-28px_rgba(0,0,0,0.35)]",
                  isOpen ? "border-emerald-700" : "border-gray-200",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx((prev) => (prev === idx ? null : idx))}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-extrabold text-gray-900">{item.q}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-gray-200 text-gray-500">
                    {isOpen ? (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-white">
                        <MinusIcon className="h-4 w-4" />
                      </span>
                    ) : (
                      <PlusIcon className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {isOpen ? (
                  <div className="px-5 pb-5">
                    <div className="text-sm leading-relaxed text-gray-600">{item.a}</div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white px-6 py-6 text-center shadow-[0_12px_34px_-28px_rgba(0,0,0,0.35)]">
          <div className="text-xs font-extrabold text-gray-900">Still have questions?</div>
          <button
            type="button"
            className="mt-2 inline-flex items-center justify-center gap-2 text-xs font-extrabold text-blue-700"
          >
            Contact our team <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}


