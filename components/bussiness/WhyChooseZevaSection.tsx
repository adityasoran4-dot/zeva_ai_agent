import type { ReactElement } from "react";

import FaqSection from "./FaqSection";

function ClockIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v6l4 2" />
    </svg>
  );
}

function TrendingUpIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 7-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 7h6v6" />
    </svg>
  );
}

function ShieldIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-5" />
    </svg>
  );
}

function BoltIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function CheckIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.415l-7.07 7.07a1 1 0 01-1.415 0l-3.535-3.536a1 1 0 011.414-1.414l2.828 2.828 6.364-6.364a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type Feature = {
  title: string;
  body: string;
  icon: ReactElement;
};

const FEATURES: Feature[] = [
  {
    title: "Save Time",
    body: "Automate repetitive tasks and streamline workflows",
    icon: <ClockIcon className="h-4 w-4" />,
  },
  {
    title: "Increase Revenue",
    body: "Convert more leads and reduce no-shows",
    icon: <TrendingUpIcon className="h-4 w-4" />,
  },
  {
    title: "Stay Compliant",
    body: "HIPAA compliant with built-in security",
    icon: <ShieldIcon className="h-4 w-4" />,
  },
  {
    title: "Scale Easily",
    body: "Add locations and team members effortlessly",
    icon: <BoltIcon className="h-4 w-4" />,
  },
];

export default function WhyChooseZevaSection(): ReactElement {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-blue-700 sm:text-3xl">Why Businesses Choose ZEVA</div>
            <div className="mt-2 text-xs text-gray-500">Built for growth, designed for efficiency</div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  {f.icon}
                </div>
                <div className="mt-3 text-sm font-extrabold text-blue-700">{f.title}</div>
                <div className="mt-1 text-xs text-gray-500">{f.body}</div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_50px_-34px_rgba(0,0,0,0.55)]">
              <div className="grid md:grid-cols-2">
                {/* Left */}
                <div className="p-7">
                  <div className="text-xl font-extrabold leading-snug text-blue-700">
                    Use only what you
                    <br />
                    need.
                    <br />
                    Pay only for what you
                    <br />
                    use.
                  </div>

                  <div className="mt-4 text-xs leading-relaxed text-gray-600">
                    No bloated plans. No unused features. Just the perfect fit for your business.
                  </div>

                  <ul className="mt-5 space-y-2 text-xs text-gray-600">
                    {[
                      "Start free, upgrade anytime",
                      "Only pay for active modules",
                      "No hidden fees or contracts",
                      "Cancel or modify anytime",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2">
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-700 text-white">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-700" />
                      HIPAA Compliant
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-700" />
                      SOC 2 Certified
                    </span>
                  </div>
                </div>

                {/* Right */}
                <div className="border-t border-gray-200 bg-gray-50/20 p-7 md:border-l md:border-t-0">
                  <div className="text-3xl font-extrabold text-gray-900">$0</div>
                  <div className="-mt-1 text-xs text-gray-500">/month</div>
                  <div className="mt-1 text-[11px] text-gray-500">Start free, then from $29/month per module</div>

                  <button
                    type="button"
                    className="mt-5 flex h-10 w-full items-center justify-center rounded-xl bg-yellow-400 px-4 text-xs font-extrabold text-gray-900 transition hover:bg-yellow-300"
                  >
                    Start Free <span className="ml-2">→</span>
                  </button>

                  <button
                    type="button"
                    className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-blue-700 bg-white px-4 text-xs font-extrabold text-blue-700 transition hover:bg-blue-50"
                  >
                    Talk to Sales
                  </button>

                  <div className="mt-6 h-px w-full bg-gray-200" />
                  <div className="mt-4 text-center text-[10px] text-gray-500">
                    No credit card required • 14-day free trial
                    <br />
                    Full access to all features
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Merge FAQ at the bottom of "Why Businesses Choose ZEVA" */}
      <FaqSection />
    </>
  );
}


