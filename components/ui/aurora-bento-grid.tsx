"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const AuroraBackground = () => {
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-300 opacity-20 blur-3xl"
          style={{
            animation: 'blob 7s infinite',
          }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-300 opacity-20 blur-3xl"
          style={{
            animation: 'blob 7s infinite 2s',
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-indigo-300 opacity-20 blur-3xl"
          style={{
            animation: 'blob 7s infinite 4s',
          }}
        />
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
      `}} />
    </>
  );
};

interface BentoGridProps {
  className?: string;
  children?: React.ReactNode;
}

export const BentoGrid = ({ className, children }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[14rem] grid-cols-1 md:grid-cols-6 gap-3 max-w-6xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

interface BentoGridItemProps {
  className?: string;
  title?: string;
  description?: string;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
  children?: React.ReactNode;
}

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  gradientFrom = "from-blue-500",
  gradientTo = "to-cyan-400",
  children,
}: BentoGridItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-3 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent justify-between flex flex-col space-y-2.5",
        `bg-gradient-to-br ${gradientFrom} ${gradientTo}`,
        className
      )}
    >
      {header}
      {icon && (
        <div className="p-2 bg-white/10 rounded-lg w-fit backdrop-blur-sm">
          {icon}
        </div>
      )}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {title && (
          <h3 className="text-lg md:text-xl font-bold text-white mt-1 leading-tight">{title}</h3>
        )}
        {description && (
          <p className="text-white/60 text-xs md:text-sm mt-1 leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </motion.div>
  );
};

