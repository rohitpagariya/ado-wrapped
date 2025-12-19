"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { WrappedConfig } from "@/types";

// Re-export for backward compatibility
export type { WrappedConfig } from "@/types";

interface ConfigFormProps {
  onSubmit: (config: WrappedConfig) => void;
  loading?: boolean;
  initialConfig?: Partial<WrappedConfig>;
}

export function ConfigForm({
  onSubmit,
  loading = false,
  initialConfig,
}: ConfigFormProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<WrappedConfig>(() => {
    // Start with default values
    const defaults: WrappedConfig = {
      pat: "",
      organization: "",
      project: "",
      repository: "",
      year: new Date().getFullYear() - 1, // Default to last year
      userEmail: "",
    };

    // Try to load from localStorage (non-sensitive config persisted across sessions)
    // The PAT is explicitly excluded when saving (see handleSubmit) for security.
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ado-wrapped-config");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...defaults, ...parsed };
        } catch (e) {
          console.error("Failed to parse saved config:", e);
        }
      }
    }

    return defaults;
  });

  // Apply initialConfig from server (env variables) when provided
  // This runs after mount, allowing server config to override localStorage
  useEffect(() => {
    if (initialConfig) {
      console.log("📋 Pre-populating form with server config:", initialConfig);
      setConfig((prev) => ({
        ...prev,
        ...initialConfig,
        // Never override PAT from server for security
        pat: prev.pat,
      }));
    }
  }, [initialConfig]);

  const [errors, setErrors] = useState<
    Partial<Record<keyof WrappedConfig, string>>
  >({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WrappedConfig, string>> = {};

    if (!config.pat.trim()) {
      newErrors.pat = "Personal Access Token is required";
    }
    if (!config.organization.trim()) {
      newErrors.organization = "Organization name is required";
    }
    if (!config.project.trim()) {
      newErrors.project = "Project name is required";
    }
    if (!config.repository.trim()) {
      newErrors.repository = "Repository name is required";
    }
    if (
      !config.year ||
      config.year < 2010 ||
      config.year > new Date().getFullYear()
    ) {
      newErrors.year = "Please enter a valid year";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage (excluding PAT for security)
    const configToSave = { ...config };
    delete (configToSave as any).pat; // Don't save PAT
    localStorage.setItem("ado-wrapped-config", JSON.stringify(configToSave));

    onSubmit(config);
  };

  const handleChange = (field: keyof WrappedConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Configure Your Wrapped</CardTitle>
        <CardDescription className="text-slate-400">
          Enter your Azure DevOps credentials and repository details to generate
          your year in review.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pat" className="text-slate-200">
              Personal Access Token (PAT) *
            </Label>
            <Input
              id="pat"
              type="password"
              placeholder="Enter your Azure DevOps PAT"
              value={config.pat}
              onChange={(e) => handleChange("pat", e.target.value)}
              disabled={loading}
              className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 ${
                errors.pat ? "border-destructive" : ""
              }`}
            />
            {errors.pat && (
              <p className="text-sm text-destructive">{errors.pat}</p>
            )}
            <p className="text-xs text-slate-500">
              Your PAT is used only to fetch data and is not stored permanently.
            </p>
            <p className="text-xs text-slate-500">
              Requires <span className="text-cyan-400">Read</span> permissions
              for <span className="text-cyan-400">Code</span>,{" "}
              <span className="text-cyan-400">Work Items</span>, and{" "}
              <span className="text-cyan-400">Identity</span> scopes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization" className="text-slate-200">
                Organization *
              </Label>
              <Input
                id="organization"
                placeholder="e.g., microsoft"
                value={config.organization}
                onChange={(e) => handleChange("organization", e.target.value)}
                disabled={loading}
                className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 ${
                  errors.organization ? "border-destructive" : ""
                }`}
              />
              {errors.organization && (
                <p className="text-sm text-destructive">
                  {errors.organization}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project" className="text-slate-200">
                Project *
              </Label>
              <Input
                id="project"
                placeholder="e.g., vscode"
                value={config.project}
                onChange={(e) => handleChange("project", e.target.value)}
                disabled={loading}
                className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 ${
                  errors.project ? "border-destructive" : ""
                }`}
              />
              {errors.project && (
                <p className="text-sm text-destructive">{errors.project}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repository" className="text-slate-200">
                Repository *
              </Label>
              <Input
                id="repository"
                placeholder="e.g., vscode"
                value={config.repository}
                onChange={(e) => handleChange("repository", e.target.value)}
                disabled={loading}
                className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 ${
                  errors.repository ? "border-destructive" : ""
                }`}
              />
              {errors.repository && (
                <p className="text-sm text-destructive">{errors.repository}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-slate-200">
                Year *
              </Label>
              <Input
                id="year"
                type="number"
                min="2010"
                max={new Date().getFullYear()}
                value={config.year}
                onChange={(e) => handleChange("year", parseInt(e.target.value))}
                disabled={loading}
                className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 ${
                  errors.year ? "border-destructive" : ""
                }`}
              />
              {errors.year && (
                <p className="text-sm text-destructive">{errors.year}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userEmail" className="text-slate-200">
              User Email (Optional)
            </Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="filter@example.com"
              value={config.userEmail}
              onChange={(e) => handleChange("userEmail", e.target.value)}
              disabled={loading}
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              Filter commits and PRs by a specific user email.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate My Wrapped"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
