"use client";

import { motion } from "framer-motion";
import type { PullRequestStats } from "@/types";
import { GitPullRequest, GitMerge, MessageSquare, Clock } from "lucide-react";

interface PRStatsProps {
  pullRequests: PullRequestStats;
}

export function PRStats({ pullRequests }: PRStatsProps) {
  const stats = [
    {
      icon: <GitPullRequest className="w-8 h-8" />,
      label: "Created",
      value: pullRequests.created,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: <GitMerge className="w-8 h-8" />,
      label: "Merged",
      value: pullRequests.merged,
      color: "text-green-600 dark:text-green-400",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      label: "Reviewed",
      value: pullRequests.reviewed,
      color: "text-cyan-600 dark:text-cyan-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main stats grid */}
      <div className="grid grid-cols-3 gap-4">
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
            <span className="text-sm">Avg. Time to Merge</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {pullRequests.avgDaysToMerge.toFixed(1)} days
          </span>
        </div>

        {pullRequests.largestPR && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Largest PR
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {pullRequests.largestPR.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {pullRequests.largestPR.filesChanged} files changed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
