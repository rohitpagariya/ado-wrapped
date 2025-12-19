"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface LanguageChartProps {
  extensions: Array<{ ext: string; count: number }>;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#14b8a6", // teal
  "#0ea5e9", // sky
  "#f97316", // orange
  "#84cc16", // lime
  "#22d3ee", // light cyan
];

export function LanguageChart({ extensions }: LanguageChartProps) {
  // Take top 10 extensions
  const data = extensions.slice(0, 10).map((ext) => ({
    name: ext.ext || "unknown",
    value: ext.count,
  }));

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No file extensions data available
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${((percent || 0) * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, rgba(255, 255, 255, 0.95))",
              border: "1px solid var(--tooltip-border, #e5e7eb)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "var(--tooltip-text, #1f2937)",
            }}
            wrapperClassName="[--tooltip-bg:rgba(255,255,255,0.95)] dark:[--tooltip-bg:rgba(30,41,59,0.95)] [--tooltip-border:#e5e7eb] dark:[--tooltip-border:#475569] [--tooltip-text:#1f2937] dark:[--tooltip-text:#f1f5f9]"
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: "14px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
