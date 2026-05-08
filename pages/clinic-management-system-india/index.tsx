"use client";
import React from "react";
import Head from "next/head";
import Zeva360Layout from "../../components/landing/Zeva360Layout";
import Zeva360HeroIndia from "../../components/landing/Zeva360HeroIndia";
import Zeva360ProblemSection from "../../components/landing/Zeva360ProblemSection";
import Zeva360WorkflowSection from "../../components/landing/Zeva360WorkflowSection";
import Zeva360SolutionsSection from "../../components/landing/Zeva360SolutionsSection";
import Zeva360ComparisonTable from "../../components/landing/Zeva360ComparisonTable";
import Zeva360TestimonialsSection from "../../components/landing/Zeva360TestimonialsSection";
import Zeva360FinalCTA from "../../components/landing/Zeva360FinalCTA";
import DemoQuickPopup from "../../components/landing/DemoQuickPopup";

const ClinicManagementSystemIndia: React.FC = () => {
  return (
    <>
      <Head>
        <title>Clinic Management System India – ZEVA 360</title>
        <meta name="description" content="ZEVA 360 – the complete clinic management system for India. Automate follow-ups, reduce no-shows by 40%, and grow revenue with intelligent automation." />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <Zeva360Layout 
        whatsappUrl="https://wa.me/9650608788" 
        whatsappNumber="9650608788"
        homeUrl="/clinic-management-system-india"
      >
        <Zeva360HeroIndia />
        <Zeva360ProblemSection />
        <Zeva360WorkflowSection />
        <Zeva360SolutionsSection />
        <Zeva360ComparisonTable />
        <Zeva360TestimonialsSection />
        <Zeva360FinalCTA 
          whatsappUrl="https://wa.me/9650608788" 
          whatsappNumber="9650608788"
          homeUrl="/clinic-management-system-india"
        />
      </Zeva360Layout>
      <DemoQuickPopup />
    </>
  );
};

export default ClinicManagementSystemIndia;
