import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuests } from '@/hooks/useQuest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestStatisticsCard } from '@/components/quests/QuestStatisticsCard';
import { QuestQuickActions } from '@/components/quests/QuestQuickActions';
import { QuestTabs } from '@/components/quests/QuestTabs';
import QuestList from '@/components/quests/QuestList';
import { calculateQuestStatistics, formatQuestStatistics } from '@/lib/questStatistics';
import { triggerManualQuestCompletionCheck } from '@/lib/apiTask';
import { Plus, Loader2, Target, CheckCircle, TrendingUp, Calendar, Activity, Trophy, ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuestDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my' | 'following'>('my');
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
  const [completionCheckResult, setCompletionCheckResult] = useState<{ completed_quests: string[], errors: string[] } | null>(null);
  const { quests, loading, error, refresh } = useQuests();

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

  const handleStart = (id: string) => {
    // Quest start logic will be handled by the QuestCard component
    console.log('Starting quest:', id);
  };

  const handleEdit = (id: string) => {
    navigate(`/quests/edit/${id}`);
  };

  const handleCancel = (id: string) => {
    // Quest cancel logic will be handled by the QuestCard component
    console.log('Cancelling quest:', id);
  };

  const handleFail = (id: string) => {
    // Quest fail logic will be handled by the QuestCard component
    console.log('Failing quest:', id);
  };

  const handleDelete = (id: string) => {
    // Quest delete logic will be handled by the QuestCard component
    console.log('Deleting quest:', id);
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
            <QuestList
              onViewDetails={handleViewDetails}
              onStart={handleStart}
              onEdit={handleEdit}
              onCancel={handleCancel}
              onFail={handleFail}
              onDelete={handleDelete}
              onCreateQuest={handleCreateQuest}
            />
          }
          followingQuestsContent={
            <div className="text-center py-8 text-muted-foreground">
              <p>{questTranslations?.dashboard?.tabs?.followingQuestsPlaceholder || 'Following quests feature will be implemented in a future update.'}</p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default QuestDashboard;
