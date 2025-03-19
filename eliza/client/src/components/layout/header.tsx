import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <img src="/elizaos-icon.png" alt="Logo" className="h-8 w-auto" />
          <span className="font-bold text-xl">ElizaOS</span>
        </NavLink>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/agents" className="text-sm font-medium hover:text-primary">
            Agents
          </NavLink>
          <NavLink to="https://elizaos.github.io/eliza/docs/intro/" target="_blank" className="text-sm font-medium hover:text-primary">
            Documentation
          </NavLink>
          <Button onClick={handleGetStarted}>
            Get Started
          </Button>
        </nav>

        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="container md:hidden py-4 pb-6">
          <nav className="flex flex-col gap-4">
            <NavLink to="/agents" className="text-sm font-medium hover:text-primary">
              Agents
            </NavLink>
            <NavLink to="https://elizaos.github.io/eliza/docs/intro/" target="_blank" className="text-sm font-medium hover:text-primary">
              Documentation
            </NavLink>
            <Button className="w-full" onClick={handleGetStarted}>
              Get Started
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
