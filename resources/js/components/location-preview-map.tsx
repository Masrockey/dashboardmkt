import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect, useRef } from 'react';

// Fix default marker icon path issue in Vite bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

import { getMapMarkerIcon } from '@/components/location-picker-map';

interface LocationPreviewMapProps {
    latitude: number;
    longitude: number;
    customIconUrl?: string | null;
    popupText?: string;
    height?: string;
    className?: string;
}

export default function LocationPreviewMap({
    latitude,
    longitude,
    customIconUrl,
    popupText,
    height = '200px',
    className = '',
}: LocationPreviewMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [latitude, longitude],
            zoom: 15,
            attributionControl: false,
            zoomControl: true,
            scrollWheelZoom: false, // Prevent accidental scrolling when inspecting modal
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([latitude, longitude], {
            icon: getMapMarkerIcon(customIconUrl),
        }).addTo(map);
        if (popupText) {
            marker.bindPopup(popupText);
        }

        markerRef.current = marker;
        mapInstanceRef.current = map;

        // Invalidate size repeatedly to account for dialog enter animations
        const timer1 = setTimeout(() => map.invalidateSize(), 150);
        const timer2 = setTimeout(() => map.invalidateSize(), 350);

        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            resizeObserver.disconnect();
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [latitude, longitude, popupText]);

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setIcon(getMapMarkerIcon(customIconUrl));
        }
    }, [customIconUrl]);

    return (
        <div
            className={`relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-xs ${className}`}
            style={{ height }}
        >
            <div ref={mapContainerRef} className="h-full w-full z-0" />
            <div className="absolute bottom-2 left-2 z-[400] rounded bg-background/90 px-2 py-0.5 text-[10px] font-mono text-neutral-600 dark:text-neutral-300 shadow-xs backdrop-blur-xs border">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
        </div>
    );
}

