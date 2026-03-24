"use client";

import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/zakatCalculator";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  title: string;
  total: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onAdd: () => void;
  addLabel?: string;
  icon?: React.ReactNode;
  /** Show total in destructive style (for liabilities) */
  destructive?: boolean;
}

export function SectionWrapper({
  title,
  total,
  children,
  defaultOpen = false,
  onAdd,
  addLabel = "Add Item",
  icon,
  destructive = false,
}: SectionWrapperProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between w-full cursor-pointer select-none px-5 py-4 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3">
              {icon && (
                <span className="text-muted-foreground">{icon}</span>
              )}
              <span className="text-sm font-semibold sm:text-base">{title}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={destructive ? "destructive" : "secondary"}
                className="font-mono text-xs sm:text-sm px-2.5 py-0.5"
              >
                {destructive ? "- " : ""}{formatPKR(total)}
              </Badge>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-5 pb-5 pt-0 space-y-4">
            <div className="border-t pt-4">
              {children}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => { e.preventDefault(); onAdd(); }}
              className="w-full border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" />
              {addLabel}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
