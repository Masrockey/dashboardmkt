import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    ArrowLeft,
    BarChart3,
    Bike,
    ChevronRight,
    Compass,
    Filter,
    Layers,
    MapPin,
    RotateCcw,
    Search,
    Tag,
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

export interface NamaPasarItem {
    nama_pasar: string;
    brand: string;
    count: number;
    is_honda: boolean;
    percentage?: number;
    desa_counts?: Record<string, number>;
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
    top_brands?: TopBrandItem[];
    nama_pasars?: NamaPasarItem[];
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

type MetricMode = 'share' | 'competitor' | 'volume';

export default function MarketingKabupatenMap({
    kabupatenData,
    height = '540px',
    className = '',
    selectedKabupatenFilter = 'all',
    onSelectKabupatenFilter,
}: MarketingKabupatenMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const kabupatenMarkersLayerRef = useRef<L.LayerGroup | null>(null);
    const overlayLayerRef = useRef<L.LayerGroup | null>(null);

    const [metricMode, setMetricMode] = useState<MetricMode>('share');
    const [selectedKabupaten, setSelectedKabupaten] = useState<KabupatenMapItem | null>(null);
    const [selectedKecamatan, setSelectedKecamatan] = useState<KecamatanMapItem | null>(null);
    const [selectedDesa, setSelectedDesa] = useState<string | null>(null);
    const [brandFilter, setBrandFilter] = useState<string>('ALL');
    const [namaPasarSearch, setNamaPasarSearch] = useState<string>('');
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

    // Render Kabupaten Markers
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

            // Competitor stats
            const competitorShare = item.total > 0 ? Math.round((item.competitor_count / item.total) * 1000) / 10 : 0;
            const topCompetitorBrand = (item.top_brands || []).find((b) => !b.is_honda)?.brand || 'Kompetitor';

            let badgeBgColor = '#dc2626';
            let displayValue = `${item.honda_share}%`;
            let subLabel = 'Honda';

            if (metricMode === 'competitor') {
                displayValue = `${competitorShare}%`;
                subLabel = topCompetitorBrand;
                badgeBgColor = competitorShare >= 40 ? '#1d4ed8' : competitorShare >= 25 ? '#2563eb' : '#475569';
            } else if (metricMode === 'volume') {
                displayValue = item.total >= 1000 ? `${(item.total / 1000).toFixed(1)}k` : `${item.total}`;
                subLabel = 'Unit R2';
                badgeBgColor = item.total >= 2000 ? '#0f172a' : item.total >= 1000 ? '#334155' : '#64748b';
            } else {
                const isDominant = item.honda_share >= 70;
                const isStrong = item.honda_share >= 50 && item.honda_share < 70;
                badgeBgColor = isDominant ? '#dc2626' : isStrong ? '#d97706' : '#4b5563';
                displayValue = `${item.honda_share}%`;
                subLabel = 'Honda';
            }

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
                        color: #ffffff;
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
                        <span style="font-size: 9px; opacity: 0.9; font-weight: 600;">${subLabel}</span>
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
                iconSize: [85, 40],
                iconAnchor: [42, 20],
            });

            const marker = L.marker(latLng, { icon: customIcon });

            // Brand breakdown html for tooltip
            const brandsHtml = (item.top_brands || [])
                .map((b) => `
                    <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-top: 2px;">
                        <span style="font-weight: ${b.is_honda ? '700' : '500'}; color: ${b.is_honda ? '#dc2626' : '#2563eb'};">
                            ${b.brand}:
                        </span>
                        <span>${b.count.toLocaleString('id-ID')} unit (${b.percentage}%)</span>
                    </div>
                `)
                .join('');

            const tooltipContent = `
                <div style="font-family: inherit; padding: 4px 2px; min-width: 190px;">
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
                            <span>Pangsa Honda:</span>
                            <strong>${item.honda_share}% (${item.honda_count.toLocaleString('id-ID')})</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #2563eb;">
                            <span>Pangsa Brand Lain:</span>
                            <strong>${competitorShare}% (${item.competitor_count.toLocaleString('id-ID')})</strong>
                        </div>
                    </div>
                    ${
                        brandsHtml
                            ? `
                        <div style="margin-top: 5px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
                            <div style="font-size: 10px; font-weight: 600; color: #475569; margin-bottom: 2px;">Rincian Merk:</div>
                            ${brandsHtml}
                        </div>
                    `
                            : ''
                    }
                    <div style="margin-top: 6px; font-size: 9.5px; color: #dc2626; font-weight: 600; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 4px;">
                        👆 Klik untuk buka overlay kecamatan &amp; desa
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
                setSelectedDesa(null);
                setBrandFilter('ALL');
                setNamaPasarSearch('');
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

        if (!selectedKecamatan) {
            // ========================================================
            // LEVEL 2: TAMPILKAN DAFTAR KECAMATAN DI KABUPATEN INI
            // ========================================================
            kecamatans.forEach((k) => {
                if (k.latitude == null || k.longitude == null) return;
                const latLng: [number, number] = [k.latitude, k.longitude];
                bounds.extend(latLng);

                const compShare = k.total > 0 ? Math.round((k.competitor_count / k.total) * 1000) / 10 : 0;
                const topKecCompBrand = (k.top_brands || []).find((b) => !b.is_honda)?.brand || 'Kompetitor';

                let zoneColor = '#dc2626';
                let subBadgeText = `Honda ${k.honda_share}%`;

                if (metricMode === 'competitor') {
                    zoneColor = compShare >= 40 ? '#1d4ed8' : compShare >= 25 ? '#2563eb' : '#475569';
                    subBadgeText = `${topKecCompBrand} ${compShare}%`;
                } else if (metricMode === 'volume') {
                    zoneColor = k.total >= 500 ? '#0f172a' : k.total >= 200 ? '#334155' : '#64748b';
                    subBadgeText = `${k.total} Unit`;
                } else {
                    const isDominant = k.honda_share >= 70;
                    const isStrong = k.honda_share >= 50 && k.honda_share < 70;
                    zoneColor = isDominant ? '#dc2626' : isStrong ? '#d97706' : '#4b5563';
                    subBadgeText = `Honda ${k.honda_share}%`;
                }

                // Scaled circle radius based on unit volume
                const radiusMeters = 2000 + Math.min(2500, k.total * 8);

                // 1. Coverage Area Circle
                const circle = L.circle(latLng, {
                    radius: radiusMeters,
                    color: zoneColor,
                    fillColor: zoneColor,
                    fillOpacity: 0.22,
                    weight: 2,
                    dashArray: '4, 4',
                });

                circle.on('mouseover', () => {
                    circle.setStyle({ fillOpacity: 0.38, weight: 3 });
                });

                circle.on('mouseout', () => {
                    circle.setStyle({ fillOpacity: 0.22, weight: 2 });
                });

                circle.on('click', () => {
                    setSelectedKecamatan(k);
                    setSelectedDesa(null);
                    setBrandFilter('ALL');
                    setNamaPasarSearch('');
                    map.flyTo(latLng, 12.5, { duration: 0.6 });
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
                        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
                    ">
                        <div style="
                            background-color: ${zoneColor};
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
                            ${subBadgeText}
                        </div>
                    </div>
                `;

                const kecIcon = L.divIcon({
                    className: 'kecamatan-div-icon',
                    html: kecMarkerHtml,
                    iconSize: [95, 36],
                    iconAnchor: [47, 18],
                });

                const kecMarker = L.marker(latLng, { icon: kecIcon });

                // Brand breakdown html for kecamatan tooltip
                const kecBrandsHtml = (k.top_brands || [])
                    .map((b) => `
                        <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-top: 2px;">
                            <span style="font-weight: ${b.is_honda ? '700' : '500'}; color: ${b.is_honda ? '#dc2626' : '#2563eb'};">
                                ${b.brand}:
                            </span>
                            <span>${b.count.toLocaleString('id-ID')} unit (${b.percentage}%)</span>
                        </div>
                    `)
                    .join('');

                const tooltipHtml = `
                    <div style="font-family: inherit; padding: 3px 2px; min-width: 180px;">
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
                                <span>Pangsa Honda:</span>
                                <strong>${k.honda_share}% (${k.honda_count.toLocaleString('id-ID')})</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: #2563eb;">
                                <span>Pangsa Brand Lain:</span>
                                <strong>${compShare}% (${k.competitor_count.toLocaleString('id-ID')})</strong>
                            </div>
                        </div>
                        ${
                            kecBrandsHtml
                                ? `
                            <div style="margin-top: 5px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
                                <div style="font-size: 10px; font-weight: 600; color: #475569; margin-bottom: 2px;">Rincian Merk di Kecamatan Ini:</div>
                                ${kecBrandsHtml}
                            </div>
                        `
                                : ''
                        }
                        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #cbd5e1; font-size: 9.5px; color: #dc2626; font-weight: 600; text-align: center;">
                            👆 Klik untuk melihat sebaran desa (${k.desas?.length || 0} desa) &amp; nama pasar
                        </div>
                    </div>
                `;

                kecMarker.bindTooltip(tooltipHtml, {
                    direction: 'top',
                    offset: [0, -14],
                    opacity: 0.98,
                });

                kecMarker.on('click', () => {
                    setSelectedKecamatan(k);
                    setSelectedDesa(null);
                    setBrandFilter('ALL');
                    setNamaPasarSearch('');
                    map.flyTo(latLng, 12.5, { duration: 0.6 });
                });

                kecMarker.addTo(layer);
            });

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
            }
        } else {
            // ========================================================
            // LEVEL 3: KECAMATAN DIKLIK -> TAMPILKAN SEBARAN DESA
            // ========================================================
            const kec = selectedKecamatan;
            const kecLatLng: [number, number] = [kec.latitude, kec.longitude];
            bounds.extend(kecLatLng);

            const compShare = kec.total > 0 ? Math.round((kec.competitor_count / kec.total) * 1000) / 10 : 0;
            const isDominant = kec.honda_share >= 70;
            const isStrong = kec.honda_share >= 50 && kec.honda_share < 70;
            const zoneColor =
                metricMode === 'competitor'
                    ? compShare >= 40
                        ? '#1d4ed8'
                        : '#2563eb'
                    : isDominant
                      ? '#dc2626'
                      : isStrong
                        ? '#d97706'
                        : '#4b5563';

            // 1. Lingkaran area kecamatan terpilih
            const radiusMeters = 2500 + Math.min(2500, kec.total * 8);
            const circle = L.circle(kecLatLng, {
                radius: radiusMeters,
                color: zoneColor,
                fillColor: zoneColor,
                fillOpacity: 0.12,
                weight: 2,
                dashArray: '4, 4',
            });
            circle.addTo(layer);

            const cleanKecName = kec.kecamatan.replace(/^(KEC\.?|KECAMATAN)\s+/i, '');

            // 2. Render Titik Setiap Desa / Kelurahan di Kecamatan Ini
            const desas = kec.desas || [];
            desas.forEach((d) => {
                if (d.latitude == null || d.longitude == null) return;
                const dLatLng: [number, number] = [d.latitude, d.longitude];
                bounds.extend(dLatLng);

                const isDesaSelected = selectedDesa === d.desa;
                const isDesaDominant = d.honda_share >= 70;
                const isDesaStrong = d.honda_share >= 50 && d.honda_share < 70;
                const desaBadgeColor =
                    metricMode === 'competitor'
                        ? d.competitor_count > d.honda_count
                            ? '#2563eb'
                            : '#64748b'
                        : isDesaDominant
                          ? '#dc2626'
                          : isDesaStrong
                            ? '#d97706'
                            : '#4b5563';

                const desaHtml = `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 3.5px;
                        background-color: ${isDesaSelected ? '#dc2626' : 'rgba(255, 255, 255, 0.96)'};
                        border: 2px solid ${isDesaSelected ? '#ffffff' : desaBadgeColor};
                        color: ${isDesaSelected ? '#ffffff' : '#0f172a'};
                        padding: ${isDesaSelected ? '3px 8px' : '2px 7px'};
                        border-radius: 9999px;
                        font-size: 10px;
                        font-weight: 700;
                        box-shadow: ${isDesaSelected ? '0 0 0 3px rgba(220, 38, 38, 0.4), 0 3px 6px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.2)'};
                        white-space: nowrap;
                        transform: translate(-50%, -50%) ${isDesaSelected ? 'scale(1.08)' : 'scale(1)'};
                        cursor: pointer;
                        transition: transform 0.15s ease, box-shadow 0.15s ease;
                    ">
                        <span style="display: inline-block; width: 6.5px; height: 6.5px; border-radius: 9999px; background-color: ${isDesaSelected ? '#ffffff' : desaBadgeColor}; shrink-0;"></span>
                        <span>${d.desa}</span>
                        <span style="background-color: ${isDesaSelected ? 'rgba(0,0,0,0.3)' : '#f1f5f9'}; color: ${isDesaSelected ? '#ffffff' : '#1e293b'}; padding: 0.5px 5px; border-radius: 4px; font-size: 9px; font-weight: 800;">
                            ${d.total}
                        </span>
                    </div>
                `;

                const desaIcon = L.divIcon({
                    className: 'desa-div-icon',
                    html: desaHtml,
                    iconSize: [95, 26],
                    iconAnchor: [47, 13],
                });

                const desaMarker = L.marker(dLatLng, {
                    icon: desaIcon,
                    zIndexOffset: isDesaSelected ? 1000 : 500,
                });

                const desaTooltip = `
                    <div style="font-family: inherit; padding: 3px 2px; min-width: 160px;">
                        <div style="font-weight: 700; font-size: 12px; color: #0f172a;">
                            Desa / Kel. ${d.desa}
                        </div>
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 5px;">
                            Kec. ${cleanKecName}, ${selectedKabupaten.kabupaten}
                        </div>
                        <div style="font-size: 11px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 4px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>Total R2:</span>
                                <strong>${d.total} unit</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: #dc2626;">
                                <span>Honda:</span>
                                <strong>${d.honda_share}% (${d.honda_count} unit)</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: #2563eb;">
                                <span>Brand Lain / Kompetitor:</span>
                                <strong>${d.competitor_count} unit</strong>
                            </div>
                        </div>
                        <div style="margin-top: 5px; font-size: 9.5px; color: #dc2626; text-align: center; font-weight: 600;">
                            Klik desa untuk menyaring daftar model motor
                        </div>
                    </div>
                `;

                desaMarker.bindTooltip(desaTooltip, {
                    direction: 'top',
                    offset: [0, -12],
                    opacity: 0.98,
                });

                desaMarker.on('click', () => {
                    setSelectedDesa((prev) => (prev === d.desa ? null : d.desa));
                    map.flyTo(dLatLng, 14, { duration: 0.5 });
                });

                desaMarker.addTo(layer);
            });

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
            }
        }
    }, [selectedKabupaten, selectedKecamatan, selectedDesa, metricMode, isMapReady]);

    // Handle Reset View (Fit All NTB)
    const handleResetView = () => {
        setSelectedKabupaten(null);
        setSelectedKecamatan(null);
        setSelectedDesa(null);
        setBrandFilter('ALL');
        setNamaPasarSearch('');
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

    // Handle Back to All Kecamatans in Selected Kabupaten
    const handleBackToKecamatanView = () => {
        setSelectedKecamatan(null);
        setSelectedDesa(null);
        setBrandFilter('ALL');
        setNamaPasarSearch('');
        if (!mapInstanceRef.current || !selectedKabupaten) return;
        const kecamatans = selectedKabupaten.kecamatans || [];
        if (kecamatans.length > 0) {
            const bounds = L.latLngBounds([]);
            kecamatans.forEach((k) => {
                if (k.latitude != null && k.longitude != null) {
                    bounds.extend([k.latitude, k.longitude]);
                }
            });
            if (bounds.isValid()) {
                mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
                return;
            }
        }
        if (selectedKabupaten.latitude != null && selectedKabupaten.longitude != null) {
            mapInstanceRef.current.flyTo([selectedKabupaten.latitude, selectedKabupaten.longitude], 11, {
                duration: 0.6,
            });
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
            setSelectedDesa(null);
            setBrandFilter('ALL');
            setNamaPasarSearch('');
            mapInstanceRef.current.flyTo([found.latitude, found.longitude], 11, {
                duration: 0.8,
            });
        }
    };

    // Fly to specific kecamatan
    const handleSelectKecamatanClick = (kec: KecamatanMapItem) => {
        setSelectedKecamatan(kec);
        setSelectedDesa(null);
        setBrandFilter('ALL');
        setNamaPasarSearch('');
        if (mapInstanceRef.current && kec.latitude != null && kec.longitude != null) {
            mapInstanceRef.current.flyTo([kec.latitude, kec.longitude], 12.5, {
                duration: 0.7,
            });
        }
    };

    // Click desa badge
    const handleSelectDesaClick = (desa: DesaMapItem) => {
        const nextDesa = selectedDesa === desa.desa ? null : desa.desa;
        setSelectedDesa(nextDesa);
        if (mapInstanceRef.current && desa.latitude != null && desa.longitude != null) {
            mapInstanceRef.current.flyTo([desa.latitude, desa.longitude], 14, {
                duration: 0.5,
            });
        }
    };

    // Dynamic Top Brands in Active Scope (Desa > Kecamatan > Kabupaten)
    const activeTopBrands: TopBrandItem[] = useMemo(() => {
        if (!selectedKabupaten) return [];

        if (selectedKecamatan) {
            if (selectedDesa && selectedKecamatan.nama_pasars) {
                // Compute brand counts in this specific desa
                const brandMap = new Map<string, { count: number; is_honda: boolean }>();
                let desaTotal = 0;
                selectedKecamatan.nama_pasars.forEach((np) => {
                    const c = np.desa_counts?.[selectedDesa] || 0;
                    if (c > 0) {
                        desaTotal += c;
                        const existing = brandMap.get(np.brand) || { count: 0, is_honda: np.is_honda };
                        existing.count += c;
                        brandMap.set(np.brand, existing);
                    }
                });

                return Array.from(brandMap.entries())
                    .map(([brand, data]) => ({
                        brand,
                        count: data.count,
                        percentage: desaTotal > 0 ? Math.round((data.count / desaTotal) * 1000) / 10 : 0,
                        is_honda: data.is_honda,
                    }))
                    .sort((a, b) => b.count - a.count);
            }

            if (selectedKecamatan.top_brands && selectedKecamatan.top_brands.length > 0) {
                return selectedKecamatan.top_brands;
            }
        }

        return selectedKabupaten.top_brands || [];
    }, [selectedKabupaten, selectedKecamatan, selectedDesa]);

    // Unique Brands Available for Nama Pasar Tabs
    const availableBrands = useMemo(() => {
        if (!selectedKecamatan?.nama_pasars) return [];
        const brands = new Set<string>();
        selectedKecamatan.nama_pasars.forEach((np) => {
            if (selectedDesa) {
                if ((np.desa_counts?.[selectedDesa] || 0) > 0) {
                    brands.add(np.brand);
                }
            } else {
                brands.add(np.brand);
            }
        });
        return Array.from(brands);
    }, [selectedKecamatan, selectedDesa]);

    // Filtered Nama Pasar List for Active Kecamatan & Desa
    const filteredNamaPasarList = useMemo(() => {
        if (!selectedKecamatan?.nama_pasars) return [];

        let list = selectedKecamatan.nama_pasars.map((np) => {
            const count = selectedDesa ? np.desa_counts?.[selectedDesa] || 0 : np.count;
            return {
                ...np,
                displayCount: count,
            };
        });

        // Filter out 0 count
        list = list.filter((item) => item.displayCount > 0);

        // Filter Brand
        if (brandFilter !== 'ALL') {
            list = list.filter((item) => item.brand.toUpperCase() === brandFilter.toUpperCase());
        }

        // Search Filter
        if (namaPasarSearch.trim() !== '') {
            const q = namaPasarSearch.toLowerCase().trim();
            list = list.filter(
                (item) => item.nama_pasar.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q),
            );
        }

        // Sort desc
        list.sort((a, b) => b.displayCount - a.displayCount);

        // Recalculate percentage based on active total
        const activeTotal = list.reduce((sum, item) => sum + item.displayCount, 0);
        return list.map((item) => ({
            ...item,
            activePercentage: activeTotal > 0 ? Math.round((item.displayCount / activeTotal) * 1000) / 10 : 0,
        }));
    }, [selectedKecamatan, selectedDesa, brandFilter, namaPasarSearch]);

    const maxModelCount = useMemo(() => {
        if (filteredNamaPasarList.length === 0) return 1;
        return Math.max(...filteredNamaPasarList.map((m) => m.displayCount), 1);
    }, [filteredNamaPasarList]);

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

                    {/* Mode Metrik Marker Toggle (Honda, Brand Lain/Kompetitor, Volume) */}
                    <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-950">
                        <button
                            type="button"
                            onClick={() => setMetricMode('share')}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                metricMode === 'share'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                            }`}
                            title="Tampilkan persentase pangsa pasar Honda"
                        >
                            Pangsa Honda (%)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMetricMode('competitor')}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                metricMode === 'competitor'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                            }`}
                            title="Tampilkan persentase pangsa pasar brand lain (Yamaha, dll.)"
                        >
                            Brand Lain / Kompetitor (%)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMetricMode('volume')}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                metricMode === 'volume'
                                    ? 'bg-neutral-900 text-white shadow-xs dark:bg-neutral-100 dark:text-neutral-900'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                            }`}
                            title="Tampilkan total volume unit R2"
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

                {/* Floating Top Bar Saat Kabupaten Dipilih */}
                {selectedKabupaten && (
                    <div className="absolute top-3 left-3 right-3 sm:right-auto z-[450] flex flex-wrap items-center gap-2 rounded-xl bg-background/95 p-2 shadow-lg backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800/90 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100 pr-2 border-r border-neutral-200 dark:border-neutral-800">
                            <MapPin className="size-3.5 text-red-600" />
                            <span className="truncate max-w-[150px]">{selectedKabupaten.kabupaten}</span>
                        </div>

                        {!selectedKecamatan ? (
                            <>
                                <Badge variant="secondary" className="text-[11px] font-semibold py-1 px-2.5">
                                    {selectedKabupaten.kecamatans?.length || 0} Kecamatan
                                </Badge>
                                <span className="text-[11px] text-neutral-500 hidden sm:inline-block">
                                    Pilih / klik kecamatan untuk melihat desa &amp; nama pasar
                                </span>
                            </>
                        ) : (
                            <>
                                <ChevronRight className="size-3.5 text-neutral-400" />
                                <div className="font-bold text-red-600 dark:text-red-400 max-w-[140px] truncate">
                                    Kec. {selectedKecamatan.kecamatan.replace(/^(KEC\.?|KECAMATAN)\s+/i, '')}
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-red-200 text-red-700 bg-red-50 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 text-[10px] py-0.5 px-2"
                                >
                                    {selectedKecamatan.desas?.length || 0} Desa
                                </Badge>
                                {selectedDesa && (
                                    <Badge
                                        variant="default"
                                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] py-0.5 px-2 flex items-center gap-1"
                                    >
                                        <span>Desa: {selectedDesa}</span>
                                        <X
                                            className="size-3 cursor-pointer hover:opacity-80"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDesa(null);
                                            }}
                                        />
                                    </Badge>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBackToKecamatanView}
                                    className="h-7 text-xs px-2.5 gap-1 font-medium bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700 shadow-xs"
                                    title="Kembali ke tampilan semua kecamatan"
                                >
                                    <ArrowLeft className="size-3" />
                                    <span>Semua Kecamatan</span>
                                </Button>
                            </>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetView}
                            className="h-7 text-xs px-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 ml-auto"
                            title="Tutup overlay dan kembali ke tinjauan NTB"
                        >
                            <X className="size-3.5 mr-1" />
                            Tutup
                        </Button>
                    </div>
                )}

                {/* Floating Quick Stats & Detail Card saat Kabupaten / Kecamatan diklik */}
                {selectedKabupaten && (
                    <div className="absolute bottom-4 left-4 z-[450] w-full max-w-[390px] max-h-[86%] overflow-y-auto rounded-xl border border-neutral-200/90 bg-background/95 p-3.5 shadow-xl backdrop-blur-md dark:border-neutral-800/90 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Header Box */}
                        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                        {selectedKecamatan
                                            ? selectedKecamatan.kecamatan
                                            : selectedKabupaten.kabupaten}
                                    </h4>
                                    {selectedKecamatan ? (
                                        selectedKecamatan.honda_share >= 70 ? (
                                            <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px] h-4 px-1.5">
                                                Dominan Honda
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400 text-[10px] h-4 px-1.5">
                                                Kompetitif
                                            </Badge>
                                        )
                                    ) : selectedKabupaten.honda_share >= 70 ? (
                                        <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px] h-4 px-1.5">
                                            Dominan Honda
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
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    {selectedKecamatan
                                        ? `Kecamatan di ${selectedKabupaten.kabupaten}`
                                        : selectedKabupaten.capital
                                          ? `Pusat Administrasi: ${selectedKabupaten.capital}`
                                          : 'Wilayah NTB'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedKabupaten(null);
                                    setSelectedKecamatan(null);
                                    setSelectedDesa(null);
                                }}
                                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                                title="Tutup panel"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>

                        {/* Top Merk Kendaraan (Semua Brand) - Dinamis Sesuai Scope */}
                        {activeTopBrands.length > 0 && (
                            <div className="mt-2.5 pb-2.5 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <BarChart3 className="size-3 text-neutral-400" />
                                        <span>
                                            Top Merk Kendaraan
                                            {selectedDesa
                                                ? ` (Desa ${selectedDesa})`
                                                : selectedKecamatan
                                                  ? ' (Kecamatan Ini)'
                                                  : ' (Kabupaten)'}:
                                        </span>
                                    </span>
                                    <span className="text-[10px] text-neutral-400">
                                        {activeTopBrands.length} merk
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    {activeTopBrands.map((b) => (
                                        <div key={b.brand} className="text-[11px]">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="flex items-center gap-1.5">
                                                    <span
                                                        className={`size-2 rounded-full shrink-0 ${
                                                            b.is_honda
                                                                ? 'bg-red-600'
                                                                : b.brand.toUpperCase() === 'YAMAHA'
                                                                  ? 'bg-blue-600'
                                                                  : 'bg-emerald-600'
                                                        }`}
                                                    />
                                                    <span
                                                        className={
                                                            b.is_honda
                                                                ? 'font-bold text-red-600 dark:text-red-400'
                                                                : 'font-semibold text-neutral-700 dark:text-neutral-300'
                                                        }
                                                    >
                                                        {b.brand}
                                                    </span>
                                                </span>
                                                <span className="text-neutral-700 dark:text-neutral-300 text-[10.5px]">
                                                    <strong>{b.count.toLocaleString('id-ID')} unit</strong> ({b.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${
                                                        b.is_honda
                                                            ? 'bg-red-600'
                                                            : b.brand.toUpperCase() === 'YAMAHA'
                                                              ? 'bg-blue-600'
                                                              : 'bg-emerald-500'
                                                    }`}
                                                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Statistik Ringkasan Kecamatan atau Kabupaten */}
                        {!selectedKecamatan ? (
                            <>
                                {/* Angka Utama Kabupaten */}
                                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
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

                                {/* Visual Progress Bar Honda vs Brand Lain */}
                                <div className="mt-2.5 space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-medium text-red-600 dark:text-red-400">
                                            Honda: {selectedKabupaten.honda_count.toLocaleString('id-ID')}
                                        </span>
                                        <span className="font-medium text-blue-600 dark:text-blue-400">
                                            Brand Lain: {selectedKabupaten.competitor_count.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
                                        <div
                                            className="bg-red-600 h-full transition-all"
                                            style={{ width: `${Math.min(100, selectedKabupaten.honda_share)}%` }}
                                            title={`Honda: ${selectedKabupaten.honda_share}%`}
                                        />
                                        <div
                                            className="bg-blue-600 h-full transition-all"
                                            style={{ width: `${Math.max(0, 100 - selectedKabupaten.honda_share)}%` }}
                                            title={`Brand Lain: ${Math.max(0, 100 - selectedKabupaten.honda_share).toFixed(1)}%`}
                                        />
                                    </div>
                                </div>

                                {/* Daftar Kecamatan di Kabupaten Ini */}
                                {selectedKabupaten.kecamatans && selectedKabupaten.kecamatans.length > 0 && (
                                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="size-3 text-red-600" />
                                                Daftar Kecamatan ({selectedKabupaten.kecamatans.length}):
                                            </span>
                                            <span className="text-[10px] text-neutral-400 font-normal">
                                                Klik untuk buka desa
                                            </span>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                            {selectedKabupaten.kecamatans.map((k) => (
                                                <button
                                                    key={k.kecamatan}
                                                    type="button"
                                                    onClick={() => handleSelectKecamatanClick(k)}
                                                    className="w-full flex items-center justify-between p-1.5 rounded-md text-[11px] transition-all text-left bg-neutral-50/80 hover:bg-neutral-100 text-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-200 dark:hover:bg-neutral-800"
                                                >
                                                    <div className="truncate pr-1">
                                                        {k.kecamatan.replace(/^(KEC\.?|KECAMATAN)\s+/i, '')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="text-[10px] text-neutral-500">
                                                            {k.total} unit
                                                        </span>
                                                        <span
                                                            className={`text-[10px] font-bold ${
                                                                k.honda_share >= 70
                                                                    ? 'text-red-600 dark:text-red-400'
                                                                    : 'text-neutral-600 dark:text-neutral-300'
                                                            }`}
                                                        >
                                                            {k.honda_share}%
                                                        </span>
                                                        <ChevronRight className="size-3 text-neutral-400" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Tampilan Saat Kecamatan Terpilih */
                            <div className="mt-2.5 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400">
                                            Kecamatan Terpilih
                                        </div>
                                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                            {selectedKecamatan.kecamatan}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBackToKecamatanView}
                                        className="h-6 text-[10.5px] px-2 text-neutral-600 hover:text-neutral-900 gap-1 dark:text-neutral-300"
                                    >
                                        <ArrowLeft className="size-3" />
                                        Semua Kec.
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 text-center text-xs bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                    <div>
                                        <div className="text-[10px] text-neutral-500">Total R2</div>
                                        <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                            {selectedKecamatan.total}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-red-600 font-medium">Honda</div>
                                        <div className="font-bold text-red-600">
                                            {selectedKecamatan.honda_share}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-blue-600 font-medium">Brand Lain</div>
                                        <div className="font-bold text-blue-600">
                                            {Math.max(0, 100 - selectedKecamatan.honda_share).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Sebaran Desa */}
                                {selectedKecamatan.desas && selectedKecamatan.desas.length > 0 ? (
                                    <div>
                                        <div className="text-[10.5px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                                            <span>Sebaran Desa ({selectedKecamatan.desas.length}):</span>
                                            {selectedDesa ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedDesa(null)}
                                                    className="text-[9.5px] text-red-600 hover:underline font-bold flex items-center gap-0.5"
                                                >
                                                    <RotateCcw className="size-2.5" />
                                                    Semua Desa
                                                </button>
                                            ) : (
                                                <span className="text-[9.5px] text-neutral-400">Klik desa untuk fokus</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-0.5">
                                            {selectedKecamatan.desas.map((d) => {
                                                const isCurrentDesa = selectedDesa === d.desa;
                                                return (
                                                    <button
                                                        key={d.desa}
                                                        type="button"
                                                        onClick={() => handleSelectDesaClick(d)}
                                                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-all ${
                                                            isCurrentDesa
                                                                ? 'bg-red-600 text-white font-bold ring-2 ring-red-400 shadow-xs'
                                                                : 'border border-neutral-200 bg-white text-neutral-800 hover:border-red-400 hover:bg-red-50 hover:text-red-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-red-950/40'
                                                        }`}
                                                        title={`Klik untuk filter model di desa ${d.desa}`}
                                                    >
                                                        <span className="font-medium">{d.desa}</span>
                                                        <span
                                                            className={`text-[9px] font-bold ${
                                                                isCurrentDesa ? 'text-white/90' : 'text-neutral-500'
                                                            }`}
                                                        >
                                                            ({d.total})
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[11px] text-neutral-500 italic py-1">
                                        Belum ada rincian data desa untuk kecamatan ini.
                                    </div>
                                )}

                                {/* ========================================================
                                    DAFTAR NAMA PASAR DARI SEMUA BRAND (Fitur Permintaan User)
                                   ======================================================== */}
                                <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 dark:text-neutral-100">
                                            <Bike className="size-3.5 text-red-600" />
                                            <span>Daftar Nama Pasar (Semua Brand)</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-semibold py-0 px-1.5 h-4">
                                            {filteredNamaPasarList.length} Model
                                        </Badge>
                                    </div>

                                    {/* Subtitle Status Filter Desa Aktif */}
                                    {selectedDesa && (
                                        <div className="flex items-center justify-between text-[10px] bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 p-1.5 rounded-md mb-2 border border-red-100 dark:border-red-900/40">
                                            <span className="truncate">
                                                Model di Desa: <strong>{selectedDesa}</strong>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDesa(null)}
                                                className="hover:underline font-bold ml-1 shrink-0"
                                            >
                                                Tampilkan Semua
                                            </button>
                                        </div>
                                    )}

                                    {/* Brand Filter Tabs & Search */}
                                    <div className="space-y-1.5 mb-2">
                                        {/* Filter Brand Tabs */}
                                        <div className="flex flex-wrap items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setBrandFilter('ALL')}
                                                className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold transition-colors ${
                                                    brandFilter === 'ALL'
                                                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                                                }`}
                                            >
                                                Semua Brand
                                            </button>
                                            {availableBrands.map((b) => {
                                                const isBActive = brandFilter.toUpperCase() === b.toUpperCase();
                                                const isHonda = b.toUpperCase().includes('HONDA');
                                                const isYamaha = b.toUpperCase().includes('YAMAHA');

                                                return (
                                                    <button
                                                        key={b}
                                                        type="button"
                                                        onClick={() => setBrandFilter(isBActive ? 'ALL' : b)}
                                                        className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold transition-colors ${
                                                            isBActive
                                                                ? isHonda
                                                                    ? 'bg-red-600 text-white'
                                                                    : isYamaha
                                                                      ? 'bg-blue-600 text-white'
                                                                      : 'bg-emerald-600 text-white'
                                                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                                                        }`}
                                                    >
                                                        {b}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Quick Search Nama Pasar */}
                                        <div className="relative">
                                            <Search className="size-3 text-neutral-400 absolute left-2 top-2" />
                                            <input
                                                type="text"
                                                value={namaPasarSearch}
                                                onChange={(e) => setNamaPasarSearch(e.target.value)}
                                                placeholder="Cari model motor (PCX, Scoopy, Aerox, dll)..."
                                                className="w-full h-7 pl-6 pr-6 text-[10.5px] rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                                            />
                                            {namaPasarSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setNamaPasarSearch('')}
                                                    className="absolute right-1.5 top-1.5 text-neutral-400 hover:text-neutral-600 p-0.5"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* List Scrollable Nama Pasar */}
                                    {filteredNamaPasarList.length > 0 ? (
                                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                            {filteredNamaPasarList.map((item) => {
                                                const isHonda = item.is_honda;
                                                const isYamaha = item.brand.toUpperCase() === 'YAMAHA';
                                                const barRatio = (item.displayCount / maxModelCount) * 100;

                                                return (
                                                    <div
                                                        key={`${item.brand}-${item.nama_pasar}`}
                                                        className="p-1.5 rounded-lg border border-neutral-100 bg-neutral-50/70 hover:bg-neutral-100/90 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:bg-neutral-800/80 transition-colors text-xs"
                                                    >
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[9px] font-bold px-1 py-0 h-3.5 shrink-0 ${
                                                                        isHonda
                                                                            ? 'border-red-300 text-red-600 bg-red-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
                                                                            : isYamaha
                                                                              ? 'border-blue-300 text-blue-600 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
                                                                              : 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                    }`}
                                                                >
                                                                    {item.brand}
                                                                </Badge>
                                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate text-[11px]" title={item.nama_pasar}>
                                                                    {item.nama_pasar}
                                                                </span>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span className="font-bold text-neutral-900 dark:text-neutral-100 text-[11px]">
                                                                    {item.displayCount.toLocaleString('id-ID')} unit
                                                                </span>
                                                                <span className="text-[9.5px] text-neutral-500 ml-1">
                                                                    ({item.activePercentage}%)
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Mini Proportional Bar */}
                                                        <div className="h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    isHonda
                                                                        ? 'bg-red-600'
                                                                        : isYamaha
                                                                          ? 'bg-blue-600'
                                                                          : 'bg-emerald-500'
                                                                }`}
                                                                style={{ width: `${Math.max(4, barRatio)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-xs text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800">
                                            Tidak ada nama pasar yang cocok dengan filter.
                                        </div>
                                    )}
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

            {/* Footer Bar: Legenda Performa Memanjang di Bawah (Dinamis Sesuai Mode Metrik) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-sidebar-border/70 px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 text-xs dark:border-sidebar-border">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                        <Layers className="size-3.5 text-neutral-500" />
                        <span>Legenda Performa:</span>
                    </div>

                    {metricMode === 'competitor' ? (
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-neutral-600 dark:text-neutral-300 text-[11px]">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-blue-700 shrink-0" />
                                <span>Brand Lain Kuat (&ge; 40%)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-blue-500 shrink-0" />
                                <span>Brand Lain Sedang (25% - 39.9%)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-slate-600 shrink-0" />
                                <span>Brand Lain Rendah (&lt; 25%)</span>
                            </div>
                        </div>
                    ) : metricMode === 'volume' ? (
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-neutral-600 dark:text-neutral-300 text-[11px]">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-slate-900 dark:bg-white shrink-0" />
                                <span>Volume Tinggi (&ge; 2.000 Unit)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-slate-600 shrink-0" />
                                <span>Volume Sedang (1.000 - 1.999)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-slate-400 shrink-0" />
                                <span>Volume Rendah (&lt; 1.000)</span>
                            </div>
                        </div>
                    ) : (
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
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <Compass className="size-3 text-neutral-400" />
                    <span>
                        {selectedKecamatan
                            ? `Kec. ${selectedKecamatan.kecamatan.replace(/^(KEC\.?|KECAMATAN)\s+/i, '')}${
                                  selectedDesa ? ` &bull; Desa ${selectedDesa}` : ' &bull; Klik desa untuk filter model'
                              }`
                            : selectedKabupaten
                              ? 'Klik pin / zona kecamatan untuk melihat sebaran desa & nama pasar'
                              : 'Klik pin kabupaten untuk melihat statistik, merk & kecamatan'}
                    </span>
                </div>
            </div>
        </Card>
    );
}
