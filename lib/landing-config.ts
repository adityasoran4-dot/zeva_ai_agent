/**
 * Landing page configuration for different regions
 * Each region can have its own WhatsApp number and URL
 */

export interface LandingConfig {
  whatsappNumber: string;
  whatsappUrl: string;
  region: string;
}

export const LANDING_CONFIGS: Record<string, LandingConfig> = {
  india: {
    whatsappNumber: "9650608788",
    whatsappUrl: "https://wa.me/9650608788",
    region: "India",
  },
  uae: {
    whatsappNumber: "971502983757",
    whatsappUrl: "https://wa.me/971502983757",
    region: "UAE",
  },
};

/**
 * Get the WhatsApp URL for a specific region
 * @param region - 'india' | 'uae'
 * @returns WhatsApp URL string
 */
export const getWhatsAppUrl = (region: keyof typeof LANDING_CONFIGS = 'india'): string => {
  return LANDING_CONFIGS[region]?.whatsappUrl || LANDING_CONFIGS.india.whatsappUrl;
};

/**
 * Get the full landing config for a region
 * @param region - 'india' | 'uae'
 * @returns Landing configuration object
 */
export const getLandingConfig = (region: keyof typeof LANDING_CONFIGS = 'india'): LandingConfig => {
  return LANDING_CONFIGS[region] || LANDING_CONFIGS.india;
};

export default LANDING_CONFIGS;
