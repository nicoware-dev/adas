import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import logo from "../assets/icon.svg";

export function AppHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const DEFAULT_AGENT_ID = 'acc5e818-17b3-0509-8411-89882fdb9ce3';

    const navItems = [
        { name: "Chat", path: `/app/chat/${DEFAULT_AGENT_ID}` },
        { name: "Analytics", path: "/app/analytics" },
        // Portfolio and Settings pages are hidden for now as they require wallet connection
        // { name: "Portfolio", path: "/app/portfolio" },
        // { name: "Settings", path: "/app/settings" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#1B3B3B] bg-[#09181B]/80 backdrop-blur supports-[backdrop-filter]:bg-[#09181B]/80">
            <div className="flex h-14 items-center justify-between px-4 relative">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="ADAS Logo" className="h-6 w-6" />
                    <span className="text-white font-heading font-semibold">ADAS</span>
                </Link>

                {/* Mobile Menu Button - Centered */}
                <div className="lg:hidden absolute left-1/2 -translate-x-1/2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#01C0C9] hover:bg-[#01C0C9]/10 hover:text-[#01C0C9]"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                {/* Desktop Navigation - Centered */}
                <nav className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`text-sm font-heading font-medium transition-colors px-6 ${
                                location.pathname.includes(item.path.split('/')[2])
                                    ? 'text-[#01C0C9]'
                                    : 'text-muted-foreground hover:text-[#01C0C9]'
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className="fixed inset-0 top-14 z-40 bg-[#09181B] lg:hidden min-h-[calc(100vh-3.5rem)]">
                        <nav className="flex flex-col items-center py-8 gap-8 bg-[#09181B] h-full">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`text-lg font-heading font-medium transition-colors ${
                                        location.pathname.includes(item.path.split('/')[2])
                                            ? 'text-[#01C0C9]'
                                            : 'text-muted-foreground hover:text-[#01C0C9]'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
