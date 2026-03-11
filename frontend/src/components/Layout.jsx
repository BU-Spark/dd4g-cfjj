import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
    const location = useLocation();

    const navLinks = [
        { name: 'Chat', path: '/' },
        { name: 'Knowledge Base', path: '/knowledge' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-cfjj-bg">
            <header className="sticky top-0 w-full h-16 bg-white/90 backdrop-blur-md border-b border-cfjj-border z-50 flex-none">
                <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

                    {/* Left: Logo and Nav */}
                    <div className="flex items-center h-full gap-8">
                        <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform">
                            <div className="flex items-center justify-center w-8 h-8 rounded bg-cfjj-navy text-white shadow-sm">
                                <Shield className="w-4 h-4" />
                            </div>
                            <span className="font-heading font-bold text-cfjj-navy text-xl tracking-tight leading-none pt-1">CFJJ</span>
                        </Link>

                        <nav className="hidden md:flex items-center h-full gap-6">
                            {navLinks.map((link) => {
                                const isActive = location.pathname === link.path;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "text-sm font-medium h-full flex items-center border-b-2 transition-colors",
                                            isActive
                                                ? "text-cfjj-navy border-cfjj-navy"
                                                : "text-cfjj-text-secondary border-transparent hover:text-cfjj-navy"
                                        )}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
    );
}