import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']> | string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    permission?: string;
    items?: NavItem[];
};

export type NavGroup = {
    title: string;
    items: NavItem[];
};

