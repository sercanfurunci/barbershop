"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Settings2, MessageSquare, FlaskConical, BarChart2, Activity, Brain, ThumbsUp, GitCompare } from "lucide-react";
import { C } from "@/lib/adminTheme";
import { AdminPageHeader, DSTabBar } from "@/components/ds";

const loading = () => <div style={{ padding: "20px", color: C.muted, fontSize: "13px" }}>Yükleniyor…</div>;

const KnowledgePage     = dynamic(() => import("./ai/KnowledgePage"),     { loading, ssr: false });
const AISettingsPage    = dynamic(() => import("./ai/AISettingsPage"),    { loading, ssr: false });
const ConversationsPage = dynamic(() => import("./ai/ConversationsPage"), { loading, ssr: false });
const AIPlaygroundPage  = dynamic(() => import("./ai/AIPlaygroundPage"),  { loading, ssr: false });
const AIAnalyticsPage   = dynamic(() => import("./ai/AIAnalyticsPage"),   { loading, ssr: false });
const AIHealthPage      = dynamic(() => import("./ai/AIHealthPage"),      { loading, ssr: false });
const AIMemoryPage      = dynamic(() => import("./ai/AIMemoryPage"),      { loading, ssr: false });
const AIFeedbackPage    = dynamic(() => import("./ai/AIFeedbackPage"),    { loading, ssr: false });
const AIEvaluatePage    = dynamic(() => import("./ai/AIEvaluatePage"),    { loading, ssr: false });

const TABS = [
  { id: "knowledge",     label: "Bilgi Bankası",  icon: BookOpen       },
  { id: "settings",      label: "AI Ayarları",    icon: Settings2      },
  { id: "conversations", label: "Konuşmalar",     icon: MessageSquare  },
  { id: "playground",    label: "Playground",     icon: FlaskConical   },
  { id: "analytics",     label: "Analitik",       icon: BarChart2      },
  { id: "health",        label: "Sağlık",         icon: Activity       },
  { id: "memory",        label: "Hafıza",         icon: Brain          },
  { id: "feedback",      label: "Geri Bildirim",  icon: ThumbsUp       },
  { id: "evaluate",      label: "Karşılaştır",    icon: GitCompare     },
];

export default function AIPlatformPage() {
  const [tab, setTab] = useState("knowledge");

  return (
    <div>
      <DSTabBar tabs={TABS} active={tab} onChange={setTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {tab === "knowledge"     && <KnowledgePage />}
          {tab === "settings"      && <AISettingsPage />}
          {tab === "conversations" && <ConversationsPage />}
          {tab === "playground"    && <AIPlaygroundPage />}
          {tab === "analytics"     && <AIAnalyticsPage />}
          {tab === "health"        && <AIHealthPage />}
          {tab === "memory"        && <AIMemoryPage />}
          {tab === "feedback"      && <AIFeedbackPage />}
          {tab === "evaluate"      && <AIEvaluatePage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
