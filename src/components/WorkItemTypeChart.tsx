"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface WorkItemTypeChartProps {
  byType: Record<string, number>;
}

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red (bugs)
  "#10b981", // green
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#8b5cf6", // purple
  "#f97316", // orange
  "#14b8a6", // teal
];

// Map work item types to display-friendly names
const TYPE_LABELS: Record<string, string> = {
  Bug: "🐛 Bug",
  "User Story": "📖 User Story",
  Task: "✅ Task",
  Feature: "⭐ Feature",
  Epic: "🚀 Epic",
  Issue: "❗ Issue",
  "Test Case": "🧪 Test Case",
  "Product Backlog Item": "📋 PBI",
};

export function WorkItemTypeChart({ byType }: WorkItemTypeChartProps) {
  const data = Object.entries(byType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      name: TYPE_LABELS[type] || type,
      value: count,
      rawType: type,
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No work items data available
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
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
