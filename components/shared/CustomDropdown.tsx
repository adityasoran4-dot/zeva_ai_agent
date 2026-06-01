import {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
  CSSProperties,
} from "react";

interface CustomDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  position?: Placement;
  align?: "start" | "center" | "end";
  offset?: number;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  autoPosition?: boolean;
  maxHeight?: string;
  onOpenChange?: (open: boolean) => void;
  closeOnSelect?: boolean;
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  style?: CSSProperties;
  triggerAs?: "button" | "div";
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

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  trigger,
  children,
  position = "bottom-left",
  align = "start",
  offset = 2,
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  autoPosition = false,
  maxHeight,
  onOpenChange,
  closeOnSelect = true,
  open: controlledOpen,
  onOpen,
  onClose,
  style,
  triggerAs = "button",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calculatedPosition, setCalculatedPosition] =
    useState<Placement>(position);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : isOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setIsOpen(value);
      }
      onOpenChange?.(value);
      if (value) {
        onOpen?.();
      } else {
        onClose?.();
      }
    },
    [isControlled, onOpenChange, onOpen, onClose]
  );

  const updateDropdownPosition = useCallback(() => {
    if (!autoPosition || !dropdownRef.current || !triggerRef.current || !open) {
      return;
    }

    const dropdown = dropdownRef.current;
    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newPosition: Placement = position;

    // Check overflow on right
    if (triggerRect.right + dropdownRect.width > viewportWidth) {
      if (position.includes("right"))
        newPosition = newPosition.replace("right", "left") as Placement;
      else if (position.includes("left")) {
        // If already left, try top/bottom
        if (triggerRect.top > dropdownRect.height) {
          newPosition = position.includes("top") ? "top-left" : "bottom-left";
        }
      }
    }

    // Check overflow on left
    if (triggerRect.left - dropdownRect.width < 0) {
      if (position.includes("left"))
        newPosition = newPosition.replace("left", "right") as Placement;
      else if (position.includes("right")) {
        if (triggerRect.top > dropdownRect.height) {
          newPosition = position.includes("top") ? "top-right" : "bottom-right";
        }
      }
    }

    // Check overflow at bottom
    if (triggerRect.bottom + dropdownRect.height > viewportHeight) {
      if (position.includes("bottom"))
        newPosition = newPosition.replace("bottom", "top") as Placement;
    }

    // Check overflow at top
    if (triggerRect.top - dropdownRect.height < 0) {
      if (position.includes("top"))
        newPosition = newPosition.replace("top", "bottom") as Placement;
    }

    setCalculatedPosition(newPosition);
  }, [autoPosition, position, open]);

  useEffect(() => {
    if (open) {
      updateDropdownPosition();
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
    }
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    },
    [setOpen]
  );

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    },
    [open, setOpen]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClickOutside, handleEscape]);

  const handleTriggerClick = () => {
    setOpen(!open);
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

    const baseClasses = "absolute z-50 min-w-max";
    return `${baseClasses} ${positionMap[positionToUse]}`;
  };

  const getAlignClasses = () => {
    if (align === "center") return "mx-auto";
    if (align === "end") return "ml-auto";
    return "";
  };

  const TriggerComponent = triggerAs === "button" ? "button" : "div";

  return (
    <div className={`relative inline-block ${className}`} style={style}>
      <TriggerComponent
        ref={triggerRef as any}
        type={triggerAs === "button" ? "button" : undefined}
        onClick={handleTriggerClick}
        className={`
          focus:outline-none focus:ring-2 focus:ring-primary/20 
          transition-all duration-200
          ${triggerClassName}
          ${open ? "" : ""}
          ${triggerAs === "div" ? "cursor-pointer" : ""}
        `}
        aria-label="Toggle dropdown"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {trigger}
      </TriggerComponent>

      {open && (
        <div
          ref={dropdownRef}
          className={`
            ${getPositionClasses()} 
            animate-in fade-in-0 zoom-in-95 duration-200
            ${getAlignClasses()}
          `}
          role="menu"
          aria-orientation="vertical"
          onClick={() => closeOnSelect && setOpen(false)}
        >
          <div
            className={`
              rounded-lg shadow-lg border border-gray-200
              overflow-hidden backdrop-blur-sm bg-white
              ${dropdownClassName}
            `}
            style={{ maxHeight }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
