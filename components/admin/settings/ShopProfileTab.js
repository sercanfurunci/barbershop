"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Save, CheckCircle, AlertCircle, Upload, Trash2, Image as ImageIcon,
  Plus, X, GripVertical, Copy, Download, QrCode, MapPin,
} from "lucide-react";
import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";

// ── Shared helpers ─────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: "11px", fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</div>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: "10px", color: C.dim, marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}

function SocialLinkField({ label, value, onChange, placeholder, fi }) {
  return (
    <Field label={label}>
      <input value={value} onChange={onChange} placeholder={placeholder} style={fi} />
    </Field>
  );
}

// ── UploadField ────────────────────────────────────────────────────────────────

function UploadField({ label, endpoint, current, aspect = "1 / 1", onChange, hint }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Sadece görsel yükleyin"); return; }
    if (file.size > 5 * 1024 * 1024)     { setErr("5 MB'dan büyük olamaz");   return; }
    setBusy(true); setErr(null);
    try {
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(file);
      });
      const r = await apiFetch(endpoint, { method: "POST", body: JSON.stringify({ dataUrl }) });
      onChange(Object.values(r)[0]);
    } catch (ex) {
      setErr(ex.message || "Yüklenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Görseli silmek istediğine emin misin?")) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(endpoint, { method: "DELETE" });
      onChange(null);
    } catch (ex) {
      setErr(ex.message || "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{
        position: "relative", aspectRatio: aspect, width: "100%", maxWidth: 180,
        background: C.surface, border: `1px dashed ${C.border}`, borderRadius: "10px",
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button type="button" onClick={remove} disabled={busy}
              style={{
                position: "absolute", top: 6, right: 6, padding: "5px 7px",
                background: "rgba(0,0,0,0.55)", color: "#fff", border: "none",
                borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11,
              }}>
              <Trash2 size={11} /> Sil
            </button>
          </>
        ) : (
          <div style={{ color: C.muted, fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <ImageIcon size={20} />
            Görsel yok
          </div>
        )}
        <label style={{
          position: "absolute", bottom: 6, left: 6,
          padding: "6px 10px", background: "rgba(255,255,255,0.94)",
          border: `1px solid ${C.border}`, borderRadius: 999, fontSize: 11, fontWeight: 600,
          cursor: busy ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, color: C.primary,
        }}>
          <Upload size={11} /> {current ? "Değiştir" : "Yükle"}
          <input type="file" accept="image/*" onChange={pick} disabled={busy} style={{ display: "none" }} />
        </label>
      </div>
      {hint && <div style={{ fontSize: "10px", color: C.dim, marginTop: 6 }}>{hint}</div>}
      {err && <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 4 }}>{err}</div>}
    </div>
  );
}

// ── GalleryGrid ────────────────────────────────────────────────────────────────

function SortableTile({ url, busy, onRemove, isCover }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        aspectRatio: "1 / 1",
        borderRadius: 8,
        overflow: "hidden",
        background: C.surface,
        border: isCover ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 5 : 1,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} loading="lazy" />

      {isCover && (
        <span style={{
          position: "absolute", bottom: 4, left: 4,
          padding: "2px 8px", borderRadius: 999,
          background: C.primary, color: "#fff",
          fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
        }}>
          KAPAK
        </span>
      )}

      {/* Drag handle — top-left */}
      <button
        type="button"
        aria-label="Sürükleyerek sırala"
        {...attributes}
        {...listeners}
        style={{
          position: "absolute", top: 4, left: 4, padding: 4,
          background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
          borderRadius: 999, cursor: "grab", display: "flex", alignItems: "center",
          touchAction: "none",
        }}
      >
        <GripVertical size={12} />
      </button>

      {/* Remove — top-right */}
      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        aria-label="Fotoğrafı sil"
        style={{
          position: "absolute", top: 4, right: 4, padding: 4,
          background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
          borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center",
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function GalleryGrid({ items, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function addMany(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true); setErr(null);
    let current = items;
    try {
      for (const file of files) {
        if (current.length >= 12) { setErr("Galeri en fazla 12 fotoğraf alır"); break; }
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) { setErr(`${file.name}: 5 MB'dan büyük`); continue; }
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload  = () => res(r.result);
          r.onerror = () => rej(r.error);
          r.readAsDataURL(file);
        });
        const r = await apiFetch("/api/admin/shop/gallery", { method: "POST", body: JSON.stringify({ dataUrl }) });
        current = r.gallery;
        onChange(current);
      }
    } catch (ex) {
      setErr(ex.message || "Yüklenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function remove(index) {
    if (!confirm("Bu fotoğrafı silmek istediğine emin misin?")) return;
    setBusy(true); setErr(null);
    try {
      const r = await apiFetch("/api/admin/shop/gallery", { method: "DELETE", body: JSON.stringify({ index }) });
      onChange(r.gallery);
    } catch (ex) {
      setErr(ex.message || "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  async function onDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    // Optimistic — revert on server reject.
    onChange(next);
    setErr(null);
    try {
      const r = await apiFetch("/api/admin/shop/gallery", { method: "PUT", body: JSON.stringify({ order: next }) });
      onChange(r.gallery);
    } catch (ex) {
      onChange(items);
      setErr(ex.message || "Sıralanamadı");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 10,
          }}>
            {items.map((url, i) => (
              <SortableTile key={url} url={url} busy={busy} isCover={i === 0} onRemove={() => remove(i)} />
            ))}
            {items.length < 12 && (
              <label style={{
                aspectRatio: "1 / 1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 8,
                color: C.muted, fontSize: 11, cursor: busy ? "wait" : "pointer",
              }}>
                <Plus size={18} />
                {busy ? "Yükleniyor…" : "Ekle"}
                <input type="file" multiple accept="image/*" onChange={addMany} disabled={busy} style={{ display: "none" }} />
              </label>
            )}
          </div>
        </SortableContext>
      </DndContext>
      {items.length > 1 && (
        <div style={{ fontSize: 11, color: C.muted }}>
          İpucu: sürükle-bırak ile sırala. İlk fotoğraf otomatik olarak kapak görseliniz olur.
        </div>
      )}
      {err && <div style={{ fontSize: 11, color: "#b91c1c" }}>{err}</div>}
    </div>
  );
}

// ── LocationPicker ─────────────────────────────────────────────────────────────

const LocationPickerMap = dynamic(() => import("@/components/map/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: C.muted }}>
      Harita yükleniyor…
    </div>
  ),
});

function nominatimCity(address) {
  return address?.province || address?.state || address?.city || "";
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=tr&addressdetails=1`
    );
    const json = await res.json();
    if (!json?.display_name) return { formattedAddress: "", placeId: "" };
    const city = nominatimCity(json.address);
    return {
      formattedAddress: json.display_name,
      placeId: String(json.place_id ?? ""),
      ...(city ? { city } : {}),
    };
  } catch {
    return { formattedAddress: "", placeId: "" };
  }
}

function LocationPicker({ latitude, longitude, formattedAddress, placeId, fi, onChange }) {
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState(formattedAddress || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);
  const skipSearch = useRef(false);

  const lat = latitude  !== "" ? Number(latitude)  : null;
  const lng = longitude !== "" ? Number(longitude) : null;
  const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

  // Debounced Nominatim search
  useEffect(() => {
    if (skipSearch.current) { skipSearch.current = false; return; }
    clearTimeout(searchTimer.current);
    if (!query || query.trim().length < 3) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=tr&limit=5&addressdetails=1&accept-language=tr`
        );
        setResults(await res.json());
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  const handlePick = useCallback(async (newLat, newLng) => {
    setGeocoding(true);
    const geo = await reverseGeocode(newLat, newLng);
    setGeocoding(false);
    onChange({ latitude: newLat, longitude: newLng, ...geo });
  }, [onChange]);

  function selectResult(r) {
    skipSearch.current = true;
    setQuery(r.display_name);
    setResults([]);
    const city = nominatimCity(r.address);
    onChange({
      latitude: Number(r.lat),
      longitude: Number(r.lon),
      formattedAddress: r.display_name,
      placeId: String(r.place_id ?? ""),
      ...(city ? { city } : {}),
    });
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await handlePick(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => { setLocating(false); }
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Address search */}
      <div style={{ position: "relative" }}>
        <Field label="Konum Ara">
          <input
            type="text"
            placeholder="Adres ara veya haritada işaretle…"
            style={fi}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        {(results.length > 0 || searching) && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
            background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8,
            boxShadow: SHADOW, overflow: "hidden", marginTop: 4,
          }}>
            {searching && (
              <div style={{ padding: "8px 12px", fontSize: 12, color: C.muted }}>Aranıyor…</div>
            )}
            {results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => selectResult(r)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 12px", fontSize: 12, color: C.primary,
                  background: "none", border: "none", cursor: "pointer",
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Use my location button */}
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.surface, color: C.primary,
          fontSize: 12, fontWeight: 500, cursor: locating ? "not-allowed" : "pointer",
          opacity: locating ? 0.6 : 1,
        }}
      >
        {locating ? "Konum alınıyor…" : "📍 Konumumu Kullan"}
      </button>

      {/* Interactive map */}
      <div
        style={{
          height: 300, borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.surface, overflow: "hidden",
          position: "relative",
        }}
      >
        <LocationPickerMap
          lat={hasCoords ? lat : null}
          lng={hasCoords ? lng : null}
          onPick={handlePick}
        />
        {geocoding && (
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", zIndex: 500, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, padding: "4px 10px", borderRadius: 99 }}>
            Adres alınıyor…
          </div>
        )}
      </div>

      {/* Read-only coord display + formattedAddress */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Enlem (lat)">
          <div style={{ ...fi, color: hasCoords ? C.primary : C.muted, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
            {hasCoords ? lat.toFixed(6) : "—"}
          </div>
        </Field>
        <Field label="Boylam (lng)">
          <div style={{ ...fi, color: hasCoords ? C.primary : C.muted, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
            {hasCoords ? lng.toFixed(6) : "—"}
          </div>
        </Field>
      </div>
      {formattedAddress && (
        <div style={{ fontSize: 11, color: C.secondary, display: "flex", alignItems: "center", gap: 5 }}>
          <MapPin size={11} />
          {formattedAddress}
        </div>
      )}
      <div style={{ fontSize: 10, color: C.muted }}>
        Haritaya tıklayın veya işareti sürükleyerek konumu güncelleyin.
      </div>
    </div>
  );
}

// ── QRSection ──────────────────────────────────────────────────────────────────

function QRSection({ slug }) {
  // ponytail: external QR API (api.qrserver.com). Swap to `qrcode` npm package
  // if uptime/offline matters. Saves an install + a server route.
  const url = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `/${slug}`;
  const qrPng = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=12&data=${encodeURIComponent(url)}`;
  const qrThumb = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(url)}`;
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <Section title="QR Kod & Bağlantı">
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <img
          src={qrThumb}
          alt="Salon QR"
          width={120}
          height={120}
          style={{ borderRadius: "8px", border: `1px solid ${C.border}`, background: "#fff" }}
        />
        <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "12px", color: C.muted }}>
            Müşterileriniz QR&apos;ı okutarak salon sayfanıza ulaşır.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <code style={{
              fontSize: "12px", padding: "6px 10px", background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: "6px", color: C.primary,
              wordBreak: "break-all",
            }}>{url}</code>
            <button type="button" onClick={copyLink}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", fontSize: "12px", fontWeight: 600, background: "#fff", border: `1px solid ${C.border}`, borderRadius: "6px", cursor: "pointer", color: C.primary }}>
              <Copy size={12} /> {copied ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a href={qrPng} download={`makas-${slug}-qr.png`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: 600, background: C.primary, color: "#fff", borderRadius: "8px", textDecoration: "none" }}>
              <Download size={13} /> QR İndir (PNG)
            </a>
            <a href={`/${slug}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: 600, background: "#fff", color: C.primary, border: `1px solid ${C.border}`, borderRadius: "8px", textDecoration: "none" }}>
              <QrCode size={13} /> Sayfayı Aç
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SHOP_TYPE_OPTIONS = [
  { value: "",       label: "Seçiniz" },
  { value: "male",   label: "Erkek"   },
  { value: "female", label: "Kadın"   },
  { value: "unisex", label: "Unisex"  },
];

const ABOUT_MAX = 500;

// ── ShopProfileTab ─────────────────────────────────────────────────────────────

export default function ShopProfileTab() {
  const empty = {
    name: "", ownerName: "", foundedYear: "", shopType: "",
    phone: "", whatsappNumber: "", email: "",
    addressLine: "", city: "", latitude: "", longitude: "",
    placeId: "", formattedAddress: "",
    description: "", about: "",
    instagramUrl: "", facebookUrl: "", tiktokUrl: "",
    googlePlaceId: "", googlePlacesKey: "", mapsEmbed: "",
    googleReviewUrl: "",
    reviewReminderEnabled: true,
  };
  const [form, setForm]     = useState(empty);
  const [slug, setSlug]     = useState(null);
  const [logo, setLogo]     = useState(null);
  const [gallery, setGallery] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    apiFetch("/api/admin/shop")
      .then(shop => {
        setSlug(shop.slug ?? null);
        setLogo(shop.logo ?? null);
        setGallery(shop.gallery ?? []);
        setForm({
          name:            shop.name            ?? "",
          ownerName:       shop.ownerName       ?? "",
          foundedYear:     shop.foundedYear     ?? "",
          shopType:        shop.shopType        ?? "",
          phone:           shop.phone           ?? "",
          whatsappNumber:  shop.whatsappNumber  ?? "",
          email:           shop.email           ?? "",
          addressLine:     shop.addressLine     ?? shop.address ?? "",
          city:            shop.city            ?? "",
          latitude:         shop.latitude         ?? "",
          longitude:        shop.longitude        ?? "",
          placeId:          shop.googlePlaceId    ?? "",
          formattedAddress: shop.formattedAddress ?? "",
          description:      shop.description      ?? "",
          about:           shop.about           ?? "",
          instagramUrl:    shop.instagramUrl    ?? shop.social?.instagram ?? "",
          facebookUrl:     shop.facebookUrl     ?? shop.social?.facebook  ?? "",
          tiktokUrl:       shop.tiktokUrl       ?? shop.social?.tiktok    ?? "",
          googlePlaceId:   shop.googlePlaceId   ?? "",
          googlePlacesKey: shop.googlePlacesKey ?? "",
          mapsEmbed:       shop.mapsEmbed       ?? "",
          googleReviewUrl: shop.googleReviewUrl ?? "",
          reviewReminderEnabled: shop.reviewReminderEnabled ?? true,
        });
        setLoaded(true);
      })
      .catch(() => { setLoaded(true); });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true); setToast(null);
    try {
      const body = { ...form };
      // Cast empty strings on numeric fields to null so server doesn't reject.
      body.foundedYear = form.foundedYear === "" ? null : Number(form.foundedYear);
      body.latitude    = form.latitude    === "" ? null : Number(form.latitude);
      body.longitude   = form.longitude   === "" ? null : Number(form.longitude);
      await apiFetch("/api/admin/shop", { method: "PATCH", body: JSON.stringify(body) });
      setToast("success");
    } catch (err) {
      setToast(err.message || "Hata");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  }

  if (!loaded) return <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>Yükleniyor…</div>;

  const fi = { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "9px 14px", fontSize: "13px", color: C.primary, outline: "none", boxSizing: "border-box" };
  const aboutLen = (form.about ?? "").length;

  // Content completeness — % of meaningful profile fields filled. Drives empty-state nudging.
  const checks = [
    { label: "Logo",     done: !!logo },
    { label: "Hakkımızda", done: !!form.about?.trim() },
    { label: "Galeri",   done: gallery.length > 0 },
    { label: "Telefon",  done: !!form.phone?.trim() },
    { label: "Adres",    done: !!form.addressLine?.trim() || !!form.city?.trim() },
    { label: "WhatsApp", done: !!form.whatsappNumber?.trim() },
    { label: "Sosyal",   done: !!(form.instagramUrl || form.facebookUrl || form.tiktokUrl) },
  ];
  const completeness = Math.round((checks.filter(c => c.done).length / checks.length) * 100);

  return (
    <form onSubmit={save}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>

        {/* Completeness score */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px",
          padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>Profil Tamamlanma</div>
            <div style={{ fontSize: "20px", fontWeight: 300, color: completeness === 100 ? "#16a34a" : C.primary, letterSpacing: "-0.01em" }}>
              {completeness}%
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: C.surface, overflow: "hidden" }}>
            <div style={{
              width: `${completeness}%`, height: "100%",
              background: completeness === 100 ? "#16a34a" : C.primary,
              transition: "width 0.3s ease",
            }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {checks.map(c => (
              <span key={c.label} style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 100,
                background: c.done ? "rgba(22,163,74,0.10)" : C.surface,
                color: c.done ? "#15803d" : C.muted,
                border: `1px solid ${c.done ? "rgba(22,163,74,0.22)" : C.border}`,
                letterSpacing: "0.02em",
              }}>
                {c.done ? "✓ " : ""}{c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Brand assets */}
        <Section title="Logo">
          <UploadField
            label="Logo"
            endpoint="/api/admin/shop/logo"
            current={logo}
            aspect="1 / 1"
            onChange={setLogo}
            hint="512×512 önerilir · paylaşım kartlarında ve kimlik bloğunda kullanılır"
          />
        </Section>

        {/* Basic info */}
        <Section title="Temel Bilgiler">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <Field label="Salon Adı *">
              <input required value={form.name} onChange={set("name")} style={fi} />
            </Field>
            <Field label="Salon Sahibi">
              <input value={form.ownerName} onChange={set("ownerName")} placeholder="Ad Soyad" style={fi} />
            </Field>
            <Field label="Kuruluş Yılı">
              <input type="number" min="1900" max={new Date().getFullYear() + 1} value={form.foundedYear} onChange={set("foundedYear")} placeholder="2015" style={fi} />
            </Field>
            <Field label="Salon Tipi">
              <select value={form.shopType} onChange={set("shopType")} style={fi}>
                {SHOP_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Telefon">
              <input value={form.phone} onChange={set("phone")} placeholder="0532 123 45 67" style={fi} />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsappNumber} onChange={set("whatsappNumber")} placeholder="+90 532 123 45 67" style={fi} />
            </Field>
            <Field label="E-posta">
              <input type="email" value={form.email} onChange={set("email")} style={fi} />
            </Field>
          </div>
        </Section>

        {/* About */}
        <Section title="Hakkımızda">
          <Field label={`Uzun açıklama (${aboutLen}/${ABOUT_MAX})`} hint="Salon sayfasında 'Hakkımızda' bölümünde gözükür">
            <textarea
              value={form.about}
              onChange={(e) => setForm(f => ({ ...f, about: e.target.value.slice(0, ABOUT_MAX) }))}
              rows={5}
              placeholder="Salonunuzun hikayesi, vizyonu, müşterilere verdiği değerler…"
              style={{ ...fi, resize: "vertical", lineHeight: 1.6 }}
            />
          </Field>
          <Field label="Kısa açıklama" hint="Sayfa metası / OG için kullanılır">
            <textarea value={form.description} onChange={set("description")} rows={2}
              placeholder="Salonunuz hakkında 1-2 cümlelik özet"
              style={{ ...fi, resize: "vertical", lineHeight: 1.6 }} />
          </Field>
        </Section>

        {/* Social */}
        <Section title="Sosyal Medya">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <SocialLinkField label="Instagram" value={form.instagramUrl} onChange={set("instagramUrl")} placeholder="https://instagram.com/…" fi={fi} />
            <SocialLinkField label="Facebook"  value={form.facebookUrl}  onChange={set("facebookUrl")}  placeholder="https://facebook.com/…"  fi={fi} />
            <SocialLinkField label="TikTok"    value={form.tiktokUrl}    onChange={set("tiktokUrl")}    placeholder="https://tiktok.com/@…"   fi={fi} />
          </div>
        </Section>

        {/* Location */}
        <Section title="Konum">
          <Field label="Adres">
            <input value={form.addressLine} onChange={set("addressLine")} placeholder="Mahalle, Cadde, No" style={fi} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field label="Şehir">
              <input value={form.city} onChange={set("city")} placeholder="İstanbul" style={fi} />
            </Field>
          </div>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            formattedAddress={form.formattedAddress}
            placeId={form.placeId}
            fi={fi}
            onChange={(patch) => setForm(f => ({ ...f, ...patch }))}
          />
        </Section>

        {/* Gallery */}
        <Section title={`Galeri (${gallery.length}/12)`}>
          <GalleryGrid items={gallery} onChange={setGallery} />
        </Section>

        {/* Google / Maps */}
        <Section title="Google & Harita">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <Field label="Google Place ID" hint="Google'da işletme sayfanızın Place ID'si">
              <input value={form.googlePlaceId} onChange={set("googlePlaceId")} placeholder="ChIJ…" style={fi} />
            </Field>
            <Field label="Google Places API Key" hint="Boş bırakırsanız platform anahtarı kullanılır">
              <input value={form.googlePlacesKey} onChange={set("googlePlacesKey")} placeholder="AIza…" type="password" style={fi} />
            </Field>
          </div>
          <Field label="Google Maps Embed URL" hint="Google Maps → Haritayı paylaş → Haritayı yerleştir bağlantısı">
            <input value={form.mapsEmbed} onChange={set("mapsEmbed")} placeholder="https://www.google.com/maps/embed?pb=…" style={fi} />
          </Field>
        </Section>

        {/* Google Review CTA */}
        <Section title="Google Değerlendirme">
          <Field
            label="Google yorum bağlantısı"
            hint="Google Maps → işletmenizi açın → 'Yorum yaz' bağlantısını kopyalayın. 4★+ değerlendirme sonrasında müşteriye gösterilir."
          >
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={form.googleReviewUrl}
                onChange={set("googleReviewUrl")}
                placeholder="https://g.page/r/…/review"
                style={{ ...fi, flex: 1 }}
                type="url"
              />
              <a
                href={form.googleReviewUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { if (!form.googleReviewUrl) e.preventDefault(); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", fontSize: 13, fontWeight: 500,
                  border: `1px solid ${C.border}`, borderRadius: 7,
                  background: form.googleReviewUrl ? C.surface : C.dim,
                  color: form.googleReviewUrl ? C.primary : C.muted,
                  textDecoration: "none",
                  pointerEvents: form.googleReviewUrl ? "auto" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                Bağlantıyı test et
              </a>
            </div>
          </Field>
          <Field label="Otomatik yorum hatırlatıcısı" hint="Randevu bitiminden 2 saat sonra müşteriye WhatsApp/SMS gönderilir.">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: C.primary, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.reviewReminderEnabled}
                onChange={(e) => setForm(f => ({ ...f, reviewReminderEnabled: e.target.checked }))}
              />
              {form.reviewReminderEnabled ? "Açık — hatırlatma gönderilecek" : "Kapalı — hatırlatma gönderilmeyecek"}
            </label>
          </Field>
        </Section>

        {/* QR & public link */}
        {slug && <QRSection slug={slug} />}

        {/* Save bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="submit" disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: saving ? C.dim : C.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
            <Save size={14} />
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {toast === "success" && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#15803D" }}>
              <CheckCircle size={14} /> Kaydedildi
            </motion.div>
          )}
          {toast && toast !== "success" && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: C.primary }}>
              <AlertCircle size={14} /> {toast}
            </motion.div>
          )}
        </div>
      </div>
    </form>
  );
}
