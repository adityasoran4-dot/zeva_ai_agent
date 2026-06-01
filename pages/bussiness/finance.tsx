import type { ReactElement, ReactNode } from "react";

import Head from "next/head";
import Header from "../../components/Header";

import FinanceSection from "../../components/bussiness/FinanceSection";

export default function FinancePage(): ReactElement {
  return (
    <>
      <Head>
        <title>ZEVA | Finance & Compliance</title>
        <meta
          name="description"
          content="Billing, taxes, compliance, reports, and financial analytics — built for healthcare teams."
        />
      </Head>

      <Header />
      <div className="pt-20">
        <FinanceSection />
      </div>
    </>
  );
}

// Opt out of the global header/footer layout for a clean landing page.
FinancePage.getLayout = (page: ReactNode) => page;


