import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Locate, MapPin, Search } from 'lucide-react';
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

interface LocationPickerMapProps {
    initialLat?: number | null;
    initialLng?: number | null;
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
    onLocationSelect,
    className = '',
    height = '240px',
}: LocationPickerMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleReverseGeocode = async (lat: number, lng: number) => {
        setIsLoadingAddress(true);
        setStatusMessage('Mengambil informasi alamat...');

        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'id,en',
                },
            });

            if (!response.ok) {
                throw new Error('Gagal menghubungi layanan geocoding');
            }

            const data = await response.json();
            const address = data.address || {};

            // Extract Kecamatan
            const rawKecamatan =
                address.county ||
                address.city_district ||
                address.subdistrict ||
                address.district ||
                address.suburb ||
                address.municipality ||
                '';

            // Clean prefix "Kecamatan " or "Kec. "
            const cleanKecamatan = rawKecamatan
                .replace(/^(kecamatan|kec\.)\s*/i, '')
                .trim();

            // Build detail alamat: prioritize specific road, neighborhood, and village
            const addressParts = [
                address.amenity || address.shop || address.building || address.office,
                address.road,
                address.neighbourhood,
                address.suburb || address.village,
            ].filter(Boolean);

            const detailAlamat =
                addressParts.length > 0
                    ? addressParts.join(', ')
                    : data.display_name || `Titik Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

            const result: LocationSelectResult = {
                kecamatan: cleanKecamatan,
                detailAlamat,
                latitude: lat,
                longitude: lng,
                displayName: data.display_name,
            };

            onLocationSelect(result);
            setStatusMessage(
                cleanKecamatan ? `Terpilih: Kec. ${cleanKecamatan}` : 'Lokasi berhasil dipilih'
            );
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            setStatusMessage('Gagal mengambil nama alamat otomatis. Anda dapat mengisinya manual.');

            // Still provide coordinates
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
            markerRef.current = L.marker([lat, lng]).addTo(map);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setStatusMessage('Mencari lokasi...');

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
                searchQuery
            )}&limit=1&countrycodes=id`;

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'id,en',
                },
            });

            if (!response.ok) throw new Error('Pencarian gagal');

            const results = await response.json();
            if (results && results.length > 0) {
                const target = results[0];
                const lat = parseFloat(target.lat);
                const lng = parseFloat(target.lon);

                setPosition(lat, lng, 15);
                await handleReverseGeocode(lat, lng);
            } else {
                setStatusMessage('Lokasi tidak ditemukan. Coba kata kunci lain atau klik langsung di peta.');
            }
        } catch (err) {
            console.error('Search error:', err);
            setStatusMessage('Terjadi kesalahan saat mencari lokasi.');
        } finally {
            setIsSearching(false);
        }
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
            markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
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
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span>Pilih Titik di Peta (Otomatis Isi Alamat & Kecamatan)</span>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCurrentLocation}
                    className="h-7 gap-1 px-2 text-[11px]"
                    title="Gunakan Lokasi GPS Saat Ini"
                >
                    <Locate className="size-3" />
                    Lokasi Saya
                </Button>
            </div>

            {/* Quick Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-1.5">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Cari jalan / tempat (contoh: Epicentrum Mall, Mataram)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 pr-2 text-xs"
                    />
                </div>
                <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={isSearching || !searchQuery.trim()}
                    className="h-8 px-2.5 text-xs shrink-0"
                >
                    {isSearching ? <Spinner className="size-3.5" /> : 'Cari'}
                </Button>
            </form>

            {/* Map Container */}
            <div
                className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-xs"
                style={{ height }}
            >
                <div ref={mapContainerRef} className="h-full w-full z-0" />

                {/* Loading overlay during reverse geocoding */}
                {isLoadingAddress && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-xs">
                        <div className="flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-medium shadow-md border">
                            <Spinner className="size-3.5 text-primary" />
                            <span>Mendeteksi alamat titik peta...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Status / Instructions Bar */}
            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="truncate">
                    {statusMessage || '💡 Klik sembarang titik pada peta untuk mengisi lokasi secara instan.'}
                </span>
                {initialLat && initialLng && (
                    <span className="shrink-0 font-mono text-[10px] text-neutral-400">
                        [{initialLat.toFixed(5)}, {initialLng.toFixed(5)}]
                    </span>
                )}
            </div>
        </div>
    );
}

