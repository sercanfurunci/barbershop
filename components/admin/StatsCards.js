"use client";

import { motion } from "framer-motion";
import { adminStats } from "@/lib/data";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Star } from "lucide-react";

const cards = [
  {
    label: "Revenue (Month)",
    key: "totalRevenue",
    change: "revenueChange",
    icon: DollarSign,
    format: (v) => `£${v.toLocaleString()}`,
    color: "#CC1A1A",
  },
  {
    label: "Appointments",
    key: "totalAppointments",
    change: "appointmentsChange",
    icon: Calendar,
    format: (v) => v.toString(),
    color: "#F8F6F1",
  },
  {
    label: "New Clients",
    key: "newClients",
    change: "clientsChange",
    icon: Users,
    format: (v) => v.toString(),
    color: "#F8F6F1",
  },
  {
    label: "Avg Rating",
    key: "avgRating",
    change: "ratingChange",
    icon: Star,
    format: (v) => v.toFixed(2),
    color: "#F8F6F1",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const value = adminStats[card.key];
        const change = adminStats[card.change];
        const isPositive = change >= 0;

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-[#111111] border border-[#242424] p-5 relative overflow-hidden group hover:border-[#CC1A1A]/30 transition-colors"
          >
            {/* Background glow for first card */}
            {i === 0 && (
              <div className="absolute inset-0 bg-[#CC1A1A]/3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            {/* Icon */}
            <div className={`w-9 h-9 flex items-center justify-center mb-4 ${i === 0 ? "bg-[#CC1A1A]" : "bg-[#1a1a1a] border border-[#242424]"}`}>
              <Icon size={15} className={i === 0 ? "text-white" : "text-[#A39E96]"} />
            </div>

            {/* Value */}
            <div className="font-display text-3xl text-[#F8F6F1] mb-1">
              {card.format(value)}
            </div>

            {/* Label */}
            <div className="text-xs text-[#A39E96] tracking-wider mb-3">{card.label}</div>

            {/* Change indicator */}
            <div className={`flex items-center gap-1 text-xs ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              <span>{isPositive ? "+" : ""}{change}% vs last month</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
