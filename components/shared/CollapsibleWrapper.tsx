import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface IProps {
  headerTitle: string;
  children: React.ReactNode;
  rightActionButton?: React.ReactNode;
  loading?: boolean;
}

const CollapsibleWrapper: React.FC<IProps> = ({
  headerTitle,
  children,
  rightActionButton,
  loading,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full border-b border-b-gray-200 px-3 py-3">
      {/* Trigger/Header */}
      <button
        className="w-full flex items-center justify-between border-0 bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <ChevronDown
            size={17}
            className={clsx(
              "transition-transform duration-300",
              isOpen ? "rotate-0" : "-rotate-90",
            )}
          />
          <h2 className="text-sm font-medium text-gray-700 ml-2">
            {headerTitle}
          </h2>
        </div>
        {rightActionButton && <div className="ml-2">{rightActionButton}</div>}
      </button>

      {/* Content Area */}
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0",
        )}
        aria-hidden={!isOpen}
      >
        {loading ? (
          <div className="flex items-center text-sm text-gray-600 justify-center py-4">
            Loading...
          </div>
        ) : (
          <div className="pt-2">{children}</div>
        )}
      </div>
    </div>
  );
};

export default CollapsibleWrapper;
