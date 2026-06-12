"use client";

import { motion } from "framer-motion";
import { weeklyRevenue } from "@/lib/data";

export default function RevenueChart() {
  const maxRevenue = Math.max(...weeklyRevenue.map((d) => d.revenue));

  return (
    <div className="bg-[#111111] border border-[#242424] p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs tracking-widest uppercase text-[#A39E96] mb-1">Weekly Revenue</div>
          <div className="font-display text-2xl text-[#F8F6F1]">
            £{weeklyRevenue.reduce((a, b) => a + b.revenue, 0).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          This week
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-2 h-36">
        {weeklyRevenue.map((item, i) => {
          const heightPercent = (item.revenue / maxRevenue) * 100;
          const isMax = item.revenue === maxRevenue;

          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full relative flex items-end" style={{ height: "120px" }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full transition-all duration-200 relative ${
                    isMax
                      ? "bg-[#CC1A1A]"
                      : "bg-[#1e1e1e] group-hover:bg-[#2a2a2a]"
                  }`}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#242424] text-[#F8F6F1] text-[9px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    £{item.revenue.toLocaleString()}
                  </div>
                </motion.div>
              </div>
              <span className="text-[10px] text-[#A39E96]">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
