"use client";

import { useMemo } from "react";
import type { CommitStats } from "@/types";

interface CommitHeatmapProps {
  commits: CommitStats;
  year: number;
}

export function CommitHeatmap({ commits, year }: CommitHeatmapProps) {
  // Generate heatmap data - 52 weeks x 7 days
  const heatmapData = useMemo(() => {
    const data: { date: Date; count: number }[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Create a map of dates to counts from actual commit data
    const commitsByDate: Record<string, number> = {};

    // For simplicity, we'll distribute commits across the year
    // In a real implementation, this would use actual commit dates
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      commitsByDate[dateStr] = 0;
    }

    // Simulate some commit distribution for demo
    // In production, you'd parse firstCommitDate, lastCommitDate and byMonth data
    Object.keys(commits.byMonth || {}).forEach((month) => {
      const count = commits.byMonth[month];
      const monthIndex = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].indexOf(month);

      if (monthIndex !== -1 && count > 0) {
        // Distribute commits across days in the month
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const avgPerDay = Math.ceil(count / daysInMonth);

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, monthIndex, day);
          if (date <= endDate) {
            const dateStr = date.toISOString().split("T")[0];
            commitsByDate[dateStr] = Math.max(
              0,
              avgPerDay + Math.floor(Math.random() * 3 - 1)
            );
          }
        }
      }
    });

    // Convert to array
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      data.push({
        date: new Date(d),
        count: commitsByDate[dateStr] || 0,
      });
    }

    return data;
  }, [commits, year]);

  // Calculate max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(...heatmapData.map((d) => d.count), 1);
  }, [heatmapData]);

  // Get color based on count
  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    const intensity = Math.ceil((count / maxCount) * 4);
    const colors = [
      "bg-green-200 dark:bg-green-900",
      "bg-green-300 dark:bg-green-700",
      "bg-green-400 dark:bg-green-600",
      "bg-green-500 dark:bg-green-500",
      "bg-green-600 dark:bg-green-400",
    ];
    return colors[Math.min(intensity, colors.length - 1)];
  };

  // Group data by week
  const weeks = useMemo(() => {
    const result: Array<Array<{ date: Date; count: number }>> = [];
    let currentWeek: Array<{ date: Date; count: number }> = [];

    // Start from first day of the year
    const firstDay = heatmapData[0];
    const startDayOfWeek = firstDay.date.getDay();

    // Add empty cells for days before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), count: -1 }); // -1 indicates empty
    }

    heatmapData.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), count: -1 });
      }
      result.push(currentWeek);
    }

    return result;
  }, [heatmapData]);

  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Month labels */}
        <div className="flex mb-2 ml-8">
          {monthLabels.map((month, i) => (
            <div
              key={month}
              className="text-xs text-gray-600 dark:text-gray-400"
              style={{ width: `${100 / 12}%` }}
            >
              {month}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 mr-2">
            {dayLabels.map((day) => (
              <div key={day} className="h-3 flex items-center">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex gap-1 flex-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1 flex-1">
                {week.map((day, dayIndex) => {
                  if (day.count === -1) {
                    return <div key={dayIndex} className="h-3" />;
                  }

                  return (
                    <div
                      key={dayIndex}
                      className={`h-3 rounded-sm ${getColor(
                        day.count
                      )} transition-all hover:ring-2 hover:ring-blue-400 cursor-pointer`}
                      title={`${day.date.toLocaleDateString()}: ${
                        day.count
                      } commits`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${
                  level === 0
                    ? "bg-gray-100 dark:bg-gray-800"
                    : level === 1
                    ? "bg-green-200 dark:bg-green-900"
                    : level === 2
                    ? "bg-green-400 dark:bg-green-700"
                    : level === 3
                    ? "bg-green-500 dark:bg-green-500"
                    : "bg-green-600 dark:bg-green-400"
                }`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
