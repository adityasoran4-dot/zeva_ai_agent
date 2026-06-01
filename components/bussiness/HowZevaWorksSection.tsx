import type { ReactElement } from "react";

import ZevaComparisonSection from "./ZevaComparisonSection";
import WhyChooseZevaSection from "./WhyChooseZevaSection";

function UserPlusIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 8v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 11h-6" />
    </svg>
  );
}

function CogIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a7.97 7.97 0 00.1-6l2-1.2-2-3.4-2.3 1a8.2 8.2 0 00-5.2-3L11.6 1h-3.2L8 3.2a8.2 8.2 0 00-5.2 3l-2.3-1-2 3.4L.5 9a7.97 7.97 0 00.1 6l-2 1.2 2 3.4 2.3-1a8.2 8.2 0 005.2 3l.4 2.2h3.2l.4-2.2a8.2 8.2 0 005.2-3l2.3 1 2-3.4-2-1.2z"
      />
    </svg>
  );
}

function GridIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3H4v6h6V3zM20 3h-6v6h6V3zM10 15H4v6h6v-6zM20 15h-6v6h6v-6z" />
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

function ClockIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v6l4 2" />
    </svg>
  );
}

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

function TrendingUpIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 7-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 7h6v6" />
    </svg>
  );
}

function StepCard({
  step,
  icon,
  title,
  subtitle,
}: {
  step: number;
  icon: ReactElement;
  title: string;
  subtitle: string;
}): ReactElement {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-700 text-white shadow-[0_16px_36px_-26px_rgba(0,0,0,0.55)]">
          {icon}
        </div>
        <div className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-blue-700 text-xs font-extrabold text-white">
          {step}
        </div>
      </div>
      <div className="mt-4 text-sm font-extrabold text-gray-900">{title}</div>
      <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  body,
  pill,
}: {
  icon: ReactElement;
  title: string;
  body: string;
  pill: string;
}): ReactElement {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_12px_34px_-28px_rgba(0,0,0,0.35)]">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <div className="mt-3 text-sm font-extrabold text-blue-700">{title}</div>
      <div className="mt-2 text-xs leading-relaxed text-gray-600">{body}</div>
      <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
        {pill}
      </div>
    </div>
  );
}

export default function HowZevaWorksSection(): ReactElement {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
          {/* How it works */}
          <div className="text-center">
            <div className="text-2xl font-extrabold text-blue-700 sm:text-3xl">How ZEVA Works</div>
            <div className="mt-2 text-xs text-gray-500">Get started in three simple steps</div>
          </div>

          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            <StepCard
              step={1}
              icon={<UserPlusIcon className="h-6 w-6" />}
              title="Add your business"
              subtitle="Quick setup in under 5 minutes"
            />
            <StepCard
              step={2}
              icon={<CogIcon className="h-6 w-6" />}
              title="Activate required modules"
              subtitle="Choose only what you need"
            />
            <StepCard
              step={3}
              icon={<GridIcon className="h-6 w-6" />}
              title="Manage from one dashboard"
              subtitle="All your tools in one place"
            />
          </div>

          {/* Divider / spacing like screenshot */}
          <div className="mt-16 h-px w-full bg-gray-100" />

          {/* Why switch */}
          <div className="mt-16 text-center">
            <div className="text-2xl font-extrabold text-blue-700 sm:text-3xl">Why Switch to ZEVA?</div>
            <div className="mx-auto mt-3 max-w-xl text-xs text-gray-500">
              Stop juggling multiple tools. See how ZEVA compares to your current setup.
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BenefitCard
              icon={<DollarIcon className="h-4 w-4" />}
              title="Save $200–500/month"
              body="Eliminate multiple subscriptions and hidden fees."
              pill="80% Cost Reduction"
            />
            <BenefitCard
              icon={<ClockIcon className="h-4 w-4" />}
              title="Save 15+ hours/week"
              body="No more switching between tools or manual data entry."
              pill="75% Time Saved"
            />
            <BenefitCard
              icon={<UsersIcon className="h-4 w-4" />}
              title="Reduce staff overhead"
              body="One system means less training and faster onboarding."
              pill="3× Faster Training"
            />
            <BenefitCard
              icon={<TrendingUpIcon className="h-4 w-4" />}
              title="Grow 40% faster"
              body="Better insights and automation drive revenue growth."
              pill="42% Avg Growth"
            />
          </div>
        </div>
      </section>

      {/* Merge comparison UI at the bottom of "Why Switch to ZEVA?" */}
      <ZevaComparisonSection />

      {/* Merge "Why Businesses Choose ZEVA" UI */}
      <WhyChooseZevaSection />
    </>
  );
}


