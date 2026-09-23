import { Link, usePage } from '@inertiajs/react';
import { Building2, CalendarDays, LayoutGrid, MapPin, Users } from 'lucide-react';
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
import dealers from '@/routes/dealers';
import jenisPameran from '@/routes/jenis-pameran';
import pameran from '@/routes/pameran';
import users from '@/routes/users';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Pameran',
        href: pameran.index(),
        icon: CalendarDays,
    },
    {
        title: 'Dealer',
        href: dealers.index(),
        icon: Building2,
    },
    {
        title: 'Jenis Channel',
        href: jenisPameran.index(),
        icon: MapPin,
    },
    {
        title: 'User',
        href: users.index(),
        icon: Users,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role?: string } } }>().props;
    const userRole = auth?.user?.role;

    const filteredNavItems = useMemo(() => {
        if (userRole === 'dealer' || userRole === 'kabag') {
            return mainNavItems.filter(
                (item) => item.title === 'Dashboard' || item.title === 'Pameran',
            );
        }

        return mainNavItems;
    }, [userRole]);

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
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
