import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface LightbulbButtonProps {
  onClick?: () => void;
  className?: string;
}

export function LightbulbButton({ onClick, className }: LightbulbButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-8 right-8 z-50 rounded-full p-3",
        "bg-[#172625] border border-[#1B3B3B]",
        "hover:bg-[#01C0C9]/10 hover:border-[#01C0C9]",
        "transition-all duration-300 shadow-lg",
        className
      )}
    >
      <Lightbulb className="h-6 w-6 text-[#01C0C9]" />
    </button>
  );
}
