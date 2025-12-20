"use client";

import { useState, useEffect, useCallback } from "react";
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
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import type { WrappedConfig, ProjectRepository } from "@/types";

export type { WrappedConfig } from "@/types";

interface ConfigFormProps {
  onSubmit: (config: WrappedConfig) => void;
  loading?: boolean;
  initialConfig?: Partial<WrappedConfig>;
}

interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
}

interface RepositoryInfo {
  id: string;
  name: string;
  project: string; // Parent project name
  defaultBranch?: string;
}

export function ConfigForm({
  onSubmit,
  loading = false,
  initialConfig,
}: ConfigFormProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<WrappedConfig>(() => {
    // Start with default values only - we no longer load from localStorage
    // Config is saved to localStorage on submit for potential future use
    const defaults: WrappedConfig = {
      pat: "",
      organization: "",
      projects: [],
      repositories: [],
      year: new Date().getFullYear() - 1, // Default to last year
      userEmail: "",
    };

    return defaults;
  });

  // State for available projects from API
  const [availableProjects, setAvailableProjects] = useState<ProjectInfo[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // State for available repositories from API
  const [availableRepositories, setAvailableRepositories] = useState<
    RepositoryInfo[]
  >([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);

  // Apply initialConfig from server (env variables) when provided
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

  // Fetch projects when organization and PAT are both available
  const fetchProjects = useCallback(
    async (organization: string, pat: string) => {
      if (!organization.trim() || !pat.trim()) {
        setAvailableProjects([]);
        return;
      }

      setProjectsLoading(true);
      setProjectsError(null);

      try {
        const response = await fetch(
          `/api/projects?organization=${encodeURIComponent(organization)}`,
          {
            headers: {
              Authorization: `Bearer ${pat}`,
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch projects");
        }

        const data = await response.json();
        setAvailableProjects(data.projects || []);
        console.log(`📋 Loaded ${data.projects?.length || 0} projects`);
      } catch (error: any) {
        console.error("Failed to fetch projects:", error);
        setProjectsError(error.message);
        setAvailableProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    },
    []
  );

  // Fetch repositories when projects change
  const fetchRepositories = useCallback(
    async (organization: string, pat: string, projects: string[]) => {
      if (!organization.trim() || !pat.trim() || projects.length === 0) {
        setAvailableRepositories([]);
        return;
      }

      setReposLoading(true);
      setReposError(null);

      try {
        const response = await fetch(
          `/api/repositories?organization=${encodeURIComponent(
            organization
          )}&projects=${encodeURIComponent(projects.join(","))}`,
          {
            headers: {
              Authorization: `Bearer ${pat}`,
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch repositories");
        }

        const data = await response.json();
        setAvailableRepositories(data.repositories || []);
        console.log(
          `📦 Loaded ${data.repositories?.length || 0} repositories from ${
            projects.length
          } project(s)`
        );
      } catch (error: any) {
        console.error("Failed to fetch repositories:", error);
        setReposError(error.message);
        setAvailableRepositories([]);
      } finally {
        setReposLoading(false);
      }
    },
    []
  );

  // Debounced fetch when org or PAT changes
  // Only fetch when PAT looks complete (Azure DevOps PATs are 52+ chars)
  // and organization has no spaces (likely complete)
  const MIN_PAT_LENGTH = 50;
  useEffect(() => {
    const orgLooksComplete =
      config.organization.trim().length > 0 &&
      !config.organization.includes(" ");
    const patLooksComplete = config.pat.length >= MIN_PAT_LENGTH;

    if (!orgLooksComplete || !patLooksComplete) {
      return; // Don't fetch until both look complete
    }

    const timeoutId = setTimeout(() => {
      fetchProjects(config.organization, config.pat);
    }, 300); // Shorter delay since we wait for complete values

    return () => clearTimeout(timeoutId);
  }, [config.organization, config.pat, fetchProjects]);

  // Fetch repositories when projects change
  useEffect(() => {
    if (config.projects.length === 0) {
      setAvailableRepositories([]);
      // Clear selected repositories that no longer belong to selected projects
      if (config.repositories.length > 0) {
        setConfig((prev) => ({ ...prev, repositories: [] }));
      }
      return;
    }

    const orgLooksComplete =
      config.organization.trim().length > 0 &&
      !config.organization.includes(" ");
    const patLooksComplete = config.pat.length >= MIN_PAT_LENGTH;

    if (!orgLooksComplete || !patLooksComplete) {
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchRepositories(config.organization, config.pat, config.projects);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [config.organization, config.pat, config.projects, fetchRepositories]);

  // When projects change, filter out repositories that no longer belong to selected projects
  useEffect(() => {
    if (config.repositories.length > 0) {
      const validRepos = config.repositories.filter((repo) =>
        config.projects.includes(repo.project)
      );
      if (validRepos.length !== config.repositories.length) {
        setConfig((prev) => ({ ...prev, repositories: validRepos }));
      }
    }
  }, [config.projects]);

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
    if (!config.projects || config.projects.length === 0) {
      newErrors.projects = "At least one project must be selected";
    }
    if (!config.repositories || config.repositories.length === 0) {
      newErrors.repositories = "At least one repository must be selected";
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

  const handleChange = (
    field: keyof WrappedConfig,
    value: string | number | string[] | ProjectRepository[]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle repository selection - convert selected keys to ProjectRepository array
  const handleRepositoryChange = (selectedKeys: string[]) => {
    const repositories: ProjectRepository[] = selectedKeys.map((key) => {
      // Key format is "project/repo"
      const [project, ...repoParts] = key.split("/");
      const repository = repoParts.join("/"); // Handle repos with / in name
      return { project, repository };
    });
    handleChange("repositories", repositories);
  };

  // Convert projects to MultiSelect options
  const projectOptions: MultiSelectOption[] = availableProjects.map((p) => ({
    value: p.name,
    label: p.name,
    description: p.description,
  }));

  // Convert repositories to MultiSelect options with project prefix
  const repositoryOptions: MultiSelectOption[] = availableRepositories.map(
    (r) => ({
      value: `${r.project}/${r.name}`, // Unique key: project/repo
      label: r.name,
      description: `Project: ${r.project}`,
    })
  );

  // Get selected repository keys from config.repositories
  const selectedRepoKeys = config.repositories.map(
    (r) => `${r.project}/${r.repository}`
  );

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
              <p className="text-sm text-destructive">{errors.organization}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projects" className="text-slate-200">
              Projects *{" "}
              {config.projects.length > 0 && (
                <span className="text-slate-400 font-normal">
                  ({config.projects.length} selected)
                </span>
              )}
            </Label>
            <MultiSelect
              options={projectOptions}
              selected={config.projects}
              onChange={(selected) => handleChange("projects", selected)}
              placeholder={
                !config.organization || !config.pat
                  ? "Enter organization and PAT first..."
                  : "Select projects..."
              }
              disabled={loading || !config.organization || !config.pat}
              loading={projectsLoading}
              error={!!errors.projects}
              selectionLabel="projects"
              emptyLabel="No projects found"
            />
            {errors.projects && (
              <p className="text-sm text-destructive">{errors.projects}</p>
            )}
            {projectsError && (
              <p className="text-sm text-amber-500">
                Could not load projects: {projectsError}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Select one or more projects to include in your Wrapped.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repositories" className="text-slate-200">
              Repositories *{" "}
              {config.repositories.length > 0 && (
                <span className="text-slate-400 font-normal">
                  ({config.repositories.length} selected)
                </span>
              )}
            </Label>
            <MultiSelect
              options={repositoryOptions}
              selected={selectedRepoKeys}
              onChange={handleRepositoryChange}
              placeholder={
                config.projects.length === 0
                  ? "Select projects first..."
                  : reposLoading
                  ? "Loading repositories..."
                  : "Select repositories..."
              }
              disabled={loading || config.projects.length === 0}
              loading={reposLoading}
              error={!!errors.repositories}
              selectionLabel="repositories"
              emptyLabel="No repositories found"
            />
            {errors.repositories && (
              <p className="text-sm text-destructive">{errors.repositories}</p>
            )}
            {reposError && (
              <p className="text-sm text-amber-500">
                Could not load repositories: {reposError}
              </p>
            )}
            {/* Display selected repositories */}
            {config.repositories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {config.repositories.map((repo) => (
                  <span
                    key={`${repo.project}/${repo.repository}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  >
                    <span className="text-slate-400">{repo.project}/</span>
                    {repo.repository}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newRepos = config.repositories.filter(
                          (r) =>
                            r.project !== repo.project ||
                            r.repository !== repo.repository
                        );
                        handleChange("repositories", newRepos);
                      }}
                      className="hover:text-cyan-100"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Select one or more repositories to analyze.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0"
            disabled={loading || config.repositories.length === 0}
          >
            {loading ? "Generating..." : "Generate My Wrapped"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
