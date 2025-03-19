import { BarChart, GraduationCap, Network, Coins, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { HomeHeader } from "./components/home-header";
import type { FC } from 'react';

// Import agent images
import memeAgentImg from "./assets/agents/meme.png";
import coordinatorAgentImg from "./assets/agents/coordinator.png";
import analyticsAgentImg from "./assets/agents/analytics.png";
import aptosExpertImg from "./assets/agents/aptos-expert.png";
import defiAgentImg from "./assets/agents/defi.png";

interface Agent {
    name: string;
    description: string;
    capabilities: string[];
    category: string;
    icon: React.ElementType;
    imagePath: string;
}

interface AgentCardProps {
    agent: Agent;
}

const AgentCard: FC<AgentCardProps> = ({ agent }) => {
    const Icon = agent.icon;
    return (
        <Card className="bg-[#172625] border-[#1B3B3B] hover:bg-[#1B3B3B] transition-all duration-300 h-full group">
            <CardHeader className="space-y-6 text-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-[#01C0C9] ring-offset-4 ring-offset-[#172625] group-hover:ring-4 transition-all duration-300">
                        <img
                            src={agent.imagePath}
                            alt={agent.name}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-xl font-bold font-heading">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#01C0C9] to-[#015FCD]">
                                {agent.name}
                            </span>
                        </CardTitle>
                        <div className="text-sm font-medium text-[#01C0C9]/80">{agent.category}</div>
                        <CardDescription className="text-base leading-relaxed">
                            {agent.description}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-[#01C0C9]/20 to-transparent" />
                        <div className="text-sm font-semibold text-[#01C0C9] font-heading">Capabilities</div>
                        <div className="h-px flex-1 bg-gradient-to-l from-[#01C0C9]/20 to-transparent" />
                    </div>
                    <ul className="grid gap-2 text-sm text-muted-foreground/90">
                        {agent.capabilities.map((capability: string) => (
                            <li key={capability} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#01C0C9]/40" />
                                {capability}
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};

// Define the agents
const agents: Agent[] = [
    {
        name: "Analytics Agent",
        description: "Aptos data analysis and visualization expert",
        capabilities: ["Portfolio tracking", "Performance analysis", "Risk assessment", "Market insights", "Trend visualization"],
        category: "Analytics",
        icon: BarChart,
        imagePath: analyticsAgentImg
    },
    {
        name: "Aptos Expert",
        description: "Comprehensive knowledge of Aptos blockchain and ecosystem",
        capabilities: ["Protocol guidance", "Technical support", "Development assistance", "Best practices", "Ecosystem insights"],
        category: "Knowledge",
        icon: GraduationCap,
        imagePath: aptosExpertImg
    },
    {
        name: "Coordinator Agent",
        description: "Multi-agent orchestration and task management specialist",
        capabilities: ["Task delegation", "Agent coordination", "Operation monitoring", "Response aggregation", "Performance optimization"],
        category: "System",
        icon: Network,
        imagePath: coordinatorAgentImg
    },
    {
        name: "DeFi Specialist",
        description: "Aptos DeFi operations and protocol specialist",
        capabilities: ["DEX operations", "Lending management", "Yield farming", "Protocol integration", "Transaction optimization"],
        category: "Finance",
        icon: Coins,
        imagePath: defiAgentImg
    },
    {
        name: "Meme Agent",
        description: "Creative content and social media engagement specialist",
        capabilities: ["Meme creation", "Social engagement", "Content strategy", "Brand awareness", "Community building"],
        category: "Marketing",
        icon: Image,
        imagePath: memeAgentImg
    }
];

export default function Agents() {
    return (
        <div className="min-h-screen bg-background">
            <HomeHeader />
            <div className="py-16 container space-y-20">
                <div className="text-center space-y-6">
                    <h1 className="text-5xl font-black title-gradient font-heading">ADAS Agent Swarm</h1>
                    <p className="text-xl text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed">
                        Explore our suite of AI agents designed to revolutionize Aptos DeFi operations through specialized expertise and intelligent coordination.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {agents.map((agent) => (
                        <AgentCard key={agent.name} agent={agent} />
                    ))}
                </div>
            </div>
        </div>
    );
}
