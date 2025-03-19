import { LineChart as LucideLineChart, BarChart as LucideBarChart, PieChart as LucidePieChart, ArrowUp, ArrowDown, Activity, RefreshCw } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from "@/components/page-header";
import { useOutletContext } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { AptosChainData, AptosProtocolData } from "@/api/defillama";
import { defiLlamaApi } from "@/api/defillama";

interface StatCardProps {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
    isLoading?: boolean;
}

interface TooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        dataKey?: string;
    }>;
    label?: string;
}

const COLORS = [
    '#01C0C9', // Primary
    '#00FCB0', // Secondary
    '#39D8E1', // Accent 1
    '#00787E', // Accent 2
    '#A5F3FF', // Accent 3
    '#319CA0'  // Others
];

function StatCard({ title, value, change, icon, isLoading = false }: StatCardProps) {
    const isPositive = change >= 0;

    return (
        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08]">
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-muted-foreground">{title}</span>
                <div className="p-2 rounded-md bg-white/[0.03]">
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                {isLoading ? (
                    <div className="animate-pulse h-8 w-24 bg-white/[0.05] rounded" />
                ) : (
                    <>
                        <span className="text-2xl font-semibold">{value}</span>
                        <span className={`text-sm flex items-center gap-0.5 ${
                            isPositive ? 'text-green-500' : 'text-red-500'
                        }`}>
                            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {Math.abs(change).toFixed(2)}%
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 border border-white/[0.08] p-3 rounded-lg shadow-lg backdrop-blur-sm">
                <p className="text-sm font-medium">{label}</p>
                {payload.map((entry) => (
                    <p key={entry.name} className="text-sm text-muted-foreground">
                        {entry.name}: ${(entry.value / 1e6).toFixed(2)}M
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

interface OutletContextType {
    headerSlot: boolean;
}

export default function Analytics() {
    const { headerSlot } = useOutletContext<OutletContextType>();
    const [isLoading, setIsLoading] = useState(true);
    const [aptosData, setAptosData] = useState<AptosChainData | null>(null);
    const [protocols, setProtocols] = useState<AptosProtocolData[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Format historical data for charts
    const formattedHistoricalData = aptosData?.historicalData.map(item => ({
        date: new Date(item.date * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tvl: item.tvl
    })) || [];

    // Load data from DefiLlama API
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [chainData, protocolsData] = await Promise.all([
                defiLlamaApi.getAptosData(),
                defiLlamaApi.getAptosProtocols()
            ]);

            setAptosData(chainData);
            setProtocols(protocolsData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error loading analytics data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    if (headerSlot) {
        return <PageHeader title="Aptos Analytics" />;
    }

    // Format protocol data for pie chart (top 5 + Others)
    const protocolChartData = useMemo(() => {
        if (!protocols.length) return [];

        const top5 = protocols.slice(0, 5);
        const others = protocols.slice(5).reduce((acc, p) => acc + p.tvl, 0);

        const chartData = top5.map(protocol => ({
            name: protocol.name,
            value: protocol.tvl
        }));

        if (others > 0) {
            chartData.push({
                name: 'Others',
                value: others
            });
        }

        return chartData;
    }, [protocols]);

    // Calculate 24h volume estimation (example: 8% of TVL)
    const volume24h = aptosData ? aptosData.tvl * 0.08 : 0;

    // Prepare stats cards data
    const stats = [
        {
            id: 'tvl',
            title: "Aptos Total Value Locked",
            value: aptosData ? `$${(aptosData.tvl / 1e6).toFixed(2)}M` : "$0",
            change: aptosData?.change_1d || 0,
            icon: <LucideLineChart className="h-4 w-4 text-[#01C0C9]" />,
            isLoading
        },
        {
            id: 'volume',
            title: "Aptos 24h Volume (est.)",
            value: `$${(volume24h / 1e6).toFixed(2)}M`,
            change: aptosData?.change_1d ? aptosData.change_1d * 1.2 : 0,
            icon: <LucideBarChart className="h-4 w-4 text-[#00FCB0]" />,
            isLoading
        },
        {
            id: 'protocols',
            title: "Active Aptos Protocols",
            value: `${protocols.length} / ${protocols.filter(p => p.tvl > 0).length}`,
            change: 1.5, // Static value for demonstration
            icon: <Activity className="h-4 w-4 text-[#39D8E1]" />,
            isLoading
        },
        {
            id: 'distribution',
            title: "Protocol Distribution",
            value: `Top ${Math.min(protocols.length, 20)} by TVL`,
            change: 2.3, // Static value for demonstration
            icon: <LucidePieChart className="h-4 w-4 text-[#00FCB0]" />,
            isLoading
        }
    ];

    return (
        <div className="min-h-0 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-muted-foreground">
                    {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading data...'}
                </div>
                <button
                    type="button"
                    onClick={loadData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                    <StatCard key={stat.id} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-4">
                    <h3 className="text-sm font-medium mb-4">Aptos TVL Over Time</h3>
                    {isLoading ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-2 border-[#01C0C9] rounded-full border-t-transparent" />
                        </div>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={formattedHistoricalData.slice(-30)}>
                                    <defs>
                                        <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#01C0C9" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#01C0C9" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="rgba(255,255,255,0.5)"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => value}
                                        interval={Math.floor(formattedHistoricalData.length / 10)}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.5)"
                                        tickFormatter={(value: number) => `$${(value / 1e6).toFixed(0)}M`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="tvl"
                                        stroke="#01C0C9"
                                        fillOpacity={1}
                                        fill="url(#tvlGradient)"
                                        strokeWidth={2}
                                        name="TVL"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-4">
                    <h3 className="text-sm font-medium mb-4">Protocol Distribution</h3>
                    {isLoading ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-2 border-[#01C0C9] rounded-full border-t-transparent" />
                        </div>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={protocolChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#01C0C9"
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, value }) => `${name} ($${(value / 1e6).toFixed(1)}M)`}
                                        labelLine={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                                    >
                                        {protocolChartData.map((entry, index) => (
                                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [
                                            `$${(Number(value) / 1e6).toFixed(2)}M`,
                                            'TVL'
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Protocols Table */}
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-4">
                <h3 className="text-sm font-medium mb-4">All Protocols</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-white/[0.08]">
                                <th className="pb-3 text-sm font-medium text-muted-foreground">Protocol</th>
                                <th className="pb-3 text-sm font-medium text-muted-foreground">Category</th>
                                <th className="pb-3 text-sm font-medium text-muted-foreground text-right">TVL</th>
                                <th className="pb-3 text-sm font-medium text-muted-foreground text-right">24h Change</th>
                                <th className="pb-3 text-sm font-medium text-muted-foreground text-right">7d Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {protocols.map((protocol, index) => (
                                <tr
                                    key={protocol.name}
                                    className="border-b border-white/[0.04] last:border-0"
                                >
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: index < 5 ? COLORS[index] : COLORS[5] }} />
                                            {protocol.name}
                                        </div>
                                    </td>
                                    <td className="py-3 text-muted-foreground">{protocol.category || 'DeFi'}</td>
                                    <td className="py-3 text-right">{protocol.formattedTVL}</td>
                                    <td className="py-3 text-right">
                                        <span className={protocol.change_1d && protocol.change_1d >= 0 ? 'text-green-500' : 'text-red-500'}>
                                            {protocol.change_1d ? `${protocol.change_1d.toFixed(2)}%` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className={protocol.change_7d && protocol.change_7d >= 0 ? 'text-green-500' : 'text-red-500'}>
                                            {protocol.change_7d ? `${protocol.change_7d.toFixed(2)}%` : '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
