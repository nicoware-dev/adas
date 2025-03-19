import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/layout/hero";
import { Footer } from "@/components/layout/footer";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Bot,
  Shield,
  Zap,
  BarChart3,
  Wallet,
  LineChart,
  MessageCircle,
  BookOpen,
  Coins,
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
  CarouselNext,
  type CarouselApi
} from "@/components/ui/carousel";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Landing() {
  const navigate = useNavigate();

  // Create carousel API state for auto-scrolling
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Create intersection observer references for each section
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [architectureRef, architectureInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [integrationsRef, integrationsInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [defiRef, defiInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [_analyticsRef, _analyticsInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [_markdownRef, _markdownInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [_techRef, _techInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: () => apiClient.getAgents(),
  });

  // Auto-scroll the carousel
  useEffect(() => {
    if (!carouselApi) return;

    // Start auto-scroll interval when the carousel is in view
    let interval: NodeJS.Timeout;

    if (integrationsInView) {
      interval = setInterval(() => {
        carouselApi.scrollNext();
      }, 3000); // Scroll every 3 seconds
    }

    // Clean up interval on unmount or when not in view
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [integrationsInView, carouselApi]);

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
    <div className="flex flex-col min-h-screen overflow-hidden w-full">
      <Header />
      <main className="flex-1 overflow-hidden w-full">
        <Hero onGetStarted={handleGetStarted} />

        {/* Main Features Section */}
        <section className="py-12 md:py-24 bg-background" ref={featuresRef}>
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Core Features</h2>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Revolutionizing Aptos DeFi with AI-Powered Agent Swarms
              </p>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <Bot className="h-10 w-10 mb-2 text-primary" />
                    </motion.div>
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
              </motion.div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.1 }}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <MessageCircle className="h-10 w-10 mb-2 text-primary" />
                    </motion.div>
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
              </motion.div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.2 }}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <Shield className="h-10 w-10 mb-2 text-primary" />
                    </motion.div>
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
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="bg-muted py-16 relative" ref={architectureRef}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/0"
            initial={{ opacity: 0 }}
            animate={{ opacity: architectureInView ? 1 : 0 }}
            transition={{ duration: 1 }}
          />
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              animate={architectureInView ? "visible" : "hidden"}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Multi-Agent Architecture</h2>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Specialized agents working together for optimal DeFi operations
              </p>
            </motion.div>
            <div className="flex flex-col md:flex-row items-center gap-12 max-w-6xl mx-auto">
              <motion.div
                className="md:w-1/2"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: architectureInView ? 1 : 0, x: architectureInView ? 0 : -50 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <motion.img
                    src="/assets/images/architecture-diagram.png"
                    alt="ADAS Multi-Agent Architecture"
                    className="w-full h-auto"
                    whileInView={{ scale: [0.95, 1] }}
                    transition={{ duration: 0.5 }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      // Fallback to a placeholder if image fails to load
                      e.currentTarget.src = "https://placehold.co/600x400/2d3748/white?text=Multi-Agent+Architecture";
                    }}
                  />
                </div>
              </motion.div>
              <motion.div
                className="md:w-1/2"
                initial="hidden"
                animate={architectureInView ? "visible" : "hidden"}
                variants={staggerContainer}
              >
                <motion.h3
                  className="text-2xl font-bold mb-4"
                  variants={fadeInUp}
                >
                  Agent Structure
                </motion.h3>
                <motion.ul className="space-y-4">
                  <motion.li
                    className="flex items-start gap-3"
                    variants={fadeInUp}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.div
                      className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Bot className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold">Coordinator Agent</h4>
                      <p className="text-sm text-muted-foreground">Orchestrates interactions between specialized agents, ensuring optimal task execution</p>
                    </div>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    variants={fadeInUp}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <BarChart3 className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold">Analytics Agent</h4>
                      <p className="text-sm text-muted-foreground">Provides real-time market data, token prices, and protocol analytics</p>
                    </div>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    variants={fadeInUp}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Wallet className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold">DeFi Agent</h4>
                      <p className="text-sm text-muted-foreground">Executes blockchain transactions, wallet operations, and protocol interactions</p>
                    </div>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    variants={fadeInUp}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div
                      className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <BookOpen className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold">Aptos Expert Agent</h4>
                      <p className="text-sm text-muted-foreground">Provides technical guidance and access to the Aptos knowledge base</p>
                    </div>
                  </motion.li>
                </motion.ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tools & Integrations Carousel */}
        <section className="py-16 relative" ref={integrationsRef}>
          <div className="absolute inset-0 mx-auto w-full max-w-7xl aspect-video overflow-hidden">
            <motion.div
              className="absolute bg-primary/5 rounded-full blur-3xl opacity-30"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: integrationsInView ? 1 : 0.8, opacity: integrationsInView ? 0.3 : 0 }}
              transition={{ duration: 1.5 }}
              style={{
                top: '50%',
                left: '50%',
                width: '80%',
                height: '80%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              animate={integrationsInView ? "visible" : "hidden"}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Tools & Integrations</h2>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Powered by leading Aptos protocols and cutting-edge technologies
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: integrationsInView ? 1 : 0, y: integrationsInView ? 0 : 20 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="max-w-6xl mx-auto"
            >
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
                setApi={setCarouselApi}
              >
                <CarouselContent>
                  {integrations.map((integration, i) => (
                    <CarouselItem key={`${integration.name}-${i}`} className="md:basis-1/3 lg:basis-1/5">
                      <div className="p-1">
                        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                          <Card className="h-full border border-border/50 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300">
                            <CardContent className="flex flex-col items-center justify-center p-6">
                              <motion.div
                                className="rounded-full bg-background p-4 w-20 h-20 flex items-center justify-center mb-4"
                                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(0,0,0,0.1)" }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                              >
                                {/* Fallback to an icon if the logo is missing */}
                                <div className="flex items-center justify-center w-full h-full">
                                  {integration.logo ? (
                                    <img
                                      src={integration.logo}
                                      alt={`${integration.name} logo`}
                                      className="max-w-full max-h-full"
                                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add('bg-primary/10');
                                      }}
                                    />
                                  ) : (
                                    <Network className="h-8 w-8 text-primary" />
                                  )}
                                </div>
                              </motion.div>
                              <h3 className="font-semibold text-center">{integration.name}</h3>
                              <p className="text-xs text-muted-foreground text-center">{integration.type}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 lg:left-4" />
                <CarouselNext className="right-2 lg:right-4" />
              </Carousel>
            </motion.div>
          </div>
        </section>

        {/* DeFi Capabilities Section */}
        <section className="bg-muted py-16" ref={defiRef}>
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              animate={defiInView ? "visible" : "hidden"}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Aptos DeFi Simplified</h2>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Seamlessly interact with the entire Aptos ecosystem
              </p>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
              initial="hidden"
              animate={defiInView ? "visible" : "hidden"}
              variants={staggerContainer}
            >
              {[
                {
                  icon: <Wallet className="h-8 w-8 mb-2 text-primary" />,
                  title: "Wallet Management",
                  description: "View balances, transfer tokens, and manage your portfolio with real-time USD values"
                },
                {
                  icon: <Coins className="h-8 w-8 mb-2 text-primary" />,
                  title: "Lending & Borrowing",
                  description: "Deposit, borrow, repay, and withdraw from Joule Finance and Aries Protocol with natural language commands"
                },
                {
                  icon: <Zap className="h-8 w-8 mb-2 text-primary" />,
                  title: "Swapping & Liquidity",
                  description: "Execute swaps and manage liquidity positions on Thala Labs and Liquidswap DEXes"
                },
                {
                  icon: <LineChart className="h-8 w-8 mb-2 text-primary" />,
                  title: "Trading & Staking",
                  description: "Place orders on Merkle Trade and stake tokens on Amnis Finance for yield generation"
                }
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Card className="bg-card h-full hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-2">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: defiInView ? 1 : 0.8, opacity: defiInView ? 1 : 0 }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                        >
                          {item.icon}
                        </motion.div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{item.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section - Changed from blue to darker */}
        <section className="bg-card border-t py-16" ref={ctaRef}>
          <div className="container px-4 md:px-6 mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: ctaInView ? 1 : 0, y: ctaInView ? 0 : 20 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-6">Ready to Simplify Your Aptos DeFi Experience?</h2>
              <p className="text-muted-foreground mb-8">
                Get started with ADAS today and explore the future of blockchain interaction through natural language. No complex interfaces, just simple conversations.
              </p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: ctaInView ? 1 : 0, y: ctaInView ? 0 : 20 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 relative overflow-hidden group"
                  >
                    <span className="relative z-10">Try ADAS Now</span>
                    <span className="absolute inset-0 bg-primary-foreground/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10 relative overflow-hidden group"
                    onClick={() => navigate('/docs')}
                  >
                    <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">Read Documentation</span>
                    <span className="absolute inset-0 bg-primary/5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
