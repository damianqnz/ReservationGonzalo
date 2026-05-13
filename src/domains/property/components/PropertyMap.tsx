"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Circle, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix Leaflet default icon paths for Next.js bundling ─────────────────────
const defaultIconProto = L.Icon.Default.prototype as unknown as Record<
  string,
  unknown
>;
delete defaultIconProto._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PropertyMapProps {
  lat: number;
  lng: number;
  radius?: number;
  propertyTitle: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Interactive proximity map using Leaflet + OpenStreetMap.
 * Shows an approximate area circle (300 m by default) with an offset pin
 * so the exact address is never revealed on the public property page.
 */
export default function PropertyMap({
  lat,
  lng,
  radius = 300,
  propertyTitle,
}: PropertyMapProps) {
  // Generate a stable random offset per mount (changes on full-page reload)
  const [offsetLat, offsetLng] = useMemo(() => {
    const oLat = (Math.random() - 0.5) * (radius / 55_000);
    const oLng = (Math.random() - 0.5) * (radius / 45_000);
    return [oLat, oLng];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — new offset only on remount

  const pinLat = lat + offsetLat;
  const pinLng = lng + offsetLng;

  const customIcon = L.divIcon({
    className: "",
    html: `<div style="
      width: 20px;
      height: 20px;
      background: #8b1a1a;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <div>
      <div 
        className="relative h-[250px] sm:h-[400px] rounded-xl overflow-hidden"
        style={{ isolation: "isolate", zIndex: 0 }}
      >
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ 
            height: "100%", 
            width: "100%",
            position: "relative",
            zIndex: 0,
            isolation: "isolate"
          }}
          aria-label={`Mapa de localização aproximada de ${propertyTitle}`}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Circle
            center={[lat, lng]}
            radius={radius}
            pathOptions={{
              color: "#8b1a1a",
              fillColor: "#8b1a1a",
              fillOpacity: 0.1,
              weight: 1.5,
            }}
          />
          <Marker position={[pinLat, pinLng]} icon={customIcon} />
        </MapContainer>
      </div>
      <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
        <span className="text-base leading-none mt-0.5">📍</span>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          A localização exata será partilhada após a confirmação da reserva.
        </p>
      </div>
    </div>
  );
}
