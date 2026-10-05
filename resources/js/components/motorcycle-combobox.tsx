import * as React from 'react';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface MotorcycleComboboxProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function MotorcycleCombobox({
    id,
    value,
    onChange,
    options,
    placeholder = 'Pilih atau cari tipe motor Honda...',
    disabled = false,
    className,
}: MotorcycleComboboxProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase();
        return options.filter((opt) => opt.toLowerCase().includes(q));
    }, [options, searchQuery]);

    // Handle outside click to close
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Auto-focus search input when opened
    React.useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    const handleSelectOption = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchQuery('');
    };

    const isCustomValue = searchQuery.trim() !== '' && !options.some(
        (opt) => opt.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    return (
        <div ref={wrapperRef} className={cn('relative w-full', className)}>
            {/* Trigger Button / Input Display */}
            <div
                id={id}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setIsOpen(true);
                    } else if (e.key === 'Escape') {
                        setIsOpen(false);
                    }
                }}
                className={cn(
                    'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    disabled ? 'cursor-not-allowed opacity-50 bg-neutral-50 dark:bg-neutral-900' : 'cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50',
                    isOpen && 'border-ring ring-ring/50 ring-[3px]'
                )}
            >
                <span className={cn('truncate', !value && 'text-muted-foreground')}>
                    {value || placeholder}
                </span>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="rounded-full p-0.5 text-muted-foreground hover:bg-neutral-200 hover:text-foreground dark:hover:bg-neutral-700 transition-colors"
                            title="Hapus pilihan"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                    <ChevronDown
                        className={cn(
                            'size-4 text-muted-foreground transition-transform duration-200',
                            isOpen && 'rotate-180 text-foreground'
                        )}
                    />
                </div>
            </div>

            {/* Dropdown Menu - Perfectly Centered & Aligned (100% width of trigger) */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute left-0 right-0 top-full mt-1.5 z-50',
                        'w-full min-w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg dark:shadow-black/40',
                        'animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden'
                    )}
                >
                    {/* Search Field inside Dropdown */}
                    <div className="flex items-center border-b border-border/80 px-2.5 py-2 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <Search className="size-4 shrink-0 text-muted-foreground mr-2" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setIsOpen(false);
                                } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (filteredOptions.length > 0) {
                                        handleSelectOption(filteredOptions[0]);
                                    } else if (isCustomValue) {
                                        handleSelectOption(searchQuery.trim());
                                    }
                                }
                            }}
                            placeholder="Ketik untuk mencari tipe Honda..."
                            className="w-full bg-transparent text-sm placeholder:text-muted-foreground outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div
                        role="listbox"
                        className="max-h-56 overflow-y-auto p-1 scrollbar-thin divide-y divide-border/20"
                    >
                        {filteredOptions.length === 0 && !isCustomValue ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                                Tidak ada tipe motor yang cocok.
                            </div>
                        ) : (
                            <>
                                {filteredOptions.map((opt) => {
                                    const isSelected = opt.toLowerCase() === value.toLowerCase();
                                    return (
                                        <div
                                            key={opt}
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => handleSelectOption(opt)}
                                            className={cn(
                                                'flex items-center justify-between px-2.5 py-2 text-sm rounded-md cursor-pointer transition-colors',
                                                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                                                isSelected && 'bg-primary/10 text-primary font-medium dark:bg-primary/20'
                                            )}
                                        >
                                            <span className="truncate">{opt}</span>
                                            {isSelected && (
                                                <Check className="size-4 text-primary shrink-0 ml-2" />
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Option to use custom typed value if not in list */}
                                {isCustomValue && (
                                    <div
                                        role="option"
                                        aria-selected={false}
                                        onClick={() => handleSelectOption(searchQuery.trim())}
                                        className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-md cursor-pointer text-primary hover:bg-primary/10 dark:hover:bg-primary/20 font-medium transition-colors"
                                    >
                                        <Plus className="size-4 shrink-0" />
                                        <span className="truncate">
                                            Gunakan: &quot;{searchQuery.trim()}&quot;
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer helper */}
                    <div className="border-t border-border/60 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-muted-foreground dark:bg-neutral-900 flex items-center justify-between">
                        <span>Menampilkan {filteredOptions.length} tipe Honda</span>
                        <span className="text-[10px] text-neutral-400">Pilih atau ketik bebas</span>
                    </div>
                </div>
            )}
        </div>
    );
}
