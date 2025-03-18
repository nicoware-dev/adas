import { Button } from "@/components/ui/button";

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted dark:from-background dark:to-background/90">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium mb-2">
              Aptos DeFi Made Simple
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              ADAS: Aptos DefAI<br />Agent Swarm
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Simplify your DeFi experience on the Aptos blockchain with the power of Multi-Agent Systems.
              Interact with DeFi protocols through natural language — no complex interfaces needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={onGetStarted}>
                Get Started
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://github.com/nicoware-dev/adas" target="_blank" rel="noopener noreferrer">
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-70"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-70"></div>
              <img
                src="/assets/images/aptos-agent-hero.png"
                alt="ADAS Agent Interface"
                className="w-full h-auto rounded-lg shadow-xl relative z-10"
                onError={(e) => {
                  // Fallback to a placeholder if image fails to load
                  e.currentTarget.src = "https://placehold.co/600x400/2d3748/white?text=ADAS:+Aptos+DefAI+Agent+Swarm";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
