import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { GoalStatus, formatGoalStatus, getStatusColorClass } from '@/models/goal';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle, 
  Archive,
  Eye,
  Calendar,
  Loader2
} from 'lucide-react';

interface GoalActionsProps {
  goalId: string;
  goalTitle: string;
  currentStatus: GoalStatus;
  onEdit?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
  onStatusChange?: (goalId: string, newStatus: GoalStatus) => void;
  onViewTasks?: (goalId: string) => void;
  onViewDetails?: (goalId: string) => void;
  disabled?: boolean;
  className?: string;
  showStatusBadge?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
}

const GoalActions: React.FC<GoalActionsProps> = ({
  goalId,
  goalTitle,
  currentStatus,
  onEdit,
  onDelete,
  onStatusChange,
  onViewTasks,
  onViewDetails,
  disabled = false,
  className = '',
  showStatusBadge = true,
  variant = 'default'
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Get translations with safety checks
  const goalsTranslations = (t as any)?.goals;
  const list = goalsTranslations?.list ?? {};
  const actions = goalsTranslations?.actions ?? {};

  // Status change options
  const statusOptions = [
    { 
      status: GoalStatus.ACTIVE, 
      label: list.statusActive || 'Active', 
      icon: Play,
      description: 'Resume working on this goal'
    },
    { 
      status: GoalStatus.PAUSED, 
      label: list.statusPaused || 'Pause', 
      icon: Pause,
      description: 'Temporarily pause this goal'
    },
    { 
      status: GoalStatus.COMPLETED, 
      label: list.statusCompleted || 'Complete', 
      icon: CheckCircle,
      description: 'Mark this goal as completed'
    },
    { 
      status: GoalStatus.ARCHIVED, 
      label: list.statusArchived || 'Archive', 
      icon: Archive,
      description: 'Archive this goal'
    }
  ];

  // Handle status change
  const handleStatusChange = async (newStatus: GoalStatus) => {
    if (onStatusChange && newStatus !== currentStatus) {
      setIsChangingStatus(true);
      try {
        await onStatusChange(goalId, newStatus);
        toast({
          title: 'Success',
          description: `Goal status changed to ${formatGoalStatus(newStatus)}`,
          variant: 'default'
        });
      } catch (error: any) {
        console.error('Error changing goal status:', error);
        
        // Parse API error response
        let errorMessage = error?.message || 'Failed to change goal status';
        
        try {
          // Try to parse error response if it's a string
          if (typeof error?.message === 'string') {
            const parsedError = JSON.parse(error.message);
            if (parsedError.message) {
              errorMessage = parsedError.message;
            }
          }
        } catch (parseError) {
          // If parsing fails, use the original error message
          console.log('Could not parse error response:', parseError);
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        setIsChangingStatus(false);
      }
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(goalId);
        toast({
          title: 'Success',
          description: 'Goal deleted successfully',
          variant: 'default'
        });
      } catch (error: any) {
        console.error('Error deleting goal:', error);
        
        // Parse API error response
        let errorMessage = error?.message || 'Failed to delete goal';
        
        try {
          // Try to parse error response if it's a string
          if (typeof error?.message === 'string') {
            const parsedError = JSON.parse(error.message);
            if (parsedError.message) {
              errorMessage = parsedError.message;
            }
          }
        } catch (parseError) {
          // If parsing fails, use the original error message
          console.log('Could not parse error response:', parseError);
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Get available status options (exclude current status)
  const availableStatusOptions = statusOptions.filter(
    option => option.status !== currentStatus
  );

  // Render status badge
  const renderStatusBadge = () => {
    if (!showStatusBadge) return null;
    
    return (
      <Badge 
        variant="secondary" 
        className={`${getStatusColorClass(currentStatus)} text-xs`}
      >
        {formatGoalStatus(currentStatus)}
      </Badge>
    );
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {renderStatusBadge()}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-8 w-8 p-0"
              aria-label={`Actions for ${goalTitle}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {onViewDetails && (
              <DropdownMenuItem onClick={() => onViewDetails(goalId)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            )}
            
            {onViewTasks && (
              <DropdownMenuItem onClick={() => onViewTasks(goalId)}>
                <Calendar className="mr-2 h-4 w-4" />
                {list.viewTasks || 'View Tasks'}
              </DropdownMenuItem>
            )}
            
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(goalId)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            
            {availableStatusOptions.length > 0 && onStatusChange && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                {availableStatusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <DropdownMenuItem
                      key={option.status}
                      onClick={() => handleStatusChange(option.status)}
                      disabled={isChangingStatus}
                    >
                      {isChangingStatus ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="mr-2 h-4 w-4" />
                      )}
                      {option.label}
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
            
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {/* Will be handled by AlertDialog */}}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(goalId)}
            disabled={disabled}
            className="h-8 px-2"
            aria-label={`Edit ${goalTitle}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        
        {onViewTasks && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewTasks(goalId)}
            disabled={disabled}
            className="h-8 px-2"
            aria-label={`View tasks for ${goalTitle}`}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}
        
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="h-8 px-2 text-destructive hover:text-destructive"
                aria-label={`Delete ${goalTitle}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{goalTitle}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  }

  // Render default variant
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:justify-end ${className}`}>
      {renderStatusBadge()}
      
      <div className="flex gap-2">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(goalId)}
            disabled={disabled}
            className="text-xs sm:text-sm"
          >
            <Eye className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            View Details
          </Button>
        )}
        
        {onViewTasks && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewTasks(goalId)}
            disabled={disabled}
            className="text-xs sm:text-sm"
          >
            <Calendar className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            {list.viewTasks || 'View Tasks'}
          </Button>
        )}
        
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(goalId)}
            disabled={disabled}
            className="text-xs sm:text-sm"
          >
            <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            Edit
          </Button>
        )}
        
        {availableStatusOptions.length > 0 && onStatusChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || isChangingStatus}
                className="text-xs sm:text-sm"
              >
                {isChangingStatus ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    Change Status
                    <MoreHorizontal className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableStatusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <DropdownMenuItem
                    key={option.status}
                    onClick={() => handleStatusChange(option.status)}
                    disabled={isChangingStatus}
                  >
                    {isChangingStatus ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="mr-2 h-4 w-4" />
                    )}
                    {option.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={disabled}
                className="text-xs sm:text-sm"
              >
                <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{goalTitle}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default GoalActions;
