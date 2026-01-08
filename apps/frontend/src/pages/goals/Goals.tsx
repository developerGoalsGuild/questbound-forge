import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import GoalCreationForm from '@/components/forms/GoalCreationForm';
import GoalEditForm from '@/components/forms/GoalEditForm';

const GoalsPageInner: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Determine if this is create or edit mode
  const isEditMode = Boolean(id);
  const isCreateMode = !isEditMode;
  
  // If in create mode, use the dedicated GoalCreationForm component
  if (isCreateMode) {
    return (
      <GoalCreationForm
        onSuccess={(goalId) => {
          toast({
            title: 'Success',
            description: 'Goal created successfully',
            variant: 'default'
          });
          navigate('/goals');
        }}
        onCancel={() => navigate('/goals')}
      />
    );
  }

  // If in edit mode, use the dedicated GoalEditForm component
  if (isEditMode && id) {
    return (
      <GoalEditForm
        goalId={id}
        onSuccess={(goalId) => {
          toast({
            title: 'Success',
            description: 'Goal updated successfully',
            variant: 'default'
          });
          navigate('/goals');
        }}
        onCancel={() => navigate('/goals')}
      />
    );
  }

  // Fallback loading state
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
};

const GoalsPage: React.FC = () => (
  <GoalsPageInner />
);

export default GoalsPage;
