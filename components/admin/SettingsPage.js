"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Calendar, Store } from "lucide-react";
import { C } from "@/lib/adminTheme";
import { AdminPageHeader, DSTabBar } from "@/components/ds";

const loading = () => <div style={{ padding: "20px", color: C.muted }}>Yükleniyor…</div>;

const ShopProfileTab   = dynamic(() => import("./settings/ShopProfileTab"),   { loading, ssr: false });
const WorkingHoursTab  = dynamic(() => import("./settings/WorkingHoursTab"),  { loading, ssr: false });
const HolidaysTab      = dynamic(() => import("./settings/HolidaysTab"),      { loading, ssr: false });
const RulesTab         = dynamic(() => import("./settings/RulesTab"),         { loading, ssr: false });

const TABS = [
  { id: "profile",  label: "Salon Profili",     icon: Store    },
  { id: "hours",    label: "Çalışma Saatleri",  icon: Clock    },
  { id: "holidays", label: "Tatil Günleri",      icon: Calendar },
  { id: "rules",    label: "Randevu Kuralları",  icon: Clock    },
];

export default function SettingsPage({ defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? "profile");

  // When parent signals a sub-tab (e.g. clicking "Manage Working Hours" in KnowledgePage)
  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  return (
    <div>
      <AdminPageHeader
        title="Ayarlar"
        sub="Çalışma saatleri, tatil günleri ve randevu kuralları"
      />

      <DSTabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "profile"  && <ShopProfileTab />}
          {activeTab === "hours"    && <WorkingHoursTab />}
          {activeTab === "holidays" && <HolidaysTab />}
          {activeTab === "rules"    && <RulesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
