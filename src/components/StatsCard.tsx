"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: string;
  variant?: "gradient" | "blue" | "green" | "orange" | "white";
  children?: ReactNode;
}

const variantStyles = {
  gradient: "bg-gradient-to-br from-blue-500 to-purple-600 text-white",
  blue: "bg-gradient-to-br from-blue-400 to-blue-600 text-white",
  green: "bg-gradient-to-br from-green-400 to-emerald-600 text-white",
  orange: "bg-gradient-to-br from-orange-400 to-red-500 text-white",
  white: "bg-white dark:bg-gray-800",
};

export function StatsCard({
  title,
  subtitle,
  value,
  icon,
  variant = "white",
  children,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <Card
        className={`${variantStyles[variant]} border-none shadow-2xl min-h-[400px] flex flex-col`}
      >
        <CardHeader className="text-center space-y-2">
          {icon && <div className="text-6xl mb-2">{icon}</div>}
          <CardTitle
            className={`text-2xl md:text-3xl ${
              variant === "white"
                ? "text-gray-900 dark:text-gray-100"
                : "text-white"
            }`}
          >
            {title}
          </CardTitle>
          {subtitle && (
            <p
              className={`text-sm ${
                variant === "white"
                  ? "text-gray-600 dark:text-gray-400"
                  : "text-white/80"
              }`}
            >
              {subtitle}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center space-y-4">
          {value && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`text-6xl md:text-7xl font-bold ${
                variant === "white"
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-white"
              }`}
            >
              {value}
            </motion.div>
          )}
          {children && <div className="w-full">{children}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
