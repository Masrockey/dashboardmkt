import { Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Calendar,
    Check,
    Copy,
    Download,
    Edit,
    ExternalLink,
    Eye,
    FilePlus2,
    FileText,
    Globe,
    Lock,
    Plus,
    QrCode,
    Search,
    Share2,
    Trash2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import formsRoute from '@/routes/forms';
import type { BreadcrumbItem } from '@/types';

interface FormItem {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    template_key: string;
    theme?: {
        color: string;
        accent: string;
        theme_name: string;
    };
    fields?: unknown[];
    visibility: 'public' | 'private';
    status: 'draft' | 'published' | 'closed';
    responses_count: number;
    share_url: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface FormIndexProps {
    forms: {
        data: FormItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    filters: {
        search: string;
        status: string;
        visibility: string;
    };
    stats: {
        total_forms: number;
        published_forms: number;
        public_forms: number;
        total_responses: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Form Builder',
        href: formsRoute.index(),
    },
    {
        title: 'Daftar Form',
        href: formsRoute.index(),
    },
];

export default function FormIndex({
    forms,
    filters,
    stats,
}: FormIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [visibility, setVisibility] = useState(filters.visibility || 'all');

    // Copy notification state
    const [copiedFormId, setCopiedFormId] = useState<number | null>(null);

    // Delete dialog state
    const [deletingForm, setDeletingForm] = useState<FormItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Share dialog state
    const [sharingForm, setSharingForm] = useState<FormItem | null>(null);
    const [shareQrDataUrl, setShareQrDataUrl] = useState<string>('');

    // Generate QR Code when sharingForm changes
    useEffect(() => {
        if (!sharingForm?.share_url) {
            setShareQrDataUrl('');
            return;
        }
        QRCode.toDataURL(sharingForm.share_url, {
            width: 480,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        })
            .then(setShareQrDataUrl)
            .catch(console.error);
    }, [sharingForm]);

    // Download QR Code for sharingForm
    const handleDownloadShareQr = () => {
        if (!shareQrDataUrl || !sharingForm) return;
        const link = document.createElement('a');
        link.href = shareQrDataUrl;
        const cleanSlug = sharingForm.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
        link.download = `qr-code-${cleanSlug || 'form'}.png`;
        link.click();
    };

    const handleFilterChange = (newSearch: string, newStatus: string, newVisibility: string) => {
        router.get(
            formsRoute.index(),
            {
                search: newSearch,
                status: newStatus,
                visibility: newVisibility,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange(search, status, visibility);
    };

    const handleCopy = (form: FormItem) => {
        navigator.clipboard.writeText(form.share_url);
        setCopiedFormId(form.id);
        setTimeout(() => setCopiedFormId(null), 2500);
    };

    const handleDelete = () => {
        if (!deletingForm) return;
        setIsDeleting(true);
        router.delete(formsRoute.destroy(deletingForm.id), {
            onFinish: () => {
                setIsDeleting(false);
                setDeletingForm(null);
            },
        });
    };

    return (
        <>
            <Head title="Daftar Formulir - Form Builder" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                {/* Header & Stats Banner */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <FileText className="size-6 text-red-600" />
                            Form Builder
                        </h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            Buat formulir kustom seperti Google Form, publikasikan secara publik atau privat, dan bagikan tautan kepada responden.
                        </p>
                    </div>

                    <Button
                        asChild
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-1.5 self-start md:self-auto shadow-sm"
                    >
                        <Link href={formsRoute.create()}>
                            <Plus className="size-4" />
                            Buat Form Baru
                        </Link>
                    </Button>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <Card className="p-3.5 border border-neutral-200 dark:border-neutral-800">
                        <div className="text-neutral-500 text-[11px]">Total Formulir</div>
                        <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                            {stats.total_forms}
                        </div>
                    </Card>

                    <Card className="p-3.5 border border-neutral-200 dark:border-neutral-800">
                        <div className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                            Form Dipublikasikan
                        </div>
                        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {stats.published_forms}
                        </div>
                    </Card>

                    <Card className="p-3.5 border border-neutral-200 dark:border-neutral-800">
                        <div className="text-blue-600 dark:text-blue-400 text-[11px] font-medium">
                            Akses Publik Terbuka
                        </div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {stats.public_forms}
                        </div>
                    </Card>

                    <Card className="p-3.5 border border-neutral-200 dark:border-neutral-800 bg-red-50/40 dark:bg-red-950/20">
                        <div className="text-red-700 dark:text-red-300 text-[11px] font-medium">
                            Total Jawaban / Tanggapan
                        </div>
                        <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                            {stats.total_responses.toLocaleString('id-ID')}
                        </div>
                    </Card>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                        <Search className="size-4 text-neutral-400 absolute left-3 top-2.5" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan judul atau deskripsi formulir..."
                            className="pl-9 h-9 text-xs"
                        />
                    </form>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select
                            value={status}
                            onValueChange={(val) => {
                                setStatus(val);
                                handleFilterChange(search, val, visibility);
                            }}
                        >
                            <SelectTrigger className="h-9 w-[130px] text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="closed">Ditutup</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={visibility}
                            onValueChange={(val) => {
                                setVisibility(val);
                                handleFilterChange(search, status, val);
                            }}
                        >
                            <SelectTrigger className="h-9 w-[130px] text-xs">
                                <SelectValue placeholder="Visibilitas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Akses</SelectItem>
                                <SelectItem value="public">Publik</SelectItem>
                                <SelectItem value="private">Privat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Forms Grid */}
                {forms.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {forms.data.map((form) => {
                            const isCopied = copiedFormId === form.id;
                            const isPublic = form.visibility === 'public';
                            const isPublished = form.status === 'published';
                            const themeColor = form.theme?.color || '#dc2626';

                            return (
                                <Card
                                    key={form.id}
                                    className="overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow bg-white dark:bg-neutral-950"
                                >
                                    <div>
                                        {/* Colored Header Stripe */}
                                        <div
                                            className="h-2.5 w-full transition-all"
                                            style={{ backgroundColor: themeColor }}
                                        />

                                        <div className="p-4 space-y-3">
                                            {/* Badges & Meta */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Badge
                                                        variant={isPublished ? 'default' : 'secondary'}
                                                        className={
                                                            isPublished
                                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-4.5 px-1.5'
                                                                : 'text-[10px] h-4.5 px-1.5'
                                                        }
                                                    >
                                                        {isPublished ? 'Published' : form.status === 'draft' ? 'Draft' : 'Closed'}
                                                    </Badge>

                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            isPublic
                                                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50 text-[10px] h-4.5 px-1.5 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : 'border-blue-300 text-blue-700 bg-blue-50 text-[10px] h-4.5 px-1.5 dark:bg-blue-950/40 dark:text-blue-300'
                                                        }
                                                    >
                                                        {isPublic ? (
                                                            <Globe className="size-2.5 mr-1 inline" />
                                                        ) : (
                                                            <Lock className="size-2.5 mr-1 inline" />
                                                        )}
                                                        {isPublic ? 'Publik' : 'Privat'}
                                                    </Badge>
                                                </div>

                                                <Link
                                                    href={formsRoute.responses(form.id)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline"
                                                    title="Lihat daftar tanggapan responden"
                                                >
                                                    <BarChart3 className="size-3.5" />
                                                    <span>{form.responses_count} Tanggapan</span>
                                                </Link>
                                            </div>

                                            {/* Title & Description */}
                                            <div>
                                                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                                                    {form.title}
                                                </h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                                                    {form.description || 'Tidak ada deskripsi.'}
                                                </p>
                                            </div>

                                            {/* Date info */}
                                            <div className="flex items-center gap-1 text-[11px] text-neutral-400 pt-1">
                                                <Calendar className="size-3" />
                                                <span>
                                                    Dibuat {new Date(form.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar Footer */}
                                    <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 flex items-center justify-between gap-1 text-xs">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {/* Tombol Salin Link */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopy(form)}
                                                className={`h-7 text-[11px] px-2.5 gap-1 shadow-xs ${isCopied ? 'border-emerald-500 text-emerald-600' : ''
                                                    }`}
                                                title="Salin tautan formulir untuk dibagikan"
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <Check className="size-3 text-emerald-600" />
                                                        <span>Tersalin!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="size-3" />
                                                        <span>Salin Link</span>
                                                    </>
                                                )}
                                            </Button>

                                            {/* Tombol Buka Tanggapan persis di sebelah Salin Link */}
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-[11px] px-2.5 gap-1.5 border-neutral-300 text-neutral-800 hover:text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 shadow-xs"
                                                title="Buka daftar tanggapan responden untuk formulir ini"
                                            >
                                                <Link href={formsRoute.responses(form.id)}>
                                                    <BarChart3 className="size-3 text-red-600" />
                                                    <span>Buka Tanggapan</span>
                                                </Link>
                                            </Button>

                                            {/* Tombol Bagikan Popup */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSharingForm(form)}
                                                className="h-7 size-7 p-0 text-neutral-600 hover:text-neutral-900"
                                                title="Bagikan formulir & QR Code"
                                            >
                                                <Share2 className="size-3.5" />
                                            </Button>

                                            {/* Buka Formulir Publik */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(form.share_url, '_blank')}
                                                className="h-7 size-7 p-0 text-neutral-600 hover:text-neutral-900"
                                                title="Buka form di tab baru"
                                            >
                                                <ExternalLink className="size-3.5" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {/* Edit */}
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 size-7 p-0 text-neutral-600 hover:text-neutral-900"
                                                title="Edit Formulir"
                                            >
                                                <Link href={formsRoute.edit(form.id)}>
                                                    <Edit className="size-3.5" />
                                                </Link>
                                            </Button>

                                            {/* Hapus */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeletingForm(form)}
                                                className="h-7 size-7 p-0 text-neutral-400 hover:text-red-600"
                                                title="Hapus Formulir"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <Card className="p-10 text-center flex flex-col items-center justify-center border-dashed">
                        <div className="size-14 rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-center mb-3">
                            <FilePlus2 className="size-7" />
                        </div>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                            Belum Ada Formulir yang Dibuat
                        </h3>
                        <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-4 leading-relaxed">
                            Mulai rancang formulir survei, pendaftaran acara, atau kuesioner Anda dengan berbagai pilihan template siap pakai.
                        </p>
                        <Button
                            asChild
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-1.5 shadow-sm"
                        >
                            <Link href={formsRoute.create()}>
                                <Plus className="size-4" />
                                Buat Form Sekarang
                            </Link>
                        </Button>
                    </Card>
                )}

                {/* Pagination */}
                {forms.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-4">
                        {forms.links.map((link, idx) => (
                            <Button
                                key={idx}
                                disabled={!link.url}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => link.url && router.visit(link.url)}
                                className={`h-8 text-xs ${link.active ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                                    }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Dialog Share Form */}
            <Dialog open={!!sharingForm} onOpenChange={() => setSharingForm(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Share2 className="size-4 text-red-600" />
                            Bagikan Formulir
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Salin tautan formulir &quot;{sharingForm?.title}&quot; untuk dibagikan kepada responden.
                        </DialogDescription>
                    </DialogHeader>

                    {sharingForm && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                                    Tautan Publik:
                                </label>
                                <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 p-1.5 rounded-lg border">
                                    <Input
                                        readOnly
                                        value={sharingForm.share_url}
                                        className="h-8 text-xs bg-transparent border-0 focus-visible:ring-0 font-mono"
                                    />
                                    <Button
                                        size="sm"
                                        type="button"
                                        onClick={() => handleCopy(sharingForm)}
                                        className="h-8 text-xs font-bold gap-1 shrink-0 bg-neutral-900 text-white hover:bg-neutral-800"
                                    >
                                        {copiedFormId === sharingForm.id ? (
                                            <>
                                                <Check className="size-3.5 text-emerald-400" /> Tersalin
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-3.5" /> Salin
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Box QR Code & Download QR */}
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
                                {shareQrDataUrl ? (
                                    <img
                                        src={shareQrDataUrl}
                                        alt="QR Code"
                                        className="size-20 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white p-1 shadow-xs shrink-0"
                                    />
                                ) : (
                                    <div className="size-20 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0">
                                        <QrCode className="size-6 text-neutral-400 animate-pulse" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                        <QrCode className="size-3.5 text-neutral-600 dark:text-neutral-300" />
                                        <span>QR Code Responden</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 leading-tight">
                                        Scan langsung lewat kamera HP untuk mengisi formulir.
                                    </p>
                                    <div className="pt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={!shareQrDataUrl}
                                            onClick={handleDownloadShareQr}
                                            className="h-7 text-xs font-semibold gap-1.5 bg-white dark:bg-neutral-800 shadow-xs"
                                        >
                                            <Download className="size-3.5 text-neutral-700 dark:text-neutral-300" />
                                            <span>Download QR Code (PNG)</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.open(sharingForm.share_url, '_blank')}
                                    className="h-8 text-xs gap-1.5"
                                >
                                    <ExternalLink className="size-3.5" />
                                    Buka Form
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const text = encodeURIComponent(
                                            `Halo! Silakan mengisi formulir "${sharingForm.title}" melalui tautan berikut:\n${sharingForm.share_url}`,
                                        );
                                        window.open(`https://wa.me/?text=${text}`, '_blank');
                                    }}
                                    className="h-8 text-xs gap-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                                >
                                    <Share2 className="size-3.5" />
                                    WhatsApp
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-8 text-xs gap-1.5 text-neutral-800 dark:text-neutral-200"
                                >
                                    <Link href={formsRoute.responses(sharingForm.id)}>
                                        <BarChart3 className="size-3.5 text-red-600" />
                                        Tanggapan
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSharingForm(null)}
                            className="text-xs"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog Delete Confirmation */}
            <Dialog open={!!deletingForm} onOpenChange={() => setDeletingForm(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                            <Trash2 className="size-4" />
                            Hapus Formulir?
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Apakah Anda yakin ingin menghapus formulir &quot;{deletingForm?.title}&quot;? Seluruh tanggapan responden yang sudah masuk juga akan ikut terhapus secara permanen.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => setDeletingForm(null)}
                            className="text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Formulir'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

FormIndex.layout = {
    breadcrumbs,
};
