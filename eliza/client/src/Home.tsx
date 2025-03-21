import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Bot, ArrowRight } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { LogoCarousel } from "./components/carrousel";
import { HomeHeader } from "./components/home-header";
import discordIcon from "./assets/discord.svg";
import githubIcon from "./assets/github-dark.svg";
import telegramIcon from "./assets/telegram.svg";
import linktreeIcon from "./assets/linktree.svg";
import x_dark from "./assets/x_dark.svg";
import logo from "./assets/icon.svg";
import hero from "./assets/hero.svg";
import bg1 from "./assets/bg1.png";
import bg2 from "./assets/bg2.png";
import bg3 from "./assets/bg3.png";
import scalabilityIcon from "./assets/features/scalability.svg";
import efficiencyIcon from "./assets/features/efficiency.svg";
import specializationIcon from "./assets/features/specialization.svg";
import robustnessIcon from "./assets/features/robustness.svg";
import adaptabilityIcon from "./assets/features/adaptability.svg";
import modularityIcon from "./assets/features/modularity.svg";
import "./App.css";

type Agent = {
    id: string;
    name: string;
};

function Home() {
    const navigate = useNavigate();

    const handleExternalLink = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <HomeHeader />
            <main className="flex-1">
                {/* Hero Section */}
                <section id="home" className="relative">
                    {/* Background Image */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={bg1}
                            alt=""
                            className="w-full h-full object-cover opacity-70"
                            style={{
                                filter: 'brightness(0.8) contrast(1.2)',
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/50" />
                    </div>

                    {/* Content */}
                    <div className="container relative py-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex items-center justify-center mb-8">
                                <img
                                    src="/hero.svg"
                                    alt="ADAS Hero"
                                    className="w-[1024px] h-auto max-w-full"
                                    style={{
                                        filter: 'drop-shadow(0 0 20px rgba(1, 95, 205, 0.3))',
                                        animation: 'float 6s ease-in-out infinite'
                                    }}
                                />
                            </div>
                            <style>
                                {`
                                    @keyframes float {
                                        0%, 100% { transform: translateY(0px); }
                                        50% { transform: translateY(-10px); }
                                    }
                                `}
                            </style>
                            <div className="space-y-8">
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black title-gradient" style={{ lineHeight: '1.2' }}>
                                    Revolutionizing Aptos DeFi with AI-Powered Agent Swarms
                                </h1>
                                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                                    Simplify your Aptos DeFi experience with the power of Multi-Agent Systems (MAS)
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Button
                                        size="lg"
                                        onClick={() => handleExternalLink('https://t.me/ADAS_Demo_bot')}
                                        className="bg-[#01C0C9] hover:bg-[#319CA0] text-white flex items-center gap-2 w-full sm:w-auto"
                                    >
                                        <span>Try for Free</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => handleExternalLink('https://adas-1.gitbook.io/adas/')}
                                        className="border-[#27353A] hover:bg-[#015FCD]/10 hover:border-[#015FCD]/50 text-white w-full sm:w-auto"
                                    >
                                        Learn More
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section id="features" className="py-24 bg-background">
                    <div className="container space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold title-gradient">Why Multi-Agent Systems?</h2>
                            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                                Our platform leverages a Multi-Agent System architecture where each agent specializes in specific tasks—from fetching metrics to executing trades on Aptos—enabling modular, scalable, and efficient operations.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {[
                                {
                                    title: "Specialization",
                                    description: "Optimized performance through task-specific agents",
                                    icon: specializationIcon,
                                    href: "#specialization"
                                },
                                {
                                    title: "Scalability",
                                    description: "Easy addition of new agents and features",
                                    icon: scalabilityIcon,
                                    href: "#scalability"
                                },
                                {
                                    title: "Robustness",
                                    description: "Continued operation even if individual agents fail",
                                    icon: robustnessIcon,
                                    href: "#robustness"
                                },
                                {
                                    title: "Efficiency",
                                    description: "Parallel task execution for improved performance",
                                    icon: efficiencyIcon,
                                    href: "#efficiency"
                                },
                                {
                                    title: "Adaptability",
                                    description: "Seamless integration with new Aptos protocols",
                                    icon: adaptabilityIcon,
                                    href: "#adaptability"
                                },
                                {
                                    title: "Modularity",
                                    description: "Plug-and-play architecture for easy customization",
                                    icon: modularityIcon,
                                    href: "#modularity"
                                }
                            ].map((feature) => {
                                return (
                                    <a
                                        key={feature.title}
                                        href={feature.href}
                                        className="block group"
                                    >
                                        <Card className="bg-[#182424] border-[#27353A] hover:bg-[#1E2E2E] transition-colors h-full">
                                            <div className="p-6 flex flex-col items-center text-center space-y-6">
                                                <div className="h-20 w-20 rounded-full bg-[#1E2E2E] flex items-center justify-center group-hover:scale-110 transition-transform ring-1 ring-[#27353A] overflow-hidden">
                                                    <img
                                                        src={feature.icon}
                                                        alt={feature.title}
                                                        className="h-full w-full object-cover rounded-full"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <h3 className="text-[#01C0C9] text-xl font-semibold">{feature.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Architecture Section */}
                <section className="relative py-24">
                    {/* Background Image */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={bg2}
                            alt=""
                            className="w-full h-full object-cover opacity-70"
                            style={{
                                filter: 'brightness(0.8) contrast(1.2)',
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/50" />
                    </div>

                    <div className="container relative space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold title-gradient">Our Architecture</h2>
                            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                                A sophisticated multi-agent system designed to revolutionize DeFi operations through specialized agents and intelligent coordination on the Aptos blockchain.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <Card className="bg-[#182424] border-[#27353A] hover:bg-[#1E2E2E] transition-all duration-300 h-full group">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#01C0C9] to-[#319CA0]">
                                            Aptos Expertise
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                        Native integration with Aptos blockchain and its leading DeFi protocols for seamless operations.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className="bg-[#182424] border-[#27353A] hover:bg-[#1E2E2E] transition-all duration-300 h-full group">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#01C0C9] to-[#319CA0]">
                                            Agent Swarm
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                        Specialized AI agents working together to handle complex DeFi operations on Aptos.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className="bg-[#182424] border-[#27353A] hover:bg-[#1E2E2E] transition-all duration-300 h-full group">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#01C0C9] to-[#319CA0]">
                                            Move Integration
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                        Leveraging Aptos' Move programming language for secure and efficient smart contract interactions.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                        <div className="flex flex-col items-center space-y-8">
                            <div className="w-full max-w-5xl bg-background rounded-lg p-8 border border-white/[0.08]">
                                <img
                                    src="/architecture.png"
                                    alt="ADAS Architecture Diagram"
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Integrations Section with Logo Carousel */}
                <section className="py-24 space-y-12">
                    <div className="container text-center space-y-4">
                        <h2 className="text-3xl font-bold title-gradient">Integrated Platforms & Protocols</h2>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            Seamlessly connected with leading protocols across the Aptos ecosystem
                        </p>
                    </div>
                    <LogoCarousel />
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="container py-24 space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-bold title-gradient">Flexible Plans for Every User</h2>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            ADAS is and will always be open source! We strongly encourage users to self-host their own instance.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                title: "Self-Hosted",
                                price: "Free",
                                description: "Unlimited. Full control over your data and agents",
                                buttonText: "View Documentation",
                                href: "https://github.com/nicoware-dev/adas",
                                featured: true
                            },
                            {
                                title: "Free Tier",
                                price: "$0",
                                description: "Public agents access, Basic features, limited API calls",
                                buttonText: "Coming Soon",
                                comingSoon: true,
                                href: "#"
                            },
                            {
                                title: "SaaS Packs",
                                price: "+$19.99",
                                description: "Full access. Customizable private agents",
                                buttonText: "Coming Soon",
                                comingSoon: true,
                                href: "#"
                            },
                            {
                                title: "Enterprise",
                                price: "Custom",
                                description: "Custom workflows, dedicated support",
                                buttonText: "Coming Soon",
                                comingSoon: true,
                                href: "#"
                            }
                        ].map((plan) => (
                            <Card
                                key={plan.title}
                                className={`bg-[#182424] border-[#27353A] hover:bg-[#1E2E2E] transition-colors ${plan.featured ? 'ring-2 ring-[#01C0C9]' : ''}`}
                            >
                                <CardHeader>
                                    <CardTitle className="text-center">{plan.title}</CardTitle>
                                    <div className="text-4xl font-bold my-4 text-center">{plan.price}</div>
                                    <CardDescription className="text-center">{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <Button
                                        className={`w-full ${plan.featured ? 'bg-[#01C0C9] text-white hover:bg-[#319CA0]' : plan.comingSoon ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'border-[#27353A] hover:bg-[#1E2E2E] text-[#01C0C9]'}`}
                                        variant={plan.featured ? 'default' : 'outline'}
                                        onClick={() => plan.comingSoon ? null : handleExternalLink(plan.href)}
                                        disabled={plan.comingSoon}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {/* Coming Soon Notice */}
                    <div className="text-center text-muted-foreground/90 mt-8">
                        <p>Hosted plans are coming soon! For now, we recommend self-hosting your own instance.</p>
                    </div>
                </section>

                {/* Open Source Section */}
                <section id="opensource" className="relative py-24">
                    {/* Background Image */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={bg3}
                            alt=""
                            className="w-full h-full object-cover opacity-70"
                            style={{
                                filter: 'brightness(0.8) contrast(1.2)',
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/50" />
                    </div>

                    <div className="container relative space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold title-gradient">Open Source and Built for Collaboration</h2>
                            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                                ADAS is an open-source initiative. We invite developers and contributors to help us expand the MAS ecosystem and redefine DeFi automation on Aptos together.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-[#27353A] hover:bg-[#01C0C9]/10 hover:border-[#01C0C9]/50 hover:text-[#01C0C9] transition-all duration-300 w-full sm:w-auto"
                                onClick={() => handleExternalLink('https://github.com/nicoware-dev/adas')}
                            >
                                <img src={githubIcon} alt="GitHub" className="mr-2 h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                                Contribute on GitHub
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-[#27353A] hover:bg-[#01C0C9]/10 hover:border-[#01C0C9]/50 hover:text-[#01C0C9] transition-all duration-300 w-full sm:w-auto"
                                onClick={() => handleExternalLink('https://discord.gg/G6GaZYzRgN')}
                            >
                                <img src={discordIcon} alt="Discord" className="mr-2 h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                                Join Our Discord
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Social Media Section */}
                <section className="container py-24 space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-bold title-gradient font-heading">Stay Updated with Our Meme Agent</h2>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            Follow our AI Meme Agent for the latest Aptos DeFi trends, market insights, and community updates.
                        </p>
                    </div>
                    <div className="flex justify-center gap-8">
                        <a href="https://twitter.com/ADAS_DefAI" target="_blank" rel="noopener noreferrer" className="group">
                            <Card className="bg-[#172625] border-[#1B3B3B] hover:bg-[#1B3B3B] transition-colors p-6">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-[#015FCD] ring-offset-2 ring-offset-[#172625] group-hover:ring-4 transition-all duration-300">
                                        <img
                                            src="/agents/meme.png"
                                            alt="ADAS Meme Agent"
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-semibold font-heading">Follow on X</h3>
                                        <p className="text-sm text-muted-foreground">Daily memes & Aptos insights</p>
                                    </div>
                                </div>
                            </Card>
                        </a>
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="relative py-24">
                    {/* Background Image */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={bg1}
                            alt=""
                            className="w-full h-full object-cover opacity-70"
                            style={{
                                filter: 'brightness(0.8) contrast(1.2)',
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/50" />
                    </div>

                    <div className="container relative space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold title-gradient font-heading">Talk to Our Coordinator Agent</h2>
                            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                                Have questions? Our dedicated Coordinator Agent is available 24/7 on Telegram to assist you with any inquiries about our platform and services.
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-8">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-[#01C0C9] ring-offset-2 ring-offset-[#182424] hover:ring-4 transition-all duration-300">
                                <img
                                    src="/agents/coordinator.png"
                                    alt="Coordinator Agent"
                                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <Button
                                size="lg"
                                className="bg-[#01C0C9] hover:bg-[#319CA0] text-white font-heading"
                                onClick={() => handleExternalLink('https://t.me/adascoordinator_bot')}
                            >
                                <img src={telegramIcon} alt="Telegram" className="mr-2 h-5 w-5" />
                                Chat with Coordinator Agent
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/[0.08] bg-background">
                <div className="container py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        <div className="space-y-4">
                            <div className="flex flex-col items-center text-center">
                                <div className="flex items-center gap-2">
                                    <img src={logo} alt="ADAS Logo" className="h-6 w-6" />
                                    <h3 className="text-lg font-semibold text-white">ADAS</h3>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-foreground">Links</h4>
                            <nav className="flex flex-col gap-2">
                                <a href="#home" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</a>
                                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                                <a href="#opensource" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Open Source</a>
                            </nav>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-foreground text-center">Social</h4>
                            <div className="flex flex-col items-center gap-4 mt-4">
                                <a
                                    href="https://t.me/+0BvBZ8KWJQNjZTIx"
                                    className="w-6 h-6 flex items-center justify-center"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img src={telegramIcon} alt="Telegram" className="w-full h-full opacity-60 hover:opacity-100 transition-opacity" />
                                </a>
                                <a
                                    href="https://discord.gg/G6GaZYzRgN"
                                    className="w-6 h-6 flex items-center justify-center"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img src={discordIcon} alt="Discord" className="w-full h-full opacity-60 hover:opacity-100 transition-opacity" />
                                </a>
                                <a
                                    href="https://github.com/nicoware-dev/adas"
                                    className="w-6 h-6 flex items-center justify-center"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img src={githubIcon} alt="GitHub" className="w-full h-full opacity-60 hover:opacity-100 transition-opacity" />
                                </a>
                                <a
                                    href="https://linktr.ee/adas_ai"
                                    className="w-6 h-6 flex items-center justify-center"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img src={linktreeIcon} alt="Linktree" className="w-full h-full opacity-60 hover:opacity-100 transition-opacity" />
                                </a>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
                            <nav className="flex flex-col gap-2">
                                <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                                <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                            </nav>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-white/[0.08] text-center text-sm text-muted-foreground">
                        © 2025 ADAS. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;
