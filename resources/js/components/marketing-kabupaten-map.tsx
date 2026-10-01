import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    BarChart3,
    Bike,
    ChevronRight,
    Compass,
    Filter,
    Layers,
    MapPin,
    RotateCcw,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Fix default marker icon path issue in Vite bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Center of Nusa Tenggara Barat (Lombok to Sumbawa)
const NTB_CENTER: [number, number] = [-8.62, 117.2];
const NTB_DEFAULT_ZOOM = 8;

export interface TopBrandItem {
    brand: string;
    count: number;
    percentage: number;
    is_honda: boolean;
}

export interface TopKecamatanStat {
    kecamatan: string;
    count: number;
}

export interface DesaMapItem {
    desa: string;
    total: number;
    honda_count: number;
    competitor_count: number;
    honda_share: number;
    latitude?: number;
    longitude?: number;
}

export interface KecamatanMapItem {
    kecamatan: string;
    total: number;
    honda_count: number;
    competitor_count: number;
    honda_share: number;
    latitude: number;
    longitude: number;
    desas?: DesaMapItem[];
}

export interface KabupatenMapItem {
    kabupaten: string;
    total: number;
    honda_count: number;
    competitor_count: number;
    honda_share: number;
    percentage_of_total: number;
    latitude?: number | null;
    longitude?: number | null;
    capital?: string | null;
    top_brands?: TopBrandItem[];
    top_kecamatans?: TopKecamatanStat[];
    kecamatans?: KecamatanMapItem[];
}

interface MarketingKabupatenMapProps {
    kabupatenData: KabupatenMapItem[];
    height?: string;
    className?: string;
    selectedKabupatenFilter?: string;
    onSelectKabupatenFilter?: (kabupaten: string) => void;
}

export default function MarketingKabupatenMap({
    kabupatenData,
    height = '520px',
    className = '',
    selectedKabupatenFilter = 'all',
    onSelectKabupatenFilter,
}: MarketingKabupatenMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const kabupatenMarkersLayerRef = useRef<L.LayerGroup | null>(null);
    const overlayLayerRef = useRef<L.LayerGroup | null>(null);

    const [metricMode, setMetricMode] = useState<'share' | 'volume'>('share');
    const [overlayMode, setOverlayMode] = useState<'kecamatan' | 'desa'>('kecamatan');
    const [selectedKabupaten, setSelectedKabupaten] = useState<KabupatenMapItem | null>(null);
    const [selectedKecamatan, setSelectedKecamatan] = useState<KecamatanMapItem | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Filter valid kabupatens with coordinates
    const mappedKabupatens = useMemo(() => {
        return kabupatenData.filter(
            (item) =>
                item.latitude != null &&
                item.longitude != null &&
                !isNaN(item.latitude) &&
                !isNaN(item.longitude),
        );
    }, [kabupatenData]);

    // All desas in the currently selected kabupaten
    const allDesasInSelectedKab = useMemo(() => {
        if (!selectedKabupaten?.kecamatans) return [];
        return selectedKabupaten.kecamatans.flatMap((k) =>
            (k.desas || []).map((d) => ({
                ...d,
                kecamatan: k.kecamatan,
            })),
        );
    }, [selectedKabupaten]);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
            center: NTB_CENTER,
            zoom: NTB_DEFAULT_ZOOM,
            minZoom: 7,
            maxZoom: 16,
            scrollWheelZoom: true,
            zoomControl: false,
        });

        // Add Zoom Control to bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        const kabLayer = L.layerGroup().addTo(map);
        const overlayLayer = L.layerGroup().addTo(map);

        kabupatenMarkersLayerRef.current = kabLayer;
        overlayLayerRef.current = overlayLayer;
        mapInstanceRef.current = map;
        setIsMapReady(true);

        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Render Kabupaten Markers (Visible when no kabupaten is selected or as secondary pins)
    useEffect(() => {
        if (!mapInstanceRef.current || !kabupatenMarkersLayerRef.current || !isMapReady) return;

        const map = mapInstanceRef.current;
        const layer = kabupatenMarkersLayerRef.current;
        layer.clearLayers();

        if (mappedKabupatens.length === 0) return;

        // When a kabupaten is selected, hide the general kabupaten markers so the kecamatan/desa overlay is clear
        if (selectedKabupaten) {
            return;
        }

        const bounds = L.latLngBounds([]);

        mappedKabupatens.forEach((item) => {
            if (item.latitude == null || item.longitude == null) return;

            const latLng: [number, number] = [item.latitude, item.longitude];
            bounds.extend(latLng);

            const isDominant = item.honda_share >= 70;
            const isStrong = item.honda_share >= 50 && item.honda_share < 70;

            const badgeBgColor = isDominant ? '#dc2626' : isStrong ? '#d97706' : '#4b5563';
            const badgeTextColor = '#ffffff';

            const displayValue =
                metricMode === 'share'
                    ? `${item.honda_share}%`
                    : item.total >= 1000
                      ? `${(item.total / 1000).toFixed(1)}k`
                      : `${item.total}`;

            const subLabel = metricMode === 'share' ? 'Honda' : 'Unit R2';
            const shortName = item.kabupaten.replace(/^(KAB\.?|KOTA)\s+/i, '');

            const customHtml = `
                <div class="kabupaten-marker-container" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    transform: translate(-50%, -50%);
                    transition: transform 0.2s ease, filter 0.2s ease;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
                ">
                    <div style="
                        background-color: ${badgeBgColor};
                        color: ${badgeTextColor};
                        border: 2px solid #ffffff;
                        border-radius: 9999px;
                        padding: 3px 8px;
                        font-family: inherit;
                        font-weight: 700;
                        font-size: 11px;
                        line-height: 1.2;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        white-space: nowrap;
                    ">
                        <span>${displayValue}</span>
                        <span style="font-size: 9px; opacity: 0.85; font-weight: 500;">${subLabel}</span>
                    </div>
                    <div style="
                        background-color: rgba(15, 23, 42, 0.88);
                        color: #ffffff;
                        padding: 1px 6px;
                        border-radius: 4px;
                        font-size: 9.5px;
                        font-weight: 600;
                        margin-top: 3px;
                        white-space: nowrap;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        letter-spacing: 0.02em;
                    ">
                        ${shortName}
                    </div>
                </div>
            `;

            const customIcon = L.divIcon({
                className: 'kabupaten-map-div-icon',
                html: customHtml,
                iconSize: [80, 40],
                iconAnchor: [40, 20],
            });

            const marker = L.marker(latLng, { icon: customIcon });

            const tooltipContent = `
                <div style="font-family: inherit; padding: 4px 2px; min-width: 170px;">
                    <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 2px;">
                        ${item.kabupaten}
                    </div>
                    ${item.capital ? `<div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">Ibukota: ${item.capital}</div>` : ''}
                    <div style="font-size: 11px; color: #334155; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 5px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Total Unit R2:</span>
                            <strong>${item.total.toLocaleString('id-ID')} unit</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #dc2626;">
                            <span>Dominasi Honda:</span>
                            <strong>${item.honda_share}% (${item.honda_count.toLocaleString('id-ID')})</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #64748b;">
                            <span>Kompetitor:</span>
                            <span>${item.competitor_count.toLocaleString('id-ID')} unit</span>
                        </div>
                    </div>
                    <div style="margin-top: 6px; font-size: 9.5px; color: #dc2626; font-weight: 600; text-align: center;">
                        Klik untuk buka overlay kecamatan &amp; desa
                    </div>
                </div>
            `;

            marker.bindTooltip(tooltipContent, {
                direction: 'top',
                offset: [0, -16],
                opacity: 0.98,
                className: 'kabupaten-leaflet-tooltip',
            });

            marker.on('click', () => {
                setSelectedKabupaten(item);
                setSelectedKecamatan(null);
                map.flyTo(latLng, 11, { duration: 0.8 });
            });

            marker.addTo(layer);
        });

        if (bounds.isValid() && selectedKabupatenFilter === 'all') {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
        }
    }, [mappedKabupatens, metricMode, selectedKabupaten, isMapReady, selectedKabupatenFilter]);

    // Render Overlay Kecamatan & Desa when a Kabupaten is selected
    useEffect(() => {
        if (!mapInstanceRef.current || !overlayLayerRef.current || !isMapReady) return;

        const map = mapInstanceRef.current;
        const layer = overlayLayerRef.current;
        layer.clearLayers();

        if (!selectedKabupaten) return;

        const kecamatans = selectedKabupaten.kecamatans || [];
        if (kecamatans.length === 0) return;

        const bounds = L.latLngBounds([]);

        if (overlayMode === 'kecamatan') {
            // RENDER OVERLAY KECAMATAN (Colored Coverage Circles & Interactive Pin Badges)
            kecamatans.forEach((k) => {
                if (k.latitude == null || k.longitude == null) return;
                const latLng: [number, number] = [k.latitude, k.longitude];
                bounds.extend(latLng);

                const isDominant = k.honda_share >= 70;
                const isStrong = k.honda_share >= 50 && k.honda_share < 70;
                const zoneColor = isDominant ? '#dc2626' : isStrong ? '#d97706' : '#4b5563';

                // Scaled circle radius based on unit volume
                const radiusMeters = 2000 + Math.min(2500, k.total * 8);

                const isKecSelected = selectedKecamatan?.kecamatan === k.kecamatan;

                // 1. Coverage Area Circle
                const circle = L.circle(latLng, {
                    radius: radiusMeters,
                    color: zoneColor,
                    fillColor: zoneColor,
                    fillOpacity: isKecSelected ? 0.38 : 0.22,
                    weight: isKecSelected ? 3 : 2,
                    dashArray: isKecSelected ? undefined : '4, 4',
                });

                circle.on('mouseover', () => {
                    circle.setStyle({ fillOpacity: 0.38, weight: 3 });
                });

                circle.on('mouseout', () => {
                    if (selectedKecamatan?.kecamatan !== k.kecamatan) {
                        circle.setStyle({ fillOpacity: 0.22, weight: 2 });
                    }
                });

                circle.on('click', () => {
                    setSelectedKecamatan(k);
                    map.flyTo(latLng, 12, { duration: 0.6 });
                });

                circle.addTo(layer);

                // 2. Center Pill Badge Marker
                const cleanKecName = k.kecamatan.replace(/^(KEC\.?|KECAMATAN)\s+/i, '');
                const kecMarkerHtml = `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        cursor: pointer;
                        transform: translate(-50%, -50%);
                        transition: transform 0.2s ease, filter 0.2s ease;
                        filter: ${isKecSelected ? 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.9))' : 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))'};
                    ">
                        <div style="
                            background-color: ${isKecSelected ? '#b91c1c' : zoneColor};
                            color: #ffffff;
                            border: 2px solid #ffffff;
                            border-radius: 9999px;
                            padding: 2.5px 7px;
                            font-size: 10px;
                            font-weight: 700;
                            white-space: nowrap;
                            display: flex;
                            align-items: center;
                            gap: 3.5px;
                        ">
                            <span>${cleanKecName}</span>
                            <span style="background: rgba(0,0,0,0.25); border-radius: 9999px; padding: 1px 5px; font-size: 9px;">
                                ${k.total}
                            </span>
                        </div>
                        <div style="
                            background: rgba(15, 23, 42, 0.9);
                            color: #ffffff;
                            padding: 1px 5px;
                            border-radius: 4px;
                            font-size: 8.5px;
                            font-weight: 600;
                            margin-top: 2px;
                            white-space: nowrap;
                        ">
                            Honda ${k.honda_share}%
                        </div>
                    </div>
                `;

                const kecIcon = L.divIcon({
                    className: 'kecamatan-div-icon',
                    html: kecMarkerHtml,
                    iconSize: [90, 36],
                    iconAnchor: [45, 18],
                });

                const kecMarker = L.marker(latLng, { icon: kecIcon });

                const topDesasHtml = (k.desas || [])
                    .slice(0, 3)
                    .map((d) => `<span style="background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 9.5px; margin-right: 3px;">${d.desa} (${d.total})</span>`)
                    .join('');

                const tooltipHtml = `
                    <div style="font-family: inherit; padding: 3px 2px; min-width: 160px;">
                        <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 2px;">
                            ${k.kecamatan}
                        </div>
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 5px;">
                            Wilayah ${selectedKabupaten.kabupaten}
                        </div>
                        <div style="font-size: 11px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 4px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>Total Unit R2:</span>
                                <strong>${k.total.toLocaleString('id-ID')} unit</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: #dc2626;">
                                <span>Dominasi Honda:</span>
                                <strong>${k.honda_share}% (${k.honda_count.toLocaleString('id-ID')})</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: #64748b;">
                                <span>Kompetitor:</span>
                                <span>${k.competitor_count.toLocaleString('id-ID')} unit</span>
                            </div>
                        </div>
                        ${topDesasHtml ? `<div style="margin-top: 6px; border-top: 1px solid #f1f5f9; padding-top: 4px;"><div style="font-size: 9.5px; font-weight: 600; color: #475569; margin-bottom: 3px;">Desa/Kelurahan:</div>${topDesasHtml}</div>` : ''}
                    </div>
                `;

                kecMarker.bindTooltip(tooltipHtml, {
                    direction: 'top',
                    offset: [0, -14],
                    opacity: 0.98,
                });

                kecMarker.on('click', () => {
                    setSelectedKecamatan(k);
                    map.flyTo(latLng, 12, { duration: 0.6 });
                });

                kecMarker.addTo(layer);
            });
        } else {
            // RENDER OVERLAY DESA (Villages / Kelurahans)
            const desasToRender = selectedKecamatan
                ? (selectedKecamatan.desas || []).map((d) => ({ ...d, kecamatan: selectedKecamatan.kecamatan }))
                : allDesasInSelectedKab;

            desasToRender.forEach((d) => {
                if (d.latitude == null || d.longitude == null) return;
                const latLng: [number, number] = [d.latitude, d.longitude];
                bounds.extend(latLng);

                const isDominant = d.honda_share >= 70;
                const isStrong = d.honda_share >= 50 && d.honda_share < 70;
                const desaBadgeColor = isDominant ? '#dc2626' : isStrong ? '#d97706' : '#4b5563';

                const desaHtml = `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 3px;
                        background-color: rgba(255, 255, 255, 0.95);
                        border: 1.5px solid ${desaBadgeColor};
                        color: #0f172a;
                        padding: 1.5px 6px;
                        border-radius: 9999px;
                        font-size: 9.5px;
                        font-weight: 600;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.18);
                        white-space: nowrap;
                        transform: translate(-50%, -50%);
                        cursor: pointer;
                    ">
                        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background-color: ${desaBadgeColor};"></span>
                        <span>${d.desa}</span>
                        <span style="background-color: #f1f5f9; color: #334155; padding: 0.5px 4px; border-radius: 4px; font-size: 8.5px; font-weight: 700;">
                            ${d.total}
                        </span>
                    </div>
                `;

                const desaIcon = L.divIcon({
                    className: 'desa-div-icon',
                    html: desaHtml,
                    iconSize: [80, 22],
                    iconAnchor: [40, 11],
                });

                const desaMarker = L.marker(latLng, { icon: desaIcon });

                const desaTooltip = `
                    <div style="font-family: inherit; padding: 3px 2px; min-width: 140px;">
                        <div style="font-weight: 700; font-size: 11.5px; color: #0f172a;">
                            Desa / Kel. ${d.desa}
                        </div>
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px;">
                            ${d.kecamatan}
                        </div>
                        <div style="font-size: 10.5px; border-top: 1px solid #e2e8f0; padding-top: 3px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>Total R2:</span>
                                <strong>${d.total} unit</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: #dc2626;">
                                <span>Honda:</span>
                                <strong>${d.honda_share}% (${d.honda_count})</strong>
                            </div>
                        </div>
                    </div>
                `;

                desaMarker.bindTooltip(desaTooltip, {
                    direction: 'top',
                    offset: [0, -10],
                    opacity: 0.98,
                });

                desaMarker.addTo(layer);
            });
        }

        // Adjust bounds if valid
        if (bounds.isValid() && !selectedKecamatan) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [selectedKabupaten, overlayMode, selectedKecamatan, isMapReady, allDesasInSelectedKab]);

    // Handle Reset View (Fit All NTB)
    const handleResetView = () => {
        setSelectedKabupaten(null);
        setSelectedKecamatan(null);
        if (overlayLayerRef.current) {
            overlayLayerRef.current.clearLayers();
        }
        if (mapInstanceRef.current && mappedKabupatens.length > 0) {
            const bounds = L.latLngBounds([]);
            mappedKabupatens.forEach((item) => {
                if (item.latitude != null && item.longitude != null) {
                    bounds.extend([item.latitude, item.longitude]);
                }
            });
            if (bounds.isValid()) {
                mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
            } else {
                mapInstanceRef.current.setView(NTB_CENTER, NTB_DEFAULT_ZOOM);
            }
        }
    };

    // Fly to specific kabupaten when chosen from dropdown
    const handleSelectKabupatenFromDropdown = (value: string) => {
        if (value === 'all') {
            handleResetView();
            return;
        }

        const found = mappedKabupatens.find((k) => k.kabupaten === value);
        if (found && found.latitude != null && found.longitude != null && mapInstanceRef.current) {
            setSelectedKabupaten(found);
            setSelectedKecamatan(null);
            mapInstanceRef.current.flyTo([found.latitude, found.longitude], 11, {
                duration: 0.8,
            });
        }
    };

    // Fly to specific kecamatan
    const handleSelectKecamatanClick = (kec: KecamatanMapItem) => {
        setSelectedKecamatan(kec);
        if (mapInstanceRef.current && kec.latitude != null && kec.longitude != null) {
            mapInstanceRef.current.flyTo([kec.latitude, kec.longitude], 12.5, {
                duration: 0.7,
            });
        }
    };

    return (
        <Card className={`border-sidebar-border/70 shadow-xs overflow-hidden dark:border-sidebar-border ${className}`}>
            {/* Toolbar Atas Peta */}
            <div className="flex flex-col gap-3 border-b border-sidebar-border/70 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-sidebar-border bg-neutral-50/50 dark:bg-neutral-900/30">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 mr-1">
                        <MapPin className="size-4 text-red-600" />
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            Peta Sebaran R2 NTB
                        </span>
                    </div>

                    {/* Dropdown Pemilihan Wilayah */}
                    <Select
                        value={selectedKabupaten?.kabupaten || 'all'}
                        onValueChange={handleSelectKabupatenFromDropdown}
                    >
                        <SelectTrigger className="h-8 w-[170px] text-xs">
                            <SelectValue placeholder="Fokus Kabupaten" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Seluruh NTB (Pusatkan)</SelectItem>
                            {mappedKabupatens.map((item) => (
                                <SelectItem key={item.kabupaten} value={item.kabupaten}>
                                    {item.kabupaten}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Mode Metrik Marker Toggle */}
                    <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-950">
                        <button
                            type="button"
                            onClick={() => setMetricMode('share')}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                metricMode === 'share'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                            }`}
                        >
                            Pangsa Honda (%)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMetricMode('volume')}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                metricMode === 'volume'
                                    ? 'bg-neutral-900 text-white shadow-xs dark:bg-neutral-100 dark:text-neutral-900'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                            }`}
                        >
                            Volume Unit
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 mr-1">
                            {selectedKabupaten
                                ? `${selectedKabupaten.kecamatans?.length || 0} Kecamatan`
                                : `${mappedKabupatens.length} Kabupaten`}
                        </span>
                        <span>{selectedKabupaten ? 'di Wilayah Ini' : 'Terpetakan'}</span>
                    </Badge>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetView}
                        className="h-8 text-xs gap-1.5"
                        title="Pusatkan kembali peta NTB"
                    >
                        <RotateCcw className="size-3" />
                        Pusatkan NTB
                    </Button>
                </div>
            </div>

            {/* Container Peta Leaflet */}
            <div className="relative w-full overflow-hidden" style={{ height }}>
                <div ref={mapContainerRef} className="size-full z-0" />

                {/* Floating Top Bar Saat Kabupaten Dipilih (Switch Overlay Kecamatan / Desa) */}
                {selectedKabupaten && (
                    <div className="absolute top-3 left-3 right-3 sm:right-auto z-[450] flex flex-wrap items-center gap-2 rounded-xl bg-background/95 p-2 shadow-lg backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800/90 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100 pr-2 border-r border-neutral-200 dark:border-neutral-800">
                            <MapPin className="size-3.5 text-red-600" />
                            <span className="truncate max-w-[150px]">{selectedKabupaten.kabupaten}</span>
                        </div>

                        {/* Switch Overlay: Kecamatan vs Desa */}
                        <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-950">
                            <button
                                type="button"
                                onClick={() => {
                                    setOverlayMode('kecamatan');
                                    setSelectedKecamatan(null);
                                }}
                                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                    overlayMode === 'kecamatan'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                }`}
                            >
                                Kecamatan ({selectedKabupaten.kecamatans?.length || 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => setOverlayMode('desa')}
                                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                    overlayMode === 'desa'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                }`}
                            >
                                Desa ({allDesasInSelectedKab.length})
                            </button>
                        </div>

                        {selectedKecamatan && (
                            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 text-[10px] gap-1 py-0.5">
                                <span>Kec. {selectedKecamatan.kecamatan.replace(/^(KEC\.?|KECAMATAN)\s+/i, '')}</span>
                                <button
                                    onClick={() => setSelectedKecamatan(null)}
                                    className="hover:text-red-900"
                                    title="Hapus fokus kecamatan"
                                >
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetView}
                            className="h-7 text-xs px-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 ml-auto"
                        >
                            <X className="size-3.5 mr-1" />
                            Tutup
                        </Button>
                    </div>
                )}

                {/* Floating Quick Stats Card saat Kabupaten diklik */}
                {selectedKabupaten && (
                    <div className="absolute bottom-4 left-4 z-[450] w-full max-w-sm max-h-[82%] overflow-y-auto rounded-xl border border-neutral-200/90 bg-background/95 p-4 shadow-xl backdrop-blur-md dark:border-neutral-800/90 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                        {selectedKabupaten.kabupaten}
                                    </h4>
                                    {selectedKabupaten.honda_share >= 70 ? (
                                        <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px] h-4 px-1.5">
                                            Dominan
                                        </Badge>
                                    ) : selectedKabupaten.honda_share >= 50 ? (
                                        <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400 text-[10px] h-4 px-1.5">
                                            Kuat
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                            Kompetitif
                                        </Badge>
                                    )}
                                </div>
                                {selectedKabupaten.capital && (
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        Pusat Administrasi: {selectedKabupaten.capital}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedKabupaten(null);
                                    setSelectedKecamatan(null);
                                }}
                                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>

                        {/* Statistik Angka Utama */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Total Unit R2</div>
                                <div className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                                    {selectedKabupaten.total.toLocaleString('id-ID')}
                                </div>
                                <div className="text-[10px] text-neutral-500">
                                    {selectedKabupaten.percentage_of_total}% dari total NTB
                                </div>
                            </div>
                            <div className="rounded-lg bg-red-50 p-2 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                                <div className="text-[11px] text-red-600 dark:text-red-400 font-medium">Honda Share</div>
                                <div className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5">
                                    {selectedKabupaten.honda_share}%
                                </div>
                                <div className="text-[10px] text-red-700/80 dark:text-red-300/80">
                                    {selectedKabupaten.honda_count.toLocaleString('id-ID')} unit terdaftar
                                </div>
                            </div>
                        </div>

                        {/* Visual Progress Bar Honda vs Kompetitor */}
                        <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    Honda: {selectedKabupaten.honda_count.toLocaleString('id-ID')}
                                </span>
                                <span className="text-neutral-500">
                                    Kompetitor: {selectedKabupaten.competitor_count.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
                                <div
                                    className="bg-red-600 h-full transition-all"
                                    style={{ width: `${Math.min(100, selectedKabupaten.honda_share)}%` }}
                                />
                                <div
                                    className="bg-neutral-400 dark:bg-neutral-600 h-full transition-all"
                                    style={{ width: `${Math.max(0, 100 - selectedKabupaten.honda_share)}%` }}
                                />
                            </div>
                        </div>

                        {/* Top 3 Brands di Kabupaten Ini */}
                        {selectedKabupaten.top_brands && selectedKabupaten.top_brands.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1">
                                    <BarChart3 className="size-3 text-neutral-400" />
                                    Top Merk Kendaraan:
                                </div>
                                <div className="space-y-1">
                                    {selectedKabupaten.top_brands.map((b) => (
                                        <div key={b.brand} className="flex items-center justify-between text-[11px]">
                                            <span className={b.is_honda ? 'font-bold text-red-600 dark:text-red-400' : 'text-neutral-600 dark:text-neutral-400'}>
                                                {b.brand}
                                            </span>
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                {b.count.toLocaleString('id-ID')} unit ({b.percentage}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rincian Kecamatan / Overlay Navigasi */}
                        {selectedKabupaten.kecamatans && selectedKabupaten.kecamatans.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="size-3 text-red-600" />
                                        Rincian Kecamatan ({selectedKabupaten.kecamatans.length}):
                                    </span>
                                    <span className="text-[10px] text-neutral-400 font-normal">
                                        Klik untuk zoom zona
                                    </span>
                                </div>
                                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                    {selectedKabupaten.kecamatans.map((k) => {
                                        const isKecActive = selectedKecamatan?.kecamatan === k.kecamatan;

                                        return (
                                            <button
                                                key={k.kecamatan}
                                                type="button"
                                                onClick={() => handleSelectKecamatanClick(k)}
                                                className={`w-full flex items-center justify-between p-1.5 rounded-md text-[11px] transition-all text-left ${
                                                    isKecActive
                                                        ? 'bg-red-50 text-red-700 border border-red-200 font-semibold dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
                                                        : 'bg-neutral-50/80 hover:bg-neutral-100 text-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-200 dark:hover:bg-neutral-800'
                                                }`}
                                            >
                                                <div className="truncate pr-1">
                                                    {k.kecamatan.replace(/^(KEC\.?|KECAMATAN)\s+/i, '')}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[10px] text-neutral-500">
                                                        {k.total} unit
                                                    </span>
                                                    <span className={`text-[10px] font-bold ${k.honda_share >= 70 ? 'text-red-600 dark:text-red-400' : 'text-neutral-600'}`}>
                                                        {k.honda_share}%
                                                    </span>
                                                    <ChevronRight className="size-3 text-neutral-400" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Rincian Desa / Kelurahan jika Kecamatan Dipilih */}
                        {selectedKecamatan && selectedKecamatan.desas && selectedKecamatan.desas.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                                    <span>Desa di {selectedKecamatan.kecamatan.replace(/^(KEC\.?|KECAMATAN)\s+/i, '')}:</span>
                                    <button
                                        type="button"
                                        onClick={() => setOverlayMode('desa')}
                                        className="text-[10px] text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        Tampilkan Pin Desa
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                    {selectedKecamatan.desas.map((d) => (
                                        <Badge
                                            key={d.desa}
                                            variant="secondary"
                                            className="text-[9.5px] py-0 px-1.5 font-normal"
                                        >
                                            {d.desa} ({d.total})
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Filter Button */}
                        {onSelectKabupatenFilter && (
                            <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSelectKabupatenFilter(selectedKabupaten.kabupaten)}
                                    className="w-full text-xs h-7 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                                >
                                    <Filter className="size-3" />
                                    Saring Dashboard Wilayah Ini
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Bar: Legenda Performa Memanjang di Bawah (Agar Tidak Menutupi Peta) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-sidebar-border/70 px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 text-xs dark:border-sidebar-border">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                        <Layers className="size-3.5 text-neutral-500" />
                        <span>Legenda Performa:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-neutral-600 dark:text-neutral-300 text-[11px]">
                        <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-red-600 shrink-0" />
                            <span>Dominan (Honda &ge; 70%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-amber-600 shrink-0" />
                            <span>Kuat (50% - 69.9%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-neutral-600 shrink-0" />
                            <span>Kompetitif (&lt; 50%)</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <Compass className="size-3 text-neutral-400" />
                    <span>
                        {selectedKabupaten
                            ? 'Klik zona/pin untuk zoom kecamatan & desa'
                            : 'Klik pin kabupaten untuk melihat statistik & overlay'}
                    </span>
                </div>
            </div>
        </Card>
    );
}
