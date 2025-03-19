import { Button } from "@/components/ui/button";
import { getPromptsForAgent } from "@/lib/example-prompts";
import { Lightbulb } from "lucide-react";
import type { UUID } from "@elizaos/core";

interface ExamplePromptsProps {
  agentId: UUID;
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

export function HeaderExamplePrompts({ agentId, onSelectPrompt, className }: ExamplePromptsProps) {
  const prompts = getPromptsForAgent(agentId);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span className="text-sm font-medium">Try asking</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {prompts.map((prompt) => (
          <Button
            key={`header-${prompt}`}
            variant="outline"
            className="justify-start h-auto py-2 px-3 text-left text-sm"
            onClick={() => onSelectPrompt(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function EmptyStateExamplePrompts({ agentId, onSelectPrompt, className }: ExamplePromptsProps) {
  const prompts = getPromptsForAgent(agentId);

  return (
    <div className={`flex flex-col gap-3 max-w-md w-full ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span className="text-sm font-medium">Try these examples</span>
      </div>
      <div className="flex flex-col gap-2">
        {prompts.map((prompt) => (
          <Button
            key={`empty-state-${prompt}`}
            variant="outline"
            className="justify-start h-auto py-2 px-3 text-left text-sm w-full"
            onClick={() => onSelectPrompt(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}
