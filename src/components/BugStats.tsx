"use client";

import { motion } from "framer-motion";
import { Bug, AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { WorkItemStats } from "@/types";

interface BugStatsProps {
  workItems: WorkItemStats;
}

// Severity icons and colors
const SEVERITY_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  "1 - Critical": {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  "2 - High": {
    icon: <AlertCircle className="w-5 h-5" />,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  "3 - Medium": {
    icon: <Bug className="w-5 h-5" />,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  "4 - Low": {
    icon: <Info className="w-5 h-5" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
};

export function BugStats({ workItems }: BugStatsProps) {
  const { bugsFixed, bugsBySeverity } = workItems;

  if (bugsFixed === 0) {
    return (
      <div className="text-center py-8">
        <Bug className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          No bugs fixed this year
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          That&apos;s either great news or suspicious! 🤔
        </p>
      </div>
    );
  }

  // Sort severities in order (Critical first)
  const sortedSeverities = Object.entries(bugsBySeverity).sort(([a], [b]) => {
    const order = ["1 - Critical", "2 - High", "3 - Medium", "4 - Low"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="space-y-6">
      {/* Big bug count */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-center"
      >
        <div className="text-5xl font-bold text-red-600 dark:text-red-400">
          {bugsFixed}
        </div>
        <div className="text-lg text-gray-600 dark:text-gray-400 mt-1">
          Bugs Squashed! 🐛💥
        </div>
      </motion.div>

      {/* Severity breakdown */}
      {sortedSeverities.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
            By Severity
          </p>
          {sortedSeverities.map(([severity, count], index) => {
            const config = SEVERITY_CONFIG[severity] || {
              icon: <Bug className="w-5 h-5" />,
              color: "text-gray-600 dark:text-gray-400",
              bgColor: "bg-gray-100 dark:bg-gray-800",
            };
            const percentage = Math.round((count / bugsFixed) * 100);

            return (
              <motion.div
                key={severity}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor}`}
              >
                <div className={config.color}>{config.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {severity}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      className={`h-full ${config.color.replace(
                        "text-",
                        "bg-"
                      )}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Fun message based on severity */}
      <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {bugsBySeverity["1 - Critical"] > 0
            ? "Crisis averted! You tackled the critical ones! 🦸"
            : bugsFixed > 20
            ? "Bug exterminator extraordinaire! 🏆"
            : "Keeping the code clean! 💪"}
        </p>
      </div>
    </div>
  );
}
