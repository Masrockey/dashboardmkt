<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodeController extends Controller
{
    /**
     * Search for places / addresses via Nominatim.
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json([]);
        }

        $viewbox = $request->query('viewbox', '115.8,-9.2,117.5,-8.1');

        $cacheKey = 'geocode_search_'.md5(mb_strtolower($query).'_'.$viewbox);

        $results = Cache::remember($cacheKey, now()->addDay(), function () use ($query, $viewbox) {
            try {
                $response = Http::withoutVerifying()
                    ->withUserAgent('DashboardMTK/1.0 (contact@dashboardmtk.local)')
                    ->timeout(6)
                    ->get('https://nominatim.openstreetmap.org/search', [
                        'format' => 'jsonv2',
                        'q' => $query,
                        'countrycodes' => 'id',
                        'viewbox' => $viewbox,
                        'bounded' => 0,
                        'limit' => 5,
                        'addressdetails' => 1,
                    ]);

                if (! $response->successful()) {
                    return [];
                }

                $items = $response->json();
                if (! is_array($items)) {
                    return [];
                }

                $formatted = [];
                foreach ($items as $item) {
                    $lat = isset($item['lat']) ? (float) $item['lat'] : null;
                    $lon = isset($item['lon']) ? (float) $item['lon'] : null;

                    if ($lat === null || $lon === null) {
                        continue;
                    }

                    $address = $item['address'] ?? [];

                    $rawKecamatan = $address['county']
                        ?? $address['city_district']
                        ?? $address['subdistrict']
                        ?? $address['district']
                        ?? $address['suburb']
                        ?? $address['municipality']
                        ?? '';

                    $cleanKecamatan = trim(preg_replace('/^(kecamatan|kec\.)\s*/i', '', (string) $rawKecamatan));

                    $addressParts = array_filter([
                        $address['shop'] ?? $address['amenity'] ?? $address['building'] ?? $address['office'] ?? null,
                        $address['road'] ?? null,
                        $address['neighbourhood'] ?? null,
                        $address['suburb'] ?? $address['village'] ?? null,
                        $address['city'] ?? $address['town'] ?? null,
                    ]);

                    $detailAlamat = ! empty($addressParts)
                        ? implode(', ', $addressParts)
                        : ($item['display_name'] ?? '');

                    $formatted[] = [
                        'place_id' => $item['place_id'] ?? null,
                        'name' => $item['name'] ?? ($addressParts[0] ?? $cleanKecamatan),
                        'display_name' => $item['display_name'] ?? '',
                        'latitude' => $lat,
                        'longitude' => $lon,
                        'kecamatan' => $cleanKecamatan,
                        'detail_alamat' => $detailAlamat,
                    ];
                }

                return $formatted;
            } catch (\Throwable $e) {
                Log::warning('Geocode search failed: '.$e->getMessage());

                return [];
            }
        });

        return response()->json($results);
    }

    /**
     * Reverse geocode coordinates to address and kecamatan.
     */
    public function reverse(Request $request): JsonResponse
    {
        $lat = $request->query('lat');
        $lon = $request->query('lon');

        if (! is_numeric($lat) || ! is_numeric($lon)) {
            return response()->json(['error' => 'Koordinat tidak valid'], 422);
        }

        $lat = round((float) $lat, 6);
        $lon = round((float) $lon, 6);

        $cacheKey = "geocode_rev_{$lat}_{$lon}";

        $result = Cache::remember($cacheKey, now()->addDay(), function () use ($lat, $lon) {
            try {
                $response = Http::withoutVerifying()
                    ->withUserAgent('DashboardMTK/1.0 (contact@dashboardmtk.local)')
                    ->timeout(6)
                    ->get('https://nominatim.openstreetmap.org/reverse', [
                        'format' => 'jsonv2',
                        'lat' => $lat,
                        'lon' => $lon,
                        'addressdetails' => 1,
                    ]);

                if (! $response->successful()) {
                    return null;
                }

                $data = $response->json();
                if (! is_array($data)) {
                    return null;
                }

                $address = $data['address'] ?? [];

                $rawKecamatan = $address['county']
                    ?? $address['city_district']
                    ?? $address['subdistrict']
                    ?? $address['district']
                    ?? $address['suburb']
                    ?? $address['municipality']
                    ?? '';

                $cleanKecamatan = trim(preg_replace('/^(kecamatan|kec\.)\s*/i', '', (string) $rawKecamatan));

                $addressParts = array_filter([
                    $address['shop'] ?? $address['amenity'] ?? $address['building'] ?? $address['office'] ?? null,
                    $address['road'] ?? null,
                    $address['neighbourhood'] ?? null,
                    $address['suburb'] ?? $address['village'] ?? null,
                ]);

                $detailAlamat = ! empty($addressParts)
                    ? implode(', ', $addressParts)
                    : ($data['display_name'] ?? "Titik Koordinat: {$lat}, {$lon}");

                return [
                    'kecamatan' => $cleanKecamatan,
                    'detail_alamat' => $detailAlamat,
                    'latitude' => $lat,
                    'longitude' => $lon,
                    'display_name' => $data['display_name'] ?? '',
                ];
            } catch (\Throwable $e) {
                Log::warning('Geocode reverse failed: '.$e->getMessage());

                return null;
            }
        });

        if (! $result) {
            return response()->json([
                'kecamatan' => '',
                'detail_alamat' => "Titik Koordinat: {$lat}, {$lon}",
                'latitude' => $lat,
                'longitude' => $lon,
            ]);
        }

        return response()->json($result);
    }
}

