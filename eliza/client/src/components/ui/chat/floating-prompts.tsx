import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingPromptsProps {
  prompts: string[] | any[];
  onPromptClick: (prompt: string) => void;
}

export function FloatingPrompts({ prompts, onPromptClick }: FloatingPromptsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!prompts || prompts.length === 0) return null;

  const handlePromptClick = (prompt: any) => {
    // Handle both string prompts and object prompts with a text property
    const promptText = typeof prompt === 'string' ? prompt : prompt.text;
    onPromptClick(promptText);
    setIsOpen(false);
  };

  const getPromptText = (prompt: any): string => {
    return typeof prompt === 'string' ? prompt : prompt.text || '';
  };

  const getPromptKey = (prompt: any, index: number): string => {
    const promptText = getPromptText(prompt);
    const shortText = promptText.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    return `prompt-${index}-${shortText || index}`;
  };

  const toggleAllPrompts = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-24 right-4 z-20 flex flex-col items-end gap-2">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full shadow-md border-[#1B3B3B] bg-[#09181B]",
            "hover:bg-[#01C0C9]/10 hover:text-[#01C0C9] hover:border-[#01C0C9]/50",
            "transition-colors duration-200"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-[#01C0C9]" />
          ) : (
            <Lightbulb className="h-5 w-5 text-[#01C0C9]" />
          )}
        </Button>

        {isOpen && (
          <div className="flex flex-col gap-2 items-end mb-2 animate-fade-in">
            <div className="bg-[#09181B] p-3 rounded-lg shadow-lg border border-[#1B3B3B] max-w-[280px]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-[#01C0C9] font-heading">Example prompts</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-[#01C0C9]/10 hover:text-[#01C0C9] font-heading"
                  onClick={toggleAllPrompts}
                >
                  View all
                </Button>
              </div>
              <div className="space-y-2">
                {prompts.slice(0, 3).map((prompt, index) => {
                  const promptText = getPromptText(prompt);
                  return (
                    <Button
                      key={getPromptKey(prompt, index)}
                      variant="ghost"
                      className="w-full justify-start text-left text-sm h-auto py-2 px-3 font-normal hover:bg-[#01C0C9]/10 hover:text-foreground"
                      onClick={() => handlePromptClick(prompt)}
                    >
                      {promptText.length > 60 ? `${promptText.substring(0, 57)}...` : promptText}
                    </Button>
                  );
                })}
                {prompts.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs text-muted-foreground hover:bg-[#01C0C9]/10 hover:text-[#01C0C9] font-heading"
                    onClick={toggleAllPrompts}
                  >
                    <ChevronUp className="h-3 w-3 mr-1" />
                    View {prompts.length - 3} more
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#09181B] border-[#1B3B3B] max-w-md">
          <DialogHeader>
            <h3 className="text-lg font-medium text-[#01C0C9] font-heading">Example Prompts</h3>
            <p className="text-sm text-muted-foreground">Click on any prompt to use it</p>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            <div className="space-y-1">
              {prompts.map((prompt, index) => {
                const promptText = getPromptText(prompt);
                return (
                  <Button
                    key={getPromptKey(prompt, index)}
                    variant="ghost"
                    className="w-full justify-start text-left text-sm h-auto py-2 px-3 font-normal hover:bg-[#01C0C9]/10 hover:text-foreground"
                    onClick={() => {
                      handlePromptClick(prompt);
                      setIsDialogOpen(false);
                    }}
                  >
                    {promptText}
                  </Button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
