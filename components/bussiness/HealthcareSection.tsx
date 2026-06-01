import type { ReactElement } from "react";

function FolderIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function HeartIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      />
    </svg>
  );
}

function VideoIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.5-2.5a1 1 0 011.5.87v7.26a1 1 0 01-1.5.87L15 14" />
      <rect x="3" y="7" width="12" height="10" rx="2" ry="2" />
    </svg>
  );
}

function CubeIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4a2 2 0 001-1.73z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7.3L12 12l8.7-4.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
    </svg>
  );
}

function LabIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 2v6l-5.5 9.5A4 4 0 008 22h8a4 4 0 003.5-4.5L14 8V2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8" />
    </svg>
  );
}

function RxIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h6a4 4 0 010 8H6V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 11l8 10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11h4l-4 10" />
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

type HealthcareCardProps = {
  icon: ReactElement;
  title: string;
  subtitle: string;
  // price: string;
  items: string[];
  delayMs?: number;
};

function HealthcareCard({ icon, title, subtitle, items, delayMs = 0 }: HealthcareCardProps): ReactElement {
  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className={[
        "zeva-health-card w-full max-w-[380px] rounded-2xl border border-gray-200 bg-white",
        "shadow-[0_14px_40px_-26px_rgba(0,0,0,0.35)]",
        "transition-transform transition-shadow duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_20px_52px_-32px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-100 text-red-600">
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
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>{it}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={[
            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors",
            "border-red-500 bg-red-500 text-gray-900 hover:bg-red-600 hover:text-white",
          ].join(" ")}
        >
      Coming Soon 
        </button>
      </div>
    </div>
  );
}

export default function HealthcareSection(): ReactElement {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-2 sm:pb-14">
        <div className="text-center">
          <div className="mt-3 flex items-center justify-center gap-6 text-2xl font-extrabold text-blue-700 sm:text-3xl">
            <span className="h-[3px] w-12 rounded-full bg-red-500" />
            <span>Healthcare &amp; Clinic Systems</span>
            <span className="h-[3px] w-12 rounded-full bg-red-500" />
          </div>

          <div className="mt-2 text-sm text-gray-500 sm:text-base">
            Complete patient care and clinic management
          </div>
        </div>

        <div className="mt-10 grid justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
          <HealthcareCard
            delayMs={0}
            icon={<FolderIcon className="h-6 w-6" />}
            title="Patient Records"
            subtitle="Secure digital records"
            // price="$69"
            items={["HIPAA compliant", "Encrypted storage", "Quick search", "History tracking"]}
          />

          <HealthcareCard
            delayMs={80}
            icon={<HeartIcon className="h-6 w-6" />}
            title="Insurance Integration"
            subtitle="Streamline claims"
            // price="$79"
            items={["Auto claims", "Eligibility checks", "EOB tracking", "Denial management"]}
          />

          <HealthcareCard
            delayMs={160}
            icon={<VideoIcon className="h-6 w-6" />}
            title="Telemedicine"
            subtitle="Virtual consultations"
            // price="$89"
            items={["HD video calls", "Screen sharing", "Recording", "Prescription integration"]}
          />

          <HealthcareCard
            delayMs={240}
            icon={<CubeIcon className="h-6 w-6" />}
            title="Inventory"
            subtitle="Track supplies & equipment"
            // price="$49"
            items={["Low-stock alerts", "Batch tracking", "Vendor ordering", "Usage reports"]}
          />

          <HealthcareCard
            delayMs={320}
            icon={<LabIcon className="h-6 w-6" />}
            title="Lab Integrations"
            subtitle="Orders & results in one place"
            // price="$—"
            items={["Lab orders", "Result imports", "Abnormal flags", "Patient notifications"]}
          />

          <HealthcareCard
            delayMs={400}
            icon={<RxIcon className="h-6 w-6" />}
            title="e-Prescriptions"
            subtitle="Prescribe faster, safer"
            // price="$—"
            items={["Drug interaction checks", "Refill requests", "Pharmacy routing", "Audit logs"]}
          />
        </div>
      </div>

      <style jsx>{`
        .zeva-health-card {
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
          .zeva-health-card {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}


