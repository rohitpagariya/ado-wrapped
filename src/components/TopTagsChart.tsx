"use client";

import { motion } from "framer-motion";
import { Tag } from "lucide-react";

interface TopTagsChartProps {
  topTags: Array<{ tag: string; count: number }>;
}

const TAG_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
];

export function TopTagsChart({ topTags }: TopTagsChartProps) {
  if (topTags.length === 0) {
    return (
      <div className="text-center py-8">
        <Tag className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No tags found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Tags help organize work items by category
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...topTags.map((t) => t.count));

  return (
    <div className="space-y-4">
      {/* Tag cloud style */}
      <div className="flex flex-wrap gap-2 justify-center">
        {topTags.slice(0, 8).map((item, index) => {
          // Scale font size based on count
          const scale = 0.8 + (item.count / maxCount) * 0.4;
          const colorClass = TAG_COLORS[index % TAG_COLORS.length];

          return (
            <motion.span
              key={item.tag}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, type: "spring" }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-medium ${colorClass}`}
              style={{ fontSize: `${scale}rem` }}
            >
              <Tag className="w-3 h-3" />
              {item.tag}
              <span className="ml-1 opacity-75">({item.count})</span>
            </motion.span>
          );
        })}
      </div>

      {/* Bar chart for top 5 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {topTags.slice(0, 5).map((item, index) => {
          const percentage = Math.round((item.count / maxCount) * 100);

          return (
            <motion.div
              key={item.tag}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400 w-24 truncate">
                {item.tag}
              </span>
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                {item.count}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
