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

function XIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
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

type CompareRow = {
  label: string;
  multipleTools: boolean;
  zeva: boolean;
  noteMultiple?: string;
  noteZeva?: string;
};

const MULTI_TOOL_ROWS: CompareRow[] = [
  { label: "Unified Dashboard", multipleTools: false, zeva: true },
  { label: "Data Integration", multipleTools: false, zeva: true },
  { label: "Single Login", multipleTools: false, zeva: true },
  { label: "Real-time Sync", multipleTools: false, zeva: true },
  { label: "One Support Team", multipleTools: false, zeva: true },
  { label: "Learning Curve", multipleTools: false, zeva: true, noteMultiple: "High", noteZeva: "Low" },
  { label: "Staff Training", multipleTools: false, zeva: true, noteMultiple: "Extensive", noteZeva: "Minimal" },
];

type ToolCompareRow = {
  tool: string;
  toolPrice: string;
  toolNote: string;
  zevaPrice: string;
  zevaNote: string;
};

const INDIVIDUAL_ROWS: ToolCompareRow[] = [
  {
    tool: "Calendly / Acuity",
    toolPrice: "$45–70/mo",
    toolNote: "Only scheduling, no patient records or billing",
    zevaPrice: "$29/mo",
    zevaNote: "Appointments + Records + Billing + Analytics integrated",
  },
  {
    tool: "QuickBooks",
    toolPrice: "$50–90/mo",
    toolNote: "Generic accounting, not healthcare-focused",
    zevaPrice: "$39/mo",
    zevaNote: "Healthcare-specific billing, insurance integration, VAT filing",
  },
  {
    tool: "BambooHR",
    toolPrice: "$150+/mo",
    toolNote: "HR only, no commission tracking",
    zevaPrice: "$49/mo",
    zevaNote: "HR + Hiring + Commission automation + Performance tracking",
  },
  {
    tool: "Hootsuite",
    toolPrice: "$99+/mo",
    toolNote: "Social media only, generic templates",
    zevaPrice: "$59/mo",
    zevaNote: "Healthcare-compliant content + Social + Patient engagement",
  },
  {
    tool: "Teladoc / Doxy.me",
    toolPrice: "$75–150/mo",
    toolNote: "Telemedicine only, separate from records",
    zevaPrice: "$89/mo",
    zevaNote: "Telemedicine + integrated patient records + Billing + Notes",
  },
];

function Badge({ children }: { children: string }): ReactElement {
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-400 px-2.5 py-1 text-[10px] font-extrabold text-gray-900">
      {children}
    </span>
  );
}

export default function ZevaComparisonSection(): ReactElement {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        {/* ZEVA vs multiple tools */}
        <div className="text-center">
          <div className="text-2xl font-extrabold text-blue-700">ZEVA vs Multiple Tools</div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-4 md:flex-row">
          {/* Multiple tools card */}
          <div className="w-full max-w-[320px] rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_14px_40px_-28px_rgba(0,0,0,0.35)]">
            <div className="text-center">
              <div className="text-sm font-extrabold text-gray-900">Multiple Tools</div>
              <div className="mt-1 text-[11px] text-gray-500">Using 5–7 separate software</div>
              <div className="mt-4 text-2xl font-extrabold text-gray-900">$450+</div>
              <div className="text-xs text-gray-500">per month</div>
              <div className="mt-1 text-[11px] text-gray-500">Setup: 2+ weeks</div>
            </div>

            <div className="mt-5 space-y-2 text-[11px] text-gray-600">
              {MULTI_TOOL_ROWS.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3">
                  <div className="truncate">{r.label}</div>
                  <div className="flex items-center gap-2">
                    {r.multipleTools ? (
                      <CheckIcon className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <XIcon className="h-4 w-4 text-red-500" />
                    )}
                    {r.noteMultiple ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        {r.noteMultiple}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ZEVA card */}
          <div className="w-full max-w-[320px] rounded-2xl bg-emerald-700 p-5 text-white shadow-[0_18px_50px_-34px_rgba(0,0,0,0.55)]">
            <div className="flex justify-center">
              <Badge>RECOMMENDED</Badge>
            </div>
            <div className="mt-3 text-center">
              <div className="text-sm font-extrabold">ZEVA</div>
              <div className="mt-1 text-[11px] text-emerald-50/90">All-in-one intelligent system</div>
              <div className="mt-4 text-2xl font-extrabold">$150–300</div>
              <div className="text-xs text-emerald-50/90">per month</div>
              <div className="mt-1 text-[11px] text-emerald-50/90">Setup: 5 minutes</div>
            </div>

            <div className="mt-5 space-y-2 text-[11px] text-emerald-50/90">
              {MULTI_TOOL_ROWS.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3">
                  <div className="truncate">{r.label}</div>
                  <div className="flex items-center gap-2">
                    {r.zeva ? <CheckIcon className="h-4 w-4 text-white" /> : <XIcon className="h-4 w-4 text-white" />}
                    {r.noteZeva ? (
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">
                        {r.noteZeva}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ZEVA vs individual tools */}
        <div className="mt-14 text-center">
          <div className="text-2xl font-extrabold text-blue-700">ZEVA vs Individual Tools</div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-[720px] space-y-3">
          {INDIVIDUAL_ROWS.map((r) => (
            <div key={r.tool} className="grid gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_12px_34px_-28px_rgba(0,0,0,0.35)] sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-extrabold text-gray-900">{r.tool}</div>
                  <div className="text-[11px] font-bold text-gray-500">{r.toolPrice}</div>
                </div>
                <div className="mt-2 flex items-start gap-2 text-[11px] text-gray-600">
                  <XIcon className="mt-0.5 h-4 w-4 text-red-500" />
                  <span>{r.toolNote}</span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-extrabold text-emerald-900">ZEVA Module</div>
                  <div className="text-[11px] font-extrabold text-emerald-900">
                    <span className="mr-2 text-[10px] font-bold text-emerald-700 line-through">{r.toolPrice}</span>
                    {r.zevaPrice}
                  </div>
                </div>
                <div className="mt-2 flex items-start gap-2 text-[11px] text-emerald-800">
                  <CheckIcon className="mt-0.5 h-4 w-4 text-emerald-700" />
                  <span>{r.zevaNote}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Savings card */}
        <div className="mt-10 flex justify-center">
          <div className="w-full max-w-[420px] rounded-2xl bg-yellow-400 p-6 text-center shadow-[0_18px_50px_-34px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-center gap-2 text-2xl font-extrabold text-gray-900">
              <BoltIcon className="h-6 w-6" />
              $3,600+
            </div>
            <div className="mt-1 text-xs font-extrabold text-gray-900">Average Annual Savings</div>
            <div className="mt-2 text-[11px] text-gray-800/80">
              Switch to ZEVA and save thousands while getting more functionality
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


