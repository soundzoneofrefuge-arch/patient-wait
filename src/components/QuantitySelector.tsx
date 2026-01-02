import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  className?: string;
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  className,
}: QuantitySelectorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-full p-1 shadow-md",
        className
      )}
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onDecrease();
        }}
        className="h-7 w-7 rounded-full hover:bg-destructive/20 hover:text-destructive"
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="min-w-[24px] text-center font-bold text-sm text-foreground">
        {quantity}
      </span>
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onIncrease();
        }}
        className="h-7 w-7 rounded-full hover:bg-primary/20 hover:text-primary"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
