"use client";

// Reusable salon map — React Leaflet + OpenStreetMap.
// Props:
//   salons          — array of shops (needs latitude/longitude)
//   selectedSalonId — id of the currently selected salon (or null)
//   onSalonSelect   — callback(salon) fired on marker click
//   userLoc         — optional { lat, lng }
//   onUserLocate    — optional callback({ lat, lng }) when the Locate/Follow controls get a fix
//
// Must be loaded with next/dynamic { ssr: false } — Leaflet touches `window`.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import { Plus, Minus, LocateFixed, Navigation, Maximize } from "lucide-react";
import SalonMarker from "./SalonMarker";

import "leaflet/dist/leaflet.css";
import "react-leaflet-markercluster/styles";
import "./map.css";

const ISTANBUL = [41.015, 28.979];

// Satellite-ready: add an entry here and a toggle button appears automatically.
const TILE_LAYERS = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "",
    html: `<div class="makas-cluster">${count}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

const userIcon = () =>
  L.divIcon({
    className: "",
    html: `<div class="makas-user-dot"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

// Leaflet caches the container size at init; if the container was mid-layout
// the map anchors everything to (0,0). Re-validate on any container resize.
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

// Fits the viewport around the salons once per fitToken change (filter-driven
// refetches bump the token; "search this area" doesn't — the map must stay put).
// padBottomFraction reserves the lower part of the map (mobile bottom sheet).
function FitBounds({ salons, fitToken = 0, padBottomFraction = 0 }) {
  const map = useMap();
  const salonsRef = useRef(salons);
  salonsRef.current = salons;
  useEffect(() => {
    const pts = salonsRef.current
      .filter(s => s.latitude != null && s.longitude != null)
      .map(s => [s.latitude, s.longitude]);
    if (pts.length === 0) return;
    map.invalidateSize();
    const padBottom = 48 + map.getSize().y * padBottomFraction;
    if (pts.length === 1) {
      map.flyTo(pts[0], 15, { duration: 0.8 });
    } else {
      map.flyToBounds(L.latLngBounds(pts), {
        paddingTopLeft: [48, 48],
        paddingBottomRight: [48, padBottom],
        maxZoom: 15,
        duration: 0.8,
      });
    }
  }, [fitToken, map, padBottomFraction]);
  return null;
}

// Smooth first-locate experience: when the user's location arrives after mount
// (permission just granted), fly to it once — never an instant jump.
function FlyToUser({ userLoc }) {
  const map = useMap();
  const hadLocAtMount = useRef(userLoc != null);
  const flown = useRef(false);
  useEffect(() => {
    if (!userLoc || hadLocAtMount.current || flown.current) return;
    flown.current = true;
    map.flyTo([userLoc.lat, userLoc.lng], 15, { duration: 1.2 });
  }, [userLoc, map]);
  return null;
}

// After a user pan/zoom, offer "Bu bölgede ara" — fetches salons in the
// current bounds without moving the map or reloading the page.
function SearchArea({ onSearchArea }) {
  const map = useMap();
  const btnRef = useRef(null);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    // dragend fires only on user pans — programmatic flyTo never triggers it
    const onDrag = () => setMoved(true);
    map.on("dragend", onDrag);
    return () => map.off("dragend", onDrag);
  }, [map]);

  useEffect(() => {
    if (btnRef.current) L.DomEvent.disableClickPropagation(btnRef.current);
  }, [moved]);

  if (!moved || !onSearchArea) return null;
  return (
    <button
      ref={btnRef}
      type="button"
      className="makas-area-btn"
      onClick={() => {
        const b = map.getBounds();
        onSearchArea({ neLat: b.getNorth(), neLng: b.getEast(), swLat: b.getSouth(), swLng: b.getWest() });
        setMoved(false);
      }}
    >
      Bu bölgede ara
    </button>
  );
}

// Card hover → nudge the map only if the hovered marker is outside the padded view.
function HoverPan({ salon }) {
  const map = useMap();
  useEffect(() => {
    if (!salon?.latitude || !salon?.longitude) return;
    map.panInside([salon.latitude, salon.longitude], { padding: [60, 60] });
  }, [salon, map]);
  return null;
}

// Smoothly moves to the selected salon: gentle pan if it's already in view at a
// useful zoom, otherwise a single flyTo — never an abrupt jump.
function PanToSelected({ salon }) {
  const map = useMap();
  useEffect(() => {
    if (!salon?.latitude || !salon?.longitude) return;
    const target = L.latLng(salon.latitude, salon.longitude);
    const visible = map.getBounds().pad(-0.15).contains(target);
    if (visible && map.getZoom() >= 15) {
      map.panTo(target, { animate: true, duration: 0.4 });
    } else {
      map.flyTo(target, 16, { duration: 0.6 });
    }
  }, [salon, map]);
  return null;
}

// Floating controls: zoom, locate-me, follow-me, reset view.
function MapControls({ salons, userLoc, onUserLocate, padBottomFraction = 0 }) {
  const map = useMap();
  const boxRef = useRef(null);
  const [following, setFollowing] = useState(false);
  const watchId = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      L.DomEvent.disableClickPropagation(boxRef.current);
      L.DomEvent.disableScrollPropagation(boxRef.current);
    }
  }, []);

  // Follow me: keep panning to live position
  useEffect(() => {
    if (!following) {
      if (watchId.current != null) navigator.geolocation?.clearWatch(watchId.current);
      watchId.current = null;
      return;
    }
    if (!navigator.geolocation) { setFollowing(false); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onUserLocate?.(loc);
        map.panTo([loc.lat, loc.lng], { animate: true });
      },
      () => setFollowing(false),
      { enableHighAccuracy: true }
    );
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [following, map, onUserLocate]);

  const locate = useCallback(() => {
    if (userLoc) {
      map.flyTo([userLoc.lat, userLoc.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
      return;
    }
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onUserLocate?.(loc);
        map.flyTo([loc.lat, loc.lng], 15, { duration: 0.6 });
      },
      () => {}
    );
  }, [map, userLoc, onUserLocate]);

  const resetView = useCallback(() => {
    const pts = salons
      .filter(s => s.latitude != null && s.longitude != null)
      .map(s => [s.latitude, s.longitude]);
    if (pts.length === 0) { map.flyTo(ISTANBUL, 11); return; }
    if (pts.length === 1) { map.flyTo(pts[0], 15); return; }
    map.flyToBounds(L.latLngBounds(pts), {
      paddingTopLeft: [48, 48],
      paddingBottomRight: [48, 48 + map.getSize().y * padBottomFraction],
      maxZoom: 15,
    });
  }, [map, salons, padBottomFraction]);

  return (
    <div
      ref={boxRef}
      className="makas-map-controls"
      style={padBottomFraction ? { bottom: `calc(${padBottomFraction * 100}% + 16px)` } : undefined}
    >
      <button type="button" className="makas-map-btn" onClick={() => map.zoomIn()} title="Yakınlaştır" aria-label="Yakınlaştır">
        <Plus size={17} />
      </button>
      <button type="button" className="makas-map-btn" onClick={() => map.zoomOut()} title="Uzaklaştır" aria-label="Uzaklaştır">
        <Minus size={17} />
      </button>
      <button type="button" className="makas-map-btn" onClick={locate} title="Konumumu Bul" aria-label="Konumumu Bul">
        <LocateFixed size={17} />
      </button>
      <button
        type="button"
        className={`makas-map-btn${following ? " makas-map-btn--active" : ""}`}
        onClick={() => setFollowing(v => !v)}
        title="Beni Takip Et"
        aria-label="Beni Takip Et"
      >
        <Navigation size={16} />
      </button>
      <button type="button" className="makas-map-btn" onClick={resetView} title="Görünümü Sıfırla" aria-label="Görünümü Sıfırla">
        <Maximize size={16} />
      </button>
    </div>
  );
}

export default function SalonMap({ salons = [], selectedSalonId = null, hoveredSalonId = null, onSalonSelect, userLoc = null, onUserLocate, onSearchArea, fitToken = 0, padBottomFraction = 0, showPopup = true }) {
  const located = useMemo(
    () => salons.filter(s => s.latitude != null && s.longitude != null),
    [salons]
  );
  const selectedSalon = useMemo(
    () => located.find(s => s.id === selectedSalonId) ?? null,
    [located, selectedSalonId]
  );
  const hoveredSalon = useMemo(
    () => located.find(s => s.id === hoveredSalonId) ?? null,
    [located, hoveredSalonId]
  );

  // Stable callback so memoized markers don't re-render when parent re-renders
  const handleSelect = useCallback((salon) => { onSalonSelect?.(salon); }, [onSalonSelect]);

  const uIcon = useMemo(() => userIcon(), []);
  const tiles = TILE_LAYERS.standard;

  const center = userLoc ? [userLoc.lat, userLoc.lng] : ISTANBUL;

  return (
    <MapContainer
      center={center}
      zoom={userLoc ? 13 : 11}
      scrollWheelZoom
      zoomControl={false}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
      attributionControl
    >
      <TileLayer url={tiles.url} attribution={tiles.attribution} />

      <AutoResize />
      <FitBounds salons={located} fitToken={fitToken} padBottomFraction={padBottomFraction} />
      <FlyToUser userLoc={userLoc} />
      <PanToSelected salon={selectedSalon} />
      <HoverPan salon={hoveredSalon} />
      <MapControls salons={located} userLoc={userLoc} onUserLocate={onUserLocate} padBottomFraction={padBottomFraction} />
      <SearchArea onSearchArea={onSearchArea} />

      {userLoc && (
        <>
          {/* Subtle 5 km "nearby" radius around the user */}
          <Circle
            center={[userLoc.lat, userLoc.lng]}
            radius={5000}
            pathOptions={{ color: "#2563eb", weight: 1, opacity: 0.35, fillColor: "#2563eb", fillOpacity: 0.06 }}
            interactive={false}
          />
          <Marker position={[userLoc.lat, userLoc.lng]} icon={uIcon} interactive={false} />
        </>
      )}

      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={56}
        spiderfyOnMaxZoom
        iconCreateFunction={clusterIcon}
      >
        {located.map((salon) => (
          <SalonMarker
            key={salon.id}
            salon={salon}
            isSelected={salon.id === selectedSalonId}
            isHovered={salon.id === hoveredSalonId}
            onSelect={handleSelect}
            userLoc={userLoc}
            showPopup={showPopup}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
