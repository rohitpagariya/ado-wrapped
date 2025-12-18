"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CommitStats } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimeDistributionChartProps {
  commits: CommitStats;
}

export function TimeDistributionChart({ commits }: TimeDistributionChartProps) {
  // Prepare hour data (0-23)
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i.toString().padStart(2, "0")}:00`,
    count: commits.byHour[i] || 0,
  }));

  // Find peak hour
  const peakHour = hourData.reduce(
    (max, curr) => (curr.count > max.count ? curr : max),
    hourData[0]
  );

  // Prepare day data
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const dayData = dayOrder.map((day) => ({
    day: day.substring(0, 3), // Mon, Tue, etc.
    count: commits.byDayOfWeek[day] || 0,
  }));

  // Find peak day
  const peakDay = dayData.reduce(
    (max, curr) => (curr.count > max.count ? curr : max),
    dayData[0]
  );

  return (
    <Tabs defaultValue="hours" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="hours">By Hour</TabsTrigger>
        <TabsTrigger value="days">By Day</TabsTrigger>
      </TabsList>

      <TabsContent value="hours" className="mt-4">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Peak coding hour:{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {peakHour.label}
              </span>
            </p>
          </div>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={3}
                  className="text-gray-600 dark:text-gray-400"
                  stroke="currentColor"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                  stroke="currentColor"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "var(--tooltip-bg, rgba(255, 255, 255, 0.95))",
                    border: "1px solid var(--tooltip-border, #e5e7eb)",
                    borderRadius: "8px",
                    color: "var(--tooltip-text, #1f2937)",
                  }}
                  wrapperClassName="[--tooltip-bg:rgba(255,255,255,0.95)] dark:[--tooltip-bg:rgba(30,41,59,0.95)] [--tooltip-border:#e5e7eb] dark:[--tooltip-border:#475569] [--tooltip-text:#1f2937] dark:[--tooltip-text:#f1f5f9]"
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {hourData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.hour === peakHour.hour ? "#3b82f6" : "#94a3b8"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="days" className="mt-4">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Most productive day:{" "}
              <span className="font-semibold text-green-600 dark:text-green-400">
                {dayOrder[dayData.indexOf(peakDay)]}
              </span>
            </p>
          </div>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dayData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                  stroke="currentColor"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                  stroke="currentColor"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "var(--tooltip-bg, rgba(255, 255, 255, 0.95))",
                    border: "1px solid var(--tooltip-border, #e5e7eb)",
                    borderRadius: "8px",
                    color: "var(--tooltip-text, #1f2937)",
                  }}
                  wrapperClassName="[--tooltip-bg:rgba(255,255,255,0.95)] dark:[--tooltip-bg:rgba(30,41,59,0.95)] [--tooltip-border:#e5e7eb] dark:[--tooltip-border:#475569] [--tooltip-text:#1f2937] dark:[--tooltip-text:#f1f5f9]"
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dayData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.day === peakDay.day ? "#10b981" : "#94a3b8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
