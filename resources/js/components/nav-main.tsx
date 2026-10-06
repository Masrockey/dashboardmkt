import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup, NavItem } from '@/types';

interface NavMainProps {
    groups?: NavGroup[];
    items?: NavItem[];
}

export function NavMain({ groups, items }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();

    const navGroups: NavGroup[] = groups || (items ? [{ title: 'Platform', items }] : []);

    return (
        <>
            {navGroups.map((group) => {
                if (group.items.length === 0) {
                    return (
                        <Collapsible
                            key={group.title}
                            defaultOpen
                            className="group/collapsible"
                        >
                            <SidebarGroup className="px-2 py-1">
                                <SidebarGroupLabel
                                    asChild
                                    className="group/label cursor-pointer select-none text-[11px] font-semibold tracking-wider uppercase text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                                >
                                    <CollapsibleTrigger className="flex w-full items-center justify-between">
                                        <span>{group.title}</span>
                                        <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </CollapsibleTrigger>
                                </SidebarGroupLabel>
                                <CollapsibleContent>
                                    <SidebarGroupContent>
                                        <div className="px-3 py-1.5 text-xs italic text-neutral-400 dark:text-neutral-500">

                                        </div>
                                    </SidebarGroupContent>
                                </CollapsibleContent>
                            </SidebarGroup>
                        </Collapsible>
                    );
                }

                return (
                    <Collapsible
                        key={group.title}
                        defaultOpen
                        className="group/collapsible"
                    >
                        <SidebarGroup className="px-2 py-1">
                            <SidebarGroupLabel
                                asChild
                                className="group/label cursor-pointer select-none text-[11px] font-semibold tracking-wider uppercase text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                            >
                                <CollapsibleTrigger className="flex w-full items-center justify-between">
                                    <span>{group.title}</span>
                                    <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => {
                                            const hasSubItems = Array.isArray(item.items);

                                            if (hasSubItems) {
                                                return (
                                                    <Collapsible
                                                        key={item.title}
                                                        defaultOpen
                                                        className="group/sub-collapsible"
                                                    >
                                                        <SidebarMenuItem>
                                                            <CollapsibleTrigger asChild>
                                                                <SidebarMenuButton
                                                                    tooltip={{ children: item.title }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {item.icon && <item.icon />}
                                                                    <span>{item.title}</span>
                                                                    <ChevronRight className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90" />
                                                                </SidebarMenuButton>
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent>
                                                                <SidebarMenuSub>
                                                                    {item.items && item.items.length > 0 ? (
                                                                        item.items.map((subItem) => (
                                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                                <SidebarMenuSubButton
                                                                                    asChild
                                                                                    isActive={
                                                                                        subItem.href
                                                                                            ? isCurrentUrl(subItem.href)
                                                                                            : false
                                                                                    }
                                                                                >
                                                                                    <Link href={subItem.href || '#'} prefetch>
                                                                                        {subItem.icon && <subItem.icon />}
                                                                                        <span>{subItem.title}</span>
                                                                                    </Link>
                                                                                </SidebarMenuSubButton>
                                                                            </SidebarMenuSubItem>
                                                                        ))
                                                                    ) : (
                                                                        <SidebarMenuSubItem>
                                                                            <div className="px-2 py-1 text-xs italic text-neutral-400 dark:text-neutral-500">

                                                                            </div>
                                                                        </SidebarMenuSubItem>
                                                                    )}
                                                                </SidebarMenuSub>
                                                            </CollapsibleContent>
                                                        </SidebarMenuItem>
                                                    </Collapsible>
                                                );
                                            }

                                            return (
                                                <SidebarMenuItem key={item.title}>
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={item.href ? isCurrentUrl(item.href) : false}
                                                        tooltip={{ children: item.title }}
                                                    >
                                                        <Link href={item.href || '#'} prefetch>
                                                            {item.icon && <item.icon />}
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>
                );
            })}
        </>
    );
}
