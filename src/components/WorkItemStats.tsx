"use client";

import { motion } from "framer-motion";
import type { WorkItemStats } from "@/types";
import { CheckCircle2, Bug, Clock, Zap } from "lucide-react";

interface WorkItemStatsDisplayProps {
  workItems: WorkItemStats;
}

export function WorkItemStatsDisplay({ workItems }: WorkItemStatsDisplayProps) {
  const stats = [
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      label: "Resolved",
      value: workItems.total,
      color: "text-green-600 dark:text-green-400",
    },
    {
      icon: <Bug className="w-8 h-8" />,
      label: "Bugs Fixed",
      value: workItems.bugsFixed,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
          >
            <div className={stat.color}>{stat.icon}</div>
            <div className="text-2xl font-bold mt-2 text-gray-900 dark:text-gray-100">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional insights */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Avg. Resolution Time</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {workItems.avgResolutionDays.toFixed(1)} days
          </span>
        </div>

        {workItems.fastestResolution && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Fastest Resolution
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {workItems.fastestResolution.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {workItems.fastestResolution.hours < 24
                ? `${workItems.fastestResolution.hours} hours`
                : `${Math.round(workItems.fastestResolution.hours / 24)} days`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
