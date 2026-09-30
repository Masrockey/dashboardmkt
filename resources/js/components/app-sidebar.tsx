import { Link, usePage } from '@inertiajs/react';
import {
    BookmarkCheck,
    Building2,
    CalendarDays,
    FolderKanban,
    Layers,
    LayoutGrid,
    Map,
    MapPin,
    Tag,
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
import pameran from '@/routes/pameran';
import segments from '@/routes/segments';
import types from '@/routes/types';
import users from '@/routes/users';
import type { NavGroup, NavItem } from '@/types';

const pcdNavItems: NavItem[] = [
    {
        title: 'Dashboard Channel',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Channel',
        href: pameran.index(),
        icon: CalendarDays,
    },
    {
        title: 'Jenis Channel',
        href: jenisPameran.index(),
        icon: MapPin,
    },
];

const masterDataNavItems: NavItem[] = [
    {
        title: 'Segment',
        href: segments.index(),
        icon: Layers,
    },
    {
        title: 'Brand',
        href: brands.index(),
        icon: BookmarkCheck,
    },
    {
        title: 'Kategori',
        href: categories.index(),
        icon: FolderKanban,
    },
    {
        title: 'Kabupaten',
        href: kabupatens.index(),
        icon: Map,
    },
    {
        title: 'Type',
        href: types.index(),
        icon: Tag,
    },
];

const managementNavItems: NavItem[] = [
    {
        title: 'Dealer',
        href: dealers.index(),
        icon: Building2,
    },
    {
        title: 'User',
        href: users.index(),
        icon: Users,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role?: string; roles?: string[] } } }>().props;
    const userRole = auth?.user?.role;
    const userRoles = auth?.user?.roles || (userRole ? [userRole] : []);

    const isDealerOrKabagOnly =
        userRoles.every((r) => r === 'dealer' || r === 'kabag') && userRoles.length > 0;
    const canAccessMasterData = userRoles.some((r) => r === 'superadmin' || r === 'spv');
    const canAccessManagement = userRoles.some((r) => r === 'superadmin' || r === 'spv');

    const navGroups: NavGroup[] = useMemo(() => {
        const groups: NavGroup[] = [
            {
                title: 'PCD',
                items: isDealerOrKabagOnly
                    ? pcdNavItems.filter(
                          (item) => item.title === 'Dashboard Channel' || item.title === 'Channel',
                      )
                    : pcdNavItems,
            },
        ];

        if (canAccessMasterData) {
            groups.push({
                title: 'Master Data',
                items: masterDataNavItems,
            });
        }

        if (canAccessManagement) {
            groups.push({
                title: 'Management',
                items: managementNavItems,
            });
        }

        return groups;
    }, [isDealerOrKabagOnly, canAccessMasterData, canAccessManagement]);

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
