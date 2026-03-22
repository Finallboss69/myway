"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

export interface RepartidorPin {
	orderId: string;
	customerName: string;
	address: string;
	lat: number;
	lng: number;
	updatedAt: string;
}

interface AdminFleetMapProps {
	pins: RepartidorPin[];
}

export default function AdminFleetMap({ pins }: AdminFleetMapProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<LeafletMap | null>(null);
	const markersRef = useRef<Map<string, Marker>>(new Map());

	useEffect(() => {
		if (!containerRef.current) return;

		if (!document.getElementById("leaflet-css")) {
			const link = document.createElement("link");
			link.id = "leaflet-css";
			link.rel = "stylesheet";
			link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
			document.head.appendChild(link);
		}

		// My Way Olivos coords as map center
		const CENTER: [number, number] = [-34.5094, -58.5082];

		import("leaflet").then((L) => {
			if (mapRef.current || !containerRef.current) return;

			const map = L.map(containerRef.current, {
				center: CENTER,
				zoom: 14,
				zoomControl: true,
				attributionControl: false,
			});

			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution: "© OpenStreetMap",
			}).addTo(map);

			// My Way marker
			const storeIcon = L.divIcon({
				className: "",
				html: `<div style="
          width:22px;height:22px;border-radius:50%;
          background:#f59e0b;
          border:3px solid #fff;
          box-shadow:0 2px 8px rgba(245,158,11,0.6);
          display:flex;align-items:center;justify-content:center;
        "></div>`,
				iconSize: [22, 22],
				iconAnchor: [11, 11],
			});
			L.marker(CENTER, { icon: storeIcon })
				.bindPopup("<b>My Way Olivos</b>")
				.addTo(map);

			mapRef.current = map;

			// Add initial pins
			pins.forEach((pin) => addOrUpdateMarker(L, map, pin));
		});

		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
			markersRef.current.clear();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Update markers when pins change
	useEffect(() => {
		if (!mapRef.current) return;
		import("leaflet").then((L) => {
			if (!mapRef.current) return;
			pins.forEach((pin) => addOrUpdateMarker(L, mapRef.current!, pin));

			// Remove markers for orders no longer in list
			const activeIds = new Set(pins.map((p) => p.orderId));
			markersRef.current.forEach((marker, id) => {
				if (!activeIds.has(id)) {
					marker.remove();
					markersRef.current.delete(id);
				}
			});
		});
	}, [pins]);

	function addOrUpdateMarker(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		L: any,
		map: LeafletMap,
		pin: RepartidorPin,
	) {
		const existing = markersRef.current.get(pin.orderId);
		if (existing) {
			existing.setLatLng([pin.lat, pin.lng]);
			return;
		}

		const icon = L.divIcon({
			className: "",
			html: `<div style="
        width:18px;height:18px;border-radius:50%;
        background:#10b981;
        border:3px solid #fff;
        box-shadow:0 0 0 0 rgba(16,185,129,0.6);
        animation:pulse-ring 1.5s ease-out infinite;
      "></div>
      <style>
        @keyframes pulse-ring {
          0%  { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
          70% { box-shadow: 0 0 0 14px rgba(16,185,129,0); }
          100%{ box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
      </style>`,
			iconSize: [18, 18],
			iconAnchor: [9, 9],
		});

		const marker = L.marker([pin.lat, pin.lng], { icon })
			.bindPopup(
				`<div style="font-family:sans-serif;min-width:140px">
          <b style="font-size:13px">${pin.customerName}</b><br/>
          <span style="font-size:11px;color:#666">${pin.address}</span>
        </div>`,
			)
			.addTo(map);

		markersRef.current.set(pin.orderId, marker);
	}

	return (
		<div
			ref={containerRef}
			style={{ width: "100%", height: "100%", background: "#0e0e0e" }}
		/>
	);
}
