"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigForm, type WrappedConfig } from "@/components/ConfigForm";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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
