import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { getActiveGoalsCountForUser } from '@/lib/apiGoal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, TrendingUp } from 'lucide-react';

interface GoalsButtonProps {
  userId: string;
  className?: string;
}

const GoalsButton: React.FC<GoalsButtonProps> = ({ userId, className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeGoalsCount, setActiveGoalsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Get translations
  const goalDashboardTranslations = (t as any)?.goalDashboard;

  // Load active goals count
  useEffect(() => {
    const loadActiveGoalsCount = async () => {
      try {
        setLoading(true);
        const count = await getActiveGoalsCountForUser(userId);
        setActiveGoalsCount(count);
      } catch (error) {
        console.error('Failed to load active goals count:', error);
        setActiveGoalsCount(0);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadActiveGoalsCount();
    }
  }, [userId]);

  const handleViewGoals = () => {
    navigate('/goals');
  };

  const handleCreateGoal = () => {
    navigate('/goals/create');
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer ${className}`} onClick={handleViewGoals}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            {goalDashboardTranslations?.button?.title || 'Goals'}
          </CardTitle>
          {activeGoalsCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {activeGoalsCount}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {goalDashboardTranslations?.button?.subtitle || 'Manage your goals'}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {activeGoalsCount > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-muted-foreground">
                {activeGoalsCount} {goalDashboardTranslations?.stats?.activeGoals || 'active goals'}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {goalDashboardTranslations?.messages?.noGoals || 'No goals yet'}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleViewGoals();
              }}
            >
              {goalDashboardTranslations?.button?.viewAll || 'View All'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateGoal();
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalsButton;
