import type { ExamplePrompt } from '@/components/ui/chat/example-prompts';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, Wallet, ArrowRightLeft, Coins, Search, Info, BarChart3, Zap, DollarSign, Layers, Shield, Compass, Code, Book, PieChart } from 'lucide-react';

// Define example prompts for different agent types
export const getExamplePrompts = (agentName?: string): ExamplePrompt[] => {
  // Default prompts that work with any agent
  const defaultPrompts: ExamplePrompt[] = [
    {
      text: "What is ADAS?",
      icon: <Info className="h-4 w-4" />,
    },
    {
      text: "What can you help me with?",
      icon: <TrendingUp className="h-4 w-4" />,
    }
  ];

  // Analytics Agent prompts
  if (agentName?.toLowerCase().includes('analytics')) {
    return [
      {
        text: "What's the TVL of Aptos?",
        icon: <PieChart className="h-4 w-4" />,
      },
      {
        text: "Show me Joule's TVL",
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        text: "Get prices for APT, BTC, and ETH",
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        text: "What are the top protocols on Aptos?",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        text: "Which pools have the most trading activity on Aptos?",
        icon: <Layers className="h-4 w-4" />,
      }
    ];
  }

  // DeFi Agent prompts
  if (agentName?.toLowerCase().includes('defi')) {
    return [
      {
        text: "Show my portfolio",
        icon: <Wallet className="h-4 w-4" />,
      },
      {
        text: "Supply 0.01 APT to Joule Finance",
        icon: <Coins className="h-4 w-4" />,
      },
      {
        text: "Swap 0.01 APT for USDC on Liquidswap",
        icon: <ArrowRightLeft className="h-4 w-4" />,
      },
      {
        text: "Stake 0.2 APT in Amnis Finance",
        icon: <Coins className="h-4 w-4" />,
      },
      {
        text: "Transfer 0.001 APT to 0x17a8c3f994621216ad8bac210eb7de3346268696bc14e89e254fd4c7a0c0ed82",
        icon: <Search className="h-4 w-4" />,
      },
      {
        text: "Mint 1000 MTK2 tokens (Address: 0x4717b796ed683a11c5946ec13aa982fd4304a73906d12a5bb5558d5238a3a15c) to 0x39a77791f641bd4e16a7f1774e5d5df5d38c03e4843d315c15ac01e01baa0b0c",
        icon: <Zap className="h-4 w-4" />,
      }
    ];
  }

  // Aptos Expert Agent prompts
  if (agentName?.toLowerCase().includes('expert')) {
    return [
      {
        text: "Compare the resource-oriented programming models of Move vs Solidity, and explain how Move's ownership system enhances DeFi security",
        icon: <Book className="h-4 w-4" />,
      },
      {
        text: "Explain how Joule Finance's isolated lending markets work technically, including the role of jTokens and health factors",
        icon: <Code className="h-4 w-4" />,
      },
      {
        text: "What makes Aptos's Block-STM unique, and how does its parallel execution engine achieve high throughput?",
        icon: <Compass className="h-4 w-4" />,
      },
      {
        text: "Analyze the risks and benefits of recursive borrowing strategies across Joule and Thala, including liquidation scenarios",
        icon: <Shield className="h-4 w-4" />,
      },
      {
        text: "Explain how Thala's MOD stablecoin maintains its peg through overcollateralization and stability mechanisms",
        icon: <Zap className="h-4 w-4" />,
      }
    ];
  }

  return defaultPrompts;
};
