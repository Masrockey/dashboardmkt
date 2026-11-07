import { Link, usePage } from '@inertiajs/react';
import billboards from '@/routes/billboards';
import forms from '@/routes/forms';
import r2 from '@/routes/r2';
import {
    Bike,
    BookmarkCheck,
    Boxes,
    Building2,
    CalendarDays,
    FilePlus2,
    FileText,
    FolderKanban,
    Handshake,
    Layers,
    LayoutGrid,
    Map,
    MapPin,
    Megaphone,
    Presentation,
    ShieldCheck,
    Tag,
    Ticket,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import brands from '@/routes/brands';
import categories from '@/routes/categories';
import dealers from '@/routes/dealers';
import jenisPameran from '@/routes/jenis-pameran';
import kabupatens from '@/routes/kabupatens';
import marketing from '@/routes/marketing';
import meetAndGreet from '@/routes/meet-and-greet';
import pameran from '@/routes/pameran';
import roles from '@/routes/roles';
import segments from '@/routes/segments';
import series from '@/routes/series';
import types from '@/routes/types';
import users from '@/routes/users';
import type { NavGroup, NavItem } from '@/types';

type PermittedNavItem = NavItem & {
    permission?: string;
    items?: PermittedNavItem[];
};

const pcdNavItems: PermittedNavItem[] = [
    {
        title: 'Dashboard Channel',
        href: dashboard(),
        icon: LayoutGrid,
        permission: 'pcd.dashboard',
    },
    {
        title: 'Channel',
        href: pameran.index(),
        icon: CalendarDays,
        permission: 'pcd.channel',
    },
    {
        title: 'Jenis Channel',
        href: jenisPameran.index(),
        icon: MapPin,
        permission: 'pcd.jenis_channel',
    },
    {
        title: 'Meet & Greet',
        href: meetAndGreet.index(),
        icon: Handshake,
        permission: 'pcd.meet_and_greet',
    },
];

const masterDataNavItems: PermittedNavItem[] = [
    {
        title: 'Segment',
        href: segments.index(),
        icon: Layers,
        permission: 'master_data.segments',
    },
    {
        title: 'Brand',
        href: brands.index(),
        icon: BookmarkCheck,
        permission: 'master_data.brands',
    },
    {
        title: 'Kategori',
        href: categories.index(),
        icon: FolderKanban,
        permission: 'master_data.categories',
    },
    {
        title: 'Kabupaten',
        href: kabupatens.index(),
        icon: Map,
        permission: 'master_data.kabupatens',
    },
    {
        title: 'Type',
        href: types.index(),
        icon: Tag,
        permission: 'master_data.types',
    },
    {
        title: 'Series',
        href: series.index(),
        icon: Boxes,
        permission: 'master_data.series',
    },
];

const promosiNavItems: PermittedNavItem[] = [
    {
        title: 'ATL',
        icon: Megaphone,
        items: [
            {
                title: 'Billboard',
                href: billboards.index(),
                icon: Presentation,
                permission: 'promosi.atl.billboard',
            },
        ],
    },
    {
        title: 'BTL',
        icon: Ticket,
        items: [],
    },
];

const marketingNavItems: PermittedNavItem[] = [
    {
        title: 'Dashboard Marketing',
        href: marketing.dashboard(),
        icon: LayoutGrid,
        permission: 'marketing.dashboard',
    },
    {
        title: 'R2',
        href: r2.index(),
        icon: Bike,
        permission: 'marketing.r2',
    },
];

const formBuilderNavItems: PermittedNavItem[] = [
    {
        title: 'Buat Form',
        href: forms.create(),
        icon: FilePlus2,
        permission: 'promosi.btl.write',
    },
    {
        title: 'Daftar Form',
        href: forms.index(),
        icon: FileText,
        permission: 'promosi.btl.read',
    },
];

const managementNavItems: PermittedNavItem[] = [
    {
        title: 'Dealer',
        href: dealers.index(),
        icon: Building2,
        permission: 'management.dealers',
    },
    {
        title: 'User',
        href: users.index(),
        icon: Users,
        permission: 'management.users',
    },
    {
        title: 'Role',
        href: roles.index(),
        icon: ShieldCheck,
        permission: 'management.roles',
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<{
        auth: {
            user: {
                role?: string;
                roles?: string[];
                permissions?: string[];
            };
        };
    }>().props;
    const userRole = auth?.user?.role;
    const userRoles = auth?.user?.roles || (userRole ? [userRole] : []);
    const userPermissions = auth?.user?.permissions || [];

    const isSuperAdmin = userRoles.includes('superadmin') || userPermissions.includes('*');

    const can = (permission?: string) => {
        if (!permission) return true;
        if (isSuperAdmin) return true;
        if (userPermissions.length > 0) {
            return userPermissions.some(
                (p) =>
                    p === permission ||
                    p.startsWith(`${permission}.`) ||
                    permission.startsWith(`${p}.`) ||
                    (p === 'master_data.access' && permission.startsWith('master_data.')) ||
                    (permission === 'master_data.access' && p.startsWith('master_data.')) ||
                    // Form builder & Promosi BTL bridge
                    ((permission.startsWith('form_builder.') || permission.startsWith('promosi.btl.')) &&
                        (p.startsWith('promosi.btl.') || p.startsWith('form_builder.') || p === 'promosi.btl' || p === 'form_builder')) ||
                    // PCD approval bridge
                    ((permission === 'pcd.channel.approval_spv' || permission === 'pcd.channel_approval_spv') &&
                        (p === 'pcd.channel.approval_spv' || p === 'pcd.channel_approval_spv')) ||
                    ((permission === 'pcd.channel.approval_kabag' || permission === 'pcd.channel_approval_kabag') &&
                        (p === 'pcd.channel_approval_kabag' || p === 'pcd.channel.approval_kabag')),
            );
        }
        // Fallback backward compatibility
        if (permission.startsWith('form_builder.') || permission.startsWith('promosi.btl.')) {
            return true;
        }
        if (permission.startsWith('pcd.')) {
            if (permission === 'pcd.jenis_channel') {
                return !userRoles.every((r) => r === 'dealer' || r === 'kabag');
            }
            return true;
        }
        if (permission.startsWith('marketing.')) {
            return userRoles.some((r) => r === 'superadmin' || r === 'spv' || r === 'kabag');
        }
        if (permission.startsWith('master_data.')) {
            return userRoles.some((r) => r === 'superadmin' || r === 'spv');
        }
        if (permission === 'management.dealers' || permission === 'management.users') {
            return userRoles.some((r) => r === 'superadmin' || r === 'spv');
        }
        if (permission === 'management.roles') {
            return userRoles.includes('superadmin');
        }
        return false;
    };

    const navGroups: NavGroup[] = useMemo(() => {
        const groups: NavGroup[] = [];

        const visiblePcd = pcdNavItems.filter((item) => can(item.permission));
        if (visiblePcd.length > 0) {
            groups.push({
                title: 'PCD',
                items: visiblePcd,
            });
        }

        // Promosi
        const visiblePromosi = promosiNavItems
            .map((item) => {
                if (item.items && item.items.length > 0) {
                    const filteredSub = item.items.filter((sub) => can(sub.permission));
                    return {
                        ...item,
                        items: filteredSub,
                    };
                }
                return item;
            })
            .filter((item) => {
                if (item.items) {
                    return item.items.length > 0;
                }
                return can(item.permission);
            });

        if (visiblePromosi.length > 0) {
            groups.push({
                title: 'Promosi',
                items: visiblePromosi,
            });
        }

        const visibleMarketing = marketingNavItems.filter((item) => can(item.permission));
        if (visibleMarketing.length > 0) {
            groups.push({
                title: 'Marketing',
                items: visibleMarketing,
            });
        }

        const visibleFormBuilder = formBuilderNavItems.filter((item) => can(item.permission));
        if (visibleFormBuilder.length > 0) {
            groups.push({
                title: 'Form Builder',
                items: visibleFormBuilder,
            });
        }

        const visibleMasterData = masterDataNavItems.filter((item) => can(item.permission));
        if (visibleMasterData.length > 0) {
            groups.push({
                title: 'Master Data',
                items: visibleMasterData,
            });
        }

        const visibleManagement = managementNavItems.filter((item) => can(item.permission));
        if (visibleManagement.length > 0) {
            groups.push({
                title: 'Management',
                items: visibleManagement,
            });
        }

        return groups;
    }, [isSuperAdmin, userPermissions]);


    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
