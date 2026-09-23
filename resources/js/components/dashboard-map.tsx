import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Compass,
    ExternalLink,
    Filter,
    Layers,
    MapPin,
    RotateCcw,
    Search,
    Store,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getMapMarkerIcon } from '@/components/location-picker-map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

export default function DashboardMap({
    pamerans,
    jenisPameranList,
    height = '520px',
    className = '',
}: DashboardMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRentalFilter, setSelectedRentalFilter] = useState('all'); // all | berlangsung | akan_datang | selesai
    const [selectedApprovalFilter, setSelectedApprovalFilter] = useState('all'); // all | disetujui | menunggu | ditolak
    const [selectedJenisFilter, setSelectedJenisFilter] = useState('all');
    const [selectedPameran, setSelectedPameran] = useState<PameranItem | null>(null);

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

            // Rental status filter
            if (selectedRentalFilter !== 'all') {
                const rentalStatus = getRentalPeriodStatus(
                    item.mulai_tanggal_sewa,
                    item.tanggal_sewa_berakhir,
                );
                if (rentalStatus.key !== selectedRentalFilter) {
                    return false;
                }
            }

            // Approval status filter
            if (selectedApprovalFilter !== 'all') {
                if (selectedApprovalFilter === 'menunggu') {
                    if (item.status !== 'menunggu_spv' && item.status !== 'menunggu_kabag') {
                        return false;
                    }
                } else if (item.status !== selectedApprovalFilter) {
                    return false;
                }
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
        selectedApprovalFilter,
        selectedJenisFilter,
    ]);

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
        };
    }, []);

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
                        <span style="font-weight: 600; color: #1f2937;">${pameran.jenis_pameran?.jenis_pameran || 'Pameran'}</span>
                        ${pameran.dealer?.kode_dealer ? ` &bull; <span style="font-family: monospace;">${pameran.dealer.kode_dealer}</span>` : ''}
                    </div>

                    <div style="border-top: 1px dashed #e5e7eb; padding-top: 6px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; align-items: flex-start; gap: 5px; color: #374151;">
                            <span style="color: #6b7280; font-size: 11px;">&#128197;</span>
                            <span style="font-size: 11px;">${formatDateIndo(pameran.mulai_tanggal_sewa)} - ${formatDateIndo(pameran.tanggal_sewa_berakhir)}</span>
                        </div>
                        <div style="display: flex; align-items: flex-start; gap: 5px; color: #374151;">
                            <span style="color: #6b7280; font-size: 11px;">&#128205;</span>
                            <span style="font-size: 11px; font-weight: 600;">${pameran.kecamatan}</span>
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

            // Klik pin untuk fokus dan melihat detail card
            marker.on('click', () => {
                setSelectedPameran(pameran);
                map.panTo([lat, lng], { animate: true, duration: 0.5 });
            });

            markersLayer.addLayer(marker);
        });

        // Fit bounds jika ada pin
        if (filteredPamerans.length > 0 && bounds.isValid()) {
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
                            <SelectItem value="all">Semua Sewa</SelectItem>
                            <SelectItem value="berlangsung">Sedang Berlangsung</SelectItem>
                            <SelectItem value="akan_datang">Akan Datang</SelectItem>
                            <SelectItem value="selesai">Selesai</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Filter Approval */}
                    <Select
                        value={selectedApprovalFilter}
                        onValueChange={setSelectedApprovalFilter}
                    >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue placeholder="Approval" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Approval</SelectItem>
                            <SelectItem value="disetujui">Disetujui</SelectItem>
                            <SelectItem value="menunggu">Menunggu Approval</SelectItem>
                            <SelectItem value="ditolak">Ditolak</SelectItem>
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
                        <span className="ml-1 text-neutral-500">titik pameran</span>
                    </Badge>

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

                {/* Floating Quick Detail Card saat pin diklik */}
                {selectedPameran && (
                    <div className="absolute bottom-4 left-4 z-[500] max-w-sm rounded-xl border border-neutral-200/90 bg-background/95 p-4 shadow-xl backdrop-blur-md dark:border-neutral-800/90 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                                onClick={() => setSelectedPameran(null)}
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

                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
                            <a
                                href={`https://www.google.com/maps?q=${selectedPameran.latitude},${selectedPameran.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                            >
                                <ExternalLink className="size-3" />
                                Buka di Google Maps
                            </a>
                        </div>
                    </div>
                )}

                {/* Petunjuk Interaksi */}
                <div className="absolute top-3 right-3 z-[400] rounded-md bg-background/85 px-2.5 py-1 text-[11px] text-neutral-600 shadow-xs backdrop-blur-xs dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-800/60 pointer-events-none hidden sm:flex items-center gap-1.5">
                    <Compass className="size-3 text-neutral-400" />
                    <span>Arahkan kursor ke titik pin untuk detail pameran</span>
                </div>
            </div>
        </Card>
    );
}

