import React, { ReactNode } from "react";
import Zeva360Header from "./Zeva360Header";
import Zeva360Footer from "./Zeva360Footer";

type Props = {
  children?: ReactNode;
  whatsappUrl?: string;
  whatsappNumber?: string;
  homeUrl?: string;
};

const Zeva360Layout: React.FC<Props> = ({ 
  children, 
  whatsappUrl = "https://wa.me/971502983757",
  whatsappNumber = "971502983757",
  homeUrl = "/clinic-management-system-uae"
}) => {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-gray-50">
      <Zeva360Header whatsappUrl={whatsappUrl} whatsappNumber={whatsappNumber} homeUrl={homeUrl} />
      <main className="flex-1 w-full pt-20">{children}</main>
      <Zeva360Footer />
    </div>
  );
};

export default Zeva360Layout;
