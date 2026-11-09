import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    Check,
    CheckCircle2,
    Copy,
    Info,
    Key,
    LogOut,
    MessageSquare,
    QrCode,
    RefreshCw,
    Send,
    Server,
    ShieldCheck,
    Smartphone,
    Users,
    Wifi,
    WifiOff,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type WaSettings = {
    server_url: string;
    device_id: string;
    auth_username?: string | null;
    auth_password?: string | null;
    has_password?: boolean;
    webhook_url?: string | null;
    webhook_secret?: string | null;
    auto_reconnect?: boolean;
    target_group_jid?: string | null;
    target_group_name?: string | null;
};

type ConnectionStatus = {
    is_connected: boolean;
    is_logged_in: boolean;
    device_id: string;
    jid?: string | null;
    phone?: string | null;
    error?: string | null;
};

type ServerHealth = {
    healthy: boolean;
    info?: Record<string, unknown> | null;
    error?: string | null;
};

type GroupItem = {
    jid: string;
    name: string;
};

type Props = {
    settings: WaSettings;
    serverHealth: ServerHealth;
    connectionStatus: ConnectionStatus;
    groups?: GroupItem[];
    can?: {
        connect?: boolean;
        manage_server?: boolean;
        write?: boolean;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Channel', href: dashboard() },
    { title: 'WA Server', href: '/wa-server' },
];

export default function WaServerIndex({
    settings,
    serverHealth,
    connectionStatus: initialConnectionStatus,
    groups: initialGroups = [],
    can,
}: Props) {
    const canConnect = can?.connect ?? can?.write ?? false;
    const canManageServer = can?.manage_server ?? can?.write ?? false;
    const [status, setStatus] = useState<ConnectionStatus>(initialConnectionStatus);
    const [health, setHealth] = useState<ServerHealth>(serverHealth);
    const [groups, setGroups] = useState<GroupItem[]>(initialGroups || []);
    const [selectedGroupJid, setSelectedGroupJid] = useState<string>(
        settings.target_group_jid || (initialGroups && initialGroups.length > 0 ? initialGroups[0].jid : ''),
    );
    const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);
    const [groupsFeedback, setGroupsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [sendTargetType, setSendTargetType] = useState<'group' | 'personal'>('group');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'target' | 'qr' | 'pairing' | 'test' | 'settings'>('target');

    // QR Code state
    const [qrLink, setQrLink] = useState<string | null>(null);
    const [qrTimer, setQrTimer] = useState<number>(0);
    const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
    const [qrError, setQrError] = useState<string | null>(null);

    // Pairing Code state
    const [pairPhone, setPairPhone] = useState<string>('');
    const [pairCode, setPairCode] = useState<string | null>(null);
    const [isLoadingPairCode, setIsLoadingPairCode] = useState<boolean>(false);
    const [pairCodeError, setPairCodeError] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);

    // Test Message state
    const [testPhone, setTestPhone] = useState<string>('');
    const [testMessage, setTestMessage] = useState<string>(
        'Halo! Ini adalah pesan uji coba dari sistem Dashboard Channel PCD Astra Motor NTB.',
    );
    const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Reconnect & Logout loading states
    const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

    const [targetGroupJid, setTargetGroupJid] = useState<string>(settings.target_group_jid || '');
    const [targetGroupName, setTargetGroupName] = useState<string>(settings.target_group_name || '');
    const [isSavingTargetGroup, setIsSavingTargetGroup] = useState<boolean>(false);
    const [targetGroupSuccessMsg, setTargetGroupSuccessMsg] = useState<string | null>(null);

    // Settings Form
    const { data: configData, setData: setConfigData, post: postSettings, processing: isSavingSettings } = useForm({
        server_url: settings.server_url || 'https://waserver.geofani.biz.id',
        device_id: settings.device_id || 'rentcars_main',
        auth_username: settings.auth_username || 'admin',
        auth_password: '',
        keep_password: true,
        webhook_url: settings.webhook_url || '',
        webhook_secret: settings.webhook_secret || '',
        auto_reconnect: settings.auto_reconnect ?? true,
        target_group_jid: settings.target_group_jid || '',
        target_group_name: settings.target_group_name || '',
    });

    const getCsrfToken = (): string => {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    // Refresh status helper
    const fetchStatus = async () => {
        try {
            const res = await fetch('/wa-server/status');
            if (res.ok) {
                const data = await res.json();
                if (data.status) setStatus(data.status);
                if (data.health) setHealth(data.health);
            }
        } catch (err) {
            console.error('Failed to check status:', err);
        }
    };

    // Fetch groups
    const handleFetchGroups = async () => {
        setIsLoadingGroups(true);
        setGroupsFeedback(null);
        try {
            const activeDevice = status.device_id || configData.device_id;
            const res = await fetch('/wa-server/groups?device_id=' + encodeURIComponent(activeDevice));
            const data = await res.json();
            if (data.groups && Array.isArray(data.groups)) {
                setGroups(data.groups);
                if (data.groups.length > 0) {
                    const match = data.groups.find((g: GroupItem) => g.jid === (targetGroupJid || selectedGroupJid));
                    if (match) {
                        setSelectedGroupJid(match.jid);
                    } else if (!selectedGroupJid) {
                        setSelectedGroupJid(data.groups[0].jid);
                    }
                    setGroupsFeedback({
                        type: 'success',
                        message: `Berhasil memuat ${data.groups.length} grup dari WhatsApp.`,
                    });
                } else {
                    setGroupsFeedback({
                        type: 'error',
                        message: data.message || 'Tidak ada grup ditemukan pada akun WhatsApp yang terhubung.',
                    });
                }
            } else {
                setGroupsFeedback({
                    type: 'error',
                    message: data.message || 'Gagal memuat grup dari WhatsApp.',
                });
            }
        } catch (err) {
            console.error('Failed to load groups', err);
            setGroupsFeedback({
                type: 'error',
                message: 'Gagal menghubungi server untuk memuat grup WhatsApp.',
            });
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchStatus(),
            status.is_logged_in ? handleFetchGroups() : Promise.resolve(),
        ]);
        setIsRefreshing(false);
    };

    // Keep selectedGroupJid synchronized with groups
    useEffect(() => {
        if (groups.length > 0) {
            const hasCurrent = groups.some((g) => g.jid === selectedGroupJid);
            if (!hasCurrent) {
                const targetMatch = groups.find((g) => g.jid === targetGroupJid);
                setSelectedGroupJid(targetMatch ? targetMatch.jid : groups[0].jid);
            }
        }
    }, [groups, targetGroupJid, selectedGroupJid]);

    useEffect(() => {
        if (settings.target_group_jid) {
            setTargetGroupJid(settings.target_group_jid);
        }
        if (settings.target_group_name) {
            setTargetGroupName(settings.target_group_name);
        }
    }, [settings.target_group_jid, settings.target_group_name]);

    useEffect(() => {
        if (!canConnect && activeTab !== 'target') {
            setActiveTab('target');
        } else if (!canManageServer && activeTab === 'settings') {
            setActiveTab('target');
        }
    }, [canConnect, canManageServer, activeTab]);

    // Auto-poll status when QR is active or pairing is underway
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (qrLink || !status.is_logged_in) {
            interval = setInterval(fetchStatus, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [qrLink, status.is_logged_in]);

    // QR Countdown timer
    useEffect(() => {
        if (qrTimer <= 0) {
            if (qrLink) {
                setQrLink(null);
            }
            return;
        }
        const timer = setInterval(() => {
            setQrTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [qrTimer, qrLink]);

    // Generate QR Code
    const handleGetQr = async () => {
        setIsLoadingQr(true);
        setQrError(null);
        try {
            const res = await fetch('/wa-server/qr');
            const data = await res.json();
            if (data.success && data.qr_link) {
                setQrLink(data.qr_link);
                setQrTimer(data.qr_duration || 20);
            } else {
                setQrError(data.error || 'Gagal memuat QR Code dari WA Server.');
                setQrLink(null);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Koneksi ke WA Server gagal.';
            setQrError(message);
            setQrLink(null);
        } finally {
            setIsLoadingQr(false);
        }
    };

    // Generate Pairing Code
    const handleGetPairCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pairPhone.trim()) return;

        setIsLoadingPairCode(true);
        setPairCodeError(null);
        setPairCode(null);
        setCopiedCode(false);

        try {
            const res = await fetch('/wa-server/pair-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ phone: pairPhone }),
            });
            const data = await res.json();
            if (data.success && data.pairing_code) {
                setPairCode(data.pairing_code);
            } else {
                setPairCodeError(data.error || 'Gagal mendapatkan kode pairing.');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Koneksi gagal.';
            setPairCodeError(message);
        } finally {
            setIsLoadingPairCode(false);
        }
    };

    const handleCopyCode = () => {
        if (!pairCode) return;
        navigator.clipboard.writeText(pairCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
    };

    // Reconnect Action
    const handleReconnect = async () => {
        setIsActionLoading(true);
        try {
            await router.post('/wa-server/reconnect', {}, {
                preserveScroll: true,
                onFinish: () => {
                    setIsActionLoading(false);
                    fetchStatus();
                },
            });
        } catch {
            setIsActionLoading(false);
        }
    };

    // Logout Action
    const handleLogout = async () => {
        if (!confirm('Apakah Anda yakin ingin memutuskan (Logout) koneksi WhatsApp dari perangkat ini?')) return;
        setIsActionLoading(true);
        try {
            await router.post('/wa-server/logout', {}, {
                preserveScroll: true,
                onFinish: () => {
                    setIsActionLoading(false);
                    setQrLink(null);
                    setPairCode(null);
                    fetchStatus();
                },
            });
        } catch {
            setIsActionLoading(false);
        }
    };

    // Save Settings
    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        postSettings('/wa-server/settings', {
            preserveScroll: true,
            onSuccess: () => {
                fetchStatus();
            },
        });
    };

    // Send Test Message
    const handleSendTestMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetRecipient = sendTargetType === 'group' ? (selectedGroupJid || targetGroupJid) : testPhone.trim();
        if (!targetRecipient || !testMessage.trim()) return;

        setIsSendingTest(true);
        setTestResult(null);

        try {
            const res = await fetch('/wa-server/test-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    phone: targetRecipient,
                    message: testMessage,
                }),
            });
            const data = await res.json();
            setTestResult(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Gagal mengirim pesan uji coba.';
            setTestResult({
                success: false,
                message,
            });
        } finally {
            setIsSendingTest(false);
        }
    };

    // Save Target Group for Channel Notifications
    const handleSaveTargetGroup = (jid: string, name?: string) => {
        if (!jid) return;
        setIsSavingTargetGroup(true);
        setTargetGroupSuccessMsg(null);

        router.post(
            '/wa-server/target-group',
            {
                target_group_jid: jid,
                target_group_name: name || '',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const finalName = name || jid;
                    setTargetGroupJid(jid);
                    setTargetGroupName(finalName);
                    setConfigData('target_group_jid', jid);
                    setConfigData('target_group_name', finalName);
                    setTargetGroupSuccessMsg(`Grup "${finalName}" berhasil disimpan sebagai target notifikasi approval!`);
                    setTimeout(() => setTargetGroupSuccessMsg(null), 5000);
                },
                onError: (errors) => {
                    console.error('Failed to set target group:', errors);
                    alert('Gagal menyimpan target grup: ' + Object.values(errors).join(', '));
                },
                onFinish: () => {
                    setIsSavingTargetGroup(false);
                },
            },
        );
    };

    return (
        <>
            <Head title="WA Server & Notifikasi Grup" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <MessageSquare className="size-6 text-emerald-600 dark:text-emerald-400" />
                            Gateway WA Server & Notifikasi Grup
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Kelola koneksi WhatsApp Gateway dan grup target notifikasi otomatis untuk pengajuan channel baru, approval SPV, dan penolakan channel.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="cursor-pointer"
                        >
                            <RefreshCw className={`size-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Segarkan Status
                        </Button>
                    </div>
                </div>

                {/* Status Summary Banner */}
                <div className={`grid grid-cols-1 ${canManageServer ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                    {/* Status Koneksi WhatsApp */}
                    <Card className="border-neutral-200 dark:border-neutral-800 shadow-2xs">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Smartphone className="size-4 text-emerald-600" />
                                    Koneksi WhatsApp
                                </CardTitle>
                                {status.is_logged_in ? (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-[11px]">
                                        <Wifi className="size-3" />
                                        Terhubung
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="gap-1 text-[11px]">
                                        <WifiOff className="size-3" />
                                        Belum Login
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 space-y-1">
                            <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                {status.phone ? `+${status.phone}` : status.is_logged_in ? 'Terhubung' : 'Offline'}
                            </div>
                            <div className="text-xs text-neutral-500 flex items-center justify-between">
                                <span>Device: <span className="font-mono">{status.device_id || configData.device_id}</span></span>
                                {status.is_logged_in && canConnect && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                        disabled={isActionLoading}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[11px] h-6 px-1.5"
                                    >
                                        <LogOut className="size-3 mr-1" />
                                        Logout
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Target Grup Notifikasi Aktif */}
                    <Card className="border-neutral-200 dark:border-neutral-800 shadow-2xs bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Bell className="size-4 text-emerald-600" />
                                    Target Grup Notifikasi
                                </CardTitle>
                                {targetGroupJid ? (
                                    <Badge className="bg-emerald-600 text-white text-[10px] py-0">Aktif</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] py-0">Belum Diset</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 space-y-1">
                            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                {targetGroupName || 'Grup Notifikasi Channel'}
                            </div>
                            <div className="text-xs text-neutral-600 dark:text-neutral-400 font-mono truncate" title={targetGroupJid || 'Belum ada grup yang ditentukan'}>
                                {targetGroupJid || 'JID belum diatur'}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Server Health (Status Server) - Disembunyikan jika aksesnya tidak punya izin kelola server */}
                    {canManageServer && (
                        <Card className="border-neutral-200 dark:border-neutral-800 shadow-2xs">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Server className="size-4 text-blue-600" />
                                        Server Health
                                    </CardTitle>
                                    {health.healthy ? (
                                        <Badge className="bg-blue-600 text-white text-[10px] py-0">Online</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="text-[10px] py-0">Error / 502</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-1 space-y-1">
                                <div className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate" title={configData.server_url}>
                                    {configData.server_url}
                                </div>
                                <div className="text-[11px] text-neutral-500 truncate">
                                    {health.healthy ? 'API Server siap menerima pesan' : (health.error || 'Server tidak dapat dijangkau')}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Navigation Tabs - Disembunyikan jika akses hanya lihat */}
                {canConnect && (
                    <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
                        <Button
                            variant={activeTab === 'target' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('target')}
                            className="cursor-pointer gap-1.5 text-xs font-semibold"
                        >
                            <Bell className="size-3.5" />
                            Pilih Grup Notifikasi
                        </Button>
                        <Button
                            variant={activeTab === 'test' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('test')}
                            className="cursor-pointer gap-1.5 text-xs font-semibold"
                        >
                            <Send className="size-3.5" />
                            Kirim Pesan Uji Coba
                        </Button>
                        <Button
                            variant={activeTab === 'qr' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('qr')}
                            className="cursor-pointer gap-1.5 text-xs font-semibold"
                        >
                            <QrCode className="size-3.5" />
                            Scan QR Code
                        </Button>
                        <Button
                            variant={activeTab === 'pairing' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('pairing')}
                            className="cursor-pointer gap-1.5 text-xs font-semibold"
                        >
                            <Key className="size-3.5" />
                            Pairing Code (Nomor HP)
                        </Button>
                        {canManageServer && (
                            <Button
                                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab('settings')}
                                className="cursor-pointer gap-1.5 text-xs font-semibold"
                            >
                                <Server className="size-3.5" />
                                Pengaturan WA Server
                            </Button>
                        )}
                    </div>
                )}

                {/* Tab Content: Target Grup Notifikasi */}
                {activeTab === 'target' && (
                    <Card className="border-neutral-200 dark:border-neutral-800 shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="size-5 text-emerald-600" />
                                Konfigurasi Grup WhatsApp Notifikasi Channel
                            </CardTitle>
                            <CardDescription>
                                Tentukan grup WhatsApp tujuan pengiriman notifikasi otomatis saat channel diajukan baru, disetujui, atau ditolak.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {targetGroupSuccessMsg && (
                                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                    <span>{targetGroupSuccessMsg}</span>
                                </div>
                            )}

                            {/* Opsi 1: Pilih dari Grup WhatsApp yang Ada */}
                            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                            <span>Pilih dari Daftar Grup WhatsApp</span>
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            Ambil daftar grup langsung dari akun WhatsApp yang terhubung di server.
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleFetchGroups}
                                        disabled={isLoadingGroups}
                                        className="cursor-pointer"
                                    >
                                        <RefreshCw className={`size-3.5 mr-1.5 ${isLoadingGroups ? 'animate-spin' : ''}`} />
                                        Muat Grup dari WhatsApp
                                    </Button>
                                </div>

                                {groupsFeedback && (
                                    <div
                                        className={`rounded-lg p-3 text-xs flex items-center justify-between gap-2 ${
                                            groupsFeedback.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900'
                                                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {groupsFeedback.type === 'success' ? (
                                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            ) : (
                                                <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
                                            )}
                                            <span>{groupsFeedback.message}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setGroupsFeedback(null)}
                                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm font-bold px-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {groups.length > 0 ? (() => {
                                    const effectiveSelectedJid = groups.some((g) => g.jid === selectedGroupJid)
                                        ? selectedGroupJid
                                        : (groups[0]?.jid || '');

                                    return (
                                        <div className="space-y-3 pt-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="select-group" className="text-xs font-semibold">Pilih Grup:</Label>
                                                <select
                                                    id="select-group"
                                                    value={effectiveSelectedJid}
                                                    onChange={(e) => setSelectedGroupJid(e.target.value)}
                                                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-800 shadow-xs dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                                >
                                                    {groups.map((g) => (
                                                        <option key={g.jid} value={g.jid}>
                                                            {g.name} ({g.jid})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {canConnect ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={!effectiveSelectedJid || isSavingTargetGroup}
                                                    onClick={() => {
                                                        const selected = groups.find((g) => g.jid === effectiveSelectedJid) || groups[0];
                                                        if (selected) {
                                                            handleSaveTargetGroup(selected.jid, selected.name);
                                                        }
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                                >
                                                    {isSavingTargetGroup ? (
                                                        <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                                                    ) : (
                                                        <Check className="size-3.5 mr-1.5" />
                                                    )}
                                                    {isSavingTargetGroup ? 'Menyimpan...' : 'Jadikan Grup Target Notifikasi'}
                                                </Button>
                                            ) : (
                                                <div className="text-xs text-neutral-400 italic">
                                                    Mode hanya lihat aktif. Untuk mengubah grup target notifikasi, hubungi Administrator.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })() : (
                                    <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500 dark:border-neutral-700">
                                        {status.is_logged_in
                                            ? 'Klik "Muat Grup dari WhatsApp" untuk memuat grup tempat akun ini bergabung.'
                                            : 'Perangkat WhatsApp belum login. Silakan scan QR Code atau gunakan Pairing Code terlebih dahulu untuk memuat daftar grup.'}
                                    </div>
                                )}
                            </div>

                            {/* Opsi 2: Atur Manual JID Grup (Untuk akses connect & kelola server) */}
                            {canConnect && (
                                <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3 dark:border-neutral-800 dark:bg-neutral-900">
                                    <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                                        Atur JID Grup Notifikasi Manual
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="manual_group_jid" className="text-xs font-semibold">
                                                Target Group JID (misal: 120363432126043755@g.us):
                                            </Label>
                                            <Input
                                                id="manual_group_jid"
                                                value={targetGroupJid}
                                                onChange={(e) => setTargetGroupJid(e.target.value)}
                                                placeholder="120363432126043755@g.us"
                                                className="font-mono text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="manual_group_name" className="text-xs font-semibold">
                                                Nama Grup (Opsional untuk label):
                                            </Label>
                                            <Input
                                                id="manual_group_name"
                                                value={targetGroupName}
                                                onChange={(e) => setTargetGroupName(e.target.value)}
                                                placeholder="Grup Notifikasi Approval PCD"
                                                className="text-xs"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleSaveTargetGroup(targetGroupJid, targetGroupName)}
                                        disabled={!targetGroupJid || isSavingTargetGroup}
                                        className="cursor-pointer"
                                    >
                                        <Check className="size-3.5 mr-1.5" />
                                        Simpan Pengaturan Target Grup
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Tab Content: Kirim Pesan Uji Coba */}
                {activeTab === 'test' && (
                    <Card className="border-neutral-200 dark:border-neutral-800 shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Send className="size-5 text-blue-600" />
                                Kirim Pesan WhatsApp Uji Coba (Test Message)
                            </CardTitle>
                            <CardDescription>
                                Uji coba koneksi gateway WhatsApp dengan mengirim pesan langsung ke grup notifikasi atau nomor HP pribadi.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSendTestMessage}>
                            <CardContent className="space-y-4">
                                {testResult && (
                                    <div
                                        className={`rounded-lg p-3 text-xs flex items-center gap-2 ${testResult.success
                                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                                                : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
                                            }`}
                                    >
                                        {testResult.success ? (
                                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                        ) : (
                                            <XCircle className="size-4 shrink-0 text-red-600" />
                                        )}
                                        <span>{testResult.message}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold">Tujuan Pesan Uji Coba:</Label>
                                    <div className="flex items-center gap-4 text-xs">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="targetType"
                                                value="group"
                                                checked={sendTargetType === 'group'}
                                                onChange={() => setSendTargetType('group')}
                                            />
                                            <span>Ke Target Grup WhatsApp ({targetGroupName || targetGroupJid || 'Belum diatur'})</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="targetType"
                                                value="personal"
                                                checked={sendTargetType === 'personal'}
                                                onChange={() => setSendTargetType('personal')}
                                            />
                                            <span>Ke Nomor Pribadi (HP / WhatsApp)</span>
                                        </label>
                                    </div>
                                </div>

                                {sendTargetType === 'personal' && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="test_phone" className="text-xs font-semibold">
                                            Nomor WhatsApp Penerima (contoh: 08123456789 atau 628123456789):
                                        </Label>
                                        <Input
                                            id="test_phone"
                                            value={testPhone}
                                            onChange={(e) => setTestPhone(e.target.value)}
                                            placeholder="081234567890"
                                            className="font-mono text-xs max-w-md"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="test_message" className="text-xs font-semibold">Isi Pesan:</Label>
                                    <textarea
                                        id="test_message"
                                        rows={4}
                                        value={testMessage}
                                        onChange={(e) => setTestMessage(e.target.value)}
                                        className="w-full rounded-md border border-neutral-300 bg-white p-2.5 text-xs text-neutral-800 shadow-xs dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSendingTest}
                                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Send className={`size-3.5 mr-1.5 ${isSendingTest ? 'animate-pulse' : ''}`} />
                                    {isSendingTest ? 'Mengirim...' : 'Kirim Pesan Uji Coba'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* Tab Content: Scan QR Code */}
                {activeTab === 'qr' && (
                    <Card className="border-neutral-200 dark:border-neutral-800 shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <QrCode className="size-5 text-neutral-700 dark:text-neutral-300" />
                                Pairing WhatsApp Menggunakan QR Code
                            </CardTitle>
                            <CardDescription>
                                Buka WhatsApp di smartphone Anda &gt; Setelan &gt; Perangkat Tertaut &gt; Tautkan Perangkat, lalu scan QR Code di bawah ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {status.is_logged_in ? (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-2 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                                    <CheckCircle2 className="size-10 text-emerald-600 mx-auto" />
                                    <div className="font-bold text-emerald-800 dark:text-emerald-300 text-base">
                                        Perangkat WhatsApp Sudah Terhubung!
                                    </div>
                                    <div className="text-xs text-emerald-700 dark:text-emerald-400">
                                        Nomor: +{status.phone} &bull; Device: {status.device_id}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                                    {qrError && (
                                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                                            <AlertTriangle className="size-4 shrink-0 text-red-600" />
                                            <span>{qrError}</span>
                                        </div>
                                    )}

                                    {qrLink ? (
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="p-3 bg-white rounded-xl border-2 border-emerald-500 shadow-md">
                                                <img
                                                    src={qrLink}
                                                    alt="QR Code WhatsApp"
                                                    className="size-64 object-contain"
                                                />
                                            </div>
                                            <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                                QR Code aktif: <span className="font-bold text-neutral-900 dark:text-neutral-100">{qrTimer} detik</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-3">
                                            <div className="size-48 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center mx-auto text-neutral-400 dark:border-neutral-700">
                                                <QrCode className="size-16 stroke-1 text-neutral-300" />
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={handleGetQr}
                                                disabled={isLoadingQr}
                                                className="cursor-pointer"
                                            >
                                                <QrCode className="size-4 mr-1.5" />
                                                {isLoadingQr ? 'Meminta QR Code...' : 'Tampilkan QR Code Baru'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Tab Content: Pairing Code */}
                {activeTab === 'pairing' && (
                    <Card className="border-neutral-200 dark:border-neutral-800 shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Key className="size-5 text-neutral-700 dark:text-neutral-300" />
                                Pairing WhatsApp Menggunakan Kode 8 Digit
                            </CardTitle>
                            <CardDescription>
                                Alternatif tanpa kamera: Masukkan nomor HP WhatsApp untuk mendapatkan kode pairing 8 digit.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleGetPairCode}>
                            <CardContent className="space-y-4 max-w-md">
                                {pairCodeError && (
                                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                                        <AlertTriangle className="size-4 shrink-0 text-red-600" />
                                        <span>{pairCodeError}</span>
                                    </div>
                                )}

                                {pairCode ? (
                                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 space-y-2 dark:border-emerald-800 dark:bg-emerald-950/40">
                                        <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                                            Masukkan kode ini pada WhatsApp di smartphone Anda:
                                        </div>
                                        <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                            <span className="font-mono text-2xl font-extrabold tracking-widest text-emerald-700 dark:text-emerald-400">
                                                {pairCode}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyCode}
                                                className="cursor-pointer"
                                            >
                                                {copiedCode ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="pair_phone" className="text-xs font-semibold">
                                            Nomor WhatsApp (diawali 08 atau 628):
                                        </Label>
                                        <Input
                                            id="pair_phone"
                                            value={pairPhone}
                                            onChange={(e) => setPairPhone(e.target.value)}
                                            placeholder="081234567890"
                                            className="font-mono text-xs"
                                        />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isLoadingPairCode || !pairPhone}
                                    className="cursor-pointer"
                                >
                                    <Key className="size-3.5 mr-1.5" />
                                    {isLoadingPairCode ? 'Meminta Kode...' : 'Dapatkan Kode Pairing'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* Tab Content: Pengaturan WA Server (Hanya jika memiliki hak akses kelola server) */}
                {activeTab === 'settings' && canManageServer && (
                    <Card className="border-neutral-200 dark:border-neutral-800 shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Server className="size-5 text-neutral-700 dark:text-neutral-300" />
                                Pengaturan Koneksi WA Server & Basic Auth
                            </CardTitle>
                            <CardDescription>
                                Konfigurasi endpoint server gateway WhatsApp, device ID, dan kredensial Basic Authentication.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSaveSettings}>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="server_url" className="text-xs font-semibold">URL WA Server:</Label>
                                        <Input
                                            id="server_url"
                                            value={configData.server_url}
                                            onChange={(e) => setConfigData('server_url', e.target.value)}
                                            placeholder="https://waserver.geofani.biz.id"
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="device_id" className="text-xs font-semibold">Device ID:</Label>
                                        <Input
                                            id="device_id"
                                            value={configData.device_id}
                                            onChange={(e) => setConfigData('device_id', e.target.value)}
                                            placeholder="rentcars_main"
                                            className="font-mono text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="auth_username" className="text-xs font-semibold">Basic Auth Username:</Label>
                                        <Input
                                            id="auth_username"
                                            value={configData.auth_username}
                                            onChange={(e) => setConfigData('auth_username', e.target.value)}
                                            placeholder="admin"
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="auth_password" className="text-xs font-semibold">
                                            Basic Auth Password {settings.has_password && '(Kosongkan jika tidak diubah)'}:
                                        </Label>
                                        <Input
                                            id="auth_password"
                                            type="password"
                                            value={configData.auth_password}
                                            onChange={(e) => setConfigData('auth_password', e.target.value)}
                                            placeholder={settings.has_password ? '********' : 'Password WA Server'}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleReconnect}
                                        disabled={isActionLoading}
                                        className="cursor-pointer"
                                    >
                                        <RefreshCw className={`size-3.5 mr-1.5 ${isActionLoading ? 'animate-spin' : ''}`} />
                                        Reconnect Device
                                    </Button>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSavingSettings}
                                    className="cursor-pointer"
                                >
                                    <ShieldCheck className="size-3.5 mr-1.5" />
                                    {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Server'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}
            </div>
        </>
    );
}

WaServerIndex.layout = {
    breadcrumbs,
};

