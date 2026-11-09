import { usePage } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    AlertTriangle,
    Building2,
    Calendar,
    ExternalLink,
    GitCompare,
    Locate,
    Navigation,
    Ruler,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    checkRadiusConflicts,
    getDistanceInMeters,
    getMapMarkerIcon,
} from '@/components/location-picker-map';
import type { PameranItem } from '@/types';

// Fix default marker icon path issue in Vite bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface LocationPreviewMapProps {
    latitude: number;
    longitude: number;
    customIconUrl?: string | null;
    popupText?: string;
    height?: string;
    className?: string;
    otherChannels?: PameranItem[];
    currentChannelId?: number;
    isDealer?: boolean;
    showRadius?: boolean;
    currentPameran?: PameranItem | null;
}

function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
}

function checkDateOverlap(
    startA?: string | null,
    endA?: string | null,
    startB?: string | null,
    endB?: string | null,
): boolean {
    if (!startA || !endA || !startB || !endB) return false;
    const sA = new Date(startA).getTime();
    const eA = new Date(endA).getTime();
    const sB = new Date(startB).getTime();
    const eB = new Date(endB).getTime();
    return sA <= eB && sB <= eA;
}

function getDurationInDays(startStr?: string | null, endStr?: string | null): number | null {
    if (!startStr || !endStr) return null;
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diff = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

function formatDateIndo(dateStr?: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function LocationPreviewMap({
    latitude,
    longitude,
    customIconUrl,
    popupText,
    height = '200px',
    className = '',
    otherChannels = [],
    currentChannelId,
    isDealer,
    showRadius = true,
    currentPameran,
}: LocationPreviewMapProps) {
    const page = usePage<{ auth?: { user?: { role?: string } } }>();
    const isDealerUser = isDealer ?? (page?.props?.auth?.user?.role === 'dealer');

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const reviewCircleRef = useRef<L.Circle | null>(null);
    const otherMarkersLayerRef = useRef<L.LayerGroup | null>(null);
    const compareLayerRef = useRef<L.LayerGroup | null>(null);

    const [selectedCompareChannel, setSelectedCompareChannel] = useState<PameranItem | null>(null);

    const conflicts = showRadius
        ? checkRadiusConflicts(
            latitude,
            longitude,
            otherChannels,
            currentChannelId,
        )
        : [];
    const hasConflict = conflicts.length > 0;

    // Daftar kandidat channel pembanding, diurutkan dari yang paling dekat
    const candidateChannels = useMemo(() => {
        return otherChannels
            .filter((c) => {
                if (currentChannelId != null && c.id === currentChannelId) return false;
                const lat = Number(c.latitude);
                const lng = Number(c.longitude);
                return !isNaN(lat) && !isNaN(lng);
            })
            .map((item) => {
                const lat = Number(item.latitude);
                const lng = Number(item.longitude);
                const distance = getDistanceInMeters(latitude, longitude, lat, lng);
                const radiusKmA = currentPameran?.jenis_pameran?.radius_km ?? 2;
                const radiusKmB = item.jenis_pameran?.radius_km ?? 2;
                const totalRadiusMeters = (radiusKmA + radiusKmB) * 1000;
                const isOverlap = distance < totalRadiusMeters;
                return {
                    item,
                    distance,
                    isOverlap,
                };
            })
            .sort((a, b) => a.distance - b.distance);
    }, [otherChannels, currentChannelId, latitude, longitude, currentPameran]);

    // Kalkulasi metrik komparasi jika ada channel yang dipilih
    const compMetrics = useMemo(() => {
        if (!selectedCompareChannel) return null;

        const latA = latitude;
        const lngA = longitude;
        const latB = Number(selectedCompareChannel.latitude);
        const lngB = Number(selectedCompareChannel.longitude);

        if (isNaN(latB) || isNaN(lngB)) return null;

        const distanceMeters = getDistanceInMeters(latA, lngA, latB, lngB);
        const radiusKmA = currentPameran?.jenis_pameran?.radius_km ?? 2;
        const radiusKmB = selectedCompareChannel.jenis_pameran?.radius_km ?? 2;
        const totalRadiusMeters = (radiusKmA + radiusKmB) * 1000;
        const isRadiusOverlap = distanceMeters < totalRadiusMeters;
        const radiusDifferenceMeters = Math.abs(distanceMeters - totalRadiusMeters);

        const isDateOverlap = checkDateOverlap(
            currentPameran?.mulai_tanggal_sewa,
            currentPameran?.tanggal_sewa_berakhir,
            selectedCompareChannel.mulai_tanggal_sewa,
            selectedCompareChannel.tanggal_sewa_berakhir,
        );

        const durationA = getDurationInDays(
            currentPameran?.mulai_tanggal_sewa,
            currentPameran?.tanggal_sewa_berakhir,
        );
        const durationB = getDurationInDays(
            selectedCompareChannel.mulai_tanggal_sewa,
            selectedCompareChannel.tanggal_sewa_berakhir,
        );

        return {
            distanceMeters,
            distanceFormatted: formatDistance(distanceMeters),
            radiusKmA,
            radiusKmB,
            totalRadiusKm: radiusKmA + radiusKmB,
            isRadiusOverlap,
            radiusDifferenceFormatted: formatDistance(radiusDifferenceMeters),
            isDateOverlap,
            durationA,
            durationB,
            googleMapsRouteUrl: `https://www.google.com/maps/dir/?api=1&origin=${latA},${lngA}&destination=${latB},${lngB}`,
        };
    }, [selectedCompareChannel, latitude, longitude, currentPameran]);

    // Helper to render other registered channels on map
    const renderOtherChannels = (
        layer: L.LayerGroup,
        channels: PameranItem[],
        curId?: number,
        isDealerRole?: boolean,
    ) => {
        layer.clearLayers();
        if (!channels || channels.length === 0) return;

        channels.forEach((item) => {
            if (curId != null && item.id === curId) return;

            const lat = Number(item.latitude);
            const lng = Number(item.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            // Jika role dealer dan merupakan channel dealer lain:
            // JANGAN munculkan pin point nya, tetapi munculkan radius nya saja (2 km dari titik koordinat)
            if (item.is_other_dealer || (isDealerRole && item.is_other_dealer !== false)) {
                const circle = L.circle([lat, lng], {
                    radius: 2000,
                    color: '#ef4444',
                    weight: 1.5,
                    dashArray: '5, 5',
                    fillColor: '#ef4444',
                    fillOpacity: 0.12,
                });

                circle.bindTooltip(
                    `<b>Radius Channel Terdaftar (2 km)</b>${item.jenis_pameran?.jenis_pameran
                        ? `<br/><span style="font-size: 10px; color: #4b5563;">${item.jenis_pameran.jenis_pameran}</span>`
                        : ''
                    }`,
                    { sticky: true, direction: 'top' },
                );

                circle.addTo(layer);
                return;
            }

            // Jika role dealer dan merupakan channel milik sendiri:
            if (isDealerRole) {
                const ownCircle = L.circle([lat, lng], {
                    radius: 2000,
                    color: '#10b981',
                    weight: 1.5,
                    dashArray: '5, 5',
                    fillColor: '#10b981',
                    fillOpacity: 0.15,
                });

                ownCircle.bindTooltip(
                    `<b>Radius Channel Anda (2 km)</b>${item.jenis_pameran?.jenis_pameran
                        ? `<br/><span style="font-size: 10px; color: #047857;">${item.jenis_pameran.jenis_pameran}</span>`
                        : ''
                    }`,
                    { sticky: true, direction: 'top' },
                );

                ownCircle.addTo(layer);

                const ownIcon = getMapMarkerIcon(item.jenis_pameran?.icon_map_url);
                const ownMarker = L.marker([lat, lng], {
                    icon: ownIcon,
                    zIndexOffset: 100,
                });
                ownMarker.bindTooltip(
                    `<b>Channel Anda</b><br/><span style="font-size: 10px;">${item.jenis_pameran?.jenis_pameran || ''} &bull; ${item.kecamatan}</span>`,
                    { direction: 'top', offset: [0, -10] },
                );

                const ownPopupHtml = `
                    <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 200px; max-width: 250px; padding: 2px;">
                        <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px;">
                            ${item.dealer?.nama_dealer || 'Dealer'}
                        </div>
                        <div style="font-size: 11px; color: #4b5563; margin-bottom: 4px;">
                            <span style="font-weight: 600;">${item.jenis_pameran?.jenis_pameran || 'Channel'}</span>
                        </div>
                        <div style="border-top: 1px dashed #e5e7eb; padding-top: 4px; font-size: 11px; color: #4b5563;">
                            <div style="margin-bottom: 2px;">&#128197; ${item.mulai_tanggal_sewa} s/d ${item.tanggal_sewa_berakhir}</div>
                            <div>&#128205; <span style="font-weight: 600;">${item.kecamatan}${item.kabupaten ? `, ${item.kabupaten}` : ''}</span></div>
                        </div>
                        <button type="button" class="preview-compare-btn" data-id="${item.id}" style="margin-top: 6px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 8px; font-size: 11px; font-weight: 600; background: #ea580c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            &#9878;&#65039; Bandingkan dengan Titik Ini
                        </button>
                    </div>
                `;
                ownMarker.bindPopup(ownPopupHtml);
                ownMarker.addTo(layer);
                return;
            }

            const icon = getMapMarkerIcon(item.jenis_pameran?.icon_map_url);
            const marker = L.marker([lat, lng], {
                icon,
                zIndexOffset: 100,
            });
            const statusText =
                item.status === 'disetujui'
                    ? 'Disetujui'
                    : item.status === 'menunggu_kabag'
                        ? 'Menunggu Kabag'
                        : item.status === 'ditolak'
                            ? 'Ditolak'
                            : 'Menunggu SPV';

            const statusColor =
                item.status === 'disetujui'
                    ? 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0;'
                    : item.status === 'menunggu_kabag'
                        ? 'background:#e0f2fe;color:#075985;border:1px solid #bae6fd;'
                        : item.status === 'ditolak'
                            ? 'background:#ffe4e6;color:#9f1239;border:1px solid #fecdd3;'
                            : 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;';

            const popupHtml = `
                <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 200px; max-width: 250px; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px;">
                        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; ${statusColor}">
                            ${statusText}
                        </span>
                        <span style="font-size: 10px; color: #6b7280; font-weight: 500;">Channel Terdaftar</span>
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px;">
                        ${item.dealer?.nama_dealer || 'Dealer'}
                    </div>
                    <div style="font-size: 11px; color: #4b5563; margin-bottom: 4px;">
                        <span style="font-weight: 600;">${item.jenis_pameran?.jenis_pameran || 'Channel'}</span>
                        ${item.dealer?.kode_dealer ? ` &bull; <span style="font-family: monospace;">${item.dealer.kode_dealer}</span>` : ''}
                    </div>
                    <div style="border-top: 1px dashed #e5e7eb; padding-top: 4px; font-size: 11px; color: #4b5563;">
                        <div style="margin-bottom: 2px;">&#128197; ${item.mulai_tanggal_sewa} s/d ${item.tanggal_sewa_berakhir}</div>
                        <div>&#128205; <span style="font-weight: 600;">${item.kecamatan}${item.kabupaten ? `, ${item.kabupaten}` : ''}</span></div>
                        ${item.detail_alamat ? `<div style="font-size: 10px; color: #6b7280; margin-top: 2px;">${item.detail_alamat}</div>` : ''}
                    </div>
                    <button type="button" class="preview-compare-btn" data-id="${item.id}" style="margin-top: 6px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 8px; font-size: 11px; font-weight: 600; background: #ea580c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        &#9878;&#65039; Bandingkan dengan Titik Ini
                    </button>
                </div>
            `;

            marker.bindPopup(popupHtml);
            marker.bindTooltip(
                `<b>${item.dealer?.nama_dealer || 'Channel Terdaftar'}</b><br/><span style="font-size: 10px;">${item.jenis_pameran?.jenis_pameran || ''} &bull; ${item.kecamatan}</span>`,
                { direction: 'top', offset: [0, -10] },
            );

            marker.addTo(layer);
        });
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [latitude, longitude],
            zoom: 14,
            attributionControl: false,
            zoomControl: false,
            scrollWheelZoom: false, // Prevent accidental scrolling when inspecting modal
        });

        // Add zoom control explicitly to bottom-right to avoid overlapping top-left warning badges
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        // Layer for other registered channels
        const otherLayer = L.layerGroup().addTo(map);
        otherMarkersLayerRef.current = otherLayer;
        renderOtherChannels(otherLayer, otherChannels, currentChannelId, isDealerUser);

        // Layer for active comparison (lines, dual radius, midpoint distance badge)
        const compareLayer = L.layerGroup().addTo(map);
        compareLayerRef.current = compareLayer;

        // Listener for popup compare button
        const handlePopupOpen = (e: L.PopupEvent) => {
            const popupEl = e.popup.getElement();
            if (!popupEl) return;
            const btn = popupEl.querySelector<HTMLButtonElement>('.preview-compare-btn');
            if (btn) {
                btn.onclick = (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    const id = Number(btn.getAttribute('data-id'));
                    const target = otherChannels.find((c) => c.id === id);
                    if (target) {
                        setSelectedCompareChannel(target);
                        map.closePopup();
                    }
                };
            }
        };
        map.on('popupopen', handlePopupOpen);

        // Circle radius 2km untuk channel yang sedang ditinjau
        if (showRadius) {
            const initialConflicts = checkRadiusConflicts(
                latitude,
                longitude,
                otherChannels,
                currentChannelId,
            );
            const isConflict = initialConflicts.length > 0;
            const circleColor = isConflict ? '#dc2626' : '#2563eb';
            const fillColor = isConflict ? '#ef4444' : '#3b82f6';
            const fillOpacity = isConflict ? 0.22 : 0.12;

            const reviewCircle = L.circle([latitude, longitude], {
                radius: 2000,
                color: circleColor,
                weight: 2,
                dashArray: '5, 5',
                fillColor,
                fillOpacity,
            }).addTo(map);

            const tooltipText = isConflict
                ? `Peringatan: Menimpa Radius Channel Lain! (${initialConflicts[0].distance < 1000 ? `${Math.round(initialConflicts[0].distance)} m` : `${(initialConflicts[0].distance / 1000).toFixed(2)} km`})`
                : 'Radius Channel Ditinjau: 2 km';

            reviewCircle.bindTooltip(tooltipText, {
                direction: 'bottom',
                offset: [0, 20],
                className: isConflict
                    ? 'text-xs font-bold text-red-600 dark:text-red-400 border border-red-300'
                    : 'text-xs font-semibold text-blue-700 dark:text-blue-300',
            });

            reviewCircleRef.current = reviewCircle;
        }

        // Marker for the current channel being reviewed
        const marker = L.marker([latitude, longitude], {
            icon: getMapMarkerIcon(customIconUrl),
            zIndexOffset: 1000,
        }).addTo(map);

        const isConflict = showRadius && conflicts.length > 0;
        marker.bindTooltip(
            showRadius
                ? `<b>Titik Channel Ditinjau</b>${isConflict ? ' - Menimpa Radius' : ''}<br/><span style="font-size: 10px;">${popupText || ''}</span>`
                : `<b>Titik Lokasi</b><br/><span style="font-size: 10px;">${popupText || ''}</span>`,
            {
                permanent: true,
                direction: 'top',
                offset: [0, -32],
                className: isConflict
                    ? 'font-bold text-xs border border-red-400 text-red-700 dark:text-red-300 shadow-md'
                    : 'font-semibold text-xs border border-primary/30 shadow-md',
            },
        );

        if (popupText) {
            marker.bindPopup(`<b>${showRadius ? 'Channel Ditinjau' : 'Lokasi'}</b><br/>${popupText}`);
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
            map.off('popupopen', handlePopupOpen);
            if (otherMarkersLayerRef.current) {
                otherMarkersLayerRef.current.clearLayers();
                otherMarkersLayerRef.current = null;
            }
            if (compareLayerRef.current) {
                compareLayerRef.current.clearLayers();
                compareLayerRef.current = null;
            }
            if (reviewCircleRef.current) {
                reviewCircleRef.current.remove();
                reviewCircleRef.current = null;
            }
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [latitude, longitude, popupText]);

    // Update layer komparasi visual saat selectedCompareChannel berubah
    useEffect(() => {
        const map = mapInstanceRef.current;
        const compareLayer = compareLayerRef.current;
        if (!map || !compareLayer) return;

        compareLayer.clearLayers();

        if (!selectedCompareChannel) return;

        const latB = Number(selectedCompareChannel.latitude);
        const lngB = Number(selectedCompareChannel.longitude);
        if (isNaN(latB) || isNaN(lngB)) return;

        const radiusKmA = currentPameran?.jenis_pameran?.radius_km ?? 2;
        const radiusKmB = selectedCompareChannel.jenis_pameran?.radius_km ?? 2;
        const totalRadiusMeters = (radiusKmA + radiusKmB) * 1000;
        const distMeters = getDistanceInMeters(latitude, longitude, latB, lngB);
        const isOverlap = distMeters < totalRadiusMeters;

        // Halo highlight untuk Titik A
        const haloA = L.circleMarker([latitude, longitude], {
            radius: 18,
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.22,
            weight: 3,
        });
        compareLayer.addLayer(haloA);

        // Radius Circle untuk Channel B (Orange)
        const circleB = L.circle([latB, lngB], {
            radius: radiusKmB * 1000,
            color: '#ea580c',
            fillColor: '#f97316',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '6, 6',
        });
        circleB.bindTooltip(
            `<b>Channel Pembanding (B)</b>: ${selectedCompareChannel.dealer?.nama_dealer || 'Dealer'}<br/><span style="font-size: 10px;">Radius: ${radiusKmB} km</span>`,
            { direction: 'top', sticky: true },
        );
        compareLayer.addLayer(circleB);

        // Halo highlight untuk Titik B
        const haloB = L.circleMarker([latB, lngB], {
            radius: 18,
            color: '#ea580c',
            fillColor: '#f97316',
            fillOpacity: 0.25,
            weight: 3,
        });
        compareLayer.addLayer(haloB);

        // Polyline garis penghubung Titik A dan Titik B
        const polyline = L.polyline(
            [
                [latitude, longitude],
                [latB, lngB],
            ],
            {
                color: isOverlap ? '#ef4444' : '#6366f1',
                weight: 3.5,
                dashArray: '8, 6',
                opacity: 0.9,
            },
        );
        compareLayer.addLayer(polyline);

        // Midpoint marker jarak & status overlap
        const midLat = (latitude + latB) / 2;
        const midLng = (longitude + lngB) / 2;
        const distLabel = formatDistance(distMeters);

        const distIcon = L.divIcon({
            className: 'preview-compare-distance-badge-wrapper',
            html: `
                <div style="background: ${isOverlap ? '#dc2626' : '#4f46e5'}; color: white; padding: 3px 8px; border-radius: 9999px; font-weight: 700; font-size: 10.5px; font-family: ui-sans-serif, system-ui, sans-serif; box-shadow: 0 4px 10px rgba(0,0,0,0.3); white-space: nowrap; border: 2px solid #ffffff; display: flex; align-items: center; gap: 4px; transform: translate(-50%, -50%);">
                    <span>&#128207; ${distLabel}</span>
                    ${isOverlap ? '<span style="background: rgba(255,255,255,0.28); border-radius: 3px; padding: 0 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">BENTROK RADIUS</span>' : ''}
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
        });

        const distMarker = L.marker([midLat, midLng], {
            icon: distIcon,
            interactive: false,
        });
        compareLayer.addLayer(distMarker);

        // Auto zoom & fit kedua titik di peta
        const bounds = L.latLngBounds([
            [latitude, longitude],
            [latB, lngB],
        ]);
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 15,
        });
    }, [selectedCompareChannel, latitude, longitude, currentPameran]);

    useEffect(() => {
        if (otherMarkersLayerRef.current) {
            renderOtherChannels(
                otherMarkersLayerRef.current,
                otherChannels,
                currentChannelId,
                isDealerUser,
            );
        }
        if (reviewCircleRef.current) {
            const currentConflicts = checkRadiusConflicts(
                latitude,
                longitude,
                otherChannels,
                currentChannelId,
            );
            const isConflicting = currentConflicts.length > 0;
            reviewCircleRef.current.setStyle({
                color: isConflicting ? '#dc2626' : '#2563eb',
                fillColor: isConflicting ? '#ef4444' : '#3b82f6',
                fillOpacity: isConflicting ? 0.22 : 0.12,
            });
            const tooltipText = isConflicting
                ? `Peringatan: Menimpa Radius Channel Lain! (${currentConflicts[0].distance < 1000 ? `${Math.round(currentConflicts[0].distance)} m` : `${(currentConflicts[0].distance / 1000).toFixed(2)} km`})`
                : 'Radius Channel Ditinjau: 2 km';
            reviewCircleRef.current.unbindTooltip();
            reviewCircleRef.current.bindTooltip(tooltipText, {
                direction: 'bottom',
                offset: [0, 20],
                className: isConflicting
                    ? 'text-xs font-bold text-red-600 dark:text-red-400 border border-red-300'
                    : 'text-xs font-semibold text-blue-700 dark:text-blue-300',
            });
        }
    }, [otherChannels, currentChannelId, isDealerUser, latitude, longitude]);

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setIcon(getMapMarkerIcon(customIconUrl));
        }
    }, [customIconUrl]);

    const otherChannelsCount = otherChannels.filter(
        (c) =>
            c.id !== currentChannelId &&
            c.latitude != null &&
            c.longitude != null,
    ).length;

    return (
        <div className="space-y-2.5">
            {/* Map Canvas Frame */}
            <div
                className={`relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-xs ${className}`}
                style={{ height }}
            >
                <div ref={mapContainerRef} className="h-full w-full z-0" />

                {/* Top-Right Toolbar: Fokus & Komparasi */}
                <div className="absolute top-2 right-2 z-[400] flex items-center gap-1.5">
                    {candidateChannels.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                if (selectedCompareChannel) {
                                    setSelectedCompareChannel(null);
                                    mapInstanceRef.current?.setView([latitude, longitude], 14, {
                                        animate: true,
                                    });
                                } else {
                                    // Langsung pilih channel yang bentrok (jika ada), atau yang terdekat
                                    const target = conflicts[0]?.item || candidateChannels[0]?.item;
                                    if (target) {
                                        setSelectedCompareChannel(target);
                                    }
                                }
                            }}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold shadow-xs backdrop-blur-xs border cursor-pointer flex items-center gap-1 transition-colors ${selectedCompareChannel
                                ? 'bg-orange-600 text-white border-orange-700 hover:bg-orange-700'
                                : 'bg-background/95 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                            title="Bandingkan channel ini dengan channel lain"
                        >
                            {selectedCompareChannel ? (
                                <>
                                    <X className="size-3" />
                                    Tutup Komparasi
                                </>
                            ) : (
                                <>
                                    <GitCompare className="size-3 text-orange-600 dark:text-orange-400" />
                                    Bandingkan
                                </>
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() =>
                            mapInstanceRef.current?.setView([latitude, longitude], 15, {
                                animate: true,
                            })
                        }
                        className="rounded-md bg-background/95 px-2 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 shadow-xs backdrop-blur-xs border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-1"
                        title="Fokus kembali ke lokasi channel yang sedang ditinjau"
                    >
                        <Locate className="size-3 text-red-500" />
                        Fokus
                    </button>
                </div>

                {/* Top Warning Badge if Menimpa Radius */}
                {showRadius && hasConflict && (
                    <div className="absolute top-2 left-2 z-[400] max-w-[calc(100%-190px)] rounded-md bg-red-600/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md backdrop-blur-xs flex items-center gap-1.5 animate-in fade-in duration-150">
                        <AlertTriangle className="size-3.5 shrink-0 text-white animate-pulse" />
                        <span className="truncate">
                            Menimpa radius ({conflicts[0].distance < 1000 ? `${Math.round(conflicts[0].distance)} m` : `${(conflicts[0].distance / 1000).toFixed(2)} km`})
                        </span>
                        {!selectedCompareChannel && conflicts[0]?.item && (
                            <button
                                type="button"
                                onClick={() => setSelectedCompareChannel(conflicts[0].item)}
                                className="ml-1 shrink-0 rounded bg-white/20 hover:bg-white/30 px-1.5 py-0.5 text-[10px] font-bold text-white transition-colors cursor-pointer inline-flex items-center gap-0.5"
                                title="Bandingkan langsung dengan channel yang menimpa radius"
                            >
                                <GitCompare className="size-3" />
                                Komparasi
                            </button>
                        )}
                    </div>
                )}

                {/* Bottom info & legend badge */}
                <div className="absolute bottom-2 left-2 z-[400] flex items-center gap-2">
                    <div className="rounded bg-background/90 px-2 py-0.5 text-[10px] font-mono text-neutral-600 dark:text-neutral-300 shadow-xs backdrop-blur-xs border border-neutral-200 dark:border-neutral-800">
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </div>
                    {showRadius && (
                        hasConflict ? (
                            <div className="rounded-full bg-red-100/95 dark:bg-red-950/95 border border-red-300 dark:border-red-800 px-2.5 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-300 shadow-xs backdrop-blur-xs flex items-center gap-1">
                                <AlertTriangle className="size-3 text-red-600 shrink-0" />
                                <span>Menimpa {conflicts.length} Channel</span>
                            </div>
                        ) : (
                            otherChannelsCount > 0 && (
                                <div className="rounded-full bg-blue-50/95 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 shadow-xs backdrop-blur-xs flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    {isDealerUser
                                        ? `${otherChannelsCount} Radius Channel (2 km)`
                                        : `${otherChannelsCount} Channel Lain Terdaftar`}
                                </div>
                            )
                        )
                    )}
                </div>
            </div>

            {/* Panel Hasil Komparasi Detail (Side-by-side & Metrics) */}
            {selectedCompareChannel && compMetrics && (
                <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-3 space-y-2.5 dark:border-orange-900/50 dark:bg-orange-950/20 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Header Panel Komparasi */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/80 pb-2 dark:border-orange-900/50">
                        <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-md bg-orange-600 text-white shadow-xs">
                                <GitCompare className="size-3.5" />
                            </span>
                            <div>
                                <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                    <span>Komparasi Titik Ditinjau vs Channel Terdaftar</span>
                                </div>
                                <div className="text-[11px] text-neutral-500">
                                    Analisis jarak geografis, radius operasional, dan overlap jadwal sewa
                                </div>
                            </div>
                        </div>

                        {/* Channel B Selector & Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {candidateChannels.length > 1 && (
                                <select
                                    value={selectedCompareChannel.id}
                                    onChange={(e) => {
                                        const target = candidateChannels.find(
                                            (c) => c.item.id === Number(e.target.value),
                                        );
                                        if (target) {
                                            setSelectedCompareChannel(target.item);
                                        }
                                    }}
                                    className="h-7 rounded-md border border-orange-300 bg-white px-2 text-[11px] font-medium text-neutral-800 shadow-xs dark:border-orange-800 dark:bg-neutral-900 dark:text-neutral-200 cursor-pointer"
                                    title="Pilih channel lain untuk dikomparasikan"
                                >
                                    {candidateChannels.map((c) => (
                                        <option key={c.item.id} value={c.item.id}>
                                            {c.item.dealer?.nama_dealer || 'Dealer'} ({formatDistance(c.distance)}{c.isOverlap ? ' • Bentrok' : ''})
                                        </option>
                                    ))}
                                </select>
                            )}

                            <a
                                href={compMetrics.googleMapsRouteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-7 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 text-[11px] font-medium text-blue-600 shadow-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-blue-400"
                                title="Buka rute navigasi Google Maps antara Titik A dan B"
                            >
                                <Navigation className="size-3" />
                                <span className="hidden sm:inline">Rute G-Maps</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCompareChannel(null);
                                    mapInstanceRef.current?.setView([latitude, longitude], 14, {
                                        animate: true,
                                    });
                                }}
                                className="inline-flex h-7 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 text-[11px] font-medium text-neutral-600 shadow-xs hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
                                title="Tutup komparasi dan kembali ke tampilan normal"
                            >
                                <X className="size-3" />
                                Tutup
                            </button>
                        </div>
                    </div>

                    {/* Metrik Komparasi (3 Kartu Ringkasan) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Metrik 1: Jarak Antar Titik */}
                        <div className="rounded-lg border border-neutral-200/80 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
                            <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                                <Ruler className="size-3 text-neutral-400" />
                                Jarak Antar Titik
                            </div>
                            <div className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 mt-0.5">
                                {compMetrics.distanceFormatted}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                                Garis lurus (Haversine)
                            </div>
                        </div>

                        {/* Metrik 2: Analisis Radius */}
                        <div className="rounded-lg border border-neutral-200/80 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
                            <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                                <AlertTriangle
                                    className={`size-3 ${compMetrics.isRadiusOverlap ? 'text-red-500' : 'text-emerald-500'
                                        }`}
                                />
                                Analisis Radius ({compMetrics.totalRadiusKm} km)
                            </div>
                            <div
                                className={`text-xs font-bold mt-1 flex items-center gap-1 ${compMetrics.isRadiusOverlap
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                    }`}
                            >
                                {compMetrics.isRadiusOverlap ? (
                                    <>
                                        <span>Menimpa Radius</span>
                                        <span className="text-[10px] font-normal">
                                            (-{compMetrics.radiusDifferenceFormatted})
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span>Radius Bebas/Aman</span>
                                        <span className="text-[10px] font-normal">
                                            (+{compMetrics.radiusDifferenceFormatted})
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                                A ({compMetrics.radiusKmA} km) + B ({compMetrics.radiusKmB} km)
                            </div>
                        </div>

                        {/* Metrik 3: Jadwal Sewa */}
                        <div className="rounded-lg border border-neutral-200/80 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
                            <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                                <Calendar className="size-3 text-neutral-400" />
                                Jadwal Sewa
                            </div>
                            <div
                                className={`text-xs font-bold mt-1 ${compMetrics.isDateOverlap
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                    }`}
                            >
                                {compMetrics.isDateOverlap
                                    ? 'Periode Sewa Bersamaan'
                                    : 'Jadwal Berbeda (Aman)'}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                                {compMetrics.durationA ? `${compMetrics.durationA} hr` : '-'} vs{' '}
                                {compMetrics.durationB ? `${compMetrics.durationB} hr` : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Perbandingan Berdampingan: Channel A vs Channel B */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
                        {/* Kolom Channel Ditinjau (A) */}
                        <div className="rounded-lg border-2 border-blue-300/90 bg-white p-2.5 dark:border-blue-800/80 dark:bg-neutral-900 space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between border-b pb-1.5 border-neutral-100 dark:border-neutral-800">
                                <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    Channel A (Ditinjau)
                                </span>
                                <span className="font-mono text-[10px] text-neutral-500">
                                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                                </span>
                            </div>
                            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                                <Building2 className="size-3 text-neutral-400 shrink-0" />
                                <span className="truncate">
                                    {currentPameran?.dealer?.nama_dealer || popupText || 'Channel Ditinjau'}
                                </span>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
                                <span>
                                    Jenis: <b>{currentPameran?.jenis_pameran?.jenis_pameran || '-'}</b>
                                </span>
                                <span className="text-[10px] text-neutral-500">
                                    Radius: {compMetrics.radiusKmA} km
                                </span>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                Periode: <b>{formatDateIndo(currentPameran?.mulai_tanggal_sewa)} s/d {formatDateIndo(currentPameran?.tanggal_sewa_berakhir)}</b>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                Lokasi: {currentPameran?.kecamatan || '-'}{currentPameran?.kabupaten ? `, ${currentPameran.kabupaten}` : ''}
                                {currentPameran?.detail_alamat ? ` (${currentPameran.detail_alamat})` : ''}
                            </div>
                        </div>

                        {/* Kolom Channel Pembanding (B) */}
                        <div className="rounded-lg border-2 border-orange-300/90 bg-white p-2.5 dark:border-orange-800/80 dark:bg-neutral-900 space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between border-b pb-1.5 border-neutral-100 dark:border-neutral-800">
                                <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                    Channel B (Pembanding)
                                </span>
                                <span className="font-mono text-[10px] text-neutral-500">
                                    {Number(selectedCompareChannel.latitude).toFixed(5)}, {Number(selectedCompareChannel.longitude).toFixed(5)}
                                </span>
                            </div>
                            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                                <Building2 className="size-3 text-neutral-400 shrink-0" />
                                <span className="truncate">
                                    {selectedCompareChannel.dealer?.nama_dealer || 'Dealer Pembanding'}
                                    {selectedCompareChannel.dealer?.kode_dealer ? ` (${selectedCompareChannel.dealer.kode_dealer})` : ''}
                                </span>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
                                <span>
                                    Jenis: <b>{selectedCompareChannel.jenis_pameran?.jenis_pameran || '-'}</b>
                                </span>
                                <span className="text-[10px] text-neutral-500">
                                    Radius: {compMetrics.radiusKmB} km
                                </span>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                Periode: <b>{formatDateIndo(selectedCompareChannel.mulai_tanggal_sewa)} s/d {formatDateIndo(selectedCompareChannel.tanggal_sewa_berakhir)}</b>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                Lokasi: {selectedCompareChannel.kecamatan || '-'}{selectedCompareChannel.kabupaten ? `, ${selectedCompareChannel.kabupaten}` : ''}
                                {selectedCompareChannel.detail_alamat ? ` (${selectedCompareChannel.detail_alamat})` : ''}
                            </div>
                            {selectedCompareChannel.kode_pameran_md && (
                                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                                    Kode MD: {selectedCompareChannel.kode_pameran_md}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
