import { Shield, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className = '' }: VerifiedBadgeProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary cursor-default select-none ${className}`}
            aria-label="Verified company — reviewed by the REP | IV team"
          >
            <Shield size={11} className="shrink-0" />
            <span>Verified company</span>
            <Info size={10} className="shrink-0 opacity-60" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          Reviewed by the REP | IV team. Work email, business and hiring contact confirmed.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
