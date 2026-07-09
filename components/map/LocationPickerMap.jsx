"use client";

// Draggable-marker location picker map (Leaflet/OSM).
// Loaded with next/dynamic { ssr: false }.
// Props:
//   lat, lng — current coords (null = no marker yet)
//   onPick(lat, lng) — fired on marker drag end or map click

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ISTANBUL = [41.0082, 28.9784];

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:38px;height:38px;border-radius:50% 50% 50% 4px;
    transform:rotate(-45deg);
    background:#111;border:2.5px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
  "><div style="width:10px;height:10px;border-radius:50%;background:#fff"></div></div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 34],
});

function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function FlyToCoords({ lat, lng }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (lat == null || lng == null) return;
    if (first.current) { first.current = false; return; } // initial center handles this
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.5 });
  }, [lat, lng, map]);
  return null;
}

export default function LocationPickerMap({ lat = null, lng = null, onPick }) {
  const hasCoords = lat != null && lng != null;

  const markerHandlers = useMemo(() => ({
    dragend(e) {
      const p = e.target.getLatLng();
      onPick(p.lat, p.lng);
    },
  }), [onPick]);

  return (
    <MapContainer
      center={hasCoords ? [lat, lng] : ISTANBUL}
      zoom={hasCoords ? 15 : 11}
      scrollWheelZoom
      style={{ width: "100%", height: "100%", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ClickToPlace onPick={onPick} />
      <FlyToCoords lat={lat} lng={lng} />
      {hasCoords && (
        <Marker
          position={[lat, lng]}
          icon={pinIcon}
          draggable
          eventHandlers={markerHandlers}
        />
      )}
    </MapContainer>
  );
}
