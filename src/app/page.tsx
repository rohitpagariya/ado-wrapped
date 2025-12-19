"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConfigForm, type WrappedConfig } from "@/components/ConfigForm";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [envConfig, setEnvConfig] = useState<Partial<WrappedConfig> | null>(
    null
  );
  const hasCheckedConfig = useRef(false);

  // Check for server-side config on mount to pre-populate form
  useEffect(() => {
    // Prevent double-execution in React StrictMode
    if (hasCheckedConfig.current) {
      return;
    }
    hasCheckedConfig.current = true;

    const checkServerConfig = async () => {
      try {
        console.log("🔍 Checking server config for pre-population...");
        const response = await fetch("/api/config");

        if (response.ok) {
          const data = await response.json();
          console.log("📋 Config response:", data);

          if (data.config) {
            console.log("✅ Server config found, will pre-populate form");
            // Store config for pre-population (PAT is not included from server)
            setEnvConfig(data.config);
          }
        }
      } catch (error) {
        console.error("❌ Failed to check server config:", error);
        // Continue without pre-population
      } finally {
        setIsReady(true);
      }
    };

    checkServerConfig();
  }, []);

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
  if (!isReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-4xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-4xl">🎁</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Azure DevOps Wrapped
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Discover your year in code with beautiful insights, stats, and
            achievements from your Azure DevOps repositories.
          </p>
        </div>

        {/* Configuration Form */}
        <div className="flex justify-center">
          <ConfigForm
            onSubmit={handleSubmit}
            loading={loading}
            initialConfig={envConfig ?? undefined}
          />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>
            Your data stays private. We never store your Personal Access Token
            or any sensitive information.
          </p>
        </div>
      </div>
    </main>
  );
}
