import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonFormFieldProps {
  /**
   * Type of form field to render skeleton for
   */
  type?: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'button';
  /**
   * Whether to show a label skeleton
   */
  showLabel?: boolean;
  /**
   * Whether to show an error message skeleton
   */
  showError?: boolean;
  /**
   * Whether to show a hint/tooltip skeleton
   */
  showHint?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Number of lines for textarea (default: 3)
   */
  lines?: number;
  /**
   * Width of the field (default: 'full')
   */
  width?: 'sm' | 'md' | 'lg' | 'full';
}

const SkeletonFormField: React.FC<SkeletonFormFieldProps> = ({
  type = 'input',
  showLabel = true,
  showError = false,
  showHint = false,
  className = '',
  lines = 3,
  width = 'full'
}) => {
  const getWidthClass = () => {
    switch (width) {
      case 'sm': return 'w-32';
      case 'md': return 'w-48';
      case 'lg': return 'w-64';
      case 'full': return 'w-full';
      default: return 'w-full';
    }
  };

  const getFieldHeight = () => {
    switch (type) {
      case 'input': return 'h-10';
      case 'textarea': return `h-${lines * 6}`;
      case 'select': return 'h-10';
      case 'checkbox': return 'h-4 w-4';
      case 'radio': return 'h-4 w-4';
      case 'button': return 'h-10';
      default: return 'h-10';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label skeleton */}
      {showLabel && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          {showHint && <Skeleton className="h-4 w-4 rounded-full" />}
        </div>
      )}
      
      {/* Field skeleton */}
      <div className="relative">
        <Skeleton 
          className={`${getFieldHeight()} ${getWidthClass()} rounded-md`}
        />
        
        {/* Validation icon skeleton */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </div>
      
      {/* Error message skeleton */}
      {showError && (
        <Skeleton className="h-4 w-32" />
      )}
    </div>
  );
};

/**
 * Skeleton for a complete form section
 */
export const SkeletonFormSection: React.FC<{
  fields?: number;
  showTitle?: boolean;
  className?: string;
}> = ({ 
  fields = 3, 
  showTitle = true, 
  className = '' 
}) => (
  <div className={`space-y-6 ${className}`}>
    {showTitle && (
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    )}
    
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <SkeletonFormField
          key={index}
          type={index === fields - 1 ? 'textarea' : 'input'}
          showLabel={true}
          showHint={index % 2 === 0}
          showError={index === 0}
        />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for NLP questions section
 */
export const SkeletonNLPQuestions: React.FC<{
  questions?: number;
  className?: string;
}> = ({ 
  questions = 8, 
  className = '' 
}) => (
  <div className={`space-y-6 ${className}`}>
    <div className="space-y-2">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-4 w-80" />
    </div>
    
    <div className="space-y-4">
      {Array.from({ length: questions }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Skeleton for form actions
 */
export const SkeletonFormActions: React.FC<{
  buttons?: number;
  className?: string;
}> = ({ 
  buttons = 3, 
  className = '' 
}) => (
  <div className={`flex gap-3 justify-end ${className}`}>
    {Array.from({ length: buttons }).map((_, index) => (
      <Skeleton 
        key={index}
        className={`h-10 ${
          index === buttons - 1 ? 'w-32' : 'w-24'
        } rounded-md`}
      />
    ))}
  </div>
);

export default SkeletonFormField;
export { SkeletonFormField };
