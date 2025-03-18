import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted dark:from-background dark:to-background/90 overflow-hidden">
      <div className="container px-4 md:px-6 relative">
        {/* Background animation elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.05, scale: 1 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/30"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.05, scale: 1 }}
            transition={{ duration: 2.5, delay: 0.5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
            className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary/20"
          />
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center relative z-10">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <motion.div
              className="inline-block px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Aptos DeFi Made Simple
            </motion.div>
            <motion.h1
              className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              ADAS: Aptos DefAI<br />Agent Swarm
            </motion.h1>
            <motion.p
              className="max-w-[600px] text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              Simplify your DeFi experience on the Aptos blockchain with the power of Multi-Agent Systems.
              Interact with DeFi protocols through natural language — no complex interfaces needed.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              <Button
                size="lg"
                onClick={onGetStarted}
                className="relative overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 bg-primary-foreground/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="group"
              >
                <a
                  href="https://github.com/nicoware-dev/adas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative overflow-hidden"
                >
                  <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">View on GitHub</span>
                  <span className="absolute inset-0 bg-primary/5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="relative w-full max-w-md">
              <motion.div
                className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-70"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0.4, 0.7]
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-70"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 0.5, 0.7]
                }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
              <motion.img
                src="/assets/images/aptos-agent-hero.png"
                alt="ADAS Agent Interface"
                className="w-full h-auto rounded-lg shadow-xl relative z-10"
                initial={{ y: 20 }}
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  // Fallback to a placeholder if image fails to load
                  e.currentTarget.src = "https://placehold.co/600x400/2d3748/white?text=ADAS:+Aptos+DefAI+Agent+Swarm";
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
