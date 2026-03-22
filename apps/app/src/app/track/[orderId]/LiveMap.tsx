"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

interface LiveMapProps {
	lat: number;
	lng: number;
}

export default function LiveMap({ lat, lng }: LiveMapProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<LeafletMap | null>(null);
	const markerRef = useRef<Marker | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		// Lazy-load Leaflet CSS
		if (!document.getElementById("leaflet-css")) {
			const link = document.createElement("link");
			link.id = "leaflet-css";
			link.rel = "stylesheet";
			link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
			document.head.appendChild(link);
		}

		import("leaflet").then((L) => {
			if (mapRef.current || !containerRef.current) return;

			const map = L.map(containerRef.current, {
				center: [lat, lng],
				zoom: 15,
				zoomControl: false,
				attributionControl: false,
			});

			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution: "© OpenStreetMap",
			}).addTo(map);

			const pulseIcon = L.divIcon({
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

			markerRef.current = L.marker([lat, lng], { icon: pulseIcon }).addTo(map);
			mapRef.current = map;
		});

		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
			markerRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // init once

	// Update marker position when lat/lng changes
	useEffect(() => {
		if (!mapRef.current || !markerRef.current) return;
		import("leaflet").then((L) => {
			markerRef.current?.setLatLng([lat, lng]);
			mapRef.current?.panTo(new L.LatLng(lat, lng));
		});
	}, [lat, lng]);

	return (
		<div
			ref={containerRef}
			style={{ width: "100%", height: "100%", background: "#0e0e0e" }}
		/>
	);
}
