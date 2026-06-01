"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypewriterProps {
  text: string[];
  speed?: number;
  loop?: boolean;
  className?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 100,
  loop = true,
  className,
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (text.length === 0) return;

    const currentString = text[currentTextIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (charIndex < currentString.length) {
          setCurrentText(currentString.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Finished typing, wait before deleting
          setTimeout(() => {
            setIsDeleting(true);
          }, 2000);
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          setCurrentText(currentString.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false);
          if (loop || currentTextIndex < text.length - 1) {
            setCurrentTextIndex((prev) => (prev + 1) % text.length);
          }
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentTextIndex, text, speed, loop]);

  return (
    <span className={cn("inline-block", className)}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

