import {
    CircleUser,
    Mail,
    Menu,
    SlidersHorizontal,
    Package2,
    FileText,
} from "lucide-react"
import { useEffect } from "react";
import { Button } from "@/components/ui/button"
import { ModeToggle } from "../mode-toggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Logo from "../Icons/Logo";
import { clsx } from "clsx";
import { __ } from "@/lib/i18n";


const navigation = [
    {
        name: "inbox",
        href: "inbox",
        path: "inbox",
        icon: Mail,
        current: true,
    },
    {
        name: "forms",
        href: "forms-usage",
        path: "forms-usage",
        icon: FileText,
        current: false,
    },
    {
        name: "settings",
        href: "settings",
        path: "settings",
        icon: SlidersHorizontal,
        current: false,
    },
];

export default function LayoutOne() {
    const streameryForms = typeof window !== 'undefined' ? window.streameryForms : null;
    let showApplicationLayout = !streameryForms?.isAdmin;
    let location = useLocation();
    const navigate = useNavigate();
    const pageTitle = location.pathname.split("/")[1];
    if(location.pathname === "/login") {
        showApplicationLayout = false;
    }
    useEffect(() => {
        // Only redirect when at root - never overwrite nested routes like /settings/providers
        if (location.pathname === '/' || location.pathname === '') {
          navigate('/inbox');
        }
      }, []);

    // Use full URLs for nav links so WordPress admin menu stays in sync (active state)
    const getNavHref = (item) => {
        const streameryForms = typeof window !== 'undefined' ? window.streameryForms : null;
        if (streameryForms?.adminUrl) {
            const base = streameryForms.adminUrl;
            let page = 'streamery-forms';
            let hash = '#/inbox';
            if (item.path === 'settings') {
                page = 'streamery-forms-settings';
                hash = location.pathname.startsWith('/settings') ? '#' + location.pathname : '#/settings';
            } else if (item.path === 'forms-usage') {
                page = 'streamery-forms-forms-usage';
                hash = '#/forms-usage';
            }
            return `${base}?page=${page}${hash}`;
        }
        return `#/${item.href}`;
    };

    return (
        <div className={`grid w-full ${showApplicationLayout ? 'md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]' : 'grid-cols-1 h-full'}`}>
            {showApplicationLayout && <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <a href={typeof window !== 'undefined' && window.streameryForms?.adminUrl ? `${window.streameryForms.adminUrl}?page=streamery-forms#/inbox` : '#/inbox'} className="flex items-center gap-2 font-semibold">
                            <Logo />
                            <span className="">{__('pluginName')}</span>
                        </a>
                       
                    </div>
                    <div className="flex-1">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                            {navigation.map((item,index) => {
                                return <a
                                    href={getNavHref(item)}
                                    key={index}
                                    className={
                                        clsx(
                                            "flex items-center gap-3 rounded-lg px-3 py-2  transition-all hover:text-primary",
                                            item.href === pageTitle
                                                ? "text-primary bg-muted"
                                                : "text-muted-foreground"
                                        )
                                    }
                                >
                                    <item.icon className="h-5 w-5" />
                                    {__(item.name)}
                                </a>
                            })}


                        </nav>
                    </div>
                
                </div>
            </div>
            }
            <div className="flex flex-col" style={{ height: 'calc(100vh - 32px)', overflow: 'hidden' }}>
                {showApplicationLayout && 
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">{__('toggleNavigationMenu')}</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <a
                                    href="#"
                                    className="flex items-center gap-2 text-lg font-semibold"
                                >
                                    <Package2 className="h-6 w-6" />
                                    <span className="sr-only">{__('pluginName')}</span>
                                </a>
                                {navigation.map((item,index) => {
                                    return <a
                                        href={getNavHref(item)}
                                        key={index}
                                        className={
                                            clsx(
                                                "flex items-center gap-3 rounded-lg px-3 py-2  transition-all hover:text-primary",
                                                item.href === pageTitle
                                                    ? "text-primary bg-muted"
                                                    : "text-muted-foreground"
                                            )
                                        }
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {__(item.name)}
                                    </a>
                                })}


                            </nav>
                          
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex items-center h-full">

                    </div>
                    <ModeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">{__('toggleUserMenu')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{__('myAccount')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>{__('settings')}</DropdownMenuItem>
                            <DropdownMenuItem>{__('support')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>{__('logout')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                }
                <main className="h-full">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
