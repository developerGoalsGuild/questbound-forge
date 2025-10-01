import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface FieldTooltipProps {
  hint?: string;
  fieldLabel: string;
  targetId: string;
  iconLabelTemplate?: string;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({
  hint,
  fieldLabel,
  targetId,
  iconLabelTemplate = 'More information about {field}'
}) => {
  if (!hint) {
    return null;
  }

  const createHintId = (id: string) => `${id}-hint`;
  const formatHintLabel = (fieldLabel: string) => {
    const safeLabel = fieldLabel && fieldLabel.trim().length > 0 ? fieldLabel.trim() : 'this field';
    if (iconLabelTemplate.includes('{field}')) {
      return iconLabelTemplate.replace('{field}', safeLabel);
    }
    return `${iconLabelTemplate} ${safeLabel}`.trim();
  };

  const descriptionId = createHintId(targetId);
  const tooltipId = `${descriptionId}-content`;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={formatHintLabel(fieldLabel)}
            aria-describedby={descriptionId}
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          id={tooltipId}
          role="tooltip"
          side="top"
          align="start"
          aria-labelledby={descriptionId}
          className="max-w-xs text-sm leading-relaxed"
        >
          {hint}
        </TooltipContent>
      </Tooltip>
      <span id={descriptionId} className="sr-only">
        {hint}
      </span>
    </>
  );
};

export default FieldTooltip;
