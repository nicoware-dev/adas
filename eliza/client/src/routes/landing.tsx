import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/layout/hero";
import { Footer } from "@/components/layout/footer";
import { useNavigate } from "react-router";
import { Bot, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero onGetStarted={handleGetStarted} />
        <section className="container py-12 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Features</h2>
            <p className="mt-4 text-muted-foreground md:text-xl">
              Discover what makes our platform special
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Bot className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Intelligent Agents</CardTitle>
                <CardDescription>
                  Our AI agents are designed to understand and assist with a wide range of tasks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Each agent is specialized to handle specific domains and can learn from interactions to provide better assistance over time.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Fast Responses</CardTitle>
                <CardDescription>
                  Get instant answers and assistance without waiting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Our platform is optimized for speed, ensuring you get the help you need when you need it.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your data and conversations are protected.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  We prioritize your privacy and implement strong security measures to keep your information safe.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        <section className="bg-muted py-12">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Try our AI agents today and experience the future of intelligent assistance.
            </p>
            <Button size="lg" onClick={handleGetStarted}>
              Try Our Agents
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
