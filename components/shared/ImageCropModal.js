"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";

const OUTPUT_SIZE = 600; // px — square output

function getCroppedCanvas(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas  = document.createElement("canvas");
      canvas.width  = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0, 0, OUTPUT_SIZE, OUTPUT_SIZE,
      );
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

export default function ImageCropModal({ file, onConfirm, onCancel }) {
  const [imageSrc, setImageSrc]             = useState(null);
  const [crop, setCrop]                     = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                     = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving]                 = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setSaving(true);
    try {
      const dataUrl = await getCroppedCanvas(imageSrc, croppedAreaPixels);
      onConfirm(dataUrl);
    } catch {
      alert("Kırpma işlemi başarısız");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 90,
      background: "rgba(0,0,0,0.82)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(6px)",
      padding: "16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px",
        width: "100%", maxWidth: "400px",
        boxShadow: "0 40px 100px rgba(0,0,0,0.40)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>
              Profil Fotoğrafını Düzenle
            </div>
            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
              Sürükle · kaydır ile yakınlaştır
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{ background: "#F3F4F6", border: "none", cursor: "pointer", color: "#6B7280", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Cropper viewport */}
        <div style={{ position: "relative", width: "100%", height: "320px", background: "#111" }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: "#111" },
                cropAreaStyle: {
                  border: "2px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
                },
              }}
            />
          )}
        </div>

        {/* Zoom controls */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setZoom(z => Math.max(1, z - 0.1))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 0, display: "flex", flexShrink: 0 }}
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min={1} max={3} step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#111111", cursor: "pointer" }}
            />
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.1))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 0, display: "flex", flexShrink: 0 }}
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: "10px", color: "#9CA3AF", marginTop: "4px" }}>
            {zoom.toFixed(1)}×
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", padding: "16px 20px 20px" }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "12px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, padding: "12px", background: "#111111", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}
          >
            <Check size={14} /> {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
