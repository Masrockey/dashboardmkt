import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Locate, MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

// Fix default marker icon path issue in Vite bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

export interface LocationSelectResult {
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
    kecamatan: string;
    detail_alamat: string;
}

export const getMapMarkerIcon = (customUrl?: string | null) => {
    if (!customUrl) {
        return new L.Icon.Default();
    }

    return L.icon({
        iconUrl: customUrl,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
        shadowUrl: markerShadow,
        shadowSize: [41, 41],
        shadowAnchor: [12, 41],
        className: 'custom-map-pin object-contain filter drop-shadow-md',
    });
};

interface LocationPickerMapProps {
    initialLat?: number | null;
    initialLng?: number | null;
    customIconUrl?: string | null;
    onLocationSelect: (result: LocationSelectResult) => void;
    className?: string;
    height?: string;
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
}: LocationPickerMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

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
                kecamatan: data.kecamatan || '',
                detailAlamat: data.detail_alamat || `Titik Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                latitude: lat,
                longitude: lng,
                displayName: data.display_name,
            };

            onLocationSelect(result);
            setStatusMessage(
                data.kecamatan ? `Terpilih: Kec. ${data.kecamatan}` : 'Lokasi berhasil dipilih'
            );
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            setStatusMessage('Gagal mengambil nama alamat otomatis. Anda dapat mengisinya manual.');

            onLocationSelect({
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
        } else {
            markerRef.current = L.marker([lat, lng], {
                icon: getMapMarkerIcon(customIconUrl),
            }).addTo(map);
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

                const locationResult: LocationSelectResult = {
                    kecamatan: top.kecamatan,
                    detailAlamat: top.detail_alamat || top.display_name,
                    latitude: top.latitude,
                    longitude: top.longitude,
                    displayName: top.display_name,
                };
                onLocationSelect(locationResult);

                setStatusMessage(`Ditemukan: ${top.name}${top.kecamatan ? ` (Kec. ${top.kecamatan})` : ''}`);
            } else {
                setSearchResults([]);
                setShowResultsDropdown(false);
                setStatusMessage(`Lokasi "${query}" tidak ditemukan. Coba kata kunci lain atau klik langsung di peta.`);
            }
        } catch (err) {
            console.error('Search error:', err);
            setStatusMessage('Terjadi kesalahan saat mencari lokasi. Silakan coba lagi.');
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (item: SearchResultItem) => {
        setPosition(item.latitude, item.longitude, 16);

        const locationResult: LocationSelectResult = {
            kecamatan: item.kecamatan,
            detailAlamat: item.detail_alamat || item.display_name,
            latitude: item.latitude,
            longitude: item.longitude,
            displayName: item.display_name,
        };
        onLocationSelect(locationResult);

        setSearchQuery(item.name);
        setShowResultsDropdown(false);
        setStatusMessage(`Terpilih: ${item.name}${item.kecamatan ? ` (Kec. ${item.kecamatan})` : ''}`);
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
                setStatusMessage('Gagal mengakses lokasi perangkat. Pastikan izin GPS aktif.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowResultsDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        const centerLat = initialLat ?? DEFAULT_LAT;
        const centerLng = initialLng ?? DEFAULT_LNG;
        const initialZoom = initialLat && initialLng ? 15 : DEFAULT_ZOOM;

        const map = L.map(mapContainerRef.current, {
            center: [centerLat, centerLng],
            zoom: initialZoom,
            attributionControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        if (initialLat && initialLng) {
            markerRef.current = L.marker([initialLat, initialLng], {
                icon: getMapMarkerIcon(customIconUrl),
            }).addTo(map);
        }

        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            setPosition(lat, lng);
            handleReverseGeocode(lat, lng);
        });

        mapInstanceRef.current = map;

        // Invalidate size on load & when container resizes
        const timer1 = setTimeout(() => map.invalidateSize(), 150);
        const timer2 = setTimeout(() => map.invalidateSize(), 400);

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
            markerRef.current = null;
        };
    }, []);

    // Dynamically update marker icon if customIconUrl changes
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setIcon(getMapMarkerIcon(customIconUrl));
        }
    }, [customIconUrl]);

    // Synchronize marker & view if initialLat / initialLng change externally
    useEffect(() => {
        if (mapInstanceRef.current && initialLat != null && initialLng != null) {
            const currentCenter = markerRef.current ? markerRef.current.getLatLng() : null;
            if (!currentCenter || currentCenter.lat !== initialLat || currentCenter.lng !== initialLng) {
                setPosition(initialLat, initialLng);
            }
        }
    }, [initialLat, initialLng]);

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Unified Search & Control Bar */}
            <div ref={searchContainerRef} className="relative z-30">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none" />
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
                                    executeSearch();
                                }
                            }}
                            className="h-9 pl-9 pr-8 text-xs bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSearchResults([]);
                                    setShowResultsDropdown(false);
                                }}
                                className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={executeSearch}
                            disabled={isSearching || !searchQuery.trim()}
                            className="h-9 px-3 text-xs"
                        >
                            {isSearching ? <Spinner className="size-3.5 mr-1" /> : <Search className="size-3.5 mr-1" />}
                            Cari
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCurrentLocation}
                            className="h-9 gap-1.5 px-3 text-xs border-neutral-200 dark:border-neutral-800"
                            title="Gunakan Lokasi GPS Saat Ini"
                        >
                            <Locate className="size-3.5 text-primary" />
                            <span>Lokasi Saya</span>
                        </Button>
                    </div>
                </div>

                {/* Dropdown Suggestions */}
                {showResultsDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                            Hasil Pencarian Lokasi:
                        </div>
                        {searchResults.map((item, idx) => (
                            <button
                                key={item.place_id || idx}
                                type="button"
                                onClick={() => selectSearchResult(item)}
                                className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                            >
                                <MapPin className="size-4 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                        {item.name}
                                    </div>
                                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                        {item.detail_alamat || item.display_name}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Canvas Box */}
            <div
                className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm z-10"
                style={{ height }}
            >
                <div ref={mapContainerRef} className="h-full w-full z-0" />

                {/* Loading overlay during reverse geocoding */}
                {isLoadingAddress && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs">
                        <div className="flex items-center gap-2 rounded-full bg-background px-3.5 py-2 text-xs font-medium shadow-lg border border-neutral-200 dark:border-neutral-800">
                            <Spinner className="size-3.5 text-primary" />
                            <span>Mendeteksi alamat titik peta...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Status / Instructions Footer */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/80">
                <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="size-3.5 text-red-500 shrink-0" />
                    <span className="truncate">
                        {statusMessage || 'Klik titik di peta atau gunakan pencarian di atas untuk menentukan lokasi.'}
                    </span>
                </div>
                {initialLat != null && initialLng != null && (
                    <span className="shrink-0 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                        [{initialLat.toFixed(6)}, {initialLng.toFixed(6)}]
                    </span>
                )}
            </div>
        </div>
    );
}
