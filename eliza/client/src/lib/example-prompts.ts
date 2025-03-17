import type { UUID } from "@elizaos/core";

export const examplePrompts = {
  default: [
    "Tell me about yourself",
    "What can you help me with?",
    "How does this work?",
    "What features do you have?",
    "Can you explain how to use this platform?",
    "What kind of tasks can you assist with?",
  ],
  // Add agent-specific prompts if needed
  specificAgent: {
    // Example format for agent-specific prompts
    // "agent-id-1": [
    //   "Custom prompt 1",
    //   "Custom prompt 2",
    // ],
  } as Record<UUID, string[]>,
};

export function getPromptsForAgent(agentId: UUID): string[] {
  return examplePrompts.specificAgent?.[agentId] || examplePrompts.default;
}
