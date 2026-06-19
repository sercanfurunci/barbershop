"use client";

import { createContext, useContext } from "react";

const ShopContext = createContext(null);

export function useShop() {
  return useContext(ShopContext);
}

export default function ShopProvider({ shop, children }) {
  return <ShopContext.Provider value={shop}>{children}</ShopContext.Provider>;
}
