import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Download,
    ExternalLink,
    FileText,
    Globe,
    Lock,
    Search,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import formsRoute from '@/routes/forms';
import type { BreadcrumbItem } from '@/types';

interface ResponseField {
    id: string;
    type: string;
    label: string;
}

interface FormDetail {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    visibility: 'public' | 'private';
    status: 'draft' | 'published' | 'closed';
    fields: ResponseField[];
    share_url: string;
    created_at: string;
}

interface ResponseRecord {
    id: number;
    created_at: string;
    respondent_ip: string | null;
    answers: Record<string, unknown>;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface ResponsesProps {
    form: FormDetail;
    responses: {
        data: ResponseRecord[];
        current_page: number;
        last_page: number;
        total: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
}

export default function FormResponses({ form, responses }: ResponsesProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [detailResponse, setDetailResponse] = useState<ResponseRecord | null>(null);
    const [isToggling, setIsToggling] = useState(false);

    const handleToggleStatus = () => {
        setIsToggling(true);
        router.post(
            formsRoute.toggleStatus.url(form.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsToggling(false),
            },
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Form Builder',
            href: formsRoute.index(),
        },
        {
            title: form.title,
            href: formsRoute.responses(form.id),
        },
        {
            title: 'Tanggapan Responden',
            href: formsRoute.responses(form.id),
        },
    ];

    const fields = form.fields || [];

    // Filter local records by search
    const filteredData = responses.data.filter((item) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        const userMatch = item.user?.name.toLowerCase().includes(q) || item.user?.email.toLowerCase().includes(q);
        const ipMatch = item.respondent_ip?.includes(q);
        const answerMatch = Object.values(item.answers || {}).some((v) =>
            String(v).toLowerCase().includes(q),
        );
        return userMatch || ipMatch || answerMatch;
    });

    return (
        <>
            <Head title={`Tanggapan: ${form.title}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                {/* Header Action Bar */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b pb-4">
                    <div>
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-neutral-500 mb-1"
                        >
                            <Link href={formsRoute.index()}>
                                <ArrowLeft className="size-3.5 mr-1" />
                                Kembali ke Daftar Form
                            </Link>
                        </Button>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                {form.title}
                            </h1>
                            <Badge
                                variant="outline"
                                className={
                                    form.visibility === 'public'
                                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50 text-[10px]'
                                        : 'border-blue-300 text-blue-700 bg-blue-50 text-[10px]'
                                }
                            >
                                {form.visibility === 'public' ? (
                                    <Globe className="size-2.5 mr-1 inline" />
                                ) : (
                                    <Lock className="size-2.5 mr-1 inline" />
                                )}
                                {form.visibility === 'public' ? 'Publik' : 'Privat'}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Tombol Buka / Tutup Form */}
                        <Button
                            variant={form.status === 'closed' ? 'default' : 'outline'}
                            size="sm"
                            disabled={isToggling}
                            onClick={handleToggleStatus}
                            className={`h-8 text-xs font-semibold gap-1.5 shadow-xs ${
                                form.status === 'closed'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400'
                            }`}
                            title={
                                form.status === 'closed'
                                    ? 'Buka kembali formulir agar responden dapat mengisi'
                                    : 'Tutup formulir agar responden tidak bisa lagi mengisi'
                            }
                        >
                            {form.status === 'closed' ? (
                                <>
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Buka Form</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="size-3.5" />
                                    <span>Tutup Form</span>
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(form.share_url, '_blank')}
                            className="h-8 text-xs gap-1.5"
                        >
                            <ExternalLink className="size-3.5" />
                            Buka Form Publik
                        </Button>

                        <Button
                            asChild
                            size="sm"
                            className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <a href={formsRoute.export.url(form.id)} download>
                                <Download className="size-3.5" />
                                Unduh CSV / Excel
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <Card className="p-3.5 border">
                        <div className="text-neutral-500 text-[11px]">Total Tanggapan Masuk</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">
                            {responses.total.toLocaleString('id-ID')}
                        </div>
                    </Card>

                    <Card className="p-3.5 border">
                        <div className="text-neutral-500 text-[11px]">Jumlah Pertanyaan / Field</div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                            {fields.length} Pertanyaan
                        </div>
                    </Card>

                    <Card className="p-3.5 border flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="text-neutral-500 text-[11px] font-medium">Status Penerimaan</div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-neutral-400 hidden sm:inline">
                                    {form.status !== 'closed' ? 'Terima Tanggapan' : 'Tutup'}
                                </span>
                                <Switch
                                    id="status-penerimaan-switch"
                                    checked={form.status !== 'closed'}
                                    disabled={isToggling}
                                    onCheckedChange={handleToggleStatus}
                                />
                            </div>
                        </div>
                        <div className="mt-1.5">
                            {form.status !== 'closed' ? (
                                <div className="text-base font-bold text-emerald-600 flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Menerima Tanggapan</span>
                                </div>
                            ) : (
                                <div className="text-base font-bold text-red-600 flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-red-500" />
                                    <span>Formulir Ditutup</span>
                                </div>
                            )}
                            <p className="text-[10.5px] text-neutral-400 mt-0.5 line-clamp-1">
                                {form.status !== 'closed'
                                    ? 'Responden dapat mengisi formulir.'
                                    : 'Responden tidak dapat mengisi formulir.'}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Filter & Table Responses */}
                <Card className="border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
                    <div className="p-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-50/50 dark:bg-neutral-900/40">
                        <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <FileText className="size-4 text-red-600" />
                            Tabel Data Tanggapan
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="size-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari di tabel tanggapan..."
                                className="h-8 pl-8 text-xs"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto max-w-full">
                        <Table className="text-xs">
                            <TableHeader className="bg-neutral-100/60 dark:bg-neutral-900">
                                <TableRow>
                                    <TableHead className="w-12 text-center">No</TableHead>
                                    <TableHead className="w-40">Tanggal Kirim</TableHead>
                                    <TableHead className="w-40">Identitas / User</TableHead>
                                    {fields.slice(0, 5).map((f) => (
                                        <TableHead key={f.id} className="min-w-[150px] max-w-[220px]">
                                            <span className="truncate block font-semibold" title={f.label}>
                                                {f.label}
                                            </span>
                                        </TableHead>
                                    ))}
                                    <TableHead className="w-20 text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((res, index) => {
                                        const rowNo =
                                            (responses.current_page - 1) * 25 + index + 1;
                                        return (
                                            <TableRow key={res.id} className="hover:bg-neutral-50/70">
                                                <TableCell className="text-center font-medium text-neutral-500">
                                                    {rowNo}
                                                </TableCell>
                                                <TableCell className="text-neutral-600 whitespace-nowrap">
                                                    {new Date(res.created_at).toLocaleString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    {res.user ? (
                                                        <div className="flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                                                            <UserCheck className="size-3.5 text-blue-600 shrink-0" />
                                                            <span className="truncate">{res.user.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-neutral-400 font-mono text-[11px]">
                                                            Publik ({res.respondent_ip || '-'})
                                                        </span>
                                                    )}
                                                </TableCell>
                                                {fields.slice(0, 5).map((f) => {
                                                    const rawVal = res.answers?.[f.id];
                                                    const valStr = Array.isArray(rawVal)
                                                        ? rawVal.join(', ')
                                                        : rawVal !== undefined && rawVal !== null
                                                          ? String(rawVal)
                                                          : '-';
                                                    return (
                                                        <TableCell key={f.id} className="truncate max-w-[220px]">
                                                            <span title={valStr}>{valStr}</span>
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDetailResponse(res)}
                                                        className="h-6 text-[11px] px-2 text-red-600 hover:text-red-700"
                                                    >
                                                        Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={fields.slice(0, 5).length + 4}
                                            className="text-center py-10 text-neutral-400"
                                        >
                                            Belum ada tanggapan responden yang masuk.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* Modal Detail Jawaban Responden */}
            <Dialog open={!!detailResponse} onOpenChange={() => setDetailResponse(null)}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <FileText className="size-4 text-red-600" />
                            Rincian Tanggapan Lengkap
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Dikirim pada{' '}
                            {detailResponse &&
                                new Date(detailResponse.created_at).toLocaleString('id-ID')}
                        </DialogDescription>
                    </DialogHeader>

                    {detailResponse && (
                        <div className="space-y-3 py-2 text-xs">
                            <div className="bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-lg border text-neutral-600 dark:text-neutral-300">
                                <div>
                                    Pengirim:{' '}
                                    <strong>
                                        {detailResponse.user?.name || 'Responden Publik'}
                                    </strong>{' '}
                                    {detailResponse.user && `(${detailResponse.user.email})`}
                                </div>
                                <div className="text-[11px] text-neutral-400 mt-0.5">
                                    IP Address: {detailResponse.respondent_ip || '-'}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {fields.map((f, i) => {
                                    const rawVal = detailResponse.answers?.[f.id];
                                    const valStr = Array.isArray(rawVal)
                                        ? rawVal.join(', ')
                                        : rawVal !== undefined && rawVal !== null && rawVal !== ''
                                          ? String(rawVal)
                                          : '(Tidak diisi)';
                                    return (
                                        <div
                                            key={f.id}
                                            className="p-3 rounded-lg border border-neutral-100 bg-white dark:bg-neutral-950 dark:border-neutral-800 space-y-1"
                                        >
                                            <div className="text-[11px] font-bold text-neutral-500">
                                                {i + 1}. {f.label}
                                            </div>
                                            <div className="font-semibold text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                                                {valStr}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

FormResponses.layout = {
    breadcrumbs: [
        {
            title: 'Form Builder',
            href: formsRoute.index(),
        },
        {
            title: 'Tanggapan Form',
            href: formsRoute.index(),
        },
    ],
};
