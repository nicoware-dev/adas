"use client";

import { useEffect, useState, useRef } from "react";

import Ai16z from '../assets/logos-ext/ai16z.svg';
import Aptos from '../assets/logos-ext/aptos.svg';
import Aries from '../assets/logos-ext/aries.svg';
import Amnis from '../assets/logos-ext/amnis.svg';
import Coingecko from '../assets/logos-ext/coingecko.svg';
import Defillama from '../assets/logos-ext/defillama.svg';
import Discord from '../assets/logos-ext/discord.svg';
import ElizaOS from '../assets/logos-ext/elizaos.svg';
import GeckoTerminal from '../assets/logos-ext/geckoterminal.svg';
import JouleFinance from '../assets/logos-ext/joule-finance.svg';
import Liquidswap from '../assets/logos-ext/liquidswap.svg';
import MerkleTrade from '../assets/logos-ext/merkle-trade.svg';
import N8n from '../assets/logos-ext/n8n.svg';
import Telegram from '../assets/logos-ext/telegram.svg';
import Thala from '../assets/logos-ext/thala.svg';
import XDark from '../assets/logos-ext/x_dark.svg';

const logos = [
  { id: "aptos", src: Aptos, alt: "Aptos" },
  { id: "thala", src: Thala, alt: "Thala" },
  { id: "liquidswap", src: Liquidswap, alt: "Liquidswap" },
  { id: "aries", src: Aries, alt: "Aries" },
  { id: "amnis", src: Amnis, alt: "Amnis" },
  { id: "merkle-trade", src: MerkleTrade, alt: "Merkle Trade" },
  { id: "joule-finance", src: JouleFinance, alt: "Joule Finance" },
  { id: "ai16z", src: Ai16z, alt: "AI16Z" },
  { id: "elizaos", src: ElizaOS, alt: "ElizaOS" },
  { id: "n8n", src: N8n, alt: "n8n" },
  { id: "telegram", src: Telegram, alt: "Telegram" },
  { id: "x_dark", src: XDark, alt: "X" },
  { id: "discord", src: Discord, alt: "Discord" },
  { id: "defillama", src: Defillama, alt: "DefiLlama" },
  { id: "geckoterminal", src: GeckoTerminal, alt: "GeckoTerminal" },
  { id: "coingecko", src: Coingecko, alt: "CoinGecko" },
];

export function LogoCarousel() {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const scrollContainer = containerRef.current;
    const totalWidth = scrollContainer.scrollWidth / 2;
    let animationFrameId: number;

    const scroll = () => {
      if (!isHovered) {
        scrollPositionRef.current += 1;
        if (scrollPositionRef.current >= totalWidth) {
          scrollPositionRef.current = 0;
        }
        scrollContainer.style.transform = `translateX(-${scrollPositionRef.current}px)`;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    scroll();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isHovered]);

  return (
    <div className="w-full overflow-hidden bg-background/80 backdrop-blur-sm border-y border-white/[0.08] py-12">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={containerRef}
          className="flex space-x-12 whitespace-nowrap"
          style={{
            willChange: 'transform',
          }}
        >
          {/* First set of logos */}
          {logos.map((logo) => (
            <div
              key={`first-${logo.id}`}
              className="inline-block w-32 h-16 flex-shrink-0"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="w-full h-full object-contain filter brightness-75 hover:brightness-100 transition-all duration-300"
                title={logo.alt}
              />
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {logos.map((logo) => (
            <div
              key={`second-${logo.id}`}
              className="inline-block w-32 h-16 flex-shrink-0"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="w-full h-full object-contain filter brightness-75 hover:brightness-100 transition-all duration-300"
                title={logo.alt}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
