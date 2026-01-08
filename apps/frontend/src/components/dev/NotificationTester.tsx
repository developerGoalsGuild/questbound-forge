import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuestNotifications } from '@/hooks/useQuestNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Quest } from '@/models/quest';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Clock, 
  Trophy, 
  Users,
  Settings
} from 'lucide-react';

/**
 * Development component for testing quest notifications
 * Only renders in development mode
 */
const NotificationTester: React.FC = () => {
  const { profile: user } = useUserProfile();
  const [lastNotification, setLastNotification] = useState<string>('');
  
  const {
    notifyQuestStarted,
    notifyQuestCompleted,
    notifyQuestFailed,
    notifyProgressMilestone,
    notifyDeadlineWarning,
    notifyStreakAchieved,
    notifyChallengeJoined,
  } = useQuestNotifications();

  // Mock quest for testing
  const mockQuest: Quest = {
    id: 'test-quest-123',
    title: 'Test Quest for Notifications',
    description: 'This is a test quest to verify notification functionality',
    status: 'active',
    difficulty: 'medium',
    category: 'productivity',
    rewardXp: 150,
    tags: ['test', 'notification'],
    deadline: new Date(Date.now() + 86400000).toISOString(),
    linkedGoals: [],
    linkedTasks: [],
    kind: 'quantitative',
    targetCount: 10,
    countScope: 'completed_tasks',
    privacy: 'private',
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    userId: user?.id || 'test-user'
  };

  const handleNotification = (type: string, callback: (quest: Quest) => void) => {
    callback(mockQuest);
    setLastNotification(`${type} notification sent at ${new Date().toLocaleTimeString()}`);
  };

  const getNotificationStatus = () => {
    if (!user?.notificationPreferences) {
      return { enabled: false, reason: 'No notification preferences set' };
    }

    const prefs = user.notificationPreferences;
    const inAppEnabled = prefs.channels?.inApp === true;
    
    if (!inAppEnabled) {
      return { enabled: false, reason: 'In-app notifications disabled' };
    }

    const enabledTypes = Object.entries(prefs)
      .filter(([key, value]) => key !== 'channels' && value === true)
      .map(([key]) => key);

    return { 
      enabled: true, 
      reason: `Enabled for: ${enabledTypes.join(', ')}` 
    };
  };

  const status = getNotificationStatus();

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Settings className="h-5 w-5" />
          Notification Tester (Dev Only)
        </CardTitle>
        <CardDescription>
          Test quest notifications with different event types and user preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notification Status */}
        <div className="p-3 rounded-lg bg-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={status.enabled ? 'default' : 'destructive'}>
              {status.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <span className="text-sm text-gray-600">{status.reason}</span>
          </div>
          {user?.notificationPreferences && (
            <div className="text-xs text-gray-500">
              User: {user.id} | In-App: {user.notificationPreferences.channels?.inApp ? 'Yes' : 'No'}
            </div>
          )}
        </div>

        <Separator />

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleNotification('Quest Started', notifyQuestStarted)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Quest Started
          </Button>

          <Button
            onClick={() => handleNotification('Quest Completed', notifyQuestCompleted)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Quest Completed
          </Button>

          <Button
            onClick={() => handleNotification('Quest Failed', notifyQuestFailed)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Quest Failed
          </Button>

          <Button
            onClick={() => handleNotification('Progress Milestone', (quest) => notifyProgressMilestone(quest, 75))}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Progress (75%)
          </Button>

          <Button
            onClick={() => handleNotification('Deadline Warning', notifyDeadlineWarning)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Deadline Warning
          </Button>

          <Button
            onClick={() => handleNotification('Streak Achieved', (quest) => notifyStreakAchieved(quest, 5))}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Trophy className="h-4 w-4" />
            Streak (5 days)
          </Button>

          <Button
            onClick={() => handleNotification('Challenge Joined', notifyChallengeJoined)}
            variant="outline"
            className="flex items-center gap-2 col-span-2"
          >
            <Users className="h-4 w-4" />
            Challenge Joined
          </Button>
        </div>

        {/* Last Notification Info */}
        {lastNotification && (
          <div className="p-3 rounded-lg bg-green-100 border border-green-200">
            <div className="text-sm text-green-800">
              <strong>Last notification:</strong> {lastNotification}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Instructions:</strong></div>
          <div>• Click buttons to test different notification types</div>
          <div>• Check if notifications appear in the top-right corner</div>
          <div>• Verify notification preferences in Profile → Notifications</div>
          <div>• Test with different user preference settings</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTester;
