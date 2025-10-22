import React, { useState, useMemo, Suspense } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuests } from '@/hooks/useQuest';
import { useQuestTemplates } from '@/hooks/useQuestTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestStatisticsCard } from '@/components/quests/QuestStatisticsCard';
import { QuestQuickActions } from '@/components/quests/QuestQuickActions';
import { QuestTabs } from '@/components/quests/QuestTabs';
// Lazy load heavy components
const QuestList = React.lazy(() => import('@/components/quests/QuestList'));
const QuestTemplateList = React.lazy(() => import('@/components/quests/QuestTemplateList'));
import { calculateQuestStatistics, formatQuestStatistics } from '@/lib/questStatistics';
import { triggerManualQuestCompletionCheck } from '@/lib/apiTask';
import { Plus, Loader2, Target, CheckCircle, TrendingUp, Calendar, Activity, Trophy, ArrowLeft, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { logger } from '@/lib/logger';

// Lazy load analytics dashboard
const QuestAnalyticsDashboard = React.lazy(() => import('@/components/quests/analytics/QuestAnalyticsDashboard'));

// Lazy load notification tester (dev only)
const NotificationTester = React.lazy(() => import('@/components/dev/NotificationTester').then(module => ({ default: module.default })));

const QuestDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Removed unused activeTab state - tab state is managed by QuestTabs component
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
  const [completionCheckResult, setCompletionCheckResult] = useState<{ completed_quests: string[], errors: string[] } | null>(null);
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);
  const { quests, loading, error, refresh, start, cancel, fail, deleteQuest, loadingStates } = useQuests();
  const { templates: questTemplates, isLoading: templatesLoading, error: templatesError } = useQuestTemplates();

  // Calculate statistics from quests
  const statistics = useMemo(() => {
    if (!quests) return null;
    return calculateQuestStatistics(quests);
  }, [quests]);

  const formattedStats = useMemo(() => {
    if (!statistics) return null;
    return formatQuestStatistics(statistics);
  }, [statistics]);

  // Get translations with safety checks
  const questTranslations = (t as any)?.quest;
  const commonTranslations = (t as any)?.common;

  const handleCreateQuest = () => {
    navigate('/quests/create');
  };

  const handleManualQuestCheck = async () => {
    setIsCheckingCompletion(true);
    setCompletionCheckResult(null);

    try {
      const result = await triggerManualQuestCompletionCheck();
      setCompletionCheckResult(result);

      // Refresh quests if any were completed
      if (result.completed_quests.length > 0) {
        refresh();
      }
    } catch (error) {
      console.error('Manual quest completion check failed:', error);
      setCompletionCheckResult({
        completed_quests: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
    } finally {
      setIsCheckingCompletion(false);
    }
  };

  // Quest action handlers
  const handleViewDetails = (id: string) => {
    navigate(`/quests/details/${id}`);
  };

  const handleStart = async (id: string) => {
    try {
      await start(id);
      logger.info('Quest started successfully', { questId: id });
      // Refresh the quest list to show updated state
      refresh();
    } catch (error) {
      logger.error('Failed to start quest', { questId: id, error });
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/quests/edit/${id}`);
  };

  const handleCancel = async (id: string) => {
    try {
      await cancel(id);
      logger.info('Quest cancelled successfully', { questId: id });
      // Refresh the quest list to show updated state
      refresh();
    } catch (error) {
      logger.error('Failed to cancel quest', { questId: id, error });
    }
  };

  const handleFail = async (id: string) => {
    try {
      await fail(id);
      logger.info('Quest marked as failed successfully', { questId: id });
      // Refresh the quest list to show updated state
      refresh();
    } catch (error) {
      logger.error('Failed to mark quest as failed', { questId: id, error });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuest(id);
      logger.info('Quest deleted successfully', { questId: id });
      // Refresh the quest list to show updated state
      refresh();
    } catch (error) {
      logger.error('Failed to delete quest', { questId: id, error });
    }
  };

  // Template action handlers
  const handleEditTemplate = (template: any) => {
    logger.info('Template edit requested', { templateId: template.id });
    // TODO: Navigate to template edit page
  };

  const handleDeleteTemplate = (template: any) => {
    logger.info('Template delete requested', { templateId: template.id });
    // TODO: Implement template deletion
  };

  const handleUseTemplate = (template: any) => {
    logger.info('Template use requested', { templateId: template.id });
    // TODO: Navigate to quest creation with template
    navigate('/quests/create', { state: { template } });
  };

  const handleViewTemplate = (template: any) => {
    logger.debug('Template view requested', { templateId: template.id });
    navigate(`/quests/templates/${template.id}`);
  };

  const handleCreateTemplate = () => {
    logger.info('Template creation requested');
    // TODO: Navigate to template creation page
    navigate('/quests/create-template');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="space-y-4">
            <div className="text-muted-foreground">
              {questTranslations?.messages?.loadError || 'Failed to load quests'}
            </div>
            <Button variant="outline" onClick={refresh}>
              {questTranslations?.actions?.retry || 'Retry'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/quests')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {commonTranslations?.back || 'Back'}
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {questTranslations?.dashboard?.title || 'Quest Dashboard'}
              </h1>
              <p className="text-muted-foreground">
                {questTranslations?.dashboard?.description || 'Track your quest progress and statistics'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleManualQuestCheck}
              disabled={isCheckingCompletion}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isCheckingCompletion ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {questTranslations?.actions?.checkCompletion || 'Check Completion'}
            </Button>
            <Button onClick={handleCreateQuest} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {questTranslations?.actions?.create || 'Create Quest'}
            </Button>
          </div>
        </div>

        {/* Notification Tester - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <Suspense fallback={<div>Loading notification tester...</div>}>
            <NotificationTester />
          </Suspense>
        )}

        {/* Quick Actions */}
        <QuestQuickActions />

        {/* Quest Statistics */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {questTranslations?.dashboard?.statistics?.title || 'Quest Statistics'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {formattedStats && (
              <>
                <QuestStatisticsCard
                  title={formattedStats.totalQuests.label}
                  value={formattedStats.totalQuests.value}
                  icon={Target}
                  description={formattedStats.totalQuests.description}
                />
                <QuestStatisticsCard
                  title={formattedStats.activeQuests.label}
                  value={formattedStats.activeQuests.value}
                  icon={Activity}
                  description={formattedStats.activeQuests.description}
                />
                <QuestStatisticsCard
                  title={formattedStats.completedQuests.label}
                  value={formattedStats.completedQuests.value}
                  icon={CheckCircle}
                  description={formattedStats.completedQuests.description}
                />
                <QuestStatisticsCard
                  title={formattedStats.totalXpEarned.label}
                  value={formattedStats.totalXpEarned.value}
                  icon={TrendingUp}
                  description={formattedStats.totalXpEarned.description}
                />
                <QuestStatisticsCard
                  title={formattedStats.averageCompletionTime.label}
                  value={formattedStats.averageCompletionTime.value}
                  icon={Calendar}
                  description={formattedStats.averageCompletionTime.description}
                />
                <QuestStatisticsCard
                  title={formattedStats.recentActivity.label}
                  value={formattedStats.recentActivity.value}
                  icon={Trophy}
                  description={formattedStats.recentActivity.description}
                />
              </>
            )}
          </div>
        </div>

        {/* Analytics Dashboard - Collapsible */}
        {statistics && (
          <Card className="mb-6">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {questTranslations?.analytics?.title || 'Analytics'}
                  {!isAnalyticsExpanded && (
                    <span className="text-sm text-gray-500 font-normal ml-2">
                      - {questTranslations?.analytics?.clickToView || 'Click to view detailed analytics'}
                    </span>
                  )}
                </div>
                {isAnalyticsExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {isAnalyticsExpanded && (
              <CardContent>
                <ErrorBoundary
                  fallback={
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-4">Failed to load analytics dashboard</p>
                      <Button onClick={() => setIsAnalyticsExpanded(false)} variant="outline">
                        Close Analytics
                      </Button>
                    </div>
                  }
                >
                  <Suspense fallback={
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading analytics...</span>
                    </div>
                  }>
                    <QuestAnalyticsDashboard />
                  </Suspense>
                </ErrorBoundary>
              </CardContent>
            )}
          </Card>
        )}

        {/* Manual Quest Completion Check Results */}
        {completionCheckResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                {questTranslations?.dashboard?.completionCheck?.title || 'Quest Completion Check Results'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completionCheckResult.completed_quests.length > 0 && (
                <div className="mb-4">
                  <p className="text-green-600 font-medium">
                    ✅ {questTranslations?.dashboard?.completionCheck?.completed || 'Completed Quests'}: {completionCheckResult.completed_quests.length}
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    {completionCheckResult.completed_quests.map((questId) => (
                      <li key={questId}>{questId}</li>
                    ))}
                  </ul>
                </div>
              )}

              {completionCheckResult.errors.length > 0 && (
                <div>
                  <p className="text-red-600 font-medium">
                    ❌ {questTranslations?.dashboard?.completionCheck?.errors || 'Errors'}: {completionCheckResult.errors.length}
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    {completionCheckResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {completionCheckResult.completed_quests.length === 0 && completionCheckResult.errors.length === 0 && (
                <p className="text-muted-foreground">
                  {questTranslations?.dashboard?.completionCheck?.noChanges || 'No quests were completed or had errors.'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quest Tabs */}
        <QuestTabs
          myQuestsContent={
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading quests...</span>
              </div>
            }>
              <QuestList
                onViewDetails={handleViewDetails}
                onStart={handleStart}
                onEdit={handleEdit}
                onCancel={handleCancel}
                onFail={handleFail}
                onDelete={handleDelete}
                onCreateQuest={handleCreateQuest}
                loadingStates={loadingStates}
                quests={quests}
                loading={loading}
                error={error}
                onRefresh={refresh}
              />
            </Suspense>
          }
          followingQuestsContent={
            <div className="text-center py-8 text-muted-foreground">
              <p>{questTranslations?.dashboard?.tabs?.followingQuestsPlaceholder || 'Following quests feature will be implemented in a future update.'}</p>
            </div>
          }
          templatesContent={
            <ErrorBoundary
              fallback={
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">Failed to load quest templates</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Back to My Quests
                  </Button>
                </div>
              }
            >
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading templates...</span>
                </div>
              }>
                <QuestTemplateList
                  templates={questTemplates}
                  isLoading={templatesLoading}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  onUse={handleUseTemplate}
                  onView={handleViewTemplate}
                  onCreate={handleCreateTemplate}
                  showActions={true}
                />
              </Suspense>
            </ErrorBoundary>
          }
        />
      </div>
    </div>
  );
};

export default QuestDashboard;
