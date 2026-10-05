import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlarmClock,
    AlertCircle,
    Calendar,
    Check,
    CheckCircle,
    CheckCircle2,
    ChevronDown,
    Copy,
    FileText,
    Info,
    MapPin,
    Printer,
    RefreshCw,
    RotateCcw,
    ScanLine,
    ShieldCheck,
    Timer,
    Bike as BikeIcon,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import type { Dealer } from '@/types';

export const DEALER_ASAL_OPTIONS = [
    'Krida Mataram',
    'SPS Mataram',
    'Daya Motor Bertais',
    'SO Brawijaya',
    'MPM',
    'SO Ampenan',
    'SO Sriwijaya',
    'NSS Mataram',
    'SO Gerung',
    'TDM Mataram',
    'Daya Selaparang',
    'FIF Mataram',
] as const;

interface RegistrationSuccessData {
    id: number;
    no_registrasi: string;
    dealer_asal?: string;
    nama_konsumen: string;
    no_hp: string;
    alamat: string;
    tipe_motor: string;
    no_plat: string;
    created_at: string;
    dealer?: {
        id: number;
        kode_dealer: string;
        nama_dealer: string;
    };
}

interface PublicMeetAndGreetProps {
    dealers?: string[] | Dealer[];
    dealerOptions?: string[];
    motorcycleTypes: string[];
    status?: string;
    registeredNo?: string;
    registrationSuccess?: RegistrationSuccessData | null;
}

export default function PublicMeetAndGreet({
    dealers,
    dealerOptions,
    motorcycleTypes,
    status,
    registeredNo,
    registrationSuccess,
}: PublicMeetAndGreetProps) {
    const activeDealerOptions =
        dealerOptions && dealerOptions.length > 0
            ? dealerOptions
            : Array.isArray(dealers) && typeof dealers[0] === 'string'
            ? (dealers as unknown as string[])
            : DEALER_ASAL_OPTIONS;

    const [stnkFileName, setStnkFileName] = useState<string | null>(null);
    const [stnkFileSize, setStnkFileSize] = useState<string | null>(null);
    const [stnkPreview, setStnkPreview] = useState<string | null>(null);
    const [refCode, setRefCode] = useState<string>(() => {
        if (registrationSuccess?.no_registrasi) {
            return registrationSuccess.no_registrasi;
        }
        if (registeredNo) {
            return registeredNo;
        }
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `#HND-MNG-${rand}`;
    });
    const [isSuccessSubmitted, setIsSuccessSubmitted] = useState<boolean>(
        Boolean(status || registeredNo || registrationSuccess)
    );
    const [isCopied, setIsCopied] = useState<boolean>(false);

    useEffect(() => {
        if (registeredNo || registrationSuccess) {
            setRefCode(registrationSuccess?.no_registrasi || registeredNo || '');
            setIsSuccessSubmitted(true);
        }
    }, [registeredNo, registrationSuccess]);

    const handleCopyNoReg = () => {
        const code = registrationSuccess?.no_registrasi || registeredNo || refCode;
        if (!code) return;
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    };

    const formatDateIndo = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    const form = useForm<{
        dealer_asal: string;
        nama_konsumen: string;
        alamat: string;
        no_hp: string;
        tipe_motor: string;
        no_plat: string;
        stnk: File | null;
    }>({
        dealer_asal: '',
        nama_konsumen: '',
        alamat: '',
        no_hp: '',
        tipe_motor: '',
        no_plat: '',
        stnk: null,
    });

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setData('stnk', file);
            setStnkFileName(file.name);
            setStnkFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');
            if (file.type.startsWith('image/')) {
                setStnkPreview(URL.createObjectURL(file));
            } else {
                setStnkPreview(null);
            }
        }
    };

    const handlePhoneChange = (val: string) => {
        // Strip non-numeric
        let clean = val.replace(/\D/g, '');
        // If user enters leading 0 or 62, normalize
        if (clean.startsWith('62')) {
            clean = clean.substring(2);
        } else if (clean.startsWith('0')) {
            clean = clean.substring(1);
        }
        form.setData('no_hp', clean);
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        // Ensure standard phone with 0 prefix for backend storage
        const phoneFormatted = form.data.no_hp.startsWith('0')
            ? form.data.no_hp
            : `0${form.data.no_hp}`;

        form.transform((data) => ({
            ...data,
            no_hp: phoneFormatted,
            no_plat: data.no_plat.toUpperCase(),
        }));

        form.post('/meetngreethonda', {
            forceFormData: true,
            preserveScroll: false,
            onSuccess: () => {
                setIsSuccessSubmitted(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    const handleReset = () => {
        form.reset();
        form.clearErrors();
        setStnkFileName(null);
        setStnkFileSize(null);
        setStnkPreview(null);
        setIsSuccessSubmitted(false);
        window.location.href = '/meetngreethonda';
    };

    return (
        <div className="bg-[#f8f9fa] text-[#111827] antialiased min-h-screen font-['Space_Grotesk',sans-serif] selection:bg-red-600 selection:text-white">
            <Head>
                <title>Registrasi Meet & Greet Honda - Paddock Mandalika GP</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Anybody:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <style>{`
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 6mm 10mm;
                        }
                        html, body {
                            background: #ffffff !important;
                            color: #111827 !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .printable-ticket {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            margin: 0 auto !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            border: 2px solid #111827 !important;
                            box-shadow: none !important;
                        }
                    }
                `}</style>
            </Head>

            <main className="w-full bg-[#f8f9fa] print:bg-white print:p-0">
                <div className="flex flex-col w-full">
                    {/* Telemetry Sub-Nav Strip */}
                    <section className="w-full bg-white border-b border-gray-200 px-4 lg:px-12 py-3 shadow-xs print:hidden no-print">
                        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-600 text-white font-['Anybody',sans-serif] italic uppercase text-xs shadow-xs">
                                    PADDOCK GATE NTB
                                </span>
                                <span className="text-gray-900 font-bold tracking-wide">
                                    MANDALIKA GP EXCLUSIVE FAN ZONE
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 border border-red-200 px-2.5 py-1">
                                    <AlarmClock className="size-3.5" />
                                    BATAS PENDAFTARAN: 05 OKT 2026 - 23:59 WITA
                                </span>
                                <span className="hidden sm:inline text-gray-300">/</span>
                                <span className="text-gray-900 font-semibold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    {isSuccessSubmitted ? 'STATUS: PENDAFTARAN RESMI BERHASIL' : 'STATUS: VERIFIKASI DOKUMEN AKTIF'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Hero Header Section with Clean White Framing */}
                    <section className="relative w-full bg-white border-b border-gray-200 px-4 lg:px-12 py-8 overflow-hidden print:hidden no-print">
                        {/* Hero Image Banner */}
                        <div className="max-w-7xl mx-auto w-full mb-8 relative z-10 overflow-hidden shadow-md bg-white border border-gray-200 rounded-sm">
                            <div className="relative w-full aspect-[16/6] md:aspect-[8/3] overflow-hidden">
                                <img
                                    alt="Astra Honda Racing Team - Mario Aji, Veda Pratama, Resky, Maulana, Badly, Bintang - Satu HATI. Melesat Lebih Cepat"
                                    className="w-full h-full object-cover object-center"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYAKHTicHmiVB2xXVLuOVCZVkK0Jd1Yz-0gtzvKIKL4gs6oyRgY4XlKg4qjkR8_gRmAISMzFaYSwV_Nia-m2LfrRtD9ou2CgKZ0I2fV95L9zf48JNosNfmE009WxcqFeqS-I3aIal4q0Bek84KzVLetrw2DAvQd8eWmuR9GuRZvivZ-fptsaNFi-t6mKMerqjRou4rvEvMaLfSXllvAdoDo5ZH3eiCvUcwWGdf7r4XbxNb0S8LdOJ81wmVhKEiHXx87A"
                                />
                            </div>
                        </div>

                        <div className="max-w-7xl mx-auto flex flex-col gap-6 relative z-10">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-800 text-[11px] font-bold uppercase tracking-wider">
                                    {isSuccessSubmitted ? 'BUKTI REGISTRASI RESMI' : 'PORTAL REGISTRASI RESMI'}
                                </span>
                                <span className="px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-red-600"></span>
                                    KONSUMEN DOMISILI NTB
                                </span>
                            </div>

                            {/* Headline & Title */}
                            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                                <div className="max-w-3xl">
                                    <p className="text-sm text-red-600 tracking-widest uppercase font-bold mb-1">
                                        ASTRA HONDA RACING TEAM • MEET &amp; GREET 2026
                                    </p>
                                    <h1 className="font-['Anybody',sans-serif] text-3xl sm:text-4xl lg:text-[50px] uppercase italic font-black text-gray-900 tracking-tight leading-none mb-3">
                                        {isSuccessSubmitted ? (
                                            <>
                                                PENDAFTARAN <span className="text-red-600">BERHASIL!</span>
                                            </>
                                        ) : (
                                            <>
                                                REGISTRASI meet n greet&nbsp;
                                                <div>
                                                    <span className="text-red-600">EKSKLUSIF&nbsp;</span>
                                                    <span className="text-red-600">RIDERS HONDA</span>
                                                </div>
                                            </>
                                        )}
                                    </h1>
                                </div>

                                {/* Telemetry Data Cockpit */}
                                <div className="flex flex-col sm:flex-row items-stretch gap-2.5 bg-gray-50 border border-gray-200 p-2.5 self-start lg:self-end shadow-xs">
                                    <div className="bg-red-600 text-white px-4 py-2.5 flex flex-col justify-center shadow-xs">
                                        <span className="text-[11px] uppercase font-bold tracking-wider opacity-90">
                                            Validasi
                                        </span>
                                        <span className="text-lg font-bold italic leading-tight">
                                            Wajib STNK Asli
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                                <div className="bg-white border border-gray-200 px-4 py-3.5 flex items-center gap-3 shadow-xs">
                                    <Calendar className="size-6 text-red-600 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] text-gray-500 uppercase font-semibold">
                                            Waktu Pelaksanaan
                                        </span>
                                        <span className="text-base text-gray-900 font-bold truncate">
                                            Rabu, 07 Okt 2026
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-200 px-4 py-3.5 flex items-center gap-3 shadow-xs">
                                    <MapPin className="size-6 text-red-600 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] text-gray-500 uppercase font-semibold">
                                            Paddock Venue
                                        </span>
                                        <span className="text-base text-gray-900 font-bold truncate">
                                            Dapur Sasak, Udayana
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-200 px-4 py-3.5 flex items-center gap-3 shadow-xs">
                                    <Timer className="size-6 text-red-600 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] text-gray-500 uppercase font-semibold">
                                            Masa Pendaftaran
                                        </span>
                                        <span className="text-base text-gray-900 font-bold truncate">
                                            2 - 5 Okt 2026
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Main Split Console Grid or Dedicated Success View */}
                    <section className="w-full px-4 lg:px-12 py-10 print:p-0 print:py-0 print:m-0">
                        {isSuccessSubmitted ? (
                            <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-200 print:max-w-none print:w-full print:gap-0 print:m-0">
                                {/* Success Notification Banner */}
                                <div className="bg-emerald-50 border-2 border-emerald-300 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-sm print:hidden no-print">
                                    <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-600 shrink-0">
                                        <CheckCircle2 className="size-8" />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="inline-flex items-center gap-1.5 text-xs font-['Anybody',sans-serif] font-black uppercase text-emerald-700 tracking-wider">
                                            <span>REGISTRASI SELESAI</span>
                                            <span>•</span>
                                            <span>MANDALIKA GP 2026</span>
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900 mt-0.5">
                                            Pendaftaran Berhasil Dikirimkan!
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                            Terima kasih telah mendaftar. Data diri, spesifikasi sepeda motor Honda, dan berkas STNK Anda telah berhasil disimpan dalam sistem registrasi resmi Astra Motor NTB.
                                        </p>
                                    </div>
                                </div>

                                {/* Official Paddock Pass Ticket Card */}
                                <div className="printable-ticket bg-white border-2 border-gray-900 shadow-xl overflow-hidden rounded-sm print:shadow-none print:rounded-none print:border-2 print:border-black print:m-0">
                                    {/* Ticket Header */}
                                    <div className="bg-neutral-900 text-white px-6 py-4 print:px-4 print:py-2.5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-red-600">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2.5 py-1 bg-red-600 text-white font-['Anybody',sans-serif] text-xs font-black italic uppercase shadow-xs">
                                                AHRT PASS
                                            </span>
                                            <div>
                                                <div className="text-[11px] print:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    BUKTI REGISTRASI RESMI
                                                </div>
                                                <div className="font-['Anybody',sans-serif] text-base print:text-sm font-extrabold italic uppercase tracking-wide">
                                                    MEET &amp; GREET HONDA • MANDALIKA GP 2026
                                                </div>
                                            </div>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 print:px-2 print:py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs print:text-[10px] font-mono font-bold tracking-wider">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse print:hidden no-print"></span>
                                            STATUS: TERDAFTAR
                                        </div>
                                    </div>

                                    {/* Event Details Bar for Print & Screen */}
                                    <div className="bg-gray-100 border-b border-gray-200 px-6 py-2 print:px-4 print:py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs print:text-[10px] text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-4 print:size-3 text-red-600 shrink-0" />
                                            <span><strong>Waktu:</strong> Rabu, 07 Oktober 2026</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="size-4 print:size-3 text-red-600 shrink-0" />
                                            <span><strong>Lokasi:</strong> Dapur Sasak, Jl. Udayana, Mataram, NTB</span>
                                        </div>
                                    </div>

                                    {/* Big Registration Number Box */}
                                    <div className="p-6 sm:p-10 print:p-3 bg-gradient-to-b from-red-50/50 via-white to-white border-b border-gray-200 flex flex-col items-center text-center gap-4 print:gap-1.5">
                                        <span className="text-xs print:text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                            NOMOR REGISTRASI RESMI ANDA
                                        </span>
                                        <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-white border-2 border-red-600 px-6 sm:px-8 py-3.5 print:py-1.5 print:px-6 shadow-sm rounded-sm">
                                            <span className="font-['Anybody',sans-serif] text-2xl sm:text-4xl lg:text-5xl print:text-3xl font-black tracking-wider text-red-600 italic select-all">
                                                {registrationSuccess?.no_registrasi || registeredNo || refCode}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleCopyNoReg}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold uppercase tracking-wider border border-gray-300 transition-colors shadow-xs cursor-pointer print:hidden no-print"
                                                title="Salin Nomor Registrasi"
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <Check className="size-4 text-emerald-600" />
                                                        <span className="text-emerald-700">Tersalin!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="size-4" />
                                                        <span>Salin</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs print:text-[9px] text-gray-500 max-w-lg leading-relaxed print:m-0">
                                            Simpan nomor registrasi ini sebagai tanda bukti sah untuk penukaran gelang ID Pass Meet &amp; Greet di sirkuit Mandalika.
                                        </p>
                                    </div>

                                    {/* Data Konsumen & Motor Grid */}
                                    <div className="p-6 sm:p-8 print:p-3 bg-white grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-3 border-b border-gray-200">
                                        {/* Column 1: Consumer Info */}
                                        <div className="space-y-3 print:space-y-1">
                                            <h3 className="text-xs print:text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-3 bg-red-600"></span>
                                                Data Diri Konsumen
                                            </h3>
                                            <div className="space-y-2.5 print:space-y-1 bg-gray-50 p-4 print:p-2 border border-gray-200 text-sm print:text-[11px]">
                                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 print:pb-1">
                                                    <span className="text-xs print:text-[10px] text-gray-500">Nama Konsumen:</span>
                                                    <span className="font-bold text-gray-900 text-right">
                                                        {registrationSuccess?.nama_konsumen || form.data.nama_konsumen || '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 print:pb-1">
                                                    <span className="text-xs print:text-[10px] text-gray-500">No. WhatsApp / HP:</span>
                                                    <span className="font-mono font-semibold text-gray-900">
                                                        {registrationSuccess?.no_hp || form.data.no_hp || '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-start pt-0.5">
                                                    <span className="text-xs print:text-[10px] text-gray-500">Alamat:</span>
                                                    <span className="font-medium text-gray-800 text-right max-w-[220px] print:max-w-none text-xs print:text-[10px]">
                                                        {registrationSuccess?.alamat || form.data.alamat || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Column 2: Vehicle & Dealer Info */}
                                        <div className="space-y-3 print:space-y-1">
                                            <h3 className="text-xs print:text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-3 bg-red-600"></span>
                                                Data Kendaraan &amp; Dealer
                                            </h3>
                                            <div className="space-y-2.5 print:space-y-1 bg-gray-50 p-4 print:p-2 border border-gray-200 text-sm print:text-[11px]">
                                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 print:pb-1">
                                                    <span className="text-xs print:text-[10px] text-gray-500">Dealer Asal:</span>
                                                    <span className="font-bold text-gray-900 text-right">
                                                        {registrationSuccess?.dealer_asal ||
                                                            registrationSuccess?.dealer?.nama_dealer ||
                                                            form.data.dealer_asal ||
                                                            form.data.dealer_id ||
                                                            '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 print:pb-1">
                                                    <span className="text-xs print:text-[10px] text-gray-500">Tipe Motor Honda:</span>
                                                    <span className="font-bold text-red-600">
                                                        {registrationSuccess?.tipe_motor || form.data.tipe_motor || '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 print:pb-1">
                                                    <span className="text-xs print:text-[10px] text-gray-500">Nomor Plat Polisi:</span>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 print:px-1.5 print:py-0 bg-neutral-900 text-white font-mono text-xs print:text-[10px] font-bold shadow-xs">
                                                        {registrationSuccess?.no_plat || form.data.no_plat || '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-0.5">
                                                    <span className="text-xs print:text-[10px] text-gray-500">Waktu Registrasi:</span>
                                                    <span className="text-xs print:text-[10px] font-mono font-medium text-gray-600">
                                                        {formatDateIndo(registrationSuccess?.created_at || new Date().toISOString())}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security & Verification Steps Notice */}
                                    <div className="p-6 print:p-2.5 bg-amber-50/70 border-b border-amber-200/70 flex flex-col sm:flex-row print:flex-row items-start gap-4 print:gap-2.5">
                                        <ShieldCheck className="size-6 print:size-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="text-xs print:text-[9.5px] text-amber-900 space-y-1 print:space-y-0.5">
                                            <p className="font-bold uppercase tracking-wide text-amber-800">
                                                Langkah Verifikasi Selanjutnya:
                                            </p>
                                            <ul className="list-disc list-inside space-y-0.5 text-amber-950/90 leading-relaxed">
                                                <li>Tim verifikator Astra Motor NTB akan memeriksa keaslian dan kesesuaian berkas STNK dalam 1x24 jam.</li>
                                                <li>Pengumuman jadwal temu sapa dan penukaran pass fisik akan diinformasikan melalui WhatsApp ke nomor terdaftar.</li>
                                                <li>Wajib menunjukkan KTP asli dan STNK asli saat penukaran ID Pass Meet &amp; Greet di sirkuit Mandalika.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Print Only Footer Note */}
                                    <div className="hidden print:flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-[9px] text-gray-500">
                                        <span>Dokumen Registrasi Resmi • Astra Motor NTB • Meet &amp; Greet Honda Mandalika GP 2026</span>
                                        <span>Harap simpan dan bawa cetakan ini bersama KTP &amp; STNK Asli</span>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="bg-gray-50 px-6 py-5 flex flex-wrap items-center justify-between gap-4 print:hidden no-print">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => window.print()}
                                                className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                                            >
                                                <Printer className="size-4" />
                                                Cetak Bukti Registrasi
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <a
                                                href="/meetngreethonda"
                                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                                            >
                                                <RotateCcw className="size-4" />
                                                Input Pendaftaran Baru
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* LEFT COLUMN: High Velocity Registration Form (62% Desktop) */}
                                <div className="lg:col-span-7 flex flex-col gap-6">
                                    {/* Form Step Progress Tracker */}
                                    <div className="bg-white border border-gray-200 p-4 flex flex-col gap-3 shadow-xs">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 bg-red-600"></span>
                                                <span className="text-sm font-bold uppercase text-gray-900 tracking-wider">
                                                    Formulir MEET n GREET
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-red-600 font-mono font-bold tracking-widest">
                                                LANGKAH 1 DARI 2
                                            </span>
                                        </div>
                                        {/* Racing Bar Step Indicator */}
                                        <div className="w-full h-2 bg-gray-100 overflow-hidden flex">
                                            <div className="w-1/2 h-full bg-red-600"></div>
                                            <div className="w-1/2 h-full bg-gray-200"></div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span className="text-gray-900 font-bold">1. Data Diri &amp; Domisili NTB</span>
                                            <span className="text-gray-500">2. Spesifikasi &amp; Verifikasi STNK</span>
                                        </div>
                                    </div>

                                    {/* Form Shell */}
                                    <form
                                        onSubmit={handleSubmit}
                                        className="bg-white border border-gray-200 p-6 sm:p-8 flex flex-col gap-6 shadow-xs"
                                    >
                                        {/* Section 1 Header */}
                                        <div className="flex items-center justify-between pb-3 bg-gray-50 border border-gray-200 px-4 py-2.5">
                                            <span className="text-base font-bold uppercase italic text-gray-900">
                                                1. Data Konsumen &amp; Domisili
                                            </span>
                                            <span className="text-[11px] text-red-600 uppercase font-bold bg-red-50 border border-red-200 px-2 py-0.5">
                                                Area NTB Only
                                            </span>
                                        </div>

                                        {/* Dealer Selector */}
                                        <div className="flex flex-col gap-1.5">
                                            <label
                                                className="text-xs uppercase tracking-wider text-gray-900 font-bold flex items-center justify-between"
                                                htmlFor="dealerName"
                                            >
                                                <span>
                                                    Nama Dealer Asal Pembelian / Servis <span className="text-red-600">*</span>
                                                </span>
                                                <span className="text-[11px] text-gray-500 font-normal">
                                                    Pilih Dealer Asal
                                                </span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="dealerName"
                                                    value={form.data.dealer_asal}
                                                    onChange={(e) => {
                                                        form.setData('dealer_asal', e.target.value);
                                                    }}
                                                    required
                                                    disabled={form.processing}
                                                    className="w-full bg-[#f9fafb] text-gray-900 text-sm px-4 py-3 border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white cursor-pointer transition-colors"
                                                >
                                                    <option disabled value="">
                                                        -- Pilih Dealer Asal --
                                                    </option>
                                                    {activeDealerOptions.map((name) => (
                                                        <option key={name} value={name}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="size-4 absolute right-3 top-3.5 pointer-events-none text-gray-500" />
                                            </div>
                                            <InputError message={form.errors.dealer_asal || form.errors.dealer_id} />
                                            <p className="text-[11px] text-gray-500">
                                                Pilih cabang atau jaringan dealer resmi Honda asal unit motor Anda di area NTB.
                                            </p>
                                        </div>

                                        {/* Full Name according to ID */}
                                        <div className="flex flex-col gap-1.5">
                                            <label
                                                className="text-xs uppercase tracking-wider text-gray-900 font-bold flex items-center justify-between"
                                                htmlFor="fullName"
                                            >
                                                <span>
                                                    Nama Konsumen Sesuai ID (e-KTP) <span className="text-red-600">*</span>
                                                </span>
                                                <span className="text-[11px] text-gray-500 font-normal">
                                                    Identitas Resmi
                                                </span>
                                            </label>
                                            <input
                                                id="fullName"
                                                type="text"
                                                placeholder="Contoh: Budi Pratama"
                                                required
                                                value={form.data.nama_konsumen}
                                                onChange={(e) => form.setData('nama_konsumen', e.target.value)}
                                                disabled={form.processing}
                                                className="w-full bg-[#f9fafb] text-gray-900 text-sm px-4 py-3 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-colors"
                                            />
                                            <InputError message={form.errors.nama_konsumen} />
                                            <p className="text-[11px] text-gray-500">
                                                Nama harus sama persis dengan e-KTP untuk pencocokan gelang akses paddock.
                                            </p>
                                        </div>

                                        {/* Address */}
                                        <div className="flex flex-col gap-1.5">
                                            <label
                                                className="text-xs uppercase tracking-wider text-gray-900 font-bold"
                                                htmlFor="address"
                                            >
                                                Alamat Lengkap Domisili NTB <span className="text-red-600">*</span>
                                            </label>
                                            <textarea
                                                id="address"
                                                rows={3}
                                                placeholder="Contoh: Jl. Majapahit No. 88, Kekalik Jaya, Kec. Sekarbela, Kota Mataram, Nusa Tenggara Barat"
                                                required
                                                value={form.data.alamat}
                                                onChange={(e) => form.setData('alamat', e.target.value)}
                                                disabled={form.processing}
                                                className="w-full bg-[#f9fafb] text-gray-900 text-sm px-4 py-3 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-colors"
                                            />
                                            <InputError message={form.errors.alamat} />
                                            <p className="text-[11px] text-gray-500">
                                                Terbuka untuk warga berdomisili di Pulau Lombok, Sumbawa, Bima, dan sekitarnya.
                                            </p>
                                        </div>

                                        {/* Phone / WhatsApp */}
                                        <div className="flex flex-col gap-1.5">
                                            <label
                                                className="text-xs uppercase tracking-wider text-gray-900 font-bold flex items-center justify-between"
                                                htmlFor="phoneNumber"
                                            >
                                                <span>
                                                    Nomor Handphone / WhatsApp <span className="text-red-600">*</span>
                                                </span>
                                                <span className="text-[11px] text-red-600 font-bold">
                                                    Notifikasi Paddock Pass
                                                </span>
                                            </label>
                                            <div className="flex items-stretch">
                                                <div className="bg-gray-100 border border-r-0 border-gray-300 text-gray-700 px-4 py-3 text-base font-bold flex items-center select-none">
                                                    +62
                                                </div>
                                                <input
                                                    id="phoneNumber"
                                                    type="tel"
                                                    placeholder="81234567890"
                                                    required
                                                    value={form.data.no_hp}
                                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                                    disabled={form.processing}
                                                    className="w-full bg-[#f9fafb] text-gray-900 text-sm px-4 py-3 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-colors"
                                                />
                                            </div>
                                            <InputError message={form.errors.no_hp} />
                                            <p className="text-[11px] text-gray-500">
                                                Undangan barcode resmi dan briefing paddock akan dikirimkan langsung ke nomor ini.
                                            </p>
                                        </div>

                                        {/* Section 2 Header */}
                                        <div className="flex items-center justify-between pb-3 bg-gray-50 border border-gray-200 px-4 py-2.5 mt-2">
                                            <span className="text-base font-bold uppercase italic text-gray-900">
                                                2. Spesifikasi Unit Honda
                                            </span>
                                            <span className="text-[11px] text-red-600 font-bold uppercase bg-red-50 border border-red-200 px-2 py-0.5">
                                                Honda Series Only
                                            </span>
                                        </div>

                                        {/* Two Column: Motorcycle Type & Plate Number */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Motorcycle Type Selection */}
                                            <div className="flex flex-col gap-1.5">
                                                <label
                                                    className="text-xs uppercase tracking-wider text-gray-900 font-bold"
                                                    htmlFor="motorType"
                                                >
                                                    Tipe Motor Honda <span className="text-red-600">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        id="motorType"
                                                        value={form.data.tipe_motor}
                                                        onChange={(e) => form.setData('tipe_motor', e.target.value)}
                                                        required
                                                        disabled={form.processing}
                                                        className="w-full bg-[#f9fafb] text-gray-900 text-sm px-4 py-3 border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white cursor-pointer transition-colors"
                                                    >
                                                        <option disabled value="">
                                                            -- Pilih Varian Honda --
                                                        </option>
                                                        {motorcycleTypes.map((type) => (
                                                            <option key={type} value={type}>
                                                                {type}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="size-4 absolute right-3 top-3.5 pointer-events-none text-gray-500" />
                                                </div>
                                                <InputError message={form.errors.tipe_motor} />
                                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                                                    <CheckCircle className="size-3 text-red-600" />
                                                    Khusus pemilik sepeda motor Honda
                                                </span>
                                            </div>

                                            {/* License Plate */}
                                            <div className="flex flex-col gap-1.5">
                                                <label
                                                    className="text-xs uppercase tracking-wider text-gray-900 font-bold"
                                                    htmlFor="plateNumber"
                                                >
                                                    Nomor Plat Polisi <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    id="plateNumber"
                                                    type="text"
                                                    placeholder="DR 1234 XX"
                                                    required
                                                    value={form.data.no_plat}
                                                    onChange={(e) => form.setData('no_plat', e.target.value.toUpperCase())}
                                                    disabled={form.processing}
                                                    className="w-full bg-[#f9fafb] text-gray-900 text-base uppercase font-bold tracking-widest px-4 py-3 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition-colors font-mono"
                                                />
                                                <InputError message={form.errors.no_plat} />
                                                <p className="text-[11px] text-gray-500">
                                                    Contoh: DR (Lombok) atau EA (Sumbawa).
                                                </p>
                                            </div>
                                        </div>

                                        {/* STNK Upload Box */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs uppercase tracking-wider text-gray-900 font-bold flex items-center justify-between">
                                                <span>
                                                    Upload Foto STNK Asli Honda <span className="text-red-600">*</span>
                                                </span>
                                                <span className="text-[11px] text-red-600 uppercase font-bold">
                                                    Maks. 5 MB (JPG/PNG/PDF)
                                                </span>
                                            </label>

                                            <div className="relative group bg-gray-50 border-2 border-dashed border-gray-300 rounded-sm p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-red-50/40 hover:border-red-400">
                                                <input
                                                    id="stnkFile"
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                                    onChange={handleFileSelect}
                                                    required={!form.data.stnk}
                                                    disabled={form.processing}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                />

                                                {!stnkFileName ? (
                                                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                        <div className="size-12 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                                            <ScanLine className="size-7" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-bold text-gray-900">
                                                                Klik atau Seret Foto STNK ke Sini
                                                            </span>
                                                            <span className="text-[11px] text-gray-500">
                                                                Pastikan Nomor Rangka, Nomor Mesin, dan Plat terlihat jernih
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="px-2.5 py-0.5 bg-white border border-gray-200 text-gray-600 text-[11px] uppercase font-mono shadow-xs">
                                                                Format: JPG, PNG, WEBP, PDF
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                        <CheckCircle2 className="size-10 text-emerald-600" />
                                                        <span className="text-base text-gray-900 font-bold">
                                                            {stnkFileName} {stnkFileSize ? `(${stnkFileSize})` : ''}
                                                        </span>
                                                        <span className="text-[11px] text-emerald-600 font-bold">
                                                            File STNK berhasil dipilih • Siap diverifikasi panitia
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {stnkPreview && (
                                                <div className="mt-2 flex justify-center">
                                                    <img
                                                        src={stnkPreview}
                                                        alt="Preview STNK"
                                                        className="max-h-48 border border-gray-200 rounded-sm shadow-xs object-contain"
                                                    />
                                                </div>
                                            )}

                                            <InputError message={form.errors.stnk} />

                                            <div className="bg-gray-50 border border-gray-200 p-3 flex items-start gap-2.5">
                                                <Info className="size-4 text-red-600 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-gray-600">
                                                    STNK wajib atas nama sendiri atau keluarga serumah (dapat dibuktikan dengan KK saat verifikasi ulang di venue Dapur Sasak, Udayana).
                                                </p>
                                            </div>
                                        </div>

                                        {/* Submit CTA Button */}
                                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                                            <button
                                                type="submit"
                                                id="submitBtn"
                                                disabled={form.processing}
                                                className="w-full sm:w-auto flex-1 bg-red-600 hover:bg-red-700 text-white px-8 py-4 font-['Anybody',sans-serif] text-xl uppercase italic font-black tracking-wider flex items-center justify-center gap-3 transition-all hover:shadow-lg active:translate-y-0 shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {form.processing ? (
                                                    <>
                                                        <Spinner className="size-5 text-white" />
                                                        <span>MEMPROSES DATA STNK...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>KIRIM REGISTRASI SEKARANG</span>
                                                        <span className="text-2xl font-bold">🏁</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                            {/* RIGHT COLUMN: Sticky Event & Rider Information Display (38% Desktop) */}
                            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-14">
                                {/* Lineup Highlight: Riders Honda (Moto2, Moto3 & Moto4 Asia Cup) */}
                                <div className="bg-white border border-gray-200 p-6 shadow-xs flex flex-col gap-5">
                                    <div className="flex items-center justify-between pb-3 bg-gray-50 border border-gray-200 px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 bg-red-600"></span>
                                            <span className="text-base font-bold uppercase italic text-gray-900">
                                                Official Riders Lineup
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5">
                                            AHRT HEROES
                                        </span>
                                    </div>

                                    {/* Hero Riders Preview Image Card */}
                                    <div className="relative w-full overflow-hidden bg-gray-100 border border-gray-200">
                                        <img
                                            className="w-full h-56 object-cover object-top hover:scale-105 transition-transform duration-500"
                                            alt="Astra Honda Racing Team Riders"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoiD8yX3hnewjP99vbHehq6J1YymruZncjI737XLmbRwRmVd0ZbT8SzrZxddizzyaFF_ZMdMdV1J2_jvMmSM4OnyUnUELgrKcPibV6k16UaTbD5P-lkj15i5AuckpAzu2iGQ7LJiv3LK_z4FZ9KZeL_o5EoXZF_-0Fy9UM2wcxboCv-uCdheyQG2DWdz1rI2700k-f_SSXvICw1unI3e99LtYRMmpyFfYPfY5h4mnZ9lWAJC5ZKkNKS6dFPFgVKncMlA"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                                            <span className="bg-red-600 text-white font-['Anybody',sans-serif] text-sm italic font-black px-2.5 py-1 uppercase shadow-xs">
                                                Astra Honda Racing Team
                                            </span>
                                            <span className="bg-white/90 text-gray-900 text-[11px] px-2 py-1 font-bold backdrop-blur-xs">
                                                MANDALIKA 2026
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rider Grid List */}
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {/* Rider 1: Mario Aji */}
                                        <div className="bg-gray-50 border border-gray-200 p-3 flex flex-col">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="px-1.5 py-0.5 bg-white border border-gray-200 font-['Anybody',sans-serif] text-xl text-red-600 font-black italic">
                                                    #64
                                                </span>
                                                <span className="text-[11px] px-1.5 py-0.5 bg-red-600 text-white font-bold">
                                                    MOTO2
                                                </span>
                                            </div>
                                            <span className="text-base font-bold uppercase text-gray-900 italic leading-tight">
                                                MARIO AJI
                                            </span>
                                            <span className="text-[11px] text-gray-500">Honda Team Asia • Moto2</span>
                                        </div>

                                        {/* Rider 2: Veda Pratama */}
                                        <div className="bg-gray-50 border border-gray-200 p-3 flex flex-col">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="px-1.5 py-0.5 bg-white border border-gray-200 font-['Anybody',sans-serif] text-xl text-red-600 font-black italic">
                                                    #9
                                                </span>
                                                <span className="text-[11px] px-1.5 py-0.5 bg-red-600 text-white font-bold">
                                                    MOTO3
                                                </span>
                                            </div>
                                            <span className="text-base font-bold uppercase text-gray-900 italic leading-tight">
                                                VEDA PRATAMA
                                            </span>
                                            <span className="text-[11px] text-gray-500">Red Bull MotoGP Rookies Cup</span>
                                        </div>

                                        {/* Rider 3: Resky & Maulana */}
                                        <div className="bg-gray-50 border border-gray-200 p-3 flex flex-col">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[11px] text-red-600 font-bold">#22 • #17</span>
                                                <span className="text-[11px] px-1.5 py-0.5 bg-gray-200 text-gray-800 font-bold">
                                                    MOTO4
                                                </span>
                                            </div>
                                            <span className="text-base font-bold uppercase text-gray-900 italic leading-tight">
                                                RESKY &amp; MAULANA
                                            </span>
                                            <span className="text-[11px] text-gray-500">Asia Talent Cup Squad</span>
                                        </div>

                                        {/* Rider 4: Badly & Bintang */}
                                        <div className="bg-gray-50 border border-gray-200 p-3 flex flex-col">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[11px] text-red-600 font-bold">#13 • #3</span>
                                                <span className="text-[11px] px-1.5 py-0.5 bg-gray-200 text-gray-800 font-bold">
                                                    MOTO4
                                                </span>
                                            </div>
                                            <span className="text-base font-bold uppercase text-gray-900 italic leading-tight">
                                                BADLY &amp; BINTANG
                                            </span>
                                            <span className="text-[11px] text-gray-500">Astra Honda Racing School</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Syarat & Ketentuan Masuk Paddock Card */}
                                <div className="bg-white border border-gray-200 p-6 shadow-xs flex flex-col gap-4">
                                    <div className="flex items-center justify-between pb-3 bg-gray-50 border border-gray-200 px-4 py-2">
                                        <span className="text-base font-bold uppercase italic text-gray-900">
                                            Syarat &amp; Ketentuan Acara
                                        </span>
                                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 uppercase">
                                            Ketentuan
                                        </span>
                                    </div>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex items-start gap-3">
                                            <span className="w-2 h-2 mt-2 bg-red-600 shrink-0"></span>
                                            <span>
                                                Pria / Wanita konsumen resmi pemilik sepeda motor <strong className="text-gray-900">Honda</strong> domisili Nusa Tenggara Barat.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-2 h-2 mt-2 bg-red-600 shrink-0"></span>
                                            <span>
                                                Menyukai dan berantusiasme tinggi terhadap dunia <strong className="text-gray-900">Racing &amp; Motorsport Indonesia</strong>.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-2 h-2 mt-2 bg-red-600 shrink-0"></span>
                                            <span>
                                                Wajib dapat menunjukkan <strong className="text-gray-900">Fisik STNK Asli Honda</strong> dan e-KTP yang cocok saat registrasi ulang di venue.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-2 h-2 mt-2 bg-red-600 shrink-0"></span>
                                            <span>
                                                Follow akun resmi Instagram <strong className="text-red-600 font-bold">@hondantb.official</strong>.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-2 h-2 mt-2 bg-red-600 shrink-0"></span>
                                            <span>
                                                Memberikan komentar <strong className="text-gray-900">"Honda"</strong> serta men-tag 3 teman pada postingan Meet &amp; Greet.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-2 h-2 mt-2 bg-red-600 shrink-0"></span>
                                            <span className="text-gray-700">
                                                Tim Honda NTB akan menghubungi melalui Direct Message (DM) Instagram dan WhatsApp untuk mengirimkan e-invitation pass resmi.
                                            </span>
                                        </li>
                                    </ul>

                                    {/* Periode Pendaftaran Pill */}
                                    <div className="mt-2 p-3 bg-red-50 border border-red-200 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-gray-600 uppercase font-semibold">
                                                Periode Pendaftaran
                                            </span>
                                            <span className="text-base text-red-600 font-bold">
                                                2 - 5 Oktober 2026
                                            </span>
                                        </div>
                                        <Timer className="size-6 text-red-600" />
                                    </div>
                                </div>

                                {/* Venue Location Map Card */}
                                <div className="bg-white border border-gray-200 p-6 shadow-xs flex flex-col gap-4">
                                    <div className="flex items-center justify-between pb-3 bg-gray-50 border border-gray-200 px-4 py-2">
                                        <span className="text-base font-bold uppercase italic text-gray-900">
                                            Venue Map
                                        </span>
                                        <span className="text-[11px] text-red-600 font-mono font-bold">
                                            DAPUR SASAK
                                        </span>
                                    </div>
                                    <div
                                        className="w-full h-44 border border-gray-200 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden bg-cover bg-center"
                                        style={{
                                            backgroundImage:
                                                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBB9-44rzIlhHdzm0AHfhRdaD_OR5iL-lYYKuZVfzoxJOpPYz69DtxCk8zkIB-E-B8uiG81H1LJ1bGN8pqD8tjoMB2ycVkBlSHhpd1IdnvG4IumwjWYviJLoK5BLbEa7j22U6SxalXH4MzMwU3TVjLbMBEsZ9QeYnV5XYj2nDeAzguSUk0mmAxu-LOfusxkHiQlS-MNdnumFFZocC2NW4RdRDZmmovENjWA2w-KGKWKjcWdtEcu_Z6N')",
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px]"></div>
                                        <div className="relative z-10 flex flex-col items-center gap-1">
                                            <MapPin className="size-8 text-red-600 animate-bounce" />
                                            <span className="text-base font-bold text-gray-900 uppercase">
                                                Dapur Sasak, Udayana
                                            </span>
                                            <span className="text-[11px] text-gray-600 font-medium">
                                                Jl. Udayana, Mataram, Nusa Tenggara Barat
                                            </span>
                                            <span className="mt-2 px-3 py-1 bg-white border border-gray-300 text-gray-900 text-[11px] uppercase font-bold shadow-xs">
                                                Gate Open: 08:00 WITA
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span className="font-medium">Parkir Khusus Honda Tersedia</span>
                                        <span className="text-red-600 font-bold">Akses Fan Area</span>
                                    </div>
                                </div>

                                {/* Official Taglines & FIFASTRA Banner */}
                                <div className="bg-white border border-gray-200 p-6 shadow-xs flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-['Anybody',sans-serif] text-xl text-red-600 font-black italic">
                                            #pakeMotorkuXaja
                                        </span>
                                        <span className="text-[11px] text-gray-700 font-bold uppercase tracking-wider">
                                            FIFASTRA
                                        </span>
                                    </div>
                                    <div className="p-4 bg-red-600 text-white flex flex-col gap-1 shadow-xs">
                                        <span className="text-[11px] uppercase font-bold tracking-widest opacity-90">
                                            Satu HATI.
                                        </span>
                                        <span className="font-['Anybody',sans-serif] text-2xl uppercase italic font-black leading-none tracking-tight">
                                            MELESAT LEBIH CEPAT
                                        </span>
                                        <span className="text-[11px] uppercase tracking-wider font-bold mt-1">
                                            Dukung Pembalap Indonesia di Mandalika!
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-600 text-xs pt-2 border-t border-gray-100">
                                        <span className="font-medium">Instagram: @HondaNTB.Official</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                                            <span className="text-red-600 font-bold">LIVE ACCESS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    </section>
                </div>
            </main>
        </div>
    );
}
