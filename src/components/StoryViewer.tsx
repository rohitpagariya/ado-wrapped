"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { WrappedStats } from "@/types";
import type { StoryCardType } from "@/lib/constants";
import { StatsCard } from "@/components/StatsCard";
import { CommitHeatmap } from "@/components/CommitHeatmap";
import { LanguageChart } from "@/components/LanguageChart";
import { TimeDistributionChart } from "@/components/TimeDistributionChart";
import { PRStats } from "@/components/PRStats";
import { InsightsCard } from "@/components/InsightsCard";
import { ExportButton } from "@/components/ExportButton";
import { WorkItemStatsDisplay } from "@/components/WorkItemStats";
import { WorkItemTypeChart } from "@/components/WorkItemTypeChart";
import { BugStats } from "@/components/BugStats";
import { TopTagsChart } from "@/components/TopTagsChart";

interface StoryCard {
  type: StoryCardType;
  data: WrappedStats;
}

interface StoryViewerProps {
  stats: WrappedStats;
}

export function StoryViewer({ stats }: StoryViewerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Define all the story cards with type safety
  const cards: StoryCard[] = [
    { type: "welcome", data: stats },
    { type: "commits-total", data: stats },
    { type: "lines-of-code", data: stats },
    { type: "heatmap", data: stats },
    { type: "time-distribution", data: stats },
    { type: "languages", data: stats },
    { type: "streak", data: stats },
    { type: "pull-requests", data: stats },
    { type: "work-items-total", data: stats },
    { type: "work-items-types", data: stats },
    { type: "bugs-fixed", data: stats },
    { type: "resolution-speed", data: stats },
    { type: "top-tags", data: stats },
    { type: "insights", data: stats },
    { type: "finale", data: stats },
  ];

  const totalCards = cards.length;

  // Memoized navigation function to prevent unnecessary re-renders
  const navigate = useCallback(
    (newDirection: number) => {
      setDirection(newDirection);
      setCurrentIndex((prev) => {
        const next = prev + newDirection;
        if (next < 0) return 0;
        if (next >= totalCards) return totalCards - 1;
        return next;
      });
    },
    [totalCards]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "Escape") router.push("/");
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router, navigate]);

  const currentCard = cards[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50"
        onClick={() => router.push("/")}
        aria-label="Close and return to home"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Progress indicators */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-50"
        role="tablist"
        aria-label="Story progress"
      >
        {cards.map((card, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Go to slide ${
              index + 1
            } of ${totalCards}: ${card.type.replace("-", " ")}`}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`h-1 rounded-full transition-all duration-300 cursor-pointer hover:opacity-80 ${
              index === currentIndex
                ? "w-8 bg-white"
                : index < currentIndex
                ? "w-8 bg-white/50"
                : "w-8 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="w-full max-w-2xl relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full"
          >
            {renderCard(currentCard)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          disabled={currentIndex === 0}
          className="bg-white/90 hover:bg-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(1)}
          disabled={currentIndex === totalCards - 1}
          className="bg-white/90 hover:bg-white"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Export button on final card */}
      {currentIndex === totalCards - 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <ExportButton stats={stats} />
        </div>
      )}

      {/* Click zones for touch navigation */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
        onClick={() => navigate(-1)}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
        onClick={() => navigate(1)}
      />
    </div>
  );
}

function renderCard(card: { type: string; data: WrappedStats }) {
  switch (card.type) {
    case "welcome":
      return (
        <StatsCard
          title={`Your ${card.data.meta.year} Wrapped`}
          subtitle={`${card.data.meta.organization} / ${card.data.meta.project}`}
          variant="gradient"
        >
          <div className="text-center space-y-4">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Let&apos;s take a look at your year in code! 🚀
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Swipe, click arrows, or use keyboard to navigate →
            </p>
          </div>
        </StatsCard>
      );

    case "commits-total":
      return (
        <StatsCard
          title="Total Commits"
          value={card.data.commits.total.toLocaleString()}
          icon="📝"
          variant="blue"
        >
          <p className="text-center text-gray-600 dark:text-gray-400">
            {card.data.commits.total > 500
              ? "Wow! You've been busy! 🔥"
              : card.data.commits.total > 100
              ? "Great work this year! 💪"
              : "Every commit counts! 👍"}
          </p>
        </StatsCard>
      );

    case "lines-of-code":
      return (
        <StatsCard title="Lines of Code" icon="💻" variant="green">
          <div className="text-center space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  +{card.data.commits.additions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Added
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  -{card.data.commits.deletions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Removed
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                Net:{" "}
                {(
                  card.data.commits.additions - card.data.commits.deletions
                ).toLocaleString()}
              </div>
            </div>
          </div>
        </StatsCard>
      );

    case "heatmap":
      return (
        <StatsCard title="Your Contribution Calendar" variant="white">
          <CommitHeatmap
            commits={card.data.commits}
            year={card.data.meta.year}
          />
        </StatsCard>
      );

    case "time-distribution":
      return (
        <StatsCard title="When You Code" variant="white">
          <TimeDistributionChart commits={card.data.commits} />
        </StatsCard>
      );

    case "languages":
      return (
        <StatsCard title="Top Languages" variant="white">
          <LanguageChart extensions={card.data.insights.topFileExtensions} />
        </StatsCard>
      );

    case "streak":
      return (
        <StatsCard
          title="Longest Streak"
          value={`${card.data.commits.longestStreak} days`}
          icon="🔥"
          variant="orange"
        >
          <p className="text-center text-gray-600 dark:text-gray-400">
            {card.data.commits.longestStreak > 30
              ? "Incredible dedication! 🏆"
              : card.data.commits.longestStreak > 7
              ? "Consistency is key! 🌟"
              : "Keep building that streak! 💪"}
          </p>
        </StatsCard>
      );

    case "pull-requests":
      return (
        <StatsCard title="Pull Requests" variant="white">
          <PRStats pullRequests={card.data.pullRequests} />
        </StatsCard>
      );

    case "work-items-total":
      return (
        <StatsCard title="Work Items Resolved" variant="white">
          <WorkItemStatsDisplay workItems={card.data.workItems} />
        </StatsCard>
      );

    case "work-items-types":
      return (
        <StatsCard title="Work Item Types" variant="white">
          <WorkItemTypeChart byType={card.data.workItems.byType} />
        </StatsCard>
      );

    case "bugs-fixed":
      return (
        <StatsCard title="Bugs Squashed" variant="white">
          <BugStats workItems={card.data.workItems} />
        </StatsCard>
      );

    case "resolution-speed":
      return (
        <StatsCard
          title="Resolution Speed"
          value={
            card.data.workItems.avgResolutionDays
              ? `${card.data.workItems.avgResolutionDays.toFixed(1)} days`
              : "N/A"
          }
          icon="⚡"
          variant="purple"
        >
          <div className="text-center space-y-2">
            {card.data.workItems.fastestResolution && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fastest:{" "}
                <span className="font-semibold">
                  {card.data.workItems.fastestResolution.hours < 24
                    ? `${card.data.workItems.fastestResolution.hours} hours`
                    : `${Math.round(
                        card.data.workItems.fastestResolution.hours / 24
                      )} day${
                        Math.round(
                          card.data.workItems.fastestResolution.hours / 24
                        ) === 1
                          ? ""
                          : "s"
                      }`}
                </span>
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {card.data.workItems.avgResolutionDays
                ? card.data.workItems.avgResolutionDays < 3
                  ? "Lightning fast! ⚡"
                  : card.data.workItems.avgResolutionDays < 7
                  ? "Great turnaround! 🚀"
                  : "Steady and thorough! 🎯"
                : "No resolution data available"}
            </p>
          </div>
        </StatsCard>
      );

    case "top-tags":
      return (
        <StatsCard title="Your Top Tags" variant="white">
          <TopTagsChart topTags={card.data.workItems.topTags} />
        </StatsCard>
      );

    case "insights":
      return <InsightsCard insights={card.data.insights} />;

    case "finale":
      return (
        <StatsCard
          title="That's a Wrap!"
          subtitle={`Thank you for an amazing ${card.data.meta.year}! 🎉`}
          variant="gradient"
        >
          <div className="text-center space-y-4">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Here&apos;s to another year of great code! 🚀
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download your stats below to share with your team!
            </p>
          </div>
        </StatsCard>
      );

    default:
      return null;
  }
}
