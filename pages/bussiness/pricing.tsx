import type { ReactElement, ReactNode } from "react";

import Head from "next/head";

import InteractivePricingSection from "../../components/bussiness/InteractivePricingSection";

export default function PricingPage(): ReactElement {
  return (
    <>
      <Head>
        <title>ZEVA | Pricing Builder</title>
        <meta
          name="description"
          content="Build your perfect plan. Select modules and see your monthly total update in real-time."
        />
      </Head>

      <InteractivePricingSection />
    </>
  );
}

PricingPage.getLayout = (page: ReactNode) => page;


