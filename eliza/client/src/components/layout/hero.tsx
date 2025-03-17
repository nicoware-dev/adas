import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";

interface HeroProps {
  onGetStarted?: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Intelligent AI Assistants at Your Service
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Interact with specialized AI agents designed to help you with various tasks.
                Our platform provides seamless AI integration for your everyday needs.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              {onGetStarted ? (
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={onGetStarted}
                >
                  Get Started
                </Button>
              ) : (
                <NavLink to="/agents">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">Get Started</Button>
                </NavLink>
              )}
              <NavLink to="https://elizaos.github.io/eliza/docs/intro/" target="_blank">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </NavLink>
            </div>
          </div>
          <div className="mx-auto lg:ml-auto">
            <div className="relative w-full aspect-video overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl"></div>
              <img
                alt="AI Assistant Platform"
                className="w-full h-full object-cover rounded-xl"
                src="/elizaos-icon.png"
                width="550"
                height="310"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
