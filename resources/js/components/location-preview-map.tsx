import { usePage } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { AlertTriangle, Locate } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
    checkRadiusConflicts,
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
}: LocationPreviewMapProps) {
    const page = usePage<{ auth?: { user?: { role?: string } } }>();
    const isDealerUser = isDealer ?? (page?.props?.auth?.user?.role === 'dealer');

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const reviewCircleRef = useRef<L.Circle | null>(null);
    const otherMarkersLayerRef = useRef<L.LayerGroup | null>(null);

    const conflicts = showRadius
        ? checkRadiusConflicts(
            latitude,
            longitude,
            otherChannels,
            currentChannelId,
        )
        : [];
    const hasConflict = conflicts.length > 0;

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
                    `<b>Radius Channel Terdaftar (2 km)</b>${
                        item.jenis_pameran?.jenis_pameran
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
                    `<b>Radius Channel Anda (2 km)</b>${
                        item.jenis_pameran?.jenis_pameran
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
            zoomControl: true,
            scrollWheelZoom: false, // Prevent accidental scrolling when inspecting modal
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        // Layer for other registered channels
        const otherLayer = L.layerGroup().addTo(map);
        otherMarkersLayerRef.current = otherLayer;
        renderOtherChannels(otherLayer, otherChannels, currentChannelId, isDealerUser);

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
                ? `⚠️ Peringatan: Menimpa Radius Channel Lain! (${initialConflicts[0].distance < 1000 ? `${Math.round(initialConflicts[0].distance)} m` : `${(initialConflicts[0].distance / 1000).toFixed(2)} km`})`
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
                ? `<b>Titik Channel Ditinjau</b>${isConflict ? ' - ⚠️ Menimpa Radius' : ''}<br/><span style="font-size: 10px;">${popupText || ''}</span>`
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
            if (otherMarkersLayerRef.current) {
                otherMarkersLayerRef.current.clearLayers();
                otherMarkersLayerRef.current = null;
            }
            if (reviewCircleRef.current) {
                reviewCircleRef.current.remove();
                reviewCircleRef.current = null;
            }
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [latitude, longitude, popupText]);

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
                ? `⚠️ Peringatan: Menimpa Radius Channel Lain! (${currentConflicts[0].distance < 1000 ? `${Math.round(currentConflicts[0].distance)} m` : `${(currentConflicts[0].distance / 1000).toFixed(2)} km`})`
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
        <div
            className={`relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-xs ${className}`}
            style={{ height }}
        >
            <div ref={mapContainerRef} className="h-full w-full z-0" />

            {/* Quick focus button */}
            <button
                type="button"
                onClick={() =>
                    mapInstanceRef.current?.setView([latitude, longitude], 15, {
                        animate: true,
                    })
                }
                className="absolute top-2 right-2 z-[400] rounded-md bg-background/95 px-2 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 shadow-sm backdrop-blur-xs border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-1"
                title="Fokus kembali ke lokasi channel yang sedang ditinjau"
            >
                <Locate className="size-3 text-red-500" />
                Fokus Titik Ini
            </button>

            {/* Top Warning Badge if Menimpa Radius */}
            {showRadius && hasConflict && (
                <div className="absolute top-2 left-2 z-[400] max-w-[calc(100%-140px)] rounded-md bg-red-600/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md backdrop-blur-xs flex items-center gap-1.5 animate-in fade-in duration-150">
                    <AlertTriangle className="size-3.5 shrink-0 text-white animate-pulse" />
                    <span className="truncate">
                        Menimpa radius channel lain ({conflicts[0].distance < 1000 ? `${Math.round(conflicts[0].distance)} m` : `${(conflicts[0].distance / 1000).toFixed(2)} km`})
                    </span>
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
                            <span>Menimpa {conflicts.length} Radius Channel Terdaftar</span>
                        </div>
                    ) : (
                        otherChannelsCount > 0 && (
                            <div className="rounded-full bg-blue-50/95 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 shadow-xs backdrop-blur-xs flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                                {isDealerUser
                                    ? `${otherChannelsCount} Radius Channel (2 km)`
                                    : `${otherChannelsCount} Channel Terdaftar Lainnya`}
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    );
}
