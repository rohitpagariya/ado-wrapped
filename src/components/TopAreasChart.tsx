"use client";

import { motion } from "framer-motion";
import { FolderTree } from "lucide-react";

interface TopAreasChartProps {
  topAreas: Array<{ area: string; count: number }>;
}

const AREA_COLORS = [
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
];

export function TopAreasChart({ topAreas }: TopAreasChartProps) {
  if (topAreas.length === 0) {
    return (
      <div className="text-center py-8">
        <FolderTree className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No areas found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Areas help organize work items by feature or component
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...topAreas.map((a) => a.count));

  return (
    <div className="space-y-4">
      {/* Area badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        {topAreas.slice(0, 5).map((item, index) => {
          const colorClass = AREA_COLORS[index % AREA_COLORS.length];

          return (
            <motion.span
              key={item.area}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, type: "spring" }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-medium ${colorClass}`}
            >
              <FolderTree className="w-3 h-3" />
              {item.area}
              <span className="ml-1 opacity-75">({item.count})</span>
            </motion.span>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {topAreas.slice(0, 5).map((item, index) => {
          const percentage = Math.round((item.count / maxCount) * 100);

          return (
            <motion.div
              key={item.area}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400 w-28 truncate">
                {item.area}
              </span>
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
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
