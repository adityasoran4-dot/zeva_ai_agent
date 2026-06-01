// lib/gtag.js

export const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with your own GA4 ID

// Log page views
export const pageview = (url) => {
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Log specific events (e.g., button click)
export const event = ({ action, category, label, value }) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
