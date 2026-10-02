import L from 'leaflet';
import type * as LeafletNamespace from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let leafletPromise: Promise<typeof LeafletNamespace> | null = null;

/**
 * Loads Leaflet dynamically on the client side only to avoid SSR "window is not defined" error.
 */
export async function loadLeaflet(): Promise<typeof LeafletNamespace> {
    if (typeof window === 'undefined') {
        throw new Error(
            'Leaflet cannot be loaded in server-side rendering context.',
        );
    }

    if (!leafletPromise) {
        leafletPromise = import('leaflet').then((module) => {
            const LeafletMod = (module.default ?? module) as typeof LeafletNamespace;

            // Fix default marker icon path issue in bundler
            delete (
                LeafletMod.Icon.Default.prototype as unknown as { _getIconUrl?: unknown }
            )._getIconUrl;
            LeafletMod.Icon.Default.mergeOptions({
                iconUrl: markerIcon,
                iconRetinaUrl: markerIcon2x,
                shadowUrl: markerShadow,
            });

            return LeafletMod;
        });
    }

    return leafletPromise;
}

/**
 * Creates a marker icon with custom URL or fallback to default Leaflet icon.
 * Flexible signature supporting createMapMarkerIcon(customUrl) or createMapMarkerIcon(L, customUrl).
 */
export function createMapMarkerIcon(
    arg1?: string | null | typeof LeafletNamespace,
    arg2?: string | null,
): LeafletNamespace.Icon | LeafletNamespace.Icon.Default {
    let leafletObj: typeof LeafletNamespace = L;
    let url: string | null | undefined = null;

    if (typeof arg1 === 'string') {
        url = arg1;
    } else if (arg1 && typeof arg1 === 'object') {
        leafletObj = typeof (arg1 as any).icon === 'function' ? (arg1 as typeof LeafletNamespace) : L;
        url = typeof arg2 === 'string' ? arg2 : null;
    } else if (typeof arg2 === 'string') {
        url = arg2;
    }

    if (!url || !url.trim()) {
        return new leafletObj.Icon.Default();
    }

    return leafletObj.icon({
        iconUrl: url,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
        shadowUrl: markerShadow,
        shadowSize: [41, 41],
        shadowAnchor: [12, 41],
        className: 'custom-map-pin object-contain filter drop-shadow-md',
    });
}
