import * as React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Option {
    label: string;
    value: string;
}

interface MultiSelectFilterProps {
    label: string;
    placeholder: string;
    options: Option[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    className?: string;
    showSearch?: boolean;
}

export function MultiSelectFilter({
    label,
    placeholder,
    options,
    selectedValues,
    onChange,
    className = 'w-[160px]',
    showSearch = false,
}: MultiSelectFilterProps) {
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase();
        return options.filter((opt) => opt.label.toLowerCase().includes(q));
    }, [options, searchQuery]);

    const handleSelectAll = (e: Event) => {
        e.preventDefault();
        if (selectedValues.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map((o) => o.value));
        }
    };

    const handleToggle = (value: string, e: Event) => {
        e.preventDefault();
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((v) => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const getTriggerLabel = () => {
        if (selectedValues.length === 0) {
            return placeholder;
        }
        if (selectedValues.length === 1) {
            const found = options.find((o) => o.value === selectedValues[0]);
            return found ? found.label : placeholder;
        }
        return `${selectedValues.length} ${label} dipilih`;
    };

    const isAllSelected = options.length > 0 && selectedValues.length === options.length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`h-9 justify-between text-xs font-normal px-2.5 ${
                        selectedValues.length > 0
                            ? 'border-emerald-500/60 bg-emerald-50/50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300 font-medium'
                            : ''
                    } ${className}`}
                >
                    <span className="truncate">{getTriggerLabel()}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                        {selectedValues.length > 0 && (
                            <Badge
                                variant="secondary"
                                className="h-4 px-1 text-[10px] font-semibold bg-emerald-600 text-white dark:bg-emerald-500"
                            >
                                {selectedValues.length}
                            </Badge>
                        )}
                        <ChevronDown className="size-3.5 opacity-50" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1">
                {(showSearch || options.length > 5) && (
                    <div className="p-1">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 size-3.5 text-neutral-400 pointer-events-none" />
                            <Input
                                placeholder={`Cari ${label.toLowerCase()}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 pl-7 text-xs"
                            />
                        </div>
                    </div>
                )}

                <DropdownMenuCheckboxItem
                    checked={isAllSelected}
                    onSelect={handleSelectAll}
                    className="font-medium text-xs text-neutral-700 dark:text-neutral-300"
                >
                    Semua {label}
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {filteredOptions.length === 0 ? (
                        <div className="p-2 text-center text-xs text-neutral-400">
                            Tidak ada pilihan
                        </div>
                    ) : (
                        filteredOptions.map((opt) => {
                            const isChecked = selectedValues.includes(opt.value);
                            return (
                                <DropdownMenuCheckboxItem
                                    key={opt.value}
                                    checked={isChecked}
                                    onSelect={(e) => handleToggle(opt.value, e)}
                                    className="text-xs"
                                >
                                    <span className="truncate">{opt.label}</span>
                                </DropdownMenuCheckboxItem>
                            );
                        })
                    )}
                </div>

                {selectedValues.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onChange([])}
                                className="w-full h-7 justify-center text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            >
                                <X className="mr-1 size-3" />
                                Hapus Filter ({selectedValues.length})
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
