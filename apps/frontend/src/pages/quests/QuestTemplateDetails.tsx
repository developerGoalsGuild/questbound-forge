import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Copy, 
  Lock, 
  Users, 
  Globe,
  Star,
  Clock,
  Target,
  Tag,
  Calendar,
  User,
  Loader2
} from 'lucide-react';
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
import { QuestTemplate } from '@/models/questTemplate';
import { 
  getPrivacyIcon, 
  getPrivacyColor, 
  getPrivacyDescription,
  QUEST_TEMPLATE_DIFFICULTY_OPTIONS,
  QUEST_TEMPLATE_KIND_OPTIONS
} from '@/models/questTemplate';
import { useQuestTemplates } from '@/hooks/useQuestTemplate';
import { logger } from '@/lib/logger';

const QuestTemplateDetails: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { getTemplate, delete: deleteTemplate, isLoading, error } = useQuestTemplates();
  
  const [template, setTemplate] = useState<QuestTemplate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) return;
      
      try {
        logger.debug('Loading template details', { templateId });
        const templateData = await getTemplate(templateId);
        setTemplate(templateData);
      } catch (error) {
        logger.error('Failed to load template details', { error, templateId });
      }
    };

    loadTemplate();
  }, [templateId, getTemplate]);

  const handleEdit = () => {
    if (!template) return;
    logger.debug('Edit template clicked', { templateId: template.id });
    navigate(`/quests/templates/${template.id}/edit`);
  };

  const handleDelete = () => {
    logger.debug('Delete template clicked', { templateId: template?.id });
    setShowDeleteDialog(true);
  };

  const handleUse = () => {
    if (!template) return;
    logger.debug('Use template clicked', { templateId: template.id });
    navigate('/quests/create', { state: { template } });
  };

  const confirmDelete = async () => {
    if (!template) return;
    
    try {
      setIsDeleting(true);
      await deleteTemplate(template.id);
      setShowDeleteDialog(false);
      navigate('/quests');
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
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatXp = (xp: number) => {
    return `${xp} XP`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{commonTranslations?.loading || 'Loading template...'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {questTranslations?.templates?.messages?.notFound || 'Template Not Found'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {questTranslations?.templates?.messages?.notFoundDescription || 
              'The template you are looking for could not be found or may have been deleted.'}
          </p>
          <Button onClick={() => navigate('/quests')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {questTranslations?.actions?.backToQuests || 'Back to Quests'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/quests')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {questTranslations?.actions?.backToQuests || 'Back to Quests'}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleUse}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {questTranslations?.templates?.actions?.useTemplate || 'Use Template'}
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {questTranslations?.templates?.actions?.edit || 'Edit'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              {questTranslations?.templates?.actions?.delete || 'Delete'}
            </Button>
          </div>
        </div>

        {/* Template Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{template.title}</CardTitle>
                {template.description && (
                  <p className="text-muted-foreground mt-2">{template.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category and Difficulty */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-sm">
                    {template.category}
                  </Badge>
                  <Badge className={`text-sm ${getDifficultyColor(template.difficulty)}`}>
                    {getDifficultyLabel(template.difficulty)}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {getKindLabel(template.kind)}
                  </Badge>
                </div>

                {/* Privacy and XP */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {template.privacy === 'public' && <Globe className="h-5 w-5" />}
                    {template.privacy === 'followers' && <Users className="h-5 w-5" />}
                    {template.privacy === 'private' && <Lock className="h-5 w-5" />}
                    <span className={`font-medium ${getPrivacyColor(template.privacy)}`}>
                      {questTranslations?.templates?.privacy?.[template.privacy] || template.privacy}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold text-lg">{formatXp(template.rewardXp)}</span>
                  </div>
                </div>

                {/* Target Count for Quantitative Quests */}
                {template.kind === 'quantitative' && template.targetCount && (
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {template.targetCount} {questTranslations?.templates?.targetCount || 'targets'}
                    </span>
                  </div>
                )}

                {/* Instructions */}
                {template.instructions && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      {questTranslations?.templates?.instructions || 'Instructions'}
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {template.instructions}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {template.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      {questTranslations?.templates?.tags || 'Tags'}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {template.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {questTranslations?.templates?.details?.templateInfo || 'Template Info'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created by:</span>
                  <span className="font-medium">{template.createdBy || 'Unknown'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(template.createdAt)}</span>
                </div>
                
                {template.updatedAt !== template.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{formatDate(template.updatedAt)}</span>
                  </div>
                )}

                {template.estimatedDuration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{template.estimatedDuration} minutes</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Privacy Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {questTranslations?.templates?.details?.privacy || 'Privacy'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  {template.privacy === 'public' && <Globe className="h-5 w-5 text-green-500 mt-0.5" />}
                  {template.privacy === 'followers' && <Users className="h-5 w-5 text-blue-500 mt-0.5" />}
                  {template.privacy === 'private' && <Lock className="h-5 w-5 text-gray-500 mt-0.5" />}
                  <div>
                    <p className="font-medium">
                      {questTranslations?.templates?.privacy?.[template.privacy] || template.privacy}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getPrivacyDescription(template.privacy)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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

export default QuestTemplateDetails;
