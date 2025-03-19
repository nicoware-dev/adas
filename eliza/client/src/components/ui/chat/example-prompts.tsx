import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

export interface ExamplePrompt {
  text: string;
  icon?: React.ReactNode;
}

interface ExamplePromptsProps {
  prompts: string[] | ExamplePrompt[];
  onPromptClick: (prompt: string) => void;
  className?: string;
}

export function ExamplePrompts({ prompts, onPromptClick, className }: ExamplePromptsProps) {
  if (!prompts || prompts.length === 0) return null;

  const getPromptText = (prompt: string | ExamplePrompt): string => {
    return typeof prompt === 'string' ? prompt : prompt.text;
  };

  const getPromptKey = (prompt: string | ExamplePrompt, index: number): string => {
    const promptText = getPromptText(prompt);
    const shortText = promptText.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    return `prompt-${index}-${shortText || index}`;
  };

  const handleClick = (prompt: string | ExamplePrompt) => {
    const promptText = getPromptText(prompt);
    onPromptClick(promptText);
  };

  return (
    <div className={cn("grid grid-cols-1 gap-2", className)}>
      {prompts.map((prompt, index) => {
        const promptText = getPromptText(prompt);
        return (
          <Button
            key={getPromptKey(prompt, index)}
            variant="outline"
            className="flex items-center justify-start gap-2 p-3 h-auto text-left border-[#1B3B3B] bg-[#09181B] hover:bg-[#01C0C9]/10 hover:border-[#01C0C9]/50 text-white transition-all duration-200"
            onClick={() => handleClick(prompt)}
          >
            {typeof prompt !== 'string' && prompt.icon && (
              <span className="flex-shrink-0 text-[#01C0C9]">{prompt.icon}</span>
            )}
            <span className="truncate">{promptText}</span>
          </Button>
        );
      })}
    </div>
  );
}
