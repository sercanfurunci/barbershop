import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PublicShop } from "@/types/api";

const KEY = "recently_viewed_salons";
const MAX = 10;

export type RecentShop = Pick<
  PublicShop,
  "id" | "slug" | "name" | "logo" | "coverImage" | "city" | "avgRating"
>;

async function getRecent(): Promise<RecentShop[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentShop[];
  } catch {
    return [];
  }
}

async function recordView(shop: RecentShop): Promise<void> {
  try {
    const current = await getRecent();
    const filtered = current.filter((s) => s.id !== shop.id);
    const next = [shop, ...filtered].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // non-critical
  }
}

async function clearRecent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // non-critical
  }
}

export const recentlyViewed = { getRecent, recordView, clearRecent };
