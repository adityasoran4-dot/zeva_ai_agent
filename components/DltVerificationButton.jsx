import React from "react";

const DltVerificationButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-red-400 bg-red-50 text-red-700 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-300 hover:border-red-500 hover:bg-red-100 hover:text-red-800 animate-pulse"
    >
      DLT ID & Template Verification
    </button>
  );
};

export default DltVerificationButton;

