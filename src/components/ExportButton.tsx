"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileText } from "lucide-react";
import { exportToJSON, exportToMarkdown } from "@/lib/export";
import type { ClientWrappedStats } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  stats: ClientWrappedStats;
}

export function ExportButton({ stats }: ExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: "json" | "markdown") => {
    setIsExporting(true);
    setShowMenu(false);
    try {
      if (format === "json") {
        exportToJSON(stats);
        toast({
          title: "Exported as JSON",
          description: "Your stats have been downloaded",
        });
      } else {
        exportToMarkdown(stats);
        toast({
          title: "Exported as Markdown",
          description: "Your stats have been downloaded",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div className="relative">
      <Button
        size="lg"
        className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
        disabled={isExporting}
        onClick={() => setShowMenu(!showMenu)}
      >
        <Download className="mr-2 h-5 w-5" />
        {isExporting ? "Exporting..." : "Download Stats"}
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            <button
              onClick={() => handleExport("json")}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <FileJson className="h-4 w-4" />
              <span>Export as JSON</span>
            </button>
            <button
              onClick={() => handleExport("markdown")}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors border-t border-gray-200 dark:border-gray-700"
            >
              <FileText className="h-4 w-4" />
              <span>Export as Markdown</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
