import React, { useEffect, useRef, useState, useCallback } from "react";
import { Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiPickerModalProps {
  setValue?: React.Dispatch<React.SetStateAction<string>>;
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
  triggerButton?: React.ReactNode;
  position?: Placement;
  align?: "start" | "center" | "end";
  offset?: number;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  autoPosition?: boolean;
  maxHeight?: string;
  onOpenChange?: (open: boolean) => void;
  onPickEmoji?: (emoji: string) => void;
}

type Placement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "left-top"
  | "left-bottom"
  | "right-top"
  | "right-bottom";

const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  setValue,
  inputRef,
  triggerButton,
  position = "bottom-left",
  align = "start",
  offset = 5,
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  autoPosition = false,
  maxHeight = "350px",
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calculatedPosition, setCalculatedPosition] =
    useState<Placement>(position);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updateDropdownPosition = useCallback(() => {
    if (
      !autoPosition ||
      !dropdownRef.current ||
      !triggerRef.current ||
      !isOpen
    ) {
      return;
    }

    const dropdown = dropdownRef.current;
    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newPosition: Placement = position;

    // Check if dropdown would overflow on the right
    if (triggerRect.right + dropdownRect.width > viewportWidth) {
      if (position.includes("right"))
        newPosition = newPosition.replace("right", "left") as Placement;
    }

    // Check if dropdown would overflow on the left
    if (triggerRect.left - dropdownRect.width < 0) {
      if (position.includes("left"))
        newPosition = newPosition.replace("left", "right") as Placement;
    }

    // Check if dropdown would overflow at the bottom
    if (triggerRect.bottom + dropdownRect.height > viewportHeight) {
      if (position.includes("bottom"))
        newPosition = newPosition.replace("bottom", "top") as Placement;
    }

    // Check if dropdown would overflow at the top
    if (triggerRect.top - dropdownRect.height < 0) {
      if (position.includes("top"))
        newPosition = newPosition.replace("top", "bottom") as Placement;
    }

    setCalculatedPosition(newPosition);
  }, [autoPosition, position, isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
    }
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClickOutside, handleEscape]);

  const handleEmojiSelect = (emoji: any) => {
    const emojiChar = emoji.native;

    if (inputRef?.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const value = input.value;

      const newValue =
        value.substring(0, start) + emojiChar + value.substring(end);
      if (setValue) setValue(newValue);

      setTimeout(() => {
        input.setSelectionRange(
          start + emojiChar.length,
          start + emojiChar.length,
        );
        input.focus();
      }, 0);
    } else {
      if (setValue) setValue((prev: string) => prev + emojiChar);
    }
  };

  const getPositionClasses = () => {
    const positionToUse = autoPosition ? calculatedPosition : position;

    const positionMap: Record<Placement, string> = {
      "top-left": `bottom-full left-0 mb-${offset}`,
      "top-right": `bottom-full right-0 mb-${offset}`,
      "bottom-left": `top-full left-0 mt-${offset}`,
      "bottom-right": `top-full right-0 mt-${offset}`,
      "left-top": `right-full top-0 mr-${offset}`,
      "left-bottom": `right-full bottom-0 mr-${offset}`,
      "right-top": `left-full top-0 ml-${offset}`,
      "right-bottom": `left-full bottom-0 ml-${offset}`,
    };

    const baseClasses = "absolute z-50";
    return `${baseClasses} ${positionMap[positionToUse]}`;
  };

  const getAlignClasses = () => {
    if (align === "center") return "mx-auto";
    if (align === "end") return "ml-auto";
    return "";
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        title="Choose emoji"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          focus:outline-none focus:ring-2 focus:ring-primary/20 
          transition-all duration-200
          ${triggerClassName}
          ${isOpen ? "ring-1 rounded-md ring-primary/20" : ""}
        `}
        aria-label="Open emoji picker"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {triggerButton || (
          <div className="cursor-pointer rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Smile
              size={20}
              className="text-muted-foreground transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(15deg)" : "rotate(0)" }}
            />
          </div>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            ${getPositionClasses()} 
            animate-in fade-in-0 zoom-in-95 duration-200
            ${getAlignClasses()}
          `}
          role="dialog"
          aria-label="Emoji picker"
        >
          <div
            className={`
              rounded-lg shadow-lg border border-gray-300 
              overflow-hidden backdrop-blur-sm bg-white 
              ${dropdownClassName}
            `}
            style={{ maxHeight }}
          >
            <div className="flex items-center  rounded-lg justify-center">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                perLine={8}
                emojiSize={22}
                emojiButtonSize={32}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPickerModal;
