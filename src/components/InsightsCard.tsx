"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Insights } from "@/types";
import { Sparkles, Trophy, Calendar, Clock } from "lucide-react";

interface InsightsCardProps {
  insights: Insights;
}

const personalityEmojis: Record<string, string> = {
  "Night Owl": "🦉",
  "Early Bird": "🌅",
  "Nine-to-Fiver": "💼",
  "Weekend Warrior": "⚡",
};

const personalityDescriptions: Record<string, string> = {
  "Night Owl": "You do your best work when the world is asleep!",
  "Early Bird": "Rising with the sun, coding at dawn!",
  "Nine-to-Fiver": "Consistent and reliable, business hours champion!",
  "Weekend Warrior": "Making the most of those Saturday commits!",
};

export function InsightsCard({ insights }: InsightsCardProps) {
  const personalityEmoji = personalityEmojis[insights.personality] || "✨";
  const personalityDesc =
    personalityDescriptions[insights.personality] ||
    "You have a unique coding style!";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-none shadow-2xl min-h-[400px]">
        <CardHeader className="text-center space-y-2">
          <div className="text-6xl mb-2">
            <Sparkles className="w-16 h-16 mx-auto" />
          </div>
          <CardTitle className="text-2xl md:text-3xl text-white">
            Your Developer Personality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personality Type */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-2"
          >
            <div className="text-7xl">{personalityEmoji}</div>
            <h3 className="text-3xl font-bold">{insights.personality}</h3>
            <p className="text-white/90 text-lg">{personalityDesc}</p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm text-white/80">Busiest Month</div>
              <div className="text-xl font-bold">{insights.busiestMonth}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm text-white/80">Peak Hour</div>
              <div className="text-xl font-bold">
                {insights.favoriteCommitHour}:00
              </div>
            </div>
          </motion.div>

          {/* Top Languages */}
          {insights.topFileExtensions.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5" />
                <h4 className="font-semibold">Top Languages</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.topFileExtensions.slice(0, 5).map((ext) => (
                  <div
                    key={ext.ext}
                    className="bg-white/20 px-3 py-1 rounded-full text-sm"
                  >
                    {ext.ext} ({ext.count})
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Busiest Day */}
          {insights.busiestDay && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="text-white/80 text-sm">
                You love coding on{" "}
                <span className="font-bold text-white">
                  {insights.busiestDay}s
                </span>
                !
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
