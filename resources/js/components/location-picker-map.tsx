import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Locate, MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { createMapMarkerIcon, loadLeaflet } from '@/lib/leaflet-utils';
import type { PameranItem } from '@/types';

export interface LocationSelectResult {
    kabupaten: string;
    kecamatan: string;
    detailAlamat: string;
    latitude: number;
    longitude: number;
    displayName?: string;
}

export interface SearchResultItem {
    place_id?: number | string;
    name: string;
    display_name: string;
    latitude: number;
    longitude: number;
    kabupaten: string;
    kecamatan: string;
    detail_alamat: string;
}

export const getMapMarkerIcon = createMapMarkerIcon;

interface LocationPickerMapProps {
    initialLat?: number | null;
    initialLng?: number | null;
    customIconUrl?: string | null;
    onLocationSelect: (result: LocationSelectResult) => void;
    className?: string;
    height?: string;
    existingChannels?: PameranItem[];
}

// Default center: Mataram, Nusa Tenggara Barat (-8.5833, 116.1167)
const DEFAULT_LAT = -8.5833;
const DEFAULT_LNG = 116.1167;
const DEFAULT_ZOOM = 13;

export default function LocationPickerMap({
    initialLat,
    initialLng,
    customIconUrl,
    onLocationSelect,
    className = '',
    height = '280px',
    existingChannels = [],
}: LocationPickerMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const existingMarkersLayerRef = useRef<L.LayerGroup | null>(null);
    const leafletRef = useRef<typeof L | null>(null);

    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
    const [showResultsDropdown, setShowResultsDropdown] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleReverseGeocode = async (lat: number, lng: number) => {
        setIsLoadingAddress(true);
        setStatusMessage('Mengambil informasi alamat...');

        try {
            const url = `/api/geocode/reverse?lat=${lat}&lon=${lng}`;
            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Gagal menghubungi layanan geocoding');
            }

            const data = await response.json();

            const result: LocationSelectResult = {
                kabupaten: data.kabupaten || '',
                kecamatan: data.kecamatan || '',
                detailAlamat:
                    data.detail_alamat ||
                    `Titik Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                latitude: lat,
                longitude: lng,
                displayName: data.display_name,
            };

            onLocationSelect(result);

            const areaParts = [
                data.kecamatan ? `Kec. ${data.kecamatan}` : null,
                data.kabupaten || null,
            ].filter(Boolean);

            setStatusMessage(
                areaParts.length > 0
                    ? `Terpilih: ${areaParts.join(', ')}`
                    : 'Lokasi berhasil dipilih',
            );
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            setStatusMessage(
                'Gagal mengambil nama alamat otomatis. Anda dapat mengisinya manual.',
            );

            onLocationSelect({
                kabupaten: '',
                kecamatan: '',
                detailAlamat: `Titik Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                latitude: lat,
                longitude: lng,
            });
        } finally {
            setIsLoadingAddress(false);
        }
    };

    const setPosition = (lat: number, lng: number, zoom?: number) => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        if (zoom !== undefined) {
            map.setView([lat, lng], zoom);
        } else {
            map.panTo([lat, lng]);
        }

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            markerRef.current.setZIndexOffset(1000);
        } else if (leafletRef.current) {
            const L = leafletRef.current;
            markerRef.current = L.marker([lat, lng], {
                icon: createMapMarkerIcon(L, customIconUrl),
                zIndexOffset: 1000,
            }).addTo(map);

            markerRef.current.bindTooltip('Titik Lokasi Baru (Dipilih)', {
                direction: 'top',
                offset: [0, -12],
            });

            markerRef.current.on('click', (e: L.LeafletMouseEvent) => {
                if (e.originalEvent) {
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                }
            });
        }
    };

    const executeSearch = async () => {
        const query = searchQuery.trim();
        if (!query) return;

        setIsSearching(true);
        setStatusMessage('Mencari lokasi...');

        try {
            let viewboxParam = '';
            if (mapInstanceRef.current) {
                const bounds = mapInstanceRef.current.getBounds();
                viewboxParam = `&viewbox=${bounds.getWest().toFixed(4)},${bounds.getSouth().toFixed(4)},${bounds.getEast().toFixed(4)},${bounds.getNorth().toFixed(4)}`;
            }

            const url = `/api/geocode/search?q=${encodeURIComponent(query)}${viewboxParam}`;
            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) throw new Error('Pencarian gagal');

            const results: SearchResultItem[] = await response.json();

            if (results && results.length > 0) {
                setSearchResults(results);
                setShowResultsDropdown(true);

                // Auto-select and navigate to the top result
                const top = results[0];
                setPosition(top.latitude, top.longitude, 16);

                const topAreaInfo = [
                    top.kecamatan ? `Kec. ${top.kecamatan}` : null,
                    top.kabupaten || null,
                ]
                    .filter(Boolean)
                    .join(', ');

                const locationResult: LocationSelectResult = {
                    kabupaten: top.kabupaten || '',
                    kecamatan: top.kecamatan || '',
                    detailAlamat: top.detail_alamat || top.display_name,
                    latitude: top.latitude,
                    longitude: top.longitude,
                    displayName: top.display_name,
                };
                onLocationSelect(locationResult);

                setStatusMessage(
                    `Ditemukan: ${top.name}${topAreaInfo ? ` (${topAreaInfo})` : ''}`,
                );
            } else {
                setSearchResults([]);
                setShowResultsDropdown(false);
                setStatusMessage(
                    `Lokasi "${query}" tidak ditemukan. Coba kata kunci lain atau klik langsung di peta.`,
                );
            }
        } catch (err) {
            console.error('Search error:', err);
            setStatusMessage(
                'Terjadi kesalahan saat mencari lokasi. Silakan coba lagi.',
            );
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (item: SearchResultItem) => {
        setPosition(item.latitude, item.longitude, 16);

        const areaInfo = [
            item.kecamatan ? `Kec. ${item.kecamatan}` : null,
            item.kabupaten || null,
        ]
            .filter(Boolean)
            .join(', ');

        const locationResult: LocationSelectResult = {
            kabupaten: item.kabupaten || '',
            kecamatan: item.kecamatan || '',
            detailAlamat: item.detail_alamat || item.display_name,
            latitude: item.latitude,
            longitude: item.longitude,
            displayName: item.display_name,
        };
        onLocationSelect(locationResult);

        setSearchQuery(item.name);
        setShowResultsDropdown(false);
        setStatusMessage(
            `Terpilih: ${item.name}${areaInfo ? ` (${areaInfo})` : ''}`,
        );
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            setStatusMessage('Browser tidak mendukung geolokasi.');
            return;
        }

        setStatusMessage('Mendeteksi lokasi saat ini...');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setPosition(lat, lng, 15);
                await handleReverseGeocode(lat, lng);
            },
            (err) => {
                console.warn('Geolocation error:', err);
                setStatusMessage(
                    'Gagal mengakses lokasi perangkat. Pastikan izin GPS aktif.',
                );
            },
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target as Node)
            ) {
                setShowResultsDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Helper to render existing channels
    const renderExistingChannels = (
        L: typeof import('leaflet'),
        layer: L.LayerGroup,
        channels: PameranItem[],
    ) => {
        layer.clearLayers();
        if (!channels || channels.length === 0) return;

        channels.forEach((item) => {
            const lat = Number(item.latitude);
            const lng = Number(item.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            const icon = createMapMarkerIcon(L, item.jenis_pameran?.icon_map_url);
            const marker = L.marker([lat, lng], {
                icon,
                zIndexOffset: 100,
            });

            // Jika merupakan channel dari dealer lain:
            // Hanya muncul pin saja, tidak bisa dicek detail (tanpa popup, tanpa info detail sensitif)
            if (item.is_other_dealer) {
                marker.bindTooltip(
                    `<b>Channel Terdaftar</b>${item.jenis_pameran?.jenis_pameran ? `<br/><span style="font-size: 10px; color: #4b5563;">${item.jenis_pameran.jenis_pameran}</span>` : ''}`,
                    { direction: 'top', offset: [0, -10] },
                );

                marker.on('click', (e: L.LeafletMouseEvent) => {
                    if (e.originalEvent) {
                        e.originalEvent.stopPropagation();
                    }
                });

                marker.addTo(layer);
                return;
            }

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

            const popupEl = document.createElement('div');
            popupEl.style.cssText =
                'font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 220px; max-width: 270px; padding: 2px;';
            popupEl.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px;">
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; ${statusColor}">
                        ${statusText}
                    </span>
                    <span style="font-size: 10px; color: #6b7280; font-weight: 500;">Channel Terdaftar</span>
                </div>
                <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px;">
                    ${item.dealer?.nama_dealer || 'Dealer'}
                </div>
                <div style="font-size: 11px; color: #4b5563; margin-bottom: 5px;">
                    <span style="font-weight: 600; color: #1f2937;">${item.jenis_pameran?.jenis_pameran || 'Channel'}</span>
                    ${item.dealer?.kode_dealer ? ` &bull; <span style="font-family: monospace;">${item.dealer.kode_dealer}</span>` : ''}
                </div>
                <div style="border-top: 1px dashed #e5e7eb; padding-top: 5px; margin-top: 5px; font-size: 11px; color: #4b5563;">
                    <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">
                        <span>&#128197;</span>
                        <span>${item.mulai_tanggal_sewa} s/d ${item.tanggal_sewa_berakhir}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span>&#128205;</span>
                        <span style="font-weight: 600;">${item.kecamatan}${item.kabupaten ? `, ${item.kabupaten}` : ''}</span>
                    </div>
                    ${item.detail_alamat ? `<div style="font-size: 10px; color: #6b7280; margin-top: 2px; padding-left: 15px;">${item.detail_alamat}</div>` : ''}
                </div>
                <div style="margin-top: 8px; border-top: 1px solid #f3f4f6; padding-top: 6px;">
                    <button type="button" class="use-location-btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 4px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 8px; font-size: 11px; font-weight: 600; color: #0f172a; cursor: pointer;">
                        <span>&#128205;</span> Salin / Gunakan Lokasi Ini
                    </button>
                </div>
            `;

            const useBtn = popupEl.querySelector('.use-location-btn');
            if (useBtn) {
                useBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPosition(lat, lng, 16);
                    const locationResult: LocationSelectResult = {
                        kabupaten: item.kabupaten || '',
                        kecamatan: item.kecamatan || '',
                        detailAlamat: item.detail_alamat || '',
                        latitude: lat,
                        longitude: lng,
                    };
                    onLocationSelect(locationResult);
                    setStatusMessage(
                        `Lokasi disalin dari channel: ${item.dealer?.nama_dealer || 'Channel'} (${item.kecamatan})`,
                    );
                    marker.closePopup();
                });
            }

            marker.bindPopup(popupEl);
            marker.bindTooltip(
                `<b>${item.dealer?.nama_dealer || 'Channel'}</b><br/><span style="font-size: 10px;">${item.jenis_pameran?.jenis_pameran || ''} &bull; ${item.kecamatan}</span>`,
                { direction: 'top', offset: [0, -10] },
            );

            marker.on('click', (e: L.LeafletMouseEvent) => {
                if (e.originalEvent) {
                    e.originalEvent.stopPropagation();
                }
            });

            marker.addTo(layer);
        });
    };

    // Initialize map
    useEffect(() => {
        let isCancelled = false;
        let resizeObserver: ResizeObserver | null = null;
        let timer1: ReturnType<typeof setTimeout> | null = null;
        let timer2: ReturnType<typeof setTimeout> | null = null;

        async function init() {
            if (!mapContainerRef.current) return;
            if (mapInstanceRef.current) return;

            const L = await loadLeaflet();
            if (isCancelled || !mapContainerRef.current) return;

            leafletRef.current = L;

            const centerLat = initialLat ?? DEFAULT_LAT;
            const centerLng = initialLng ?? DEFAULT_LNG;
            const initialZoom = initialLat && initialLng ? 15 : DEFAULT_ZOOM;

            // Prevent Leaflet map container events from bubbling up to parent form
            L.DomEvent.disableClickPropagation(mapContainerRef.current);
            L.DomEvent.disableScrollPropagation(mapContainerRef.current);

            const map = L.map(mapContainerRef.current, {
                center: [centerLat, centerLng],
                zoom: initialZoom,
                attributionControl: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            // Layer for existing registered channels
            const existingLayer = L.layerGroup().addTo(map);
            existingMarkersLayerRef.current = existingLayer;
            renderExistingChannels(L, existingLayer, existingChannels);

            // Fit bounds if existing channels are available and no initial coordinate is selected
            if (
                initialLat == null &&
                initialLng == null &&
                existingChannels &&
                existingChannels.length > 0
            ) {
                const validCoords = existingChannels
                    .map((c) => [Number(c.latitude), Number(c.longitude)] as [number, number])
                    .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));
                if (validCoords.length > 0) {
                    const bounds = L.latLngBounds(validCoords);
                    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
                }
            }

            if (initialLat && initialLng) {
                markerRef.current = L.marker([initialLat, initialLng], {
                    icon: createMapMarkerIcon(L, customIconUrl),
                    zIndexOffset: 1000,
                }).addTo(map);

                markerRef.current.bindTooltip('Titik Lokasi Baru (Dipilih)', {
                    direction: 'top',
                    offset: [0, -12],
                });

                markerRef.current.on('click', (e: L.LeafletMouseEvent) => {
                    if (e.originalEvent) {
                        e.originalEvent.preventDefault();
                        e.originalEvent.stopPropagation();
                    }
                });
            }

            map.on('click', (e: L.LeafletMouseEvent) => {
                if (e.originalEvent) {
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                }
                const { lat, lng } = e.latlng;
                setPosition(lat, lng);
                void handleReverseGeocode(lat, lng);
            });

            mapInstanceRef.current = map;

            // Invalidate size on load & when container resizes
            timer1 = setTimeout(() => map.invalidateSize(), 150);
            timer2 = setTimeout(() => map.invalidateSize(), 400);

            resizeObserver = new ResizeObserver(() => {
                map.invalidateSize();
            });
            resizeObserver.observe(mapContainerRef.current);
        }

        void init();

        return () => {
            isCancelled = true;
            if (timer1) clearTimeout(timer1);
            if (timer2) clearTimeout(timer2);
            if (resizeObserver) resizeObserver.disconnect();
            if (existingMarkersLayerRef.current) {
                existingMarkersLayerRef.current.clearLayers();
                existingMarkersLayerRef.current = null;
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            markerRef.current = null;
        };
    }, []);

    // Re-render existing channels when prop changes
    useEffect(() => {
        if (!leafletRef.current || !existingMarkersLayerRef.current) {
            return;
        }
        renderExistingChannels(
            leafletRef.current,
            existingMarkersLayerRef.current,
            existingChannels,
        );
    }, [existingChannels]);

    // Dynamically update marker icon if customIconUrl changes
    useEffect(() => {
        if (markerRef.current && leafletRef.current) {
            markerRef.current.setIcon(
                createMapMarkerIcon(leafletRef.current, customIconUrl),
            );
        }
    }, [customIconUrl]);

    // Synchronize marker & view if initialLat / initialLng change externally
    useEffect(() => {
        if (
            mapInstanceRef.current &&
            initialLat != null &&
            initialLng != null
        ) {
            const currentCenter = markerRef.current
                ? markerRef.current.getLatLng()
                : null;
            if (
                !currentCenter ||
                currentCenter.lat !== initialLat ||
                currentCenter.lng !== initialLng
            ) {
                setPosition(initialLat, initialLng);
            }
        }
    }, [initialLat, initialLng]);

    return (
        <div
            className={`space-y-3 ${className}`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Unified Search & Control Bar */}
            <div ref={searchContainerRef} className="relative z-30">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            type="text"
                            placeholder="Cari jalan / tempat (contoh: Epicentrum Mall, Mataram)..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value) {
                                    setSearchResults([]);
                                    setShowResultsDropdown(false);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void executeSearch();
                                }
                            }}
                            className="h-9 border-neutral-200 bg-white pr-8 pl-9 text-xs shadow-2xs dark:border-neutral-800 dark:bg-neutral-900"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSearchQuery('');
                                    setSearchResults([]);
                                    setShowResultsDropdown(false);
                                }}
                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void executeSearch();
                            }}
                            disabled={isSearching || !searchQuery.trim()}
                            className="h-9 px-3 text-xs"
                        >
                            {isSearching ? (
                                <Spinner className="mr-1 size-3.5" />
                            ) : (
                                <Search className="mr-1 size-3.5" />
                            )}
                            Cari
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCurrentLocation();
                            }}
                            className="h-9 gap-1.5 border-neutral-200 px-3 text-xs dark:border-neutral-800"
                            title="Gunakan Lokasi GPS Saat Ini"
                        >
                            <Locate className="text-primary size-3.5" />
                            <span>Lokasi Saya</span>
                        </Button>
                    </div>
                </div>

                {/* Dropdown Suggestions */}
                {showResultsDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                            Hasil Pencarian Lokasi:
                        </div>
                        {searchResults.map((item, idx) => (
                            <button
                                key={item.place_id || idx}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    selectSearchResult(item);
                                }}
                                className="flex w-full cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
                            >
                                <MapPin className="mt-0.5 size-4 shrink-0 text-red-500" />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                        {item.name}
                                    </div>
                                    <div className="line-clamp-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                        {item.detail_alamat ||
                                            item.display_name}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Canvas Box */}
            <div
                className="relative z-10 overflow-hidden rounded-xl border border-neutral-200 shadow-sm dark:border-neutral-800"
                style={{ height }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div ref={mapContainerRef} className="z-0 h-full w-full" />

                {/* Loading overlay during reverse geocoding */}
                {isLoadingAddress && (
                    <div className="bg-background/60 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-xs">
                        <div className="bg-background flex items-center gap-2 rounded-full border border-neutral-200 px-3.5 py-2 text-xs font-medium shadow-lg dark:border-neutral-800">
                            <Spinner className="text-primary size-3.5" />
                            <span>Mendeteksi alamat titik peta...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Status / Instructions Footer */}
            <div className="flex flex-col gap-1 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:text-neutral-400">
                <div className="flex min-w-0 items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0 text-red-500" />
                    <span className="truncate">
                        {statusMessage ||
                            'Klik titik di peta atau gunakan pencarian di atas untuk menentukan lokasi.'}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {existingChannels && existingChannels.length > 0 && (
                        <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                            {existingChannels.length} Channel Terdaftar
                        </span>
                    )}
                    {initialLat != null && initialLng != null && (
                        <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                            [{initialLat.toFixed(6)}, {initialLng.toFixed(6)}]
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
