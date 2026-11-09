<?php

namespace App\Services;

use App\Models\Pameran;
use App\Models\User;
use App\Models\WaServerSetting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected WaServerSetting $setting;

    public function __construct(?WaServerSetting $setting = null)
    {
        $this->setting = $setting ?? WaServerSetting::current();
    }

    /**
     * Get configured HTTP client with base URL, headers, timeouts, and auth.
     */
    protected function client(?string $deviceId = null): PendingRequest
    {
        $baseUrl = rtrim($this->setting->server_url ?: 'http://localhost:3000', '/');
        $activeDeviceId = $deviceId ?: ($this->setting->device_id ?: 'rentcars_main');

        $request = Http::baseUrl($baseUrl)
            ->withoutVerifying()
            ->timeout(12)
            ->connectTimeout(5)
            ->withHeaders([
                'Accept' => 'application/json',
                'X-Device-Id' => $activeDeviceId,
            ]);

        if (! empty($this->setting->auth_username) && ! empty($this->setting->auth_password)) {
            $request = $request->withBasicAuth($this->setting->auth_username, $this->setting->auth_password);
        }

        return $request;
    }

    /**
     * Format Indonesian / international phone number or group JID for WhatsApp API.
     */
    public static function formatPhone(string $phone): string
    {
        $trimmed = trim($phone);

        if (str_ends_with($trimmed, '@g.us') || str_ends_with($trimmed, '@s.whatsapp.net')) {
            return $trimmed;
        }

        $cleaned = preg_replace('/[^0-9]/', '', $trimmed) ?? '';

        if (str_starts_with($cleaned, '0')) {
            return '62'.substr($cleaned, 1);
        }

        if (str_starts_with($cleaned, '8')) {
            return '62'.$cleaned;
        }

        return $cleaned;
    }

    /**
     * Extract a user-friendly error message from a non-successful HTTP response.
     */
    protected function extractErrorMessage(Response $res, string $defaultMessage = 'Permintaan gagal'): string
    {
        $status = $res->status();

        if ($status === 401) {
            return 'Autentikasi WA Server gagal (HTTP 401 Unauthorized): Username atau Password Basic Auth tidak cocok. Silakan periksa pengaturan Username dan Password WA Server.';
        }

        if ($status === 403) {
            return 'Akses ditolak oleh WA Server (HTTP 403 Forbidden).';
        }

        if ($status === 404) {
            return 'Endpoint tidak ditemukan di WA Server (HTTP 404 Not Found). Pastikan URL server benar.';
        }

        $serverMsg = $res->json('message') ?? $res->json('error');
        if (! empty($serverMsg) && is_string($serverMsg)) {
            return $serverMsg;
        }

        $body = trim($res->body());
        if (! empty($body) && strlen($body) < 200 && ! str_contains($body, '<html')) {
            return "HTTP {$status}: {$body}";
        }

        return "HTTP {$status}: {$defaultMessage}";
    }

    /**
     * Check WA Server Health and Info.
     *
     * @return array{healthy: bool, info: ?array, error: ?string}
     */
    public function getServerHealth(): array
    {
        try {
            $res = $this->client()->get('/app/info');

            if ($res->successful()) {
                return [
                    'healthy' => true,
                    'info' => $res->json('results') ?? $res->json(),
                    'error' => null,
                ];
            }

            if ($res->status() === 401) {
                return [
                    'healthy' => false,
                    'info' => null,
                    'error' => 'Server online, tetapi autentikasi gagal (HTTP 401 Unauthorized): Username atau Password salah. Periksa pengaturan Basic Auth di bawah.',
                ];
            }

            // Fallback to /health
            $healthRes = $this->client()->get('/health');
            if ($healthRes->successful()) {
                return [
                    'healthy' => true,
                    'info' => ['version' => 'v9.0.0', 'status' => 'OK'],
                    'error' => null,
                ];
            }

            return [
                'healthy' => false,
                'info' => null,
                'error' => $this->extractErrorMessage($res, 'Koneksi ke WA Server gagal.'),
            ];
        } catch (\Throwable $e) {
            return [
                'healthy' => false,
                'info' => null,
                'error' => 'Gagal terhubung ke WA Server: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Get Device Connection Status.
     *
     * @return array{is_connected: bool, is_logged_in: bool, device_id: string, jid: ?string, phone: ?string, raw: ?array, error: ?string}
     */
    public function getStatus(?string $deviceId = null): array
    {
        $activeDeviceId = $deviceId ?: ($this->setting->device_id ?: 'rentcars_main');

        try {
            $res = $this->client($activeDeviceId)->get('/app/status');

            if ($res->successful()) {
                $data = $res->json('results') ?? $res->json();
                $jid = $data['jid'] ?? null;
                $phone = null;

                if ($jid && str_contains($jid, '@')) {
                    $phone = explode('@', $jid)[0];
                    if (str_contains($phone, ':')) {
                        $phone = explode(':', $phone)[0];
                    }
                }

                return [
                    'is_connected' => (bool) ($data['is_connected'] ?? false),
                    'is_logged_in' => (bool) ($data['is_logged_in'] ?? false),
                    'device_id' => $data['device_id'] ?? $activeDeviceId,
                    'jid' => $jid,
                    'phone' => $phone,
                    'raw' => $data,
                    'error' => null,
                ];
            }

            return [
                'is_connected' => false,
                'is_logged_in' => false,
                'device_id' => $activeDeviceId,
                'jid' => null,
                'phone' => null,
                'raw' => null,
                'error' => $this->extractErrorMessage($res, 'Status tidak dapat diambil.'),
            ];
        } catch (\Throwable $e) {
            return [
                'is_connected' => false,
                'is_logged_in' => false,
                'device_id' => $activeDeviceId,
                'jid' => null,
                'phone' => null,
                'raw' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get QR Code for WhatsApp Pairing.
     *
     * @return array{success: bool, qr_link: ?string, qr_duration: int, raw: ?array, error: ?string}
     */
    public function getQrLogin(?string $deviceId = null): array
    {
        $activeDeviceId = $deviceId ?: ($this->setting->device_id ?: 'rentcars_main');

        try {
            $res = $this->client($activeDeviceId)->get('/app/login');

            if ($res->successful()) {
                $results = $res->json('results') ?? $res->json();
                $qrLink = $results['qr_link'] ?? $results['qr_code'] ?? $results['qr'] ?? null;

                if ($qrLink && ! str_starts_with($qrLink, 'http') && ! str_starts_with($qrLink, 'data:image')) {
                    $baseUrl = rtrim($this->setting->server_url, '/');
                    $qrLink = $baseUrl.'/'.ltrim($qrLink, '/');
                }

                return [
                    'success' => true,
                    'qr_link' => $qrLink,
                    'qr_duration' => (int) ($results['qr_duration'] ?? 20),
                    'raw' => $results,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'qr_link' => null,
                'qr_duration' => 20,
                'raw' => null,
                'error' => $this->extractErrorMessage($res, 'Gagal membuat QR Login dari WA Server.'),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'qr_link' => null,
                'qr_duration' => 20,
                'raw' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get Pairing Code using Phone Number.
     *
     * @return array{success: bool, pairing_code: ?string, error: ?string}
     */
    public function getPairingCode(string $phone, ?string $deviceId = null): array
    {
        $activeDeviceId = $deviceId ?: ($this->setting->device_id ?: 'rentcars_main');
        $formattedPhone = self::formatPhone($phone);

        try {
            $res = $this->client($activeDeviceId)->get('/app/login-with-code', [
                'phone' => $formattedPhone,
            ]);

            if ($res->successful()) {
                $results = $res->json('results') ?? $res->json();
                $pairingCode = $results['pair_code'] ?? $results['code'] ?? null;

                return [
                    'success' => true,
                    'pairing_code' => $pairingCode,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'pairing_code' => null,
                'error' => $this->extractErrorMessage($res, 'Gagal meminta pairing code dari WA Server.'),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'pairing_code' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Reconnect device to WhatsApp.
     *
     * @return array{success: bool, message: string}
     */
    public function reconnect(?string $deviceId = null): array
    {
        $activeDeviceId = $deviceId ?: ($this->setting->device_id ?: 'rentcars_main');

        try {
            $res = $this->client($activeDeviceId)->post('/app/reconnect');

            return [
                'success' => $res->successful(),
                'message' => $res->json('message') ?? ($res->successful() ? 'Perangkat berhasil direconnect.' : 'Gagal reconnect perangkat.'),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Error: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Logout / disconnect device from WhatsApp.
     *
     * @return array{success: bool, message: string}
     */
    public function logout(?string $deviceId = null): array
    {
        $activeDeviceId = $deviceId ?: ($this->setting->device_id ?: 'rentcars_main');

        try {
            $res = $this->client($activeDeviceId)->post('/app/logout');

            return [
                'success' => $res->successful(),
                'message' => $res->json('message') ?? ($res->successful() ? 'Berhasil logout dari WhatsApp.' : 'Gagal logout perangkat.'),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Error: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Get list of registered devices from WA API.
     *
     * @return array<int, array>
     */
    public function listDevices(): array
    {
        try {
            $res = $this->client()->get('/devices');

            if ($res->successful()) {
                $devices = $res->json('results') ?? $res->json('data') ?? $res->json();

                return is_array($devices) ? $devices : [];
            }

            // Fallback endpoint
            $fallbackRes = $this->client()->get('/app/devices');
            if ($fallbackRes->successful()) {
                $fallbackDevices = $fallbackRes->json('results') ?? $fallbackRes->json('data') ?? $fallbackRes->json();

                return is_array($fallbackDevices) ? $fallbackDevices : [];
            }

            return [];
        } catch (\Throwable $e) {
            Log::warning('Failed to list WA devices: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Add a new device slot on WA API.
     *
     * @return array{success: bool, message: string, data: ?array}
     */
    public function addDevice(string $deviceId, ?string $webhookUrl = null, ?string $webhookSecret = null): array
    {
        try {
            $payload = [
                'device_id' => $deviceId,
            ];
            if ($webhookUrl) {
                $payload['webhook_url'] = $webhookUrl;
            }
            if ($webhookSecret) {
                $payload['webhook_secret'] = $webhookSecret;
            }

            $res = $this->client()->post('/devices', $payload);

            return [
                'success' => $res->successful(),
                'message' => $res->json('message') ?? ($res->successful() ? 'Device berhasil ditambahkan.' : 'Gagal menambah device.'),
                'data' => $res->json('results') ?? $res->json(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Error: '.$e->getMessage(),
                'data' => null,
            ];
        }
    }

    /**
     * Delete a device slot from WA API.
     *
     * @return array{success: bool, message: string}
     */
    public function deleteDevice(string $deviceId): array
    {
        try {
            $res = $this->client()->delete("/devices/{$deviceId}");

            return [
                'success' => $res->successful(),
                'message' => $res->json('message') ?? ($res->successful() ? 'Device berhasil dihapus.' : 'Gagal menghapus device.'),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Error: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Send WhatsApp text message.
     *
     * @return array{success: bool, message_id: ?string, message: string, raw: ?array}
     */
    public function sendMessage(string $phone, string $message, ?string $replyMessageId = null, ?string $deviceId = null): array
    {
        $activeDeviceId = $deviceId ?: ($this->setting->device_id ?: 'rentcars_main');
        $formattedPhone = self::formatPhone($phone);

        try {
            $payload = [
                'phone' => $formattedPhone,
                'message' => $message,
            ];

            if ($replyMessageId) {
                $payload['reply_message_id'] = $replyMessageId;
            }

            $res = $this->client($activeDeviceId)
                ->timeout(30)
                ->connectTimeout(10)
                ->post('/send/message', $payload);

            if ($res->successful()) {
                $results = $res->json('results') ?? $res->json();
                $messageId = $results['message_id'] ?? $results['id'] ?? null;

                return [
                    'success' => true,
                    'message_id' => $messageId,
                    'message' => 'Pesan WhatsApp berhasil dikirim.',
                    'raw' => $results,
                ];
            }

            return [
                'success' => false,
                'message_id' => null,
                'message' => $this->extractErrorMessage($res, 'Gagal mengirim pesan WhatsApp.'),
                'raw' => $res->json(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message_id' => null,
                'message' => 'Error: '.$e->getMessage(),
                'raw' => null,
            ];
        }
    }

    /**
     * Get real-time WhatsApp groups list for the logged-in device.
     *
     * @return array<int, array{jid: string, name: string}>
     */
    public function getMyGroups(?string $deviceId = null): array
    {
        $activeDeviceId = $deviceId ?: ($this->setting->device_id ?: 'rentcars_main');

        try {
            $res = $this->client($activeDeviceId)->get('/user/my/groups');

            if ($res->successful()) {
                $json = $res->json();
                $results = $json['results'] ?? $json['data'] ?? $json;

                if (isset($results['data']) && is_array($results['data'])) {
                    $results = $results['data'];
                }

                if (! is_array($results)) {
                    return [];
                }

                $groups = [];
                foreach ($results as $item) {
                    if (is_array($item)) {
                        $jid = $item['JID'] ?? $item['jid'] ?? $item['id'] ?? $item['group_id'] ?? null;
                        $name = $item['Name'] ?? $item['name'] ?? $item['subject'] ?? $item['Subject'] ?? $item['group_name'] ?? $jid;

                        if ($jid && is_string($jid) && str_ends_with($jid, '@g.us')) {
                            $groups[] = [
                                'jid' => (string) $jid,
                                'name' => (string) ($name ?: $jid),
                            ];
                        }
                    }
                }

                usort($groups, fn ($a, $b) => strcasecmp($a['name'], $b['name']));

                return $groups;
            }

            return [];
        } catch (\Throwable $e) {
            Log::warning('Failed to fetch WA groups: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Send channel SPV approval notification to the designated WhatsApp group.
     */
    public static function sendChannelApprovalNotification(
        Pameran $pameran,
        User $approver,
        ?string $catatanApproval = null
    ): bool {
        try {
            $setting = WaServerSetting::current();

            if (empty($setting->target_group_jid)) {
                Log::info('WA Channel approval notification skipped: target_group_jid is not configured.');

                return false;
            }

            $pameran->loadMissing(['dealer', 'jenisPameran', 'creator', 'spvApprover']);

            $kodeMd = $pameran->kode_pameran_md ?: '-';
            $kodeAhm = $pameran->kode_pameran_ahm ? " ({$pameran->kode_pameran_ahm})" : '';
            $dealerName = $pameran->dealer?->nama_dealer ?: 'Dealer';
            $dealerCode = $pameran->dealer?->kode_dealer ? " ({$pameran->dealer->kode_dealer})" : '';
            $jenisName = $pameran->jenisPameran?->jenis_pameran ?: 'Channel';
            $jenisCode = $pameran->jenisPameran?->kode_pameran ?: '';
            $radiusKm = $pameran->jenisPameran?->radius_km ? "Radius {$pameran->jenisPameran->radius_km} km" : 'Tanpa radius';

            $tglMulai = $pameran->mulai_tanggal_sewa
                ? Carbon::parse($pameran->mulai_tanggal_sewa)->translatedFormat('d M Y')
                : '-';
            $tglSelesai = $pameran->tanggal_sewa_berakhir
                ? Carbon::parse($pameran->tanggal_sewa_berakhir)->translatedFormat('d M Y')
                : '-';

            $durasiText = '';
            if ($pameran->mulai_tanggal_sewa && $pameran->tanggal_sewa_berakhir) {
                $days = Carbon::parse($pameran->mulai_tanggal_sewa)->diffInDays(Carbon::parse($pameran->tanggal_sewa_berakhir)) + 1;
                $durasiText = " ({$days} Hari)";
            }

            $wilayah = trim(($pameran->kecamatan ?: '').($pameran->kabupaten ? ', '.$pameran->kabupaten : ''));
            $alamat = $pameran->detail_alamat ?: '-';

            $koordinatText = '';
            if ($pameran->latitude != null && $pameran->longitude != null) {
                $lat = number_format((float) $pameran->latitude, 6, '.', '');
                $lng = number_format((float) $pameran->longitude, 6, '.', '');
                $koordinatText = "• *Koordinat:* {$lat}, {$lng}\n"
                    ."• *Google Maps:* https://www.google.com/maps?q={$lat},{$lng}\n";
            }

            $approverName = $approver->name ?: 'SPV';
            $approvedAt = $pameran->spv_approved_at
                ? Carbon::parse($pameran->spv_approved_at)->translatedFormat('d M Y H:i').' WITA'
                : Carbon::now()->translatedFormat('d M Y H:i').' WITA';

            $noteLine = '';
            if (! empty($catatanApproval)) {
                $noteLine = "*Catatan Persetujuan:*\n_{$catatanApproval}_\n\n";
            }

            $creatorName = $pameran->creator?->name ?: ($pameran->dealer?->nama_dealer ?: '-');

            $message = "━━━━━━━━━━━━━━━━━━━━\n"
                ."*NOTIFIKASI APPROVAL CHANNEL*\n"
                ."*Main Dealer Astra Motor NTB*\n"
                ."━━━━━━━━━━━━━━━━━━━━\n\n"
                ."*Status:* Disetujui\n"
                ."*Kode Channel MD:* {$kodeMd}{$kodeAhm}\n\n"
                ."*Informasi Dealer & Channel:*\n"
                ."• *Dealer:* {$dealerName}{$dealerCode}\n"
                ."• *Jenis Channel:* {$jenisName}".($jenisCode ? " ({$jenisCode} - {$radiusKm})" : " ({$radiusKm})")."\n\n"
                ."*Periode :*\n"
                ."• *Jadwal:* {$tglMulai} s/d {$tglSelesai}{$durasiText}\n\n"
                ."*Lokasi Channel:*\n"
                ."• *Wilayah:* {$wilayah}\n"
                ."• *Alamat:* {$alamat}\n"
                .$koordinatText."\n"
                .$noteLine
                ."*Disetujui Oleh:* {$approverName}\n"
                ."*Waktu Persetujuan:* {$approvedAt}\n"
                ."*Diajukan Oleh:* {$creatorName}\n"
                .'━━━━━━━━━━━━━━━━━━━━';

            $waService = new self($setting);
            $res = $waService->sendMessage($setting->target_group_jid, $message);

            if (! ($res['success'] ?? false)) {
                Log::warning('Failed to send WA approval notification to group: '.($res['message'] ?? 'Unknown error'));

                return false;
            }

            Log::info("WA approval notification sent successfully for Channel #{$pameran->id} to group {$setting->target_group_jid}");

            return true;
        } catch (\Throwable $e) {
            Log::error('Exception sending WA channel approval notification: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Send new channel creation notification to the designated WhatsApp group.
     */
    public static function sendChannelCreatedNotification(
        Pameran $pameran,
        User $creator
    ): bool {
        try {
            $setting = WaServerSetting::current();

            if (empty($setting->target_group_jid)) {
                Log::info('WA Channel creation notification skipped: target_group_jid is not configured.');

                return false;
            }

            $pameran->loadMissing(['dealer', 'jenisPameran', 'creator']);

            $dealerName = $pameran->dealer?->nama_dealer ?: 'Dealer';
            $dealerCode = $pameran->dealer?->kode_dealer ? " ({$pameran->dealer->kode_dealer})" : '';
            $jenisName = $pameran->jenisPameran?->jenis_pameran ?: 'Channel';
            $jenisCode = $pameran->jenisPameran?->kode_pameran ?: '';
            $radiusKm = $pameran->jenisPameran?->radius_km ? "Radius {$pameran->jenisPameran->radius_km} km" : 'Tanpa radius';

            $tglMulai = $pameran->mulai_tanggal_sewa
                ? Carbon::parse($pameran->mulai_tanggal_sewa)->translatedFormat('d M Y')
                : '-';
            $tglSelesai = $pameran->tanggal_sewa_berakhir
                ? Carbon::parse($pameran->tanggal_sewa_berakhir)->translatedFormat('d M Y')
                : '-';

            $durasiText = '';
            if ($pameran->mulai_tanggal_sewa && $pameran->tanggal_sewa_berakhir) {
                $days = Carbon::parse($pameran->mulai_tanggal_sewa)->diffInDays(Carbon::parse($pameran->tanggal_sewa_berakhir)) + 1;
                $durasiText = " ({$days} Hari)";
            }

            $wilayah = trim(($pameran->kecamatan ?: '').($pameran->kabupaten ? ', '.$pameran->kabupaten : ''));
            $alamat = $pameran->detail_alamat ?: '-';

            $koordinatText = '';
            if ($pameran->latitude != null && $pameran->longitude != null) {
                $lat = number_format((float) $pameran->latitude, 6, '.', '');
                $lng = number_format((float) $pameran->longitude, 6, '.', '');
                $koordinatText = "• *Koordinat:* {$lat}, {$lng}\n"
                    ."• *Google Maps:* https://www.google.com/maps?q={$lat},{$lng}\n";
            }

            $createdAt = $pameran->created_at
                ? Carbon::parse($pameran->created_at)->translatedFormat('d M Y H:i').' WITA'
                : Carbon::now()->translatedFormat('d M Y H:i').' WITA';

            $creatorName = $creator->name ?: ($pameran->dealer?->nama_dealer ?: '-');

            $message = "━━━━━━━━━━━━━━━━━━━━\n"
                ."*PENGAJUAN CHANNEL BARU*\n"
                ."*Main Dealer Astra Motor NTB*\n"
                ."━━━━━━━━━━━━━━━━━━━━\n\n"
                ."*Status:* Menunggu Persetujuan SPV\n\n"
                ."*Informasi Dealer & Channel:*\n"
                ."• *Dealer:* {$dealerName}{$dealerCode}\n"
                ."• *Jenis Channel:* {$jenisName}".($jenisCode ? " ({$jenisCode} - {$radiusKm})" : " ({$radiusKm})")."\n\n"
                ."*Periode :*\n"
                ."• *Jadwal:* {$tglMulai} s/d {$tglSelesai}{$durasiText}\n\n"
                ."*Lokasi Channel:*\n"
                ."• *Wilayah:* {$wilayah}\n"
                ."• *Alamat:* {$alamat}\n"
                .$koordinatText."\n"
                ."*Diajukan Oleh:* {$creatorName}\n"
                ."*Waktu Pengajuan:* {$createdAt}\n"
                .'━━━━━━━━━━━━━━━━━━━━';

            $waService = new self($setting);
            $res = $waService->sendMessage($setting->target_group_jid, $message);

            if (! ($res['success'] ?? false)) {
                Log::warning('Failed to send WA channel creation notification to group: '.($res['message'] ?? 'Unknown error'));

                return false;
            }

            Log::info("WA channel creation notification sent successfully for Channel #{$pameran->id} to group {$setting->target_group_jid}");

            return true;
        } catch (\Throwable $e) {
            Log::error('Exception sending WA channel creation notification: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Send channel rejection notification to the designated WhatsApp group.
     */
    public static function sendChannelRejectionNotification(
        Pameran $pameran,
        User $rejector,
        ?string $catatanPenolakan = null
    ): bool {
        try {
            $setting = WaServerSetting::current();

            if (empty($setting->target_group_jid)) {
                Log::info('WA Channel rejection notification skipped: target_group_jid is not configured.');

                return false;
            }

            $pameran->loadMissing(['dealer', 'jenisPameran', 'creator', 'spvApprover']);

            $dealerName = $pameran->dealer?->nama_dealer ?: 'Dealer';
            $dealerCode = $pameran->dealer?->kode_dealer ? " ({$pameran->dealer->kode_dealer})" : '';
            $jenisName = $pameran->jenisPameran?->jenis_pameran ?: 'Channel';
            $jenisCode = $pameran->jenisPameran?->kode_pameran ?: '';
            $radiusKm = $pameran->jenisPameran?->radius_km ? "Radius {$pameran->jenisPameran->radius_km} km" : 'Tanpa radius';

            $tglMulai = $pameran->mulai_tanggal_sewa
                ? Carbon::parse($pameran->mulai_tanggal_sewa)->translatedFormat('d M Y')
                : '-';
            $tglSelesai = $pameran->tanggal_sewa_berakhir
                ? Carbon::parse($pameran->tanggal_sewa_berakhir)->translatedFormat('d M Y')
                : '-';

            $durasiText = '';
            if ($pameran->mulai_tanggal_sewa && $pameran->tanggal_sewa_berakhir) {
                $days = Carbon::parse($pameran->mulai_tanggal_sewa)->diffInDays(Carbon::parse($pameran->tanggal_sewa_berakhir)) + 1;
                $durasiText = " ({$days} Hari)";
            }

            $wilayah = trim(($pameran->kecamatan ?: '').($pameran->kabupaten ? ', '.$pameran->kabupaten : ''));
            $alamat = $pameran->detail_alamat ?: '-';

            $koordinatText = '';
            if ($pameran->latitude != null && $pameran->longitude != null) {
                $lat = number_format((float) $pameran->latitude, 6, '.', '');
                $lng = number_format((float) $pameran->longitude, 6, '.', '');
                $koordinatText = "• *Koordinat:* {$lat}, {$lng}\n"
                    ."• *Google Maps:* https://www.google.com/maps?q={$lat},{$lng}\n";
            }

            $rejectorName = $rejector->name ?: 'Supervisor';
            $rejectedAt = Carbon::now()->translatedFormat('d M Y H:i').' WITA';

            $noteLine = '';
            if (! empty($catatanPenolakan)) {
                $noteLine = "*Alasan Penolakan:*\n_{$catatanPenolakan}_\n\n";
            }

            $creatorName = $pameran->creator?->name ?: ($pameran->dealer?->nama_dealer ?: '-');

            $message = "━━━━━━━━━━━━━━━━━━━━\n"
                ."*NOTIFIKASI PENOLAKAN CHANNEL*\n"
                ."*Main Dealer Astra Motor NTB*\n"
                ."━━━━━━━━━━━━━━━━━━━━\n\n"
                ."*Status:* Ditolak\n\n"
                ."*Informasi Dealer & Channel:*\n"
                ."• *Dealer:* {$dealerName}{$dealerCode}\n"
                ."• *Jenis Channel:* {$jenisName}".($jenisCode ? " ({$jenisCode} - {$radiusKm})" : " ({$radiusKm})")."\n\n"
                ."*Periode :*\n"
                ."• *Jadwal:* {$tglMulai} s/d {$tglSelesai}{$durasiText}\n\n"
                ."*Lokasi Channel:*\n"
                ."• *Wilayah:* {$wilayah}\n"
                ."• *Alamat:* {$alamat}\n"
                .$koordinatText."\n"
                .$noteLine
                ."*Ditolak Oleh:* {$rejectorName}\n"
                ."*Waktu Penolakan:* {$rejectedAt}\n"
                ."*Diajukan Oleh:* {$creatorName}\n"
                .'━━━━━━━━━━━━━━━━━━━━';

            $waService = new self($setting);
            $res = $waService->sendMessage($setting->target_group_jid, $message);

            if (! ($res['success'] ?? false)) {
                Log::warning('Failed to send WA rejection notification to group: '.($res['message'] ?? 'Unknown error'));

                return false;
            }

            Log::info("WA rejection notification sent successfully for Channel #{$pameran->id} to group {$setting->target_group_jid}");

            return true;
        } catch (\Throwable $e) {
            Log::error('Exception sending WA channel rejection notification: '.$e->getMessage());

            return false;
        }
    }
}
