import type { ReactElement } from "react";

import InteractivePricingSection from "./InteractivePricingSection";

function SparkIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11l.9 2.7L23 15l-3.1 1.3L19 19l-.9-2.7L15 15l3.1-1.3L19 11z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.5l.8 2.4L8 16l-2.7 1.1-.8 2.4-.8-2.4L1 16l2.7-1.1.8-2.4z" />
    </svg>
  );
}

export default function CustomSolutionsSection(): ReactElement {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:pt-10">
          <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white px-6 py-10 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.55)] sm:px-9 sm:py-12">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold tracking-wide text-emerald-800">
                <SparkIcon className="h-4 w-4 text-emerald-700" />
                CUSTOM SOLUTIONS
              </div>

              <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-blue-700 sm:text-3xl">
                Need a Custom Module?
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
                We build tailored solutions for your specific business needs
              </p>

              <button
                type="button"
                className="mt-8 inline-flex h-11 items-center justify-center rounded-2xl bg-yellow-400 px-8 text-sm font-extrabold text-gray-900 shadow-[0_14px_34px_-22px_rgba(0,0,0,0.55)] transition hover:bg-yellow-300"
              >
                Talk to Our Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Merge Interactive Pricing at the bottom of Custom Solutions */}
      <InteractivePricingSection />
    </>
  );
}


