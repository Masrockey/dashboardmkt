import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    AlertTriangle,
    ArrowLeftRight,
    Calendar,
    CheckCircle2,
    Clock,
    Compass,
    ExternalLink,
    Filter,
    GitCompare,
    Layers,
    MapPin,
    Maximize2,
    Navigation,
    Radio,
    RotateCcw,
    Search,
    ShieldAlert,
    Store,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getMapMarkerIcon } from '@/components/location-picker-map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { JenisPameran, PameranItem } from '@/types';

// Fix default marker icon path issue in Vite bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Default center: Mataram, Nusa Tenggara Barat
const DEFAULT_CENTER: [number, number] = [-8.5833, 116.1167];
const DEFAULT_ZOOM = 11;

interface DashboardMapProps {
    pamerans: PameranItem[];
    jenisPameranList: JenisPameran[];
    height?: string;
    className?: string;
}

// Haversine distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
}

function checkDateOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    const sA = new Date(startA).getTime();
    const eA = new Date(endA).getTime();
    const sB = new Date(startB).getTime();
    const eB = new Date(endB).getTime();
    return sA <= eB && sB <= eA;
}

function getDurationInDays(startStr: string, endStr: string): number {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diff = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

export default function DashboardMap({
    pamerans,
    jenisPameranList,
    height = '520px',
    className = '',
}: DashboardMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const radiusCircleRef = useRef<L.Circle | null>(null);
    const compareLayerGroupRef = useRef<L.LayerGroup | null>(null);

    const [showRadiusCircle, setShowRadiusCircle] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRentalFilter, setSelectedRentalFilter] = useState('all'); // all | berlangsung | akan_datang | selesai
    const [selectedJenisFilter, setSelectedJenisFilter] = useState('all');
    const [selectedPameran, setSelectedPameran] = useState<PameranItem | null>(null);

    // State Komparasi Pameran
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [comparePameranA, setComparePameranA] = useState<PameranItem | null>(null);
    const [comparePameranB, setComparePameranB] = useState<PameranItem | null>(null);
    const [isCompareDetailModalOpen, setIsCompareDetailModalOpen] = useState(false);

    // Hitung status periode sewa
    const getRentalPeriodStatus = (startDateStr: string, endDateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);

        if (today < start) {
            return {
                label: 'Akan Datang',
                key: 'akan_datang',
                color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            };
        } else if (today > end) {
            return {
                label: 'Selesai',
                key: 'selesai',
                color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
            };
        } else {
            return {
                label: 'Sedang Berlangsung',
                key: 'berlangsung',
                color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            };
        }
    };

    const formatDateIndo = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Filter pamerans
    const filteredPamerans = useMemo(() => {
        return pamerans.filter((item) => {
            if (item.latitude == null || item.longitude == null) {
                return false;
            }

            // Search filter
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchDealer =
                    item.dealer?.nama_dealer?.toLowerCase().includes(q) ||
                    item.dealer?.kode_dealer?.toLowerCase().includes(q);
                const matchKecamatan = item.kecamatan?.toLowerCase().includes(q);
                const matchAlamat = item.detail_alamat?.toLowerCase().includes(q);
                const matchKode =
                    item.kode_pameran_md?.toLowerCase().includes(q) ||
                    item.kode_pameran_ahm?.toLowerCase().includes(q);
                const matchJenis = item.jenis_pameran?.jenis_pameran?.toLowerCase().includes(q);

                if (!matchDealer && !matchKecamatan && !matchAlamat && !matchKode && !matchJenis) {
                    return false;
                }
            }

            // Rental status: pameran yang periode sewanya sudah berakhir tidak ditampilkan di peta
            const rentalStatus = getRentalPeriodStatus(
                item.mulai_tanggal_sewa,
                item.tanggal_sewa_berakhir,
            );
            if (rentalStatus.key === 'selesai') {
                return false;
            }

            if (selectedRentalFilter !== 'all') {
                if (rentalStatus.key !== selectedRentalFilter) {
                    return false;
                }
            }

            // Approval status: hanya pameran yang sudah disetujui (approved) yang ditampilkan di peta
            if (item.status && item.status !== 'disetujui') {
                return false;
            }

            // Jenis Pameran filter
            if (selectedJenisFilter !== 'all') {
                if (String(item.jenis_pameran_id) !== String(selectedJenisFilter)) {
                    return false;
                }
            }

            return true;
        });
    }, [
        pamerans,
        searchQuery,
        selectedRentalFilter,
        selectedJenisFilter,
    ]);

    // Ref untuk sinkronisasi state komparasi ke Leaflet listener tanpa re-render semua marker
    const compareStateRef = useRef({
        isCompareMode,
        comparePameranA,
        comparePameranB,
    });
    useEffect(() => {
        compareStateRef.current = {
            isCompareMode,
            comparePameranA,
            comparePameranB,
        };
    }, [isCompareMode, comparePameranA, comparePameranB]);

    // Inisialisasi peta Leaflet
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            attributionControl: false,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;

        const compareLayer = L.layerGroup().addTo(map);
        compareLayerGroupRef.current = compareLayer;

        mapInstanceRef.current = map;

        // Auto invalidate size on resize
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            map.remove();
            mapInstanceRef.current = null;
            markersLayerRef.current = null;
            compareLayerGroupRef.current = null;
        };
    }, []);

    // Render / update visual komparasi di peta (garis penghubung, dual radius circle, distance marker)
    useEffect(() => {
        const map = mapInstanceRef.current;
        const compareLayer = compareLayerGroupRef.current;
        if (!map || !compareLayer) return;

        compareLayer.clearLayers();

        if (!isCompareMode) return;

        const latA = comparePameranA ? Number(comparePameranA.latitude) : null;
        const lngA = comparePameranA ? Number(comparePameranA.longitude) : null;
        const latB = comparePameranB ? Number(comparePameranB.latitude) : null;
        const lngB = comparePameranB ? Number(comparePameranB.longitude) : null;

        const validA = latA != null && lngA != null && !isNaN(latA) && !isNaN(lngA);
        const validB = latB != null && lngB != null && !isNaN(latB) && !isNaN(lngB);

        // Visual radius & highlight untuk Pameran A
        if (validA && comparePameranA) {
            const radiusKmA = comparePameranA.jenis_pameran?.radius_km ?? 2;
            const circleA = L.circle([latA, lngA], {
                radius: radiusKmA * 1000,
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.12,
                weight: 2,
                dashArray: '6 4',
                opacity: 0.8,
            });
            circleA.bindTooltip(`<b>Channel A:</b> ${comparePameranA.dealer?.nama_dealer || 'Dealer'} (Radius ${radiusKmA} km)`, {
                direction: 'top',
                className: 'custom-dashboard-map-tooltip',
            });
            compareLayer.addLayer(circleA);

            const haloA = L.circleMarker([latA, lngA], {
                radius: 20,
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.25,
                weight: 3,
            });
            compareLayer.addLayer(haloA);
        }

        // Visual radius & highlight untuk Pameran B
        if (validB && comparePameranB) {
            const radiusKmB = comparePameranB.jenis_pameran?.radius_km ?? 2;
            const circleB = L.circle([latB, lngB], {
                radius: radiusKmB * 1000,
                color: '#ea580c',
                fillColor: '#f97316',
                fillOpacity: 0.12,
                weight: 2,
                dashArray: '6 4',
                opacity: 0.8,
            });
            circleB.bindTooltip(`<b>Channel B:</b> ${comparePameranB.dealer?.nama_dealer || 'Dealer'} (Radius ${radiusKmB} km)`, {
                direction: 'top',
                className: 'custom-dashboard-map-tooltip',
            });
            compareLayer.addLayer(circleB);

            const haloB = L.circleMarker([latB, lngB], {
                radius: 20,
                color: '#ea580c',
                fillColor: '#f97316',
                fillOpacity: 0.25,
                weight: 3,
            });
            compareLayer.addLayer(haloB);
        }

        // Garis penghubung dan marker jarak jika A dan B dua-duanya valid
        if (validA && validB && comparePameranA && comparePameranB) {
            const distMeters = getDistanceInMeters(latA, lngA, latB, lngB);
            const radiusKmA = comparePameranA.jenis_pameran?.radius_km ?? 2;
            const radiusKmB = comparePameranB.jenis_pameran?.radius_km ?? 2;
            const totalRadiusMeters = (radiusKmA + radiusKmB) * 1000;
            const isOverlap = distMeters < totalRadiusMeters;

            // Polyline penghubung A dan B
            const polyline = L.polyline(
                [
                    [latA, lngA],
                    [latB, lngB],
                ],
                {
                    color: isOverlap ? '#ef4444' : '#6366f1',
                    weight: 3.5,
                    dashArray: '8 6',
                    opacity: 0.9,
                },
            );
            compareLayer.addLayer(polyline);

            // Midpoint marker jarak
            const midLat = (latA + latB) / 2;
            const midLng = (lngA + lngB) / 2;
            const distLabel = formatDistance(distMeters);

            const distIcon = L.divIcon({
                className: 'compare-distance-badge-wrapper',
                html: `
                    <div style="background: ${isOverlap ? '#dc2626' : '#4f46e5'}; color: white; padding: 3px 9px; border-radius: 9999px; font-weight: 700; font-size: 11px; font-family: ui-sans-serif, system-ui, sans-serif; box-shadow: 0 4px 10px rgba(0,0,0,0.3); white-space: nowrap; border: 2px solid #ffffff; display: flex; align-items: center; gap: 5px; transform: translate(-50%, -50%);">
                        <span style="font-size: 12px;">&#128207;</span>
                        <span>${distLabel}</span>
                        ${isOverlap ? '<span style="background: rgba(255,255,255,0.25); border-radius: 4px; padding: 0 4px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.5px;">BENTROK</span>' : ''}
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

            // Auto zoom & fit kedua pameran
            const compareBounds = L.latLngBounds([
                [latA, lngA],
                [latB, lngB],
            ]);
            map.fitBounds(compareBounds, {
                padding: [75, 75],
                maxZoom: 14,
            });
        }
    }, [isCompareMode, comparePameranA, comparePameranB]);

    // Render / update markers saat data atau filter berubah
    useEffect(() => {
        const map = mapInstanceRef.current;
        const markersLayer = markersLayerRef.current;
        if (!map || !markersLayer) return;

        markersLayer.clearLayers();

        const bounds = L.latLngBounds([]);

        filteredPamerans.forEach((pameran) => {
            const lat = Number(pameran.latitude);
            const lng = Number(pameran.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            bounds.extend([lat, lng]);

            const icon = getMapMarkerIcon(pameran.jenis_pameran?.icon_map_url);
            const marker = L.marker([lat, lng], { icon });

            if (pameran.is_other_dealer) {
                marker.bindTooltip(
                    `<b>Channel Terdaftar</b>${pameran.jenis_pameran?.jenis_pameran ? `<br/><span style="font-size: 10px; color: #4b5563;">${pameran.jenis_pameran.jenis_pameran}</span>` : ''}`,
                    {
                        direction: 'top',
                        offset: [0, -32],
                        opacity: 0.98,
                        className: 'custom-dashboard-map-tooltip',
                    },
                );

                marker.on('click', () => {
                    const { isCompareMode: inCompare, comparePameranA: curA } = compareStateRef.current;
                    if (inCompare) {
                        if (!curA) {
                            setComparePameranA(pameran);
                        } else if (curA.id !== pameran.id) {
                            setComparePameranB(pameran);
                        }
                        map.panTo([lat, lng], { animate: true, duration: 0.5 });
                        return;
                    }
                    map.panTo([lat, lng], { animate: true, duration: 0.5 });
                });

                markersLayer.addLayer(marker);
                return;
            }

            const rental = getRentalPeriodStatus(
                pameran.mulai_tanggal_sewa,
                pameran.tanggal_sewa_berakhir,
            );

            let statusBadgeColor = 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;'; // amber
            let statusBadgeText = 'Menunggu SPV';
            if (pameran.status === 'menunggu_kabag') {
                statusBadgeColor = 'background:#e0f2fe;color:#075985;border:1px solid #bae6fd;'; // sky
                statusBadgeText = 'Menunggu Kabag';
            } else if (pameran.status === 'disetujui') {
                statusBadgeColor = 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0;'; // emerald
                statusBadgeText = 'Disetujui';
            } else if (pameran.status === 'ditolak') {
                statusBadgeColor = 'background:#ffe4e6;color:#9f1239;border:1px solid #fecdd3;'; // rose
                statusBadgeText = 'Ditolak';
            }

            let rentalBadgeColor = 'background:#e0e7ff;color:#3730a3;';
            if (rental.key === 'berlangsung') {
                rentalBadgeColor = 'background:#dcfce7;color:#166534;';
            } else if (rental.key === 'selesai') {
                rentalBadgeColor = 'background:#f3f4f6;color:#4b5563;';
            }

            // Tooltip HTML saat di-hover
            const tooltipContent = `
                <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 240px; max-width: 290px; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
                        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; ${statusBadgeColor}">
                            ${statusBadgeText}
                        </span>
                        <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; ${rentalBadgeColor}">
                            ${rental.label}
                        </span>
                    </div>

                    <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px;">
                        ${pameran.dealer?.nama_dealer || 'Dealer'}
                    </div>

                    <div style="font-size: 11px; color: #4b5563; margin-bottom: 6px;">
                        <span style="font-weight: 600; color: #1f2937;">${pameran.jenis_pameran?.jenis_pameran || 'Channel'}</span>
                        ${pameran.dealer?.kode_dealer ? ` &bull; <span style="font-family: monospace;">${pameran.dealer.kode_dealer}</span>` : ''}
                    </div>

                    <div style="border-top: 1px dashed #e5e7eb; padding-top: 6px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; align-items: flex-start; gap: 5px; color: #374151;">
                            <span style="color: #6b7280; font-size: 11px;">&#128197;</span>
                            <span style="font-size: 11px;">${formatDateIndo(pameran.mulai_tanggal_sewa)} - ${formatDateIndo(pameran.tanggal_sewa_berakhir)}</span>
                        </div>
                        <div style="display: flex; align-items: flex-start; gap: 5px; color: #374151;">
                            <span style="color: #6b7280; font-size: 11px;">&#128205;</span>
                            <span style="font-size: 11px; font-weight: 600;">${pameran.kecamatan}${pameran.kabupaten ? `, ${pameran.kabupaten}` : ''}</span>
                        </div>
                        ${
                            pameran.detail_alamat
                                ? `<div style="font-size: 10.5px; color: #6b7280; padding-left: 17px;">${pameran.detail_alamat}</div>`
                                : ''
                        }
                    </div>

                    ${
                        pameran.kode_pameran_md
                            ? `
                    <div style="margin-top: 6px; padding: 4px 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 10px; color: #15803d; font-weight: 600;">Kode MD:</span>
                        <span style="font-size: 11px; font-family: monospace; font-weight: 700; color: #166534;">${pameran.kode_pameran_md}</span>
                    </div>`
                            : ''
                    }
                </div>
            `;

            marker.bindTooltip(tooltipContent, {
                direction: 'top',
                offset: [0, -32],
                opacity: 0.98,
                className: 'custom-dashboard-map-tooltip',
            });

            // Klik pin: jika mode komparasi aktif, pilih sebagai Channel A atau Channel B
            marker.on('click', () => {
                const { isCompareMode: inCompare, comparePameranA: curA } = compareStateRef.current;
                if (inCompare) {
                    if (!curA) {
                        setComparePameranA(pameran);
                    } else if (curA.id === pameran.id) {
                        // klik yang sama, tetap di A
                    } else {
                        setComparePameranB(pameran);
                    }
                    map.panTo([lat, lng], { animate: true, duration: 0.5 });
                    return;
                }

                // Mode normal: tampilkan quick detail card dan radius channel
                setSelectedPameran(pameran);
                setShowRadiusCircle(false);
                map.panTo([lat, lng], { animate: true, duration: 0.5 });

                // Hapus circle lama jika ada
                if (radiusCircleRef.current) {
                    radiusCircleRef.current.remove();
                    radiusCircleRef.current = null;
                }

                // Gambar circle radius dari jenis channel (default 2 km)
                const radiusKm = pameran.jenis_pameran?.radius_km ?? 2;
                const circle = L.circle([lat, lng], {
                    radius: radiusKm * 1000, // konversi KM ke meter
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.08,
                    weight: 2,
                    dashArray: '6 4',
                    opacity: 0.7,
                }).addTo(map);

                radiusCircleRef.current = circle;
                setShowRadiusCircle(true);
            });

            markersLayer.addLayer(marker);
        });

        // Fit bounds jika ada pin
        if (filteredPamerans.length > 0 && bounds.isValid() && !compareStateRef.current.isCompareMode) {
            map.fitBounds(bounds, {
                padding: [45, 45],
                maxZoom: 15,
            });
        }
    }, [filteredPamerans]);

    const handleResetView = () => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (filteredPamerans.length > 0) {
            const bounds = L.latLngBounds([]);
            filteredPamerans.forEach((p) => {
                if (p.latitude != null && p.longitude != null) {
                    bounds.extend([Number(p.latitude), Number(p.longitude)]);
                }
            });
            if (bounds.isValid()) {
                map.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 15,
                });
                return;
            }
        }

        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    };

    const handleStartCompareWithCurrent = (target: PameranItem) => {
        setIsCompareMode(true);
        setComparePameranA(target);
        setComparePameranB(null);
        setSelectedPameran(null);
        if (radiusCircleRef.current) {
            radiusCircleRef.current.remove();
            radiusCircleRef.current = null;
        }
        setShowRadiusCircle(false);
    };

    const handleToggleCompareMode = () => {
        if (isCompareMode) {
            setIsCompareMode(false);
            setComparePameranA(null);
            setComparePameranB(null);
            if (compareLayerGroupRef.current) {
                compareLayerGroupRef.current.clearLayers();
            }
        } else {
            setIsCompareMode(true);
            if (selectedPameran) {
                setComparePameranA(selectedPameran);
                setSelectedPameran(null);
                if (radiusCircleRef.current) {
                    radiusCircleRef.current.remove();
                    radiusCircleRef.current = null;
                }
                setShowRadiusCircle(false);
            }
        }
    };

    const handleSwapPamerans = () => {
        const temp = comparePameranA;
        setComparePameranA(comparePameranB);
        setComparePameranB(temp);
    };

    // Kalkulasi komparasi A dan B
    const comparisonMetrics = useMemo(() => {
        if (!comparePameranA || !comparePameranB) return null;

        const latA = Number(comparePameranA.latitude);
        const lngA = Number(comparePameranA.longitude);
        const latB = Number(comparePameranB.latitude);
        const lngB = Number(comparePameranB.longitude);

        if (isNaN(latA) || isNaN(lngA) || isNaN(latB) || isNaN(lngB)) return null;

        const distanceMeters = getDistanceInMeters(latA, lngA, latB, lngB);
        const radiusKmA = comparePameranA.jenis_pameran?.radius_km ?? 2;
        const radiusKmB = comparePameranB.jenis_pameran?.radius_km ?? 2;
        const totalRadiusMeters = (radiusKmA + radiusKmB) * 1000;
        const isRadiusOverlap = distanceMeters < totalRadiusMeters;
        const radiusDifferenceMeters = Math.abs(distanceMeters - totalRadiusMeters);

        const isDateOverlap = checkDateOverlap(
            comparePameranA.mulai_tanggal_sewa,
            comparePameranA.tanggal_sewa_berakhir,
            comparePameranB.mulai_tanggal_sewa,
            comparePameranB.tanggal_sewa_berakhir,
        );

        const durationA = getDurationInDays(
            comparePameranA.mulai_tanggal_sewa,
            comparePameranA.tanggal_sewa_berakhir,
        );
        const durationB = getDurationInDays(
            comparePameranB.mulai_tanggal_sewa,
            comparePameranB.tanggal_sewa_berakhir,
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
    }, [comparePameranA, comparePameranB]);

    return (
        <Card className="relative flex flex-col overflow-hidden border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
            {/* Toolbar Filter Peta */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-sidebar-border/70 bg-card/60 p-3.5 backdrop-blur-xs dark:border-sidebar-border">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search Input */}
                    <div className="relative w-44 sm:w-56">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-neutral-400" />
                        <Input
                            placeholder="Cari dealer, lokasi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 text-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="size-3" />
                            </button>
                        )}
                    </div>

                    {/* Filter Periode Sewa */}
                    <Select
                        value={selectedRentalFilter}
                        onValueChange={setSelectedRentalFilter}
                    >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue placeholder="Status Sewa" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Sewa Aktif</SelectItem>
                            <SelectItem value="berlangsung">Sedang Berlangsung</SelectItem>
                            <SelectItem value="akan_datang">Akan Datang</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Filter Jenis Channel */}
                    <Select
                        value={selectedJenisFilter}
                        onValueChange={setSelectedJenisFilter}
                    >
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                            <SelectValue placeholder="Jenis Channel" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Channel</SelectItem>
                            {jenisPameranList.map((j) => (
                                <SelectItem key={j.id} value={String(j.id)}>
                                    {j.jenis_pameran}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                        <Store className="mr-1.5 size-3 text-neutral-500" />
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {filteredPamerans.length}
                        </span>
                        <span className="ml-1 text-neutral-500">titik channel</span>
                    </Badge>

                    {/* Tombol Toggle Mode Komparasi */}
                    <Button
                        variant={isCompareMode ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleToggleCompareMode}
                        className={`h-8 text-xs gap-1.5 transition-all ${
                            isCompareMode
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                : 'border-neutral-300 dark:border-neutral-700 hover:border-indigo-500'
                        }`}
                        title="Bandingkan jarak & periode dua titik pameran"
                    >
                        <GitCompare className="size-3.5" />
                        <span>{isCompareMode ? 'Mode Komparasi' : 'Komparasi'}</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetView}
                        className="h-8 text-xs gap-1.5"
                        title="Pusatkan kembali seluruh titik lokasi"
                    >
                        <RotateCcw className="size-3" />
                        Pusatkan
                    </Button>
                </div>
            </div>

            {/* Area Peta Leaflet */}
            <div className="relative w-full overflow-hidden" style={{ height }}>
                <div ref={mapContainerRef} className="size-full z-0" />

                {/* Banner Panduan jika Komparasi Aktif tapi belum lengkap */}
                {isCompareMode && (!comparePameranA || !comparePameranB) && !isCompareDetailModalOpen && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-indigo-200/90 bg-indigo-50/95 px-4 py-1.5 text-xs font-medium text-indigo-900 shadow-md backdrop-blur-md dark:border-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-200 animate-in fade-in slide-in-from-top-2">
                        <GitCompare className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>
                            {!comparePameranA
                                ? 'Pilih Channel Pertama (A) dengan mengklik pin di peta'
                                : 'Sekarang klik pin kedua di peta untuk Channel B'}
                        </span>
                        <button
                            onClick={handleToggleCompareMode}
                            className="ml-1 rounded-full p-0.5 text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                )}

                {/* Floating Quick Detail Card saat pin diklik (Mode Normal) */}
                {selectedPameran && !isCompareMode && !isCompareDetailModalOpen && (
                    <div className="absolute bottom-4 left-4 z-20 max-w-sm rounded-xl border border-neutral-200/90 bg-background/95 p-4 shadow-xl backdrop-blur-md dark:border-neutral-800/90 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                        {selectedPameran.jenis_pameran?.jenis_pameran}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className={`text-[10px] py-0 px-1.5 ${
                                            getRentalPeriodStatus(
                                                selectedPameran.mulai_tanggal_sewa,
                                                selectedPameran.tanggal_sewa_berakhir,
                                            ).color
                                        }`}
                                    >
                                        {
                                            getRentalPeriodStatus(
                                                selectedPameran.mulai_tanggal_sewa,
                                                selectedPameran.tanggal_sewa_berakhir,
                                            ).label
                                        }
                                    </Badge>
                                </div>
                                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                    {selectedPameran.dealer?.nama_dealer}
                                </h4>
                                <p className="text-xs text-neutral-500 font-mono">
                                    Kode Dealer: {selectedPameran.dealer?.kode_dealer}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedPameran(null);
                                    setShowRadiusCircle(false);
                                    if (radiusCircleRef.current) {
                                        radiusCircleRef.current.remove();
                                        radiusCircleRef.current = null;
                                    }
                                }}
                                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                            <div className="flex items-center gap-2">
                                <Calendar className="size-3.5 text-neutral-400 shrink-0" />
                                <span>
                                    {formatDateIndo(selectedPameran.mulai_tanggal_sewa)} s/d{' '}
                                    {formatDateIndo(selectedPameran.tanggal_sewa_berakhir)}
                                </span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="size-3.5 text-neutral-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                        {selectedPameran.kecamatan}
                                        {selectedPameran.kabupaten ? `, ${selectedPameran.kabupaten}` : ''}
                                    </span>
                                    {selectedPameran.detail_alamat && (
                                        <p className="text-[11px] text-neutral-500">
                                            {selectedPameran.detail_alamat}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {selectedPameran.kode_pameran_md && (
                                <div className="mt-2 flex items-center justify-between rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    <span>Kode MD:</span>
                                    <span className="font-mono">{selectedPameran.kode_pameran_md}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
                            {/* Toggle radius circle */}
                            <button
                                onClick={() => {
                                    const map = mapInstanceRef.current;
                                    if (!map || !radiusCircleRef.current) return;

                                    if (showRadiusCircle) {
                                        radiusCircleRef.current.remove();
                                        setShowRadiusCircle(false);
                                    } else {
                                        radiusCircleRef.current.addTo(map);
                                        setShowRadiusCircle(true);
                                    }
                                }}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                    showRadiusCircle
                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                                }`}
                                title="Tampilkan / sembunyikan area radius"
                            >
                                <Radio className="size-3" />
                                {showRadiusCircle
                                    ? 'Sembunyikan Radius'
                                    : `Radius ${selectedPameran.jenis_pameran?.radius_km ?? 2} km`}
                            </button>

                            {/* Tombol Bandingkan */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartCompareWithCurrent(selectedPameran)}
                                className="h-7 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                            >
                                <GitCompare className="size-3 text-indigo-500" />
                                Bandingkan
                            </Button>

                            <a
                                href={`https://www.google.com/maps?q=${selectedPameran.latitude},${selectedPameran.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                            >
                                <ExternalLink className="size-3" />
                                Google Maps
                            </a>
                        </div>
                    </div>
                )}

                {/* Bottom Floating Comparison Panel (Saat Mode Komparasi Aktif) */}
                {isCompareMode && (comparePameranA || comparePameranB) && !isCompareDetailModalOpen && (
                    <div className="absolute bottom-3 left-3 right-3 z-20 max-h-[85%] overflow-y-auto rounded-xl border border-indigo-100 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-indigo-900/60 dark:bg-neutral-900/95 animate-in fade-in slide-in-from-bottom-3 duration-200">
                        {/* Header Panel Komparasi */}
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                                <span className="flex size-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                                    <GitCompare className="size-3.5" />
                                </span>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                        Komparasi Titik Channel
                                    </h4>
                                    <p className="text-[11px] text-neutral-500">
                                        Perbandingan jarak, radius zonasi, dan kesesuaian jadwal antar pameran
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {comparePameranA && comparePameranB && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleSwapPamerans}
                                            className="h-7 text-xs gap-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                                            title="Tukar posisi Channel A dan Channel B"
                                        >
                                            <ArrowLeftRight className="size-3" />
                                            <span className="hidden sm:inline">Tukar (⇄)</span>
                                        </Button>

                                        {comparisonMetrics && (
                                            <>
                                                <a
                                                    href={comparisonMetrics.googleMapsRouteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-neutral-200 bg-background px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                    title="Buka rute navigasi dari A ke B di Google Maps"
                                                >
                                                    <Navigation className="size-3 text-blue-600 dark:text-blue-400" />
                                                    <span className="hidden sm:inline">Rute G-Maps</span>
                                                </a>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setIsCompareDetailModalOpen(true)}
                                                    className="h-7 text-xs gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
                                                >
                                                    <Maximize2 className="size-3" />
                                                    <span>Detail Lengkap</span>
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}

                                <button
                                    onClick={handleToggleCompareMode}
                                    className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                                    title="Tutup komparasi"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* Side by side cards */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            {/* Card Channel A */}
                            <div className="md:col-span-5 rounded-lg border-2 border-blue-500/30 bg-blue-50/30 p-2.5 dark:bg-blue-950/20">
                                <div className="flex items-center justify-between mb-1.5">
                                    <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px] py-0 px-1.5">
                                        Channel A
                                    </Badge>
                                    {comparePameranA && (
                                        <Badge variant="outline" className="text-[10px] py-0">
                                            Radius {comparePameranA.jenis_pameran?.radius_km ?? 2} km
                                        </Badge>
                                    )}
                                </div>

                                {comparePameranA ? (
                                    <div className="space-y-1">
                                        <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                            {comparePameranA.dealer?.nama_dealer}
                                        </h5>
                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                {comparePameranA.jenis_pameran?.jenis_pameran}
                                            </span>
                                            <span>&bull;</span>
                                            <span className="font-mono">
                                                {comparePameranA.dealer?.kode_dealer || '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 pt-1">
                                            <Calendar className="size-3 text-neutral-400 shrink-0" />
                                            <span>
                                                {formatDateIndo(comparePameranA.mulai_tanggal_sewa)} -{' '}
                                                {formatDateIndo(comparePameranA.tanggal_sewa_berakhir)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                                            <MapPin className="size-3 text-neutral-400 shrink-0" />
                                            <span className="truncate">
                                                {comparePameranA.kecamatan}
                                                {comparePameranA.kabupaten ? `, ${comparePameranA.kabupaten}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4 text-center text-xs text-neutral-400">
                                        Pilih channel A di peta
                                    </div>
                                )}
                            </div>

                            {/* Komparasi Metric Tengah */}
                            <div className="md:col-span-2 flex flex-col items-center justify-center text-center p-2 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/60">
                                {comparisonMetrics ? (
                                    <div className="space-y-1.5 w-full">
                                        <div>
                                            <span className="text-[10px] font-semibold uppercase text-neutral-400">
                                                Jarak Lurus
                                            </span>
                                            <div className="text-base font-extrabold text-indigo-700 dark:text-indigo-400">
                                                {comparisonMetrics.distanceFormatted}
                                            </div>
                                        </div>

                                        {/* Status Overlap Radius */}
                                        <div>
                                            {comparisonMetrics.isRadiusOverlap ? (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-[9.5px] py-0 px-1 font-bold gap-1 w-full justify-center"
                                                    title={`Jarak (${comparisonMetrics.distanceFormatted}) < Total Radius Kebijakan (${comparisonMetrics.totalRadiusKm} km)`}
                                                >
                                                    <AlertTriangle className="size-2.5" />
                                                    Bentrok Radius
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    className="bg-emerald-600 hover:bg-emerald-600 text-white text-[9.5px] py-0 px-1 font-bold gap-1 w-full justify-center"
                                                    title={`Jarak aman melebihi total radius kedua channel (${comparisonMetrics.totalRadiusKm} km)`}
                                                >
                                                    <CheckCircle2 className="size-2.5" />
                                                    Radius Aman
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Status Jadwal */}
                                        <div>
                                            {comparisonMetrics.isDateOverlap ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[9.5px] py-0 px-1 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 w-full justify-center"
                                                >
                                                    Jadwal Bersamaan
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[9.5px] py-0 px-1 text-neutral-500 w-full justify-center"
                                                >
                                                    Jadwal Berbeda
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-neutral-400 py-3">
                                        <ArrowLeftRight className="size-4 mx-auto mb-1 text-neutral-300" />
                                        <span>Pilih 2 titik</span>
                                    </div>
                                )}
                            </div>

                            {/* Card Channel B */}
                            <div className="md:col-span-5 rounded-lg border-2 border-orange-500/30 bg-orange-50/30 p-2.5 dark:bg-orange-950/20">
                                <div className="flex items-center justify-between mb-1.5">
                                    <Badge className="bg-orange-600 hover:bg-orange-600 text-white text-[10px] py-0 px-1.5">
                                        Channel B
                                    </Badge>
                                    {comparePameranB && (
                                        <Badge variant="outline" className="text-[10px] py-0">
                                            Radius {comparePameranB.jenis_pameran?.radius_km ?? 2} km
                                        </Badge>
                                    )}
                                </div>

                                {comparePameranB ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                                {comparePameranB.dealer?.nama_dealer}
                                            </h5>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                {comparePameranB.jenis_pameran?.jenis_pameran}
                                            </span>
                                            <span>&bull;</span>
                                            <span className="font-mono">
                                                {comparePameranB.dealer?.kode_dealer || '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 pt-1">
                                            <Calendar className="size-3 text-neutral-400 shrink-0" />
                                            <span>
                                                {formatDateIndo(comparePameranB.mulai_tanggal_sewa)} -{' '}
                                                {formatDateIndo(comparePameranB.tanggal_sewa_berakhir)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                                            <MapPin className="size-3 text-neutral-400 shrink-0" />
                                            <span className="truncate">
                                                {comparePameranB.kecamatan}
                                                {comparePameranB.kabupaten ? `, ${comparePameranB.kabupaten}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-2 space-y-1.5">
                                        <p className="text-xs text-neutral-500">
                                            Klik pin pameran lain pada peta, atau pilih dari daftar:
                                        </p>
                                        <Select
                                            onValueChange={(val) => {
                                                const found = filteredPamerans.find((p) => String(p.id) === val);
                                                if (found) setComparePameranB(found);
                                            }}
                                        >
                                            <SelectTrigger className="h-7 text-xs bg-background">
                                                <SelectValue placeholder="-- Pilih Channel B --" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-56">
                                                {filteredPamerans
                                                    .filter((p) => p.id !== comparePameranA?.id)
                                                    .map((p) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {p.dealer?.nama_dealer} ({p.jenis_pameran?.jenis_pameran} - {p.kecamatan})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Petunjuk Interaksi */}
                <div className="absolute top-3 right-3 z-10 rounded-md bg-background/85 px-2.5 py-1 text-[11px] text-neutral-600 shadow-xs backdrop-blur-xs dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-800/60 pointer-events-none hidden sm:flex items-center gap-1.5">
                    <Compass className="size-3 text-neutral-400" />
                    <span>
                        {isCompareMode
                            ? 'Klik pin untuk menentukan Channel A & B'
                            : 'Arahkan kursor ke titik pin untuk detail channel'}
                    </span>
                </div>
            </div>

            {/* Modal Dialog Detail Komparasi Lengkap */}
            <Dialog open={isCompareDetailModalOpen} onOpenChange={setIsCompareDetailModalOpen}>
                <DialogContent className="max-w-3xl overflow-hidden p-0 max-h-[90vh] flex flex-col z-[100]">
                    <DialogHeader className="p-5 pb-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                <GitCompare className="size-4" />
                            </span>
                            <div>
                                <DialogTitle className="text-base font-bold">
                                    Detail Komparasi Pameran
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Analisis perbandingan komprehensif antara Channel A dan Channel B
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {comparePameranA && comparePameranB && comparisonMetrics && (
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Summary Card Analisis Zonasi */}
                            <div
                                className={`rounded-xl border p-4 ${
                                    comparisonMetrics.isRadiusOverlap
                                        ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
                                        : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {comparisonMetrics.isRadiusOverlap ? (
                                        <AlertTriangle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    ) : (
                                        <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    )}
                                    <div className="space-y-1">
                                        <h5
                                            className={`text-sm font-bold ${
                                                comparisonMetrics.isRadiusOverlap
                                                    ? 'text-red-900 dark:text-red-200'
                                                    : 'text-emerald-900 dark:text-emerald-200'
                                            }`}
                                        >
                                            {comparisonMetrics.isRadiusOverlap
                                                ? 'Peringatan: Radius Zonasi Bersinggungan (Potensi Bentrok)'
                                                : 'Zonasi Aman: Jarak Melebihi Total Radius Kebijakan'}
                                        </h5>
                                        <p
                                            className={`text-xs ${
                                                comparisonMetrics.isRadiusOverlap
                                                    ? 'text-red-700 dark:text-red-300'
                                                    : 'text-emerald-700 dark:text-emerald-300'
                                            }`}
                                        >
                                            Jarak straight-line antara kedua lokasi adalah{' '}
                                            <b>{comparisonMetrics.distanceFormatted}</b>. Total radius zonasi kedua
                                            pameran adalah <b>{comparisonMetrics.totalRadiusKm} km</b> (Channel A:{' '}
                                            {comparisonMetrics.radiusKmA} km + Channel B:{' '}
                                            {comparisonMetrics.radiusKmB} km).
                                            {comparisonMetrics.isRadiusOverlap
                                                ? ` Area jangkauan tumpang tindih sebesar ${comparisonMetrics.radiusDifferenceFormatted}.`
                                                : ` Jarak aman surplus ${comparisonMetrics.radiusDifferenceFormatted}.`}
                                        </p>
                                        {comparisonMetrics.isDateOverlap && (
                                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 pt-1">
                                                &#9888; Catatan Jadwal: Periode sewa kedua channel berjalan di waktu yang bersamaan!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tabel Komparasi Berdampingan */}
                            <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 bg-neutral-100/70 dark:border-neutral-800 dark:bg-neutral-800/70">
                                            <th className="p-3 font-semibold text-neutral-600 dark:text-neutral-300 w-1/4">
                                                Parameter / Aspek
                                            </th>
                                            <th className="p-3 font-semibold text-blue-700 dark:text-blue-300 w-[37.5%] bg-blue-50/50 dark:bg-blue-950/20">
                                                <Badge className="bg-blue-600 text-white mr-1.5 py-0 px-1 text-[10px]">A</Badge>
                                                {comparePameranA.dealer?.nama_dealer}
                                            </th>
                                            <th className="p-3 font-semibold text-orange-700 dark:text-orange-300 w-[37.5%] bg-orange-50/50 dark:bg-orange-950/20">
                                                <Badge className="bg-orange-600 text-white mr-1.5 py-0 px-1 text-[10px]">B</Badge>
                                                {comparePameranB.dealer?.nama_dealer}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        <tr>
                                            <td className="p-3 font-medium text-neutral-500">Kode Dealer</td>
                                            <td className="p-3 font-mono">{comparePameranA.dealer?.kode_dealer || '-'}</td>
                                            <td className="p-3 font-mono">{comparePameranB.dealer?.kode_dealer || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-neutral-500">Jenis Channel</td>
                                            <td className="p-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                                {comparePameranA.jenis_pameran?.jenis_pameran}
                                            </td>
                                            <td className="p-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                                {comparePameranB.jenis_pameran?.jenis_pameran}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-neutral-500">Kebijakan Radius</td>
                                            <td className="p-3">{comparisonMetrics.radiusKmA} km ({comparisonMetrics.radiusKmA * 1000} m)</td>
                                            <td className="p-3">{comparisonMetrics.radiusKmB} km ({comparisonMetrics.radiusKmB * 1000} m)</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-neutral-500">Periode Sewa</td>
                                            <td className="p-3">
                                                {formatDateIndo(comparePameranA.mulai_tanggal_sewa)} s/d{' '}
                                                {formatDateIndo(comparePameranA.tanggal_sewa_berakhir)}
                                                <div className="text-[11px] text-neutral-500 mt-0.5">
                                                    Durasi: {comparisonMetrics.durationA} hari
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {formatDateIndo(comparePameranB.mulai_tanggal_sewa)} s/d{' '}
                                                {formatDateIndo(comparePameranB.tanggal_sewa_berakhir)}
                                                <div className="text-[11px] text-neutral-500 mt-0.5">
                                                    Durasi: {comparisonMetrics.durationB} hari
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-neutral-500">Status Operasional</td>
                                            <td className="p-3">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] py-0 px-1.5 ${
                                                        getRentalPeriodStatus(
                                                            comparePameranA.mulai_tanggal_sewa,
                                                            comparePameranA.tanggal_sewa_berakhir,
                                                        ).color
                                                    }`}
                                                >
                                                    {
                                                        getRentalPeriodStatus(
                                                            comparePameranA.mulai_tanggal_sewa,
                                                            comparePameranA.tanggal_sewa_berakhir,
                                                        ).label
                                                    }
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] py-0 px-1.5 ${
                                                        getRentalPeriodStatus(
                                                            comparePameranB.mulai_tanggal_sewa,
                                                            comparePameranB.tanggal_sewa_berakhir,
                                                        ).color
                                                    }`}
                                                >
                                                    {
                                                        getRentalPeriodStatus(
                                                            comparePameranB.mulai_tanggal_sewa,
                                                            comparePameranB.tanggal_sewa_berakhir,
                                                        ).label
                                                    }
                                                </Badge>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-neutral-500">Kecamatan & Kab.</td>
                                            <td className="p-3">
                                                {comparePameranA.kecamatan}
                                                {comparePameranA.kabupaten ? `, ${comparePameranA.kabupaten}` : ''}
                                            </td>
                                            <td className="p-3">
                                                {comparePameranB.kecamatan}
                                                {comparePameranB.kabupaten ? `, ${comparePameranB.kabupaten}` : ''}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-neutral-500">Alamat Lokasi</td>
                                            <td className="p-3 text-[11px] text-neutral-600 dark:text-neutral-400">
                                                {comparePameranA.detail_alamat || '-'}
                                            </td>
                                            <td className="p-3 text-[11px] text-neutral-600 dark:text-neutral-400">
                                                {comparePameranB.detail_alamat || '-'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-neutral-500">Koordinat (Lat, Lng)</td>
                                            <td className="p-3 font-mono text-[11px]">
                                                {comparePameranA.latitude}, {comparePameranA.longitude}
                                            </td>
                                            <td className="p-3 font-mono text-[11px]">
                                                {comparePameranB.latitude}, {comparePameranB.longitude}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-neutral-500">Kode Pameran MD</td>
                                            <td className="p-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                                {comparePameranA.kode_pameran_md || '-'}
                                            </td>
                                            <td className="p-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                                {comparePameranB.kode_pameran_md || '-'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Footer Dialog */}
                    <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-900/50">
                        {comparisonMetrics && (
                            <a
                                href={comparisonMetrics.googleMapsRouteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
                            >
                                <Navigation className="size-3.5" />
                                Buka Navigasi Rute di Google Maps
                            </a>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCompareDetailModalOpen(false)}
                        >
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

