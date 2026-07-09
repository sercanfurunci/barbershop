// Shared geo utilities — used by both web (Next.js) and mobile (Expo via alias).

const R = 6371; // Earth radius in km

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Haversine distance between two lat/lng pairs. Returns km.
export function haversine(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Format distance for display: meters below 1 km ("350 m"), km above ("1.2 km")
export function fmtDistance(km) {
  if (km < 1)  return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${Math.round(km * 10) / 10} km`;
  return `${Math.round(km)} km`;
}

// Sort shops by distance from (lat, lng). Shops without coordinates go last.
export function sortByDistance(shops, lat, lng) {
  return [...shops].sort((a, b) => {
    const da = (a.latitude != null && a.longitude != null)
      ? haversine(lat, lng, a.latitude, a.longitude)
      : Infinity;
    const db = (b.latitude != null && b.longitude != null)
      ? haversine(lat, lng, b.latitude, b.longitude)
      : Infinity;
    return da - db;
  });
}

// Returns shops within maxKm of (lat, lng).
export function filterNearby(shops, lat, lng, maxKm = 10) {
  return shops.filter((s) =>
    s.latitude != null && s.longitude != null &&
    haversine(lat, lng, s.latitude, s.longitude) <= maxKm
  );
}
