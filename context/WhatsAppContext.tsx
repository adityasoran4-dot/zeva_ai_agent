import React, { createContext, useContext, ReactNode } from 'react';

interface WhatsAppContextType {
  whatsappUrl: string;
  whatsappNumber: string;
  region: string;
}

const WhatsAppContext = createContext<WhatsAppContextType>({
  whatsappUrl: 'https://wa.me/971502983757',
  whatsappNumber: '971502983757',
  region: 'UAE',
});

interface WhatsAppProviderProps {
  children: ReactNode;
  whatsappUrl?: string;
  whatsappNumber?: string;
  region?: string;
}

export const WhatsAppProvider: React.FC<WhatsAppProviderProps> = ({
  children,
  whatsappUrl = 'https://wa.me/971502983757',
  whatsappNumber = '971502983757',
  region = 'UAE',
}) => {
  return (
    <WhatsAppContext.Provider value={{ whatsappUrl, whatsappNumber, region }}>
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = (): WhatsAppContextType => {
  return useContext(WhatsAppContext);
};

export default WhatsAppContext;
