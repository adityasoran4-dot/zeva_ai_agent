// context/CurrencyContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { getAuthHeaders } from "@/lib/helper";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "INR",
  setCurrency: () => {},
});

export const useCurrency = (): CurrencyContextType => useContext(CurrencyContext);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>("INR");

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) return; // user not logged in — keep default
        const res = await axios.get("/api/clinics/myallClinic", {
          headers: authHeaders,
        });
        if (res.data.success && res.data.clinic?.currency) {
          setCurrencyState(res.data.clinic.currency);
        }
      } catch {
        // Not authenticated or not a clinic user — keep default "INR"
      }
    };

    fetchCurrency();
  }, []);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
