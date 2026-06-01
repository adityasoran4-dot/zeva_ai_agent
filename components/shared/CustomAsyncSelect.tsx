import React, { forwardRef } from "react";
import dynamic from "next/dynamic";
import type {
  StylesConfig,
  MultiValue,
  SingleValue,
  ActionMeta,
} from "react-select";

// Dynamic import for AsyncSelect to avoid build issues with Next.js/Turbopack
const AsyncSelect = dynamic(
  () => import("react-select/async").then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs bg-gray-50 text-gray-500">
        Loading...
      </div>
    )
  }
) as React.ComponentType<any>;

// Types for the component props
export interface OptionType {
  value: string;
  label: string;
  [key: string]: any; // Allow additional properties
}

interface CustomAsyncSelectProps {
  // Required props
  loadOptions: (inputValue: string) => Promise<OptionType[]>;
  label?: string;
  name: string;

  // Selection props
  isMulti?: boolean;
  value?: OptionType | OptionType[] | null;
  onChange?: (
    value: OptionType | OptionType[] | null,
    actionMeta: ActionMeta<OptionType>
  ) => void;

  // AsyncSelect props
  cacheOptions?: boolean;
  defaultOptions?: boolean | OptionType[];
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isLoading?: boolean;

  // Styling props
  className?: string;
  error?: string;
  required?: boolean;

  // Custom props
  noOptionsMessage?: string;
  loadingMessage?: string;
}

// Custom styles to match the provided design
const customStyles: StylesConfig<OptionType, boolean> = {
  control: (provided, state) => ({
    ...provided,
    border: state.isFocused ? "1px solid #1f2937" : "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    padding: "0.25rem 0.5rem",
    minHeight: "2.3rem",
    fontSize: "0.75rem", // text-xs
    "&:hover": {
      borderColor: "#d1d5db",
    },
    boxShadow: state.isFocused
      ? "0 0 0 2px rgba(31, 41, 55, 0.1)" // focus:ring-2 focus:ring-gray-800/20
      : "none",
    transition: "all 150ms ease-in-out",
    backgroundColor: state.isDisabled ? "#f9fafb" : "white",
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0",
  }),
  input: (provided) => ({
    ...provided,
    margin: "0",
    padding: "0",
    fontSize: "0.75rem",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
    fontSize: "0.75rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.75rem",
    color: "#374151",
  }),
  multiValue: (provided) => ({
    ...provided,
    fontSize: "0.75rem",
    borderRadius: "0.25rem",
    backgroundColor: "#f3f4f6",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    fontSize: "0.75rem",
    padding: "0.125rem 0.375rem",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    paddingLeft: "0.25rem",
    paddingRight: "0.25rem",
    backgroundColor: "#E0E0E0",
    color: "#616161",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#E0E0E0",
      color: "#616161",
    },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    border: "1px solid #e5e7eb",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    fontSize: "0.75rem",
    zIndex: 50,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.75rem",
    backgroundColor: state.isSelected
      ? "#f3f4f6"
      : state.isFocused
      ? "#f9fafb"
      : "white",
    color: "#374151",
    padding: "0.5rem 0.75rem",
    "&:active": {
      backgroundColor: "#f3f4f6",
    },
  }),
  dropdownIndicator: (provided, _state) => ({
    ...provided,
    padding: "0.125rem",
    color: "#9ca3af",
    "&:hover": {
      color: "#6b7280",
    },
    transition: "color 150ms ease-in-out",
  }),
  clearIndicator: (provided) => ({
    ...provided,
    padding: "0.125rem",
    color: "#9ca3af",
    "&:hover": {
      color: "#6b7280",
    },
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: "#e5e7eb",
    marginTop: "0.5rem",
    marginBottom: "0.5rem",
  }),
  loadingIndicator: (provided) => ({
    ...provided,
    color: "#6b7280",
  }),
};

// Reusable CustomAsyncSelect component
const CustomAsyncSelect = forwardRef<any, CustomAsyncSelectProps>(
  (
    {
      label,
      name,
      loadOptions,
      isMulti = false,
      value,
      onChange,
      cacheOptions = true,
      defaultOptions = true,
      placeholder = "Select...",
      isDisabled = false,
      isClearable = true,
      isLoading = false,
      className = "",
      error,
      required = false,
      noOptionsMessage = "No options found",
      loadingMessage = "Loading...",
    },
    ref
  ) => {
    // Handle change event
    const handleChange = (
      newValue: MultiValue<OptionType> | SingleValue<OptionType>,
      actionMeta: ActionMeta<OptionType>
    ) => {
      if (!onChange) return;

      if (isMulti) {
        onChange((newValue as OptionType[]) || [], actionMeta);
      } else {
        onChange(newValue as OptionType | null, actionMeta);
      }
    };

    // Custom messages
    const customNoOptionsMessage = () => noOptionsMessage;
    const customLoadingMessage = () => loadingMessage;

    return (
      <div className={`w-full space-y-2 ${className}`}>
        {label && (
          <label htmlFor={name} className="block text-sm text-gray-800">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <AsyncSelect
          ref={ref}
          name={name}
          inputId={name}
          isMulti={isMulti}
          value={value}
          onChange={handleChange}
          loadOptions={loadOptions}
          cacheOptions={cacheOptions}
          defaultOptions={defaultOptions}
          placeholder={placeholder}
          isDisabled={isDisabled}
          isClearable={isClearable}
          isLoading={isLoading}
          styles={customStyles}
          noOptionsMessage={customNoOptionsMessage}
          loadingMessage={customLoadingMessage}
          classNamePrefix="react-select"
          menuPlacement="auto"
        />

        {error && (
          <p className="mt-1 text-[10px] sm:text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

CustomAsyncSelect.displayName = "CustomAsyncSelect";

export default CustomAsyncSelect;
