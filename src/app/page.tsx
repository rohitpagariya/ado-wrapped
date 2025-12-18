"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfigForm, type WrappedConfig } from "@/components/ConfigForm";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Check for server-side config on mount
  useEffect(() => {
    const checkServerConfig = async () => {
      try {
        const response = await fetch("/api/config");
        const data = await response.json();

        if (data.hasConfig && data.config) {
          console.log(
            "✅ Server config found, auto-navigating to wrapped page"
          );
          // Store server config in sessionStorage with a flag
          sessionStorage.setItem(
            "ado-wrapped-config",
            JSON.stringify({
              ...data.config,
              useServerPAT: true, // Flag to tell wrapped page to use server PAT
            })
          );
          // Auto-navigate to wrapped page
          router.push("/wrapped");
        } else {
          console.log("ℹ️ No server config, showing form");
          setShowForm(true);
        }
      } catch (error) {
        console.error("Failed to check server config:", error);
        // Show form on error
        setShowForm(true);
      } finally {
        setCheckingConfig(false);
      }
    };

    checkServerConfig();
  }, [router]);

  const handleSubmit = async (config: WrappedConfig) => {
    setLoading(true);

    try {
      // Store config in sessionStorage for the wrapped page to use
      sessionStorage.setItem("ado-wrapped-config", JSON.stringify(config));

      // Navigate to wrapped page
      router.push("/wrapped");
    } catch (error: any) {
      console.error("Configuration error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Show loading state while checking config
  if (checkingConfig) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking configuration...</p>
        </div>
      </main>
    );
  }

  // Don't show form until we've checked for server config
  if (!showForm) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
      <div className="w-full max-w-4xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Azure DevOps Wrapped
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover your year in code with beautiful insights, stats, and
            achievements from your Azure DevOps repositories.
          </p>
        </div>

        {/* Configuration Form */}
        <div className="flex justify-center">
          <ConfigForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Your data stays private. We never store your Personal Access Token
            or any sensitive information.
          </p>
        </div>
      </div>
    </main>
  );
}
