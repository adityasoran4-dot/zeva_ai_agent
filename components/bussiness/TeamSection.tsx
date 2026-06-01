import type { ReactElement } from "react";
import Link from "next/link";

function UsersIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function BriefcaseIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6V5a2 2 0 012-2h0a2 2 0 012 2v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12v2a1 1 0 001 1h4a1 1 0 001-1v-2" />
    </svg>
  );
}

function DollarIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 5.5c0-1.93-2.24-3.5-5-3.5S7 3.57 7 5.5 9.24 9 12 9s5 1.57 5 3.5S14.76 16 12 16s-5-1.57-5-3.5"
      />
    </svg>
  );
}

function CalendarIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 11h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
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

function ArrowRightIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 6l6 6-6 6" />
    </svg>
  );
}

type TeamCardProps = {
  icon: ReactElement;
  title: string;
  subtitle: string;
  items: string[];
  delayMs?: number;
  link?: string;
};

function TeamCard({ icon, title, subtitle, items, delayMs = 0, link = "/bussiness" }: TeamCardProps): ReactElement {
  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className={[
        "zeva-team-card w-full max-w-[380px] rounded-2xl border border-gray-200 bg-white",
        "shadow-[0_14px_40px_-26px_rgba(0,0,0,0.35)]",
        "transition-transform transition-shadow duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_20px_52px_-32px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-blue-700">
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
              <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
              <span>{it}</span>
            </li>
          ))}
        </ul>

        <Link
          href={link}
          className={[
            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors",
            "border-blue-700 bg-white text-blue-700 hover:bg-blue-700 hover:text-white",
          ].join(" ")}
        >
          Learn More <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function TeamSection(): ReactElement {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-2 sm:pb-14">
        <div className="text-center">
          <div className="mt-3 flex items-center justify-center gap-6 text-2xl font-extrabold text-blue-700 sm:text-3xl">
            <span className="h-[3px] w-12 rounded-full bg-blue-700" />
            <span>Team &amp; Workforce</span>
            <span className="h-[3px] w-12 rounded-full bg-blue-700" />
          </div>

          <div className="mt-2 text-sm text-gray-500 sm:text-base">
            Build and manage your perfect team
          </div>
        </div>

        <div className="mt-10 grid justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
          <TeamCard
            delayMs={0}
            icon={<UsersIcon className="h-6 w-6" />}
            title="HR & Staff"
            subtitle="Manage your team efficiently"
            items={["Employee profiles", "Time tracking", "Performance reviews", "Document management"]}
            link="/"
          />

          <TeamCard
            delayMs={80}
            icon={<BriefcaseIcon className="h-6 w-6" />}
            title="Jobs & Hiring"
            subtitle="Find the right talent"
            items={["Job postings", "Applicant tracking", "Interview scheduling", "Offer management"]}
            link="/bussiness/job-dashboard"
          />

          <TeamCard
            delayMs={160}
            icon={<DollarIcon className="h-6 w-6" />}
            title="Commission Module"
            subtitle="Automate staff incentives"
            items={["Custom rules", "Auto calculations", "Performance tracking", "Payout automation"]}
            link="/"
          />

          <TeamCard
            delayMs={240}
            icon={<CalendarIcon className="h-6 w-6" />}
            title="Shifts & Scheduling"
            subtitle="Plan shifts without chaos"
            items={["Shift templates", "Availability rules", "Swap requests", "Overtime alerts"]}
            link="/"
          />

          <TeamCard
            delayMs={320}
            icon={<ShieldIcon className="h-6 w-6" />}
            title="Roles & Permissions"
            subtitle="Access control for every role"
            items={["Role-based access", "Audit logs", "Approvals", "HIPAA-ready settings"]}
            link="/"
          />

          <TeamCard
            delayMs={400}
            icon={<UsersIcon className="h-6 w-6" />}
            title="Training & SOPs"
            subtitle="Onboard faster, stay consistent"
            items={["SOP library", "Checklists", "Quizzes & tracking", "Team announcements"]}
            link="/"
          />
        </div>
      </div>

      <style jsx>{`
        .zeva-team-card {
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
          .zeva-team-card {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}


