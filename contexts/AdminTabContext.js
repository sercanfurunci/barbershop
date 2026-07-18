"use client";

import { createContext, useContext } from "react";

// Shared context so nested components (e.g. KnowledgePage inside AIPlatformPage)
// can trigger the same tab change as clicking the sidebar — no second nav system.
export const AdminTabContext = createContext(null);

export function useAdminTab() {
  return useContext(AdminTabContext);
}
