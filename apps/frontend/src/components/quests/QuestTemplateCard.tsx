import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Lock, 
  Users, 
  Globe,
  Star,
  Clock,
  Target,
  Tag
} from 'lucide-react';
import { QuestTemplate } from '@/models/questTemplate';
import { 
  getPrivacyIcon, 
  getPrivacyColor, 
  getPrivacyDescription,
  QUEST_TEMPLATE_DIFFICULTY_OPTIONS,
  QUEST_TEMPLATE_KIND_OPTIONS
} from '@/models/questTemplate';
import { logger } from '@/lib/logger';

interface QuestTemplateCardProps {
  template: QuestTemplate;
  onEdit?: (template: QuestTemplate) => void;
  onDelete?: (template: QuestTemplate) => void;
  onUse?: (template: QuestTemplate) => void;
  onView?: (template: QuestTemplate) => void;
  showActions?: boolean;
  className?: string;
}

const QuestTemplateCard: React.FC<QuestTemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onUse,
  onView,
  showActions = true,
  className = ''
}) => {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  const handleEdit = () => {
    logger.debug('Edit template clicked', { templateId: template.id });
    onEdit?.(template);
  };

  const handleDelete = () => {
    logger.debug('Delete template clicked', { templateId: template.id });
    setShowDeleteDialog(true);
  };

  const handleUse = () => {
    logger.debug('Use template clicked', { templateId: template.id });
    onUse?.(template);
  };

  const handleView = () => {
    logger.debug('View template clicked', { templateId: template.id });
    onView?.(template);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete?.(template);
      setShowDeleteDialog(false);
    } catch (error) {
      logger.error('Failed to delete template', { error, templateId: template.id });
    } finally {
      setIsDeleting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    const option = QUEST_TEMPLATE_DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
    return option?.label || difficulty;
  };

  const getKindLabel = (kind: string) => {
    const option = QUEST_TEMPLATE_KIND_OPTIONS.find(opt => opt.value === kind);
    return option?.label || kind;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatXp = (xp: number) => {
    return `${xp} XP`;
  };

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate" title={template.title}>
                {template.title}
              </CardTitle>
              {template.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {template.description}
                </p>
              )}
            </div>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={handleView}>
                      <Eye className="h-4 w-4 mr-2" />
                      {questTranslations?.templates?.actions?.view || 'View'}
                    </DropdownMenuItem>
                  )}
                  {onUse && (
                    <DropdownMenuItem onClick={handleUse}>
                      <Copy className="h-4 w-4 mr-2" />
                      {questTranslations?.templates?.actions?.useTemplate || 'Use Template'}
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      {questTranslations?.templates?.actions?.edit || 'Edit'}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {questTranslations?.templates?.actions?.delete || 'Delete'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Template Info */}
          <div className="space-y-3">
            {/* Category and Difficulty */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {template.category}
              </Badge>
              <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                {getDifficultyLabel(template.difficulty)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getKindLabel(template.kind)}
              </Badge>
            </div>

            {/* Privacy and XP */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {template.privacy === 'public' && <Globe className="h-4 w-4" />}
                {template.privacy === 'followers' && <Users className="h-4 w-4" />}
                {template.privacy === 'private' && <Lock className="h-4 w-4" />}
                <span className={getPrivacyColor(template.privacy)}>
                  {questTranslations?.templates?.privacy?.[template.privacy] || template.privacy}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{formatXp(template.rewardXp)}</span>
              </div>
            </div>

            {/* Target Count for Quantitative Quests */}
            {template.kind === 'quantitative' && template.targetCount && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>
                  {template.targetCount} {questTranslations?.templates?.targetCount || 'targets'}
                </span>
              </div>
            )}

            {/* Tags */}
            {template.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {template.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{template.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Created {formatDate(template.createdAt)}</span>
              </div>
              {template.updatedAt !== template.createdAt && (
                <span>Updated {formatDate(template.updatedAt)}</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 mt-4">
              {onUse && (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={handleUse}
                >
                  {questTranslations?.templates?.actions?.useTemplate || 'Use Template'}
                </Button>
              )}
              {onView && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleView}
                >
                  {questTranslations?.templates?.actions?.view || 'View'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {questTranslations?.templates?.actions?.deleteTemplate || 'Delete Template'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {questTranslations?.templates?.messages?.deleteConfirm || 
                `Are you sure you want to delete "${template.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {commonTranslations?.actions?.cancel || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting 
                ? (commonTranslations?.actions?.deleting || 'Deleting...') 
                : (questTranslations?.templates?.actions?.delete || 'Delete')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default QuestTemplateCard;
