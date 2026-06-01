import { Database, Webhook } from "lucide-react";

interface WebhookVariable {
  label: string;
  value: string;
  category: string;
  icon: any; // Replace 'any' with the actual Webhook icon type if available
}

interface FlattenedObject {
  [key: string]: any;
}

export const getDynamicWebhookVariables = (
  payload: Record<string, any>,
): WebhookVariable[] => {
  const flattenObject = (
    obj: Record<string, any>,
    prefix: string = "",
  ): FlattenedObject => {
    return Object.keys(obj).reduce((acc: FlattenedObject, key: string) => {
      const value = obj[key];
      const newPrefix = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(acc, flattenObject(value, newPrefix));
      } else {
        acc[newPrefix] = value;
      }
      return acc;
    }, {});
  };

  const flattenedPayload = flattenObject(payload);

  return Object.keys(flattenedPayload).map(
    (key: string): WebhookVariable => ({
      label:
        key.split(".").pop()!.charAt(0).toUpperCase() +
        key
          .split(".")
          .pop()!
          .slice(1)
          .replace(/([A-Z])/g, " $1")
          .trim(),
      value: `{{webhook.${key}}}`,
      category: "Webhook",
      icon: Webhook, // Make sure Webhook is imported/defined
    }),
  );
};

export const getDynamicRestApiVariables = (
  payload: Record<string, any>,
): WebhookVariable[] => {
  const flattenObject = (
    obj: Record<string, any>,
    prefix: string = "",
  ): FlattenedObject => {
    return Object.keys(obj).reduce((acc: FlattenedObject, key: string) => {
      const value = obj[key];
      const newPrefix = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(acc, flattenObject(value, newPrefix));
      } else {
        acc[newPrefix] = value;
      }
      return acc;
    }, {});
  };

  const flattenedPayload = flattenObject(payload);

  return Object.keys(flattenedPayload).map(
    (key: string): WebhookVariable => ({
      label:
        key.split(".").pop()!.charAt(0).toUpperCase() +
        key
          .split(".")
          .pop()!
          .slice(1)
          .replace(/([A-Z])/g, " $1")
          .trim(),
      value: `{{rest_api.${key}}}`,
      category: "Rest API",
      icon: Database, // Make sure RestApi is imported/defined
    }),
  );
};

export const getAiComposerVariables = (outputKey: string) => {
  if (!outputKey) {
    return [];
  }
  return [
    {
      label: outputKey,
      value: `{{ai_composer.${outputKey}}}`,
      category: "AI Composer",
      icon: Webhook, // Make sure RestApi is imported/defined
    },
  ];
};
