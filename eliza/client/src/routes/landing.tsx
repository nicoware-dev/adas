import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/layout/hero";
import { Footer } from "@/components/layout/footer";
import { useNavigate } from "react-router";
import {
  Bot,
  Shield,
  Zap,
  BarChart3,
  Wallet,
  LineChart,
  LayoutDashboard,
  MessageCircle,
  Code,
  Coins,
  BookOpen,
  Network
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export default function Landing() {
  const navigate = useNavigate();

  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: () => apiClient.getAgents(),
  });

  const handleGetStarted = () => {
    if (agentsQuery.data?.agents?.length > 0) {
      const firstAgent = agentsQuery.data.agents[0];
      navigate(`/chat/${firstAgent.id}`);
    } else {
      // Fallback to agents page if no agents are available
      navigate("/agents");
    }
  };

  const integrations = [
    { name: "Aptos", logo: "/assets/logos/aptos-logo.png", type: "Blockchain" },
    { name: "ElizaOS", logo: "/assets/logos/elizaos-logo.png", type: "Agent Framework" },
    { name: "Joule", logo: "/assets/logos/joule-logo.png", type: "Lending Protocol" },
    { name: "Amnis", logo: "/assets/logos/amnis-logo.png", type: "Staking Protocol" },
    { name: "Thala", logo: "/assets/logos/thala-logo.png", type: "DEX" },
    { name: "Liquidswap", logo: "/assets/logos/liquidswap-logo.png", type: "DEX" },
    { name: "Merkle", logo: "/assets/logos/merkle-logo.png", type: "Trading" },
    { name: "Aries", logo: "/assets/logos/aries-logo.png", type: "Lending Protocol" },
    { name: "CoinGecko", logo: "/assets/logos/coingecko-logo.png", type: "Price Data" },
    { name: "DefiLlama", logo: "/assets/logos/defillama-logo.png", type: "TVL Data" },
    { name: "n8n", logo: "/assets/logos/n8n-logo.png", type: "Workflow Automation" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero onGetStarted={handleGetStarted} />

        {/* Main Features Section */}
        <section className="container py-12 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Core Features</h2>
            <p className="mt-4 text-muted-foreground md:text-xl">
              Revolutionizing Aptos DeFi with AI-Powered Agent Swarms
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Bot className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Multi-Agent System</CardTitle>
                <CardDescription>
                  Specialized agents working together for optimal performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Our platform leverages a sophisticated Multi-Agent System where specialized agents handle different tasks—from analytics to executing transactions—enabling modular, scalable, and fault-tolerant operations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <MessageCircle className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Natural Language Interface</CardTitle>
                <CardDescription>
                  Interact with DeFi using simple conversational prompts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Communicate with the Aptos blockchain and DeFi protocols through natural language. No need to learn complex interfaces or command syntaxes—just tell ADAS what you want to do.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Secure & Transparent</CardTitle>
                <CardDescription>
                  Your assets and data are protected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Control your own private keys and approve all transactions. Our open-source codebase ensures complete transparency, giving you full authority over your assets and interactions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="bg-muted py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Multi-Agent Architecture</h2>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Specialized agents working together for optimal DeFi operations
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/assets/images/architecture-diagram.png"
                    alt="ADAS Multi-Agent Architecture"
                    className="w-full h-auto"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      e.currentTarget.src = "https://placehold.co/600x400/2d3748/white?text=Multi-Agent+Architecture";
                    }}
                  />
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold mb-4">Agent Structure</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Coordinator Agent</h4>
                      <p className="text-sm text-muted-foreground">Orchestrates interactions between specialized agents, ensuring optimal task execution</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Analytics Agent</h4>
                      <p className="text-sm text-muted-foreground">Provides real-time market data, token prices, and protocol analytics</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">DeFi Agent</h4>
                      <p className="text-sm text-muted-foreground">Executes blockchain transactions, wallet operations, and protocol interactions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Aptos Expert Agent</h4>
                      <p className="text-sm text-muted-foreground">Provides technical guidance and access to the Aptos knowledge base</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Tools & Integrations Carousel */}
        <section className="container py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Tools & Integrations</h2>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Powered by leading Aptos protocols and cutting-edge technologies
              </p>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {integrations.map((integration, index) => (
                  <CarouselItem key={index} className="md:basis-1/3 lg:basis-1/5">
                    <div className="p-1">
                      <Card className="h-full">
                        <CardContent className="flex flex-col items-center justify-center p-6">
                          <div className="rounded-full bg-background p-4 w-20 h-20 flex items-center justify-center mb-4">
                            {/* Fallback to an icon if the logo is missing */}
                            <div className="flex items-center justify-center w-full h-full">
                              {integration.logo ? (
                                <img
                                  src={integration.logo}
                                  alt={`${integration.name} logo`}
                                  className="max-w-full max-h-full"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.classList.add('bg-primary/10');
                                  }}
                                />
                              ) : (
                                <Network className="h-8 w-8 text-primary" />
                              )}
                            </div>
                          </div>
                          <h3 className="font-semibold text-center">{integration.name}</h3>
                          <p className="text-xs text-muted-foreground text-center">{integration.type}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>
        </section>

        {/* DeFi Capabilities Section */}
        <section className="bg-muted py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Aptos DeFi Simplified</h2>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Seamlessly interact with the entire Aptos ecosystem
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <Wallet className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle className="text-lg">Wallet Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">View balances, transfer tokens, and manage your portfolio with real-time USD values</p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <Coins className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle className="text-lg">Lending & Borrowing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Deposit, borrow, repay, and withdraw from Joule Finance and Aries Protocol with natural language commands</p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <Zap className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle className="text-lg">Swapping & Liquidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Execute swaps and manage liquidity positions on Thala Labs and Liquidswap DEXes</p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <LineChart className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle className="text-lg">Trading & Staking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Place orders on Merkle Trade and stake tokens on Amnis Finance for yield generation</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="container py-16">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">Real-Time Analytics & Insights</h2>
              <p className="text-muted-foreground mb-6">
                Make informed decisions with comprehensive data from multiple sources, all accessible through natural language queries.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <BarChart3 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Token Prices & Market Data</h3>
                    <p className="text-sm text-muted-foreground">Real-time price data via CoinGecko for APT and other cryptocurrencies</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <LineChart className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">TVL Tracking</h3>
                    <p className="text-sm text-muted-foreground">Monitor Total Value Locked across chains and protocols via DeFiLlama</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <LayoutDashboard className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">DEX Analytics</h3>
                    <p className="text-sm text-muted-foreground">Track trading volumes, liquidity, and pool performance with GeckoTerminal data</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 bg-muted p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Example Analytics Queries:</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-background p-3 rounded-md">"What's the current price of APT?"</div>
                <div className="bg-background p-3 rounded-md">"What's the TVL of Thala on Aptos?"</div>
                <div className="bg-background p-3 rounded-md">"Show me the top 5 pools on Aptos by volume"</div>
                <div className="bg-background p-3 rounded-md">"Compare the TVL of Joule and Amnis"</div>
              </div>
            </div>
          </div>
        </section>

        {/* Markdown Formatting Section */}
        <section className="bg-muted py-16">
          <div className="container">
            <div className="flex flex-col-reverse md:flex-row items-center gap-12">
              <div className="md:w-1/2 bg-background p-6 rounded-lg font-mono text-sm">
                <div className="mb-2 text-primary font-bold"># Portfolio</div>
                <div className="mb-2">**Wallet Address**: 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c</div>
                <div className="mb-2">## Tokens</div>
                <div className="mb-2">- **APT** (Aptos Coin): 1.361169 APT - $7.27</div>
                <div className="mb-2">- **stAPT** (Staked APT): 0.243765 stAPT - $1.47</div>
                <div className="mb-2">- **amAPT** (Amnis APT): 0.225344 amAPT - $1.20</div>
                <div className="mb-2">- **USDC**: 0.037232 USDC - $0.04</div>
                <div className="mb-2">**Total Value**: $9.97</div>
              </div>
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">Beautiful, Readable Responses</h2>
                <p className="text-muted-foreground mb-6">
                  All responses are formatted with Markdown support for better readability and organization. Complex data like portfolio information, protocol details, and analytics results are presented in a clear, structured format.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">1</div>
                    <div>
                      <h3 className="font-semibold">Rich Text Formatting</h3>
                      <p className="text-sm text-muted-foreground">Headings, lists, and emphasis for structured information</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">2</div>
                    <div>
                      <h3 className="font-semibold">Code Snippets</h3>
                      <p className="text-sm text-muted-foreground">Properly formatted wallet addresses and transaction details</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">3</div>
                    <div>
                      <h3 className="font-semibold">Persistent Chat History</h3>
                      <p className="text-sm text-muted-foreground">Your conversations are saved across sessions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Section */}
        <section className="container py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Powered by Advanced Technology</h2>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Built with cutting-edge tools and frameworks
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Code className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Move Agent Kit Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Leverages production-ready implementations for interacting with Aptos protocols, ensuring reliable and secure blockchain operations.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <BookOpen className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>RAG Knowledge Base</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Comprehensive Aptos DeFi knowledge integrated with AI to provide accurate information and guidance for all your blockchain questions.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Bot className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>ElizaOS Framework</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Built on the powerful ElizaOS agent framework, enabling modular architecture, plugin support, and multi-LLM provider compatibility.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section - Changed from blue to darker */}
        <section className="bg-card border-t py-16">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Simplify Your Aptos DeFi Experience?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get started with ADAS today and explore the future of blockchain interaction through natural language. No complex interfaces, just simple conversations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Try ADAS Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                onClick={() => navigate('/docs')}
              >
                Read Documentation
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
