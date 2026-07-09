"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import SalonPopup from "./SalonPopup";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function buildIcon(salon, isSelected, isHovered) {
  const letter = escapeHtml((salon.name?.[0] || "M").toUpperCase());
  const inner = salon.logo
    ? `<img src="${escapeHtml(salon.logo)}" style="width:100%;height:100%;object-fit:cover" onerror="this.outerHTML='<span class=\\'makas-marker__fallback\\'>${letter}</span>'" />`
    : `<span class="makas-marker__fallback">${letter}</span>`;
  const cls = isSelected ? " makas-marker--selected" : isHovered ? " makas-marker--hovered" : "";
  return L.divIcon({
    className: "", // suppress default leaflet-div-icon styles
    html: `<div class="makas-marker${cls}">${inner}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function SalonMarker({ salon, isSelected, isHovered, onSelect, userLoc }) {
  const markerRef = useRef(null);

  const icon = useMemo(() => buildIcon(salon, isSelected, isHovered), [salon, isSelected, isHovered]);

  // Open popup on selection — deferred past the 0.6s flyTo, which would close it
  useEffect(() => {
    if (!isSelected) return;
    const t = setTimeout(() => markerRef.current?.openPopup(), 650);
    return () => clearTimeout(t);
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[salon.latitude, salon.longitude]}
      icon={icon}
      zIndexOffset={isSelected ? 1000 : isHovered ? 900 : 0}
      eventHandlers={{ click: () => onSelect?.(salon) }}
    >
      {isHovered && !isSelected && (
        <Tooltip permanent direction="top" offset={[0, -26]} className="makas-tooltip">
          {salon.name}
        </Tooltip>
      )}
      <Popup offset={[0, -20]} closeButton={false} autoPan>
        <SalonPopup salon={salon} userLoc={userLoc} />
      </Popup>
    </Marker>
  );
}

// Re-render only when the salon reference or its selection/hover state changes.
export default memo(SalonMarker, (prev, next) =>
  prev.salon === next.salon &&
  prev.isSelected === next.isSelected &&
  prev.isHovered === next.isHovered &&
  prev.userLoc === next.userLoc &&
  prev.onSelect === next.onSelect
);
