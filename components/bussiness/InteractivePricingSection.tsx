import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";



type CategoryKey = "operations" | "growth" | "team" | "finance" | "healthcare" | "marketing";

type ModuleItem = {
  id: string;
  category: CategoryKey;
  title: string;
  subtitle: string;
  price: number;
  popular?: boolean;
};

type Toast = {
  id: string;
  message: string;
  variant: "success" | "info";
};

const STORAGE_KEY = "zeva:bussiness:selectedModules:v1";

const CATEGORIES: Record<CategoryKey, { title: string; accent: string }> = {
  operations: { title: "Operations", accent: "text-blue-700" },
  growth: { title: "Growth", accent: "text-blue-700" },
  team: { title: "Team", accent: "text-blue-700" },
  finance: { title: "Finance", accent: "text-blue-700" },
  healthcare: { title: "Healthcare", accent: "text-blue-700" },
  marketing: { title: "Marketing", accent: "text-blue-700" },
};

const MODULES: ModuleItem[] = [
  // Operations
  { id: "book-appointments", category: "operations", title: "Book Appointments", subtitle: "Smart scheduling & reminders", price: 29, popular: true },
  { id: "lead-management", category: "operations", title: "Lead Management", subtitle: "Track & convert leads", price: 39, popular: true },

  // Growth
  { id: "marketplace", category: "growth", title: "Marketplace Listings", subtitle: "Buy/Sell/Franchise/Invest", price: 49, popular: true },
  { id: "referrals", category: "growth", title: "Referral Program", subtitle: "Partner growth", price: 29 },

  // Team
  { id: "hr-staff", category: "team", title: "HR & Staff Management", subtitle: "Team management tools", price: 49, popular: true },
  { id: "jobs-hiring", category: "team", title: "Jobs & Hiring", subtitle: "Find the right talent", price: 39 },
  { id: "commission", category: "team", title: "Commission Module", subtitle: "Automate incentives", price: 29, popular: true },

  // Finance
  { id: "billing-invoices", category: "finance", title: "Billing & Invoices", subtitle: "Professional invoicing", price: 39 },
  { id: "vat-tax", category: "finance", title: "VAT & Tax Filing", subtitle: "Stay compliant", price: 49, popular: true },
  { id: "reports-analytics", category: "finance", title: "Reports & Analytics", subtitle: "Real-time insights", price: 59, popular: true },
  { id: "clinic-financing", category: "finance", title: "Clinic Financing", subtitle: "Business funding", price: 99 },

  // Healthcare
  { id: "patient-records", category: "healthcare", title: "Patient Records", subtitle: "Secure digital records", price: 69, popular: true },
  { id: "insurance", category: "healthcare", title: "Insurance Integration", subtitle: "Streamline claims", price: 79 },
  { id: "telemedicine", category: "healthcare", title: "Telemedicine", subtitle: "Virtual consultations", price: 89 },
  { id: "inventory", category: "healthcare", title: "Inventory Management", subtitle: "Track supplies", price: 49 },

  // Marketing
  { id: "social-media", category: "marketing", title: "Social Media Tools", subtitle: "Grow online presence", price: 59, popular: true },
  { id: "seo-local", category: "marketing", title: "SEO & Local Listings", subtitle: "Get found locally", price: 49 },
  { id: "reputation", category: "marketing", title: "Reviews & Reputation", subtitle: "Build trust", price: 39 },
];

function PlusCircleIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
    </svg>
  );
}

function MinusCircleIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
    </svg>
  );
}

function SparklesIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11l.9 2.7L23 15l-3.1 1.3L19 19l-.9-2.7L15 15l3.1-1.3L19 11z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.5l.8 2.4L8 16l-2.7 1.1-.8 2.4-.8-2.4L1 16l2.7-1.1.8-2.4z" />
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

function formatUsd(amount: number): string {
  return `$${amount}`;
}

export default function InteractivePricingSection(): ReactElement {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const safe = parsed.filter((x) => typeof x === "string") as string[];
      setSelectedIds(safe);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // ignore
    }
  }, [selectedIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const byCategory = useMemo(() => {
    const map: Record<CategoryKey, ModuleItem[]> = {
      operations: [],
      growth: [],
      team: [],
      finance: [],
      healthcare: [],
      marketing: [],
    };
    for (const m of MODULES) map[m.category].push(m);
    return map;
  }, []);

  const selectedModules = useMemo(() => {
    return selectedIds
      .map((id) => MODULES.find((m) => m.id === id))
      .filter(Boolean) as ModuleItem[];
  }, [selectedIds]);

  const total = useMemo(() => {
    let sum = 0;
    for (const id of selectedIds) {
      const mod = MODULES.find((m) => m.id === id);
      if (mod) sum += mod.price;
    }
    return sum;
  }, [selectedIds]);

  const pushToast = (message: string, variant: Toast["variant"] = "info") => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const toast: Toast = { id, message, variant };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  const toggle = (id: string) => {
    const mod = MODULES.find((m) => m.id === id);
    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter((x) => x !== id) : [...prev, id];
      if (mod) {
        pushToast(
          isSelected
            ? `Removed: ${mod.title} (${formatUsd(mod.price)}/mo)`
            : `Added: ${mod.title} (${formatUsd(mod.price)}/mo)`,
          isSelected ? "info" : "success"
        );
      }
      return next;
    });
  };

  const quickSelectPopular = () => {
    const popular = MODULES.filter((m) => m.popular).slice(0, 7).map((m) => m.id);
    setSelectedIds(popular);
    pushToast("Popular Package selected (5–7 modules)", "success");
  };

  const clearSelection = () => {
    setSelectedIds([]);
    pushToast("Selection cleared", "info");
  };

  const selectedCount = selectedIds.length;
  const isReady = selectedCount > 0;
  const isInPopularRange = selectedCount >= 5 && selectedCount <= 7;

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-gray-900 shadow-sm">
              <SparklesIcon className="h-4 w-4 text-yellow-500" />
              INTERACTIVE PRICING
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-blue-700 sm:text-4xl">
              Build Your Perfect Plan
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
              Select the modules you need and watch your price update in real-time
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            {/* Left: categories */}
            <div className="space-y-6">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
                <div
                  key={key}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_12px_34px_-26px_rgba(0,0,0,0.35)] transition-shadow hover:shadow-[0_18px_46px_-30px_rgba(0,0,0,0.45)]"
                >
                  <div className={["text-sm font-extrabold", CATEGORIES[key].accent].join(" ")}>
                    {CATEGORIES[key].title}
                  </div>

                  <div className="mt-4 space-y-3">
                    {byCategory[key].map((m) => {
                      const isSelected = selectedSet.has(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggle(m.id)}
                          className={[
                            "group w-full rounded-xl border px-4 py-3 text-left transition-colors",
                            isSelected ? "border-emerald-700 bg-emerald-50/40" : "border-gray-200 bg-white hover:bg-gray-50",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={[
                                  "grid h-7 w-7 place-items-center rounded-full border",
                                  isSelected ? "border-emerald-700 text-emerald-700" : "border-gray-200 text-gray-500",
                                ].join(" ")}
                              >
                                {isSelected ? <MinusCircleIcon className="h-4 w-4" /> : <PlusCircleIcon className="h-4 w-4" />}
                              </span>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-extrabold text-gray-900">{m.title}</div>
                                  {m.popular ? (
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                      Popular
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-xs text-gray-500">{m.subtitle}</div>
                              </div>
                            </div>

                            <div className="text-sm font-extrabold text-blue-700">{formatUsd(m.price)}/mo</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: total */}
            <div className="space-y-6 lg:sticky lg:top-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_46px_-30px_rgba(0,0,0,0.45)]">
                <div className="text-center">
                  <div className="text-[11px] font-extrabold tracking-wide text-gray-500">YOUR MONTHLY TOTAL</div>
                  <div className="mt-3 flex items-end justify-center gap-2">
                    <div className="text-5xl font-extrabold text-blue-700">{formatUsd(total)}</div>
                    <div className="pb-2 text-sm font-semibold text-gray-500">/month</div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {selectedCount} modules selected
                    {isInPopularRange ? <span className="ml-2 font-bold text-emerald-700">(Popular range)</span> : null}
                  </div>
                </div>

                <div className="mt-5 h-px w-full bg-gray-200" />

                {selectedCount > 0 ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-extrabold tracking-wide text-gray-500">SELECTED MODULES</div>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-[11px] font-extrabold text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedModules.slice(0, 8).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggle(m.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50"
                          title="Click to remove"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                          {m.title}
                        </button>
                      ))}
                      {selectedModules.length > 8 ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600">
                          +{selectedModules.length - 8} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <ul className="mt-5 space-y-2 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                    14-day free trial
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                    No credit card required
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                    Cancel anytime
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                    Add/remove modules anytime
                  </li>
                </ul>

                <button
                  type="button"
                  disabled={!isReady}
                  className={[
                    "mt-6 flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-extrabold transition",
                    isReady ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300" : "bg-gray-200 text-gray-500",
                  ].join(" ")}
                >
                  {isReady ? (
                    <>
                      Start Free Trial <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Select Modules"
                  )}
                </button>

                <button
                  type="button"
                  className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-blue-700 bg-white px-4 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50"
                >
                  Talk to Sales
                </button>
              </div>

              <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-[0_18px_46px_-30px_rgba(0,0,0,0.45)]">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <SparklesIcon className="h-4 w-4" />
                  Popular Package
                </div>
                <div className="mt-2 text-xs text-emerald-50/90">Most clinics choose 5–7 modules</div>

                <button
                  type="button"
                  onClick={quickSelectPopular}
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-50"
                >
                  Quick Select Popular
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Merge "How ZEVA Works" + "Why Switch to ZEVA?" at the bottom */}


      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[320px] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto zeva-toast rounded-2xl border bg-white px-4 py-3 shadow-[0_18px_46px_-30px_rgba(0,0,0,0.45)]",
              t.variant === "success" ? "border-emerald-200" : "border-gray-200",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <span
                className={[
                  "mt-0.5 grid h-8 w-8 place-items-center rounded-full",
                  t.variant === "success" ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-600",
                ].join(" ")}
              >
                {t.variant === "success" ? <CheckMark className="h-4 w-4" /> : <InfoDot className="h-4 w-4" />}
              </span>
              <div>
                <div className="text-sm font-extrabold text-gray-900">{t.message}</div>
                <div className="mt-0.5 text-xs text-gray-500">Total: {formatUsd(total)}/mo</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .zeva-toast {
          animation: zevaToastIn 220ms ease-out both;
        }

        @keyframes zevaToastIn {
          from {
            opacity: 0;
            transform: translate3d(0, 10px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </>
  );
}

function CheckMark(props: { className?: string }) {
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

function InfoDot(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7h.01" />
    </svg>
  );
}


