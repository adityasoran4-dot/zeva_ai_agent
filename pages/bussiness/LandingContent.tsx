import Head from "next/head";
import Link from "next/link";
import type { ReactElement } from "react";

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

function ArrowRightIcon(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 6l6 6-6 6" />
    </svg>
  );
}

function PlayIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8.5 6.7a1 1 0 011.5-.86l9 5.3a1 1 0 010 1.72l-9 5.3A1 1 0 018.5 17V6.7z" />
    </svg>
  );
}

type Props = {
  includeHead?: boolean;
  embedded?: boolean;
};

export default function LandingContent({ includeHead = true, embedded = false }: Props): ReactElement {
  const title = "ZEVA | Business";

  const containerClassName = [
    "relative overflow-hidden bg-white",
    embedded ? "" : "min-h-screen",
  ].join(" ");

  const mainClassName = embedded
    ? "relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-10 pt-10 sm:pt-12"
    : "relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 sm:pt-20";

  return (
    <>
      {includeHead ? (
        <Head>
          <title>{title}</title>
          <meta
            name="description"
            content="One platform to run, scale & monetize your business — built for healthcare teams."
          />
        </Head>
      ) : null}

      <div className={containerClassName}>
        {/* Soft background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute -right-48 -top-24 h-[520px] w-[520px] rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute left-1/3 top-1/2 h-[520px] w-[520px] rounded-full bg-indigo-50/70 blur-3xl" />

          {/* Floating dots */}
          <div className="absolute left-[18%] top-[38%] h-2.5 w-2.5 rounded-full bg-emerald-200/70" />
          <div className="absolute left-[48%] top-[46%] h-2 w-2 rounded-full bg-emerald-200/70" />
          <div className="absolute left-[70%] top-[52%] h-2.5 w-2.5 rounded-full bg-emerald-200/70" />
          <div className="absolute left-[82%] top-[40%] h-2 w-2 rounded-full bg-emerald-200/70" />
        </div>

        <main className={mainClassName}>
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-gray-800 sm:text-sm">
              Now serving 500+ healthcare businesses
            </span>
            <ArrowRightIcon className="h-4 w-4 text-gray-500" />
          </div>

          {/* Heading */}
          <h1 className="mt-7 max-w-4xl text-center text-3xl font-extrabold leading-tight tracking-tight text-blue-700 sm:mt-8 sm:text-5xl">
            One Platform to Run Scale &amp; Run
            <br className="hidden sm:block" />
            Monetize Your Business
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-3xl text-center text-sm leading-relaxed text-gray-700 sm:mt-6 sm:text-base">
            Appointments, staff, finance, compliance, healthcare, and growth tools — all in one intelligent
            system.
          </p>

          {/* Feature chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:mt-10 sm:gap-3">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm sm:gap-2.5 sm:px-4 sm:py-2.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-700 sm:h-7 sm:w-7">
                <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="text-xs font-semibold text-gray-800 sm:text-sm">
                Complete business automation
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm sm:gap-2.5 sm:px-4 sm:py-2.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-700 sm:h-7 sm:w-7">
                <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="text-xs font-semibold text-gray-800 sm:text-sm">HIPAA compliant &amp; secure</span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm sm:gap-2.5 sm:px-4 sm:py-2.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-700 sm:h-7 sm:w-7">
                <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="text-xs font-semibold text-gray-800 sm:text-sm">Pay only for what you use</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:mt-12 sm:gap-4">
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event("zeva:open-demo-popup"));
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 text-sm font-bold leading-none text-gray-900 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.55)] transition hover:bg-yellow-300 sm:h-11 sm:gap-2.5 sm:px-6 sm:text-base"
            >
              Get a Demo
              <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>

            <Link
              href="#watch"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-blue-700 bg-white px-4 text-sm font-bold leading-none text-blue-700 transition hover:bg-blue-50 sm:h-11 sm:gap-2.5 sm:px-6 sm:text-base"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-blue-700 sm:h-7 sm:w-7">
                <PlayIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </span>
              Watch Demo
            </Link>
          </div>

          {/* Invisible anchors for CTA targets */}
          <div id="demo" className="h-0 w-0" aria-hidden="true" />
          <div id="watch" className="h-0 w-0" aria-hidden="true" />

          {/* Dashboard preview section */}
          <section className="mt-12 w-full sm:mt-14">
            <div className="mx-auto w-full max-w-4xl">
              <div className="rounded-[24px] border border-gray-200/70 bg-white shadow-[0_22px_50px_-30px_rgba(0,0,0,0.26)]">
                <div className="p-5 sm:p-8">
                  {/* Header row */}
                <div className="w-full max-w-none overflow-visible">

  {/* Header */}
 {/* <div className="w-screen max-w-none mx-0 px-0 overflow-x-hidden"> */}

  {/* Header */}
  <div className="flex items-start justify-between px-4 md:px-6">
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-700 text-white">
        <span className="text-base font-extrabold">Z</span>
      </div>
      <div>
        <div className="text-base font-extrabold text-gray-900">
          Your Dashboard
        </div>
        <div className="text-xs text-gray-500 sm:text-sm">
          Welcome back, Admin
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-full bg-gray-100" />
      <div className="h-7 w-7 rounded-full bg-gray-100" />
      <div className="h-7 w-7 rounded-full bg-emerald-100" />
    </div>
  </div>

  <div className="mt-2 h-px w-full bg-gray-200/70" />

  {/* Images Section */}
  <div className="relative mt-4 flex w-full flex-col md:flex-row items-center md:items-start">
    <img 
      src="/admin.png"
      alt="admin"
      className="w-full h-full object-cover rounded-none md:rounded-xl shadow-md"
    />

   

  </div>
</div>


                  {/* Top stats */}
                  {/* <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 00-3-3.87" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-emerald-800">500+</div>
                          <div className="mt-1 text-xs font-semibold text-gray-500">Active Businesses</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 7-7" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 7h6v6" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-indigo-700">42%</div>
                          <div className="mt-1 text-xs font-semibold text-gray-500">Avg Revenue Growth</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-amber-500">10hrs</div>
                          <div className="mt-1 text-xs font-semibold text-gray-500">Saved Weekly</div>
                        </div>
                      </div>
                    </div>
                  </div> */}

                  {/* Secondary chips */}
                  {/* <div className="mt-5 grid gap-2.5 sm:grid-cols-4">
                    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 11h14M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
                        </svg>
                      </span>
                      <span className="text-xs font-semibold text-gray-800">Smart Scheduling</span>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.66 0 3-1.34 3-3S13.66 5 12 5 9 6.34 9 8s1.34 3 3 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11v-1a7 7 0 10-14 0v1" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 11v6a6 6 0 0012 0v-6" />
                        </svg>
                      </span>
                      <span className="text-xs font-semibold text-gray-800">HIPAA Compliant</span>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 19V9" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V3" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-7" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 19V11" />
                        </svg>
                      </span>
                      <span className="text-xs font-semibold text-gray-800">Real-time Analytics</span>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M23 20v-2a4 4 0 00-3-3.87" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
                        </svg>
                      </span>
                      <span className="text-xs font-semibold text-gray-800">Team Management</span>
                    </div>
                  </div> */}

                  {/* Revenue overview */}
                  {/* <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-gray-900">Revenue Overview</div>
                      <div className="text-base font-extrabold text-emerald-800">+42%</div>
                    </div>

                    <div className="mt-6 grid grid-cols-8 items-end gap-2">
                      <div className="h-12 rounded-lg bg-gray-200/70" />
                      <div className="h-20 rounded-lg bg-gray-200/70" />
                      <div className="h-14 rounded-lg bg-gray-200/70" />
                      <div className="h-24 rounded-lg bg-gray-200/70" />
                      <div className="h-16 rounded-lg bg-gray-200/70" />
                      <div className="h-24 rounded-lg bg-gray-200/70" />
                      <div className="h-[72px] rounded-lg bg-gray-200/70" />
                      <div className="h-20 rounded-lg bg-emerald-700" />
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Trust bar */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-7 text-xs font-semibold text-gray-800 sm:gap-9">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-700" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-5" />
                  </svg>
                  <span>HIPAA Compliant</span>
                </div>

                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-700" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.66 0 3-1.34 3-3S13.66 5 12 5 9 6.34 9 8s1.34 3 3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11v-1a7 7 0 10-14 0v1" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 11v6a6 6 0 0012 0v-6" />
                  </svg>
                  <span>SOC 2 Certified</span>
                </div>

                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-700" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>5-Minute Setup</span>
                </div>
              </div>
            </div>
          </section>

          {/* Built for section */}
          <section className="mt-12 w-full border-y border-gray-200/70 bg-white/60 py-10 sm:mt-16 sm:py-12">
            <div className="mx-auto w-full max-w-4xl px-4">
              <div className="text-center">
                <div className="text-[11px] font-extrabold tracking-[0.22em] text-gray-600 sm:text-xs">
                  BUILT FOR MODERN CLINICS AND SERVICE BUSINESSES
                </div>
              </div>

              <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
                <div className="flex items-center justify-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-8-4.5-8-11a5 5 0 019-3 5 5 0 019 3c0 6.5-8 11-8 11z" />
                    </svg>
                  </div>
                  <div className="text-base font-medium text-gray-900 sm:text-lg">Healthcare Clinics</div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M23 20v-2a4 4 0 00-3-3.87" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <div className="text-base font-medium text-gray-900 sm:text-lg">Service Businesses</div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V11h6v10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h.01M12 9h.01M16 9h.01" />
                    </svg>
                  </div>
                  <div className="text-base font-medium text-gray-900 sm:text-lg">Multi-Location Practices</div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}


