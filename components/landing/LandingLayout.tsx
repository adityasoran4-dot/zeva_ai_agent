import React, { ReactNode } from "react";
import LandingHeader from "./LandingHeader";
import LandingFooter from "./LandingFooter";
import dynamic from "next/dynamic";

const DemoQuickPopup = dynamic(() => import("./DemoQuickPopup"), { ssr: false });

type Props = {
  children?: ReactNode;
};

const LandingLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
      <LandingHeader />
      <main className="flex-1 w-full pt-20 bg-white">{children}</main>
      <DemoQuickPopup />
      <LandingFooter />
    </div>
  );
};

export default LandingLayout;
