"use client";

// Small single-marker Leaflet map used by MiniMap (tenant landing page).
// Loaded with next/dynamic { ssr: false }.

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function pinIcon(logo, name) {
  const inner = logo
    ? `<img src="${logo}" style="width:100%;height:100%;object-fit:cover" />`
    : `<span style="color:#fff;font-weight:700;font-size:18px">${(name?.[0] || "M").toUpperCase()}</span>`;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:44px;height:44px;border-radius:50%;
      border:2.5px solid #fff;overflow:hidden;background:#111;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
    ">${inner}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

export default function MiniLeafletMap({ lat, lng, logo, name }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[lat, lng]} icon={pinIcon(logo, name)} />
    </MapContainer>
  );
}
