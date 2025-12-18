"use client";

import { motion } from "framer-motion";
import type { BuildStats as BuildStatsType } from "@/types";
import { CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BuildStatsProps {
  builds: BuildStatsType;
}

export function BuildStats({ builds }: BuildStatsProps) {
  const successRate = builds.total > 0 ? builds.successRate : 0;

  return (
    <div className="space-y-6">
      {/* Success Rate Circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex flex-col items-center justify-center"
      >
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - successRate / 100)}`}
              className={
                successRate >= 80
                  ? "text-green-500"
                  : successRate >= 60
                  ? "text-yellow-500"
                  : "text-red-500"
              }
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {successRate.toFixed(0)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
        >
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {builds.succeeded}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Succeeded
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
        >
          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {builds.failed}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total Builds</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {builds.total}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Avg. Duration</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {builds.avgDurationMinutes.toFixed(1)} min
          </span>
        </div>
      </motion.div>

      {/* Progress bar visualization */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Build Reliability</span>
          <span>
            {successRate >= 80
              ? "Excellent"
              : successRate >= 60
              ? "Good"
              : "Needs Work"}
          </span>
        </div>
        <Progress value={successRate} className="h-2" />
      </motion.div>
    </div>
  );
}
