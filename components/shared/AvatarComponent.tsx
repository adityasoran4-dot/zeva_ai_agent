// components/Avatar.tsx
import React from "react";

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const AvatarComponent: React.FC<AvatarProps> = ({
  name = "",
  imageUrl,
  size = "md",
  className = "",
}) => {
  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter((part) => part && part.length > 0)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent color based on name
  const getColorFromName = (name: string) => {
    const colors = [
      { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
      { bg: "bg-green-50", text: "text-green-600", border: "border-green-100" },
      {
        bg: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-100",
      },
      {
        bg: "bg-yellow-50",
        text: "text-yellow-600",
        border: "border-yellow-100",
      },
      { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-100" },
      {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        border: "border-indigo-100",
      },
      { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100" },
      {
        bg: "bg-orange-50",
        text: "text-orange-600",
        border: "border-orange-100",
      },
      { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-100" },
      { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
    ];

    // Simple hash function to get consistent color for each name
    const hash = (name || "")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const colorClasses = getColorFromName(name);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 ${colorClasses.border}`}
        />
      ) : (
        <div
          className={`
            ${sizeClasses[size]} 
            ${colorClasses.bg} 
            ${colorClasses.text}
            ${colorClasses.border}
            rounded-full
            flex
            items-center
            justify-center
            font-semibold
            border-2
            shadow-sm
          `}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default AvatarComponent;
