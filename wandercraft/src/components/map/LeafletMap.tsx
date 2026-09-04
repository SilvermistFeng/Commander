"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ACTIVITY_CATEGORIES } from "@/lib/categories";
import type { ActivityCategory } from "@/types";

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  locationName?: string | null;
  category: ActivityCategory;
  order: number;
  time?: string | null;
};

/**
 * A numbered pin coloured by category. Built as a divIcon so the number stays
 * crisp at any zoom and matches the order shown on the itinerary cards.
 */
function pinIcon(point: MapPoint, isActive: boolean) {
  const colour = ACTIVITY_CATEGORIES[point.category]?.color ?? "#D95338";
  const size = isActive ? 38 : 30;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6],
    html: `
      <div style="
        width:${size}px;height:${size}px;
        display:flex;align-items:center;justify-content:center;
        transform:translateY(${isActive ? "-2px" : "0"});
        transition:all .18s ease;
      ">
        <div style="
          width:${size - 6}px;height:${size - 6}px;border-radius:50% 50% 50% 6px;
          transform:rotate(-45deg);
          background:${colour};
          border:2px solid rgba(255,255,255,.92);
          box-shadow:0 ${isActive ? 8 : 3}px ${isActive ? 18 : 8}px rgba(0,0,0,${isActive ? 0.38 : 0.22});
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="
            transform:rotate(45deg);color:#fff;font-weight:700;
            font-size:${isActive ? 13 : 11}px;font-family:ui-sans-serif,system-ui,sans-serif;
          ">${point.order}</span>
        </div>
      </div>`,
  });
}

/** Keeps the viewport following whatever the user selected on the timeline. */
function ViewController({ points, activeId }: { points: MapPoint[]; activeId?: string | null }) {
  const map = useMap();
  const lastFitKey = useRef<string>("");

  useEffect(() => {
    if (points.length === 0) return;

    const active = activeId ? points.find((p) => p.id === activeId) : null;
    if (active) {
      map.setView([active.latitude, active.longitude], Math.max(map.getZoom(), 14), { animate: true });
      return;
    }

    // Only refit when the set of points actually changes, so panning sticks.
    const key = points.map((p) => p.id).join("|");
    if (key === lastFitKey.current) return;
    lastFitKey.current = key;

    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13, { animate: true });
    } else {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number])), {
        padding: [48, 48],
        maxZoom: 15,
      });
    }
  }, [map, points, activeId]);

  // The container is often revealed by a tab switch, which Leaflet can't see.
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 180);
    return () => clearTimeout(t);
  }, [map]);

  return null;
}

export default function LeafletMap({
  points,
  activeId,
  onSelect,
  showRoute = true,
  fallbackCenter,
  className,
  interactive = true,
}: {
  points: MapPoint[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  showRoute?: boolean;
  fallbackCenter?: [number, number] | null;
  className?: string;
  interactive?: boolean;
}) {
  const center = useMemo<[number, number]>(() => {
    if (points.length > 0) return [points[0].latitude, points[0].longitude];
    return fallbackCenter ?? [20, 0];
  }, [points, fallbackCenter]);

  const route = useMemo(
    () => points.map((p) => [p.latitude, p.longitude] as [number, number]),
    [points]
  );

  return (
    <MapContainer
      center={center}
      zoom={points.length > 0 ? 12 : 2}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      doubleClickZoom={interactive}
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {showRoute && route.length > 1 ? (
        <>
          {/* A soft halo under the line keeps it readable over busy map detail. */}
          <Polyline positions={route} pathOptions={{ color: "#ffffff", weight: 7, opacity: 0.5 }} />
          <Polyline
            positions={route}
            pathOptions={{ color: "#D95338", weight: 3, opacity: 0.9, dashArray: "1 7", lineCap: "round" }}
          />
        </>
      ) : null}

      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={pinIcon(point, point.id === activeId)}
          zIndexOffset={point.id === activeId ? 1000 : 0}
          eventHandlers={onSelect ? { click: () => onSelect(point.id) } : undefined}
        >
          <Popup>
            <div style={{ minWidth: 150 }}>
              <strong style={{ display: "block", fontSize: 13 }}>{point.name}</strong>
              {point.locationName ? (
                <span style={{ fontSize: 12, opacity: 0.7 }}>{point.locationName}</span>
              ) : null}
              {point.time ? (
                <span style={{ display: "block", fontSize: 12, opacity: 0.7 }}>{point.time}</span>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}

      <ViewController points={points} activeId={activeId} />
    </MapContainer>
  );
}
