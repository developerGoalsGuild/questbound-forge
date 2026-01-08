import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { loadGoals, deleteGoal, updateGoal } from '@/lib/apiGoal';
import { GoalListItem, GoalStatus } from '@/models/goal';
import GoalActions from '@/components/goals/GoalActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Target,
  MoreHorizontal
} from 'lucide-react';
import { formatDeadline, getStatusColorClass, formatGoalStatus } from '@/models/goal';
import FieldTooltip from '@/components/ui/FieldTooltip';
import { logger } from '@/lib/logger';

const GoalsListPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [goals, setGoals] = useState<GoalListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filtering
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Sorting
  const [sortBy, setSortBy] = useState<'title' | 'deadline' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get translations
  const goalListTranslations = (t as any)?.goalList;
  const commonTranslations = (t as any)?.common;

  // Load goals
  const loadMyGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const myGoals = await loadGoals();
      setGoals(Array.isArray(myGoals) ? myGoals.map(goal => ({
        ...goal,
        status: goal.status as GoalStatus
      })) : []);
    } catch (e: any) {
      logger.error('Error loading goals', { error: e });
      
      // Parse API error response
      let errorMessage = e?.message || 'Failed to load goals';
      
      try {
        // Try to parse error response if it's a string
        if (typeof e?.message === 'string') {
          const parsedError = JSON.parse(e.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        logger.warn('Could not parse goal loading error response', { parseError });
      }
      
      setError(errorMessage);
      toast({
        title: goalListTranslations?.messages?.loading || 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, goalListTranslations]);

  useEffect(() => {
    loadMyGoals();
  }, [loadMyGoals]);

  // Filter and sort goals
  const filteredAndSortedGoals = useMemo(() => {
    let filtered = goals.filter(goal => {
      const matchesText = !query || 
        goal.title.toLowerCase().includes(query.toLowerCase()) ||
        (goal.description && goal.description.toLowerCase().includes(query.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
      const matchesCategory = !categoryFilter || goal.category === categoryFilter;
      
      return matchesText && matchesStatus && matchesCategory;
    });

    // Sort goals
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'deadline':
          aValue = a.deadline ? new Date(a.deadline).getTime() : 0;
          bValue = b.deadline ? new Date(b.deadline).getTime() : 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [goals, query, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedGoals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGoals = filteredAndSortedGoals.slice(startIndex, endIndex);

  // Handlers
  const handleEditGoal = (goalId: string) => {
    navigate(`/goals/edit/${goalId}`);
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      toast({
        title: goalListTranslations?.messages?.deleteSuccess || 'Success',
        description: goalListTranslations?.messages?.deleteSuccess || 'Goal deleted successfully'
      });
      await loadMyGoals();
    } catch (e: any) {
      logger.error('Error deleting goal', { goalId, error: e });
      
      // Parse API error response
      let errorMessage = e?.message || 'Failed to delete goal';
      
      try {
        // Try to parse error response if it's a string
        if (typeof e?.message === 'string') {
          const parsedError = JSON.parse(e.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        logger.warn('Could not parse delete goal error response', { parseError });
      }
      
      toast({
        title: goalListTranslations?.messages?.deleteError || 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (goalId: string, newStatus: GoalStatus) => {
    try {
      await updateGoal(goalId, { status: newStatus });
      toast({
        title: goalListTranslations?.messages?.statusUpdateSuccess || 'Success',
        description: goalListTranslations?.messages?.statusUpdateSuccess || 'Goal status updated successfully'
      });
      await loadMyGoals();
    } catch (e: any) {
      logger.error('Error updating goal status', { goalId, newStatus, error: e });
      
      // Parse API error response
      let errorMessage = e?.message || 'Failed to update goal status';
      
      try {
        // Try to parse error response if it's a string
        if (typeof e?.message === 'string') {
          const parsedError = JSON.parse(e.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        logger.warn('Could not parse update status error response', { parseError });
      }
      
      toast({
        title: goalListTranslations?.messages?.statusUpdateError || 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleViewTasks = (goalId: string) => {
    navigate(`/goals/${goalId}/tasks`);
  };

  const handleViewDetails = (goalId: string) => {
    navigate(`/goals/details/${goalId}`);
  };

  const handleCreateGoal = () => {
    navigate('/goals/create');
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Status options for filter
  const statusOptions = [
    { value: 'all', label: goalListTranslations?.filters?.allStatuses || 'All Statuses' },
    { value: 'active', label: goalListTranslations?.filters?.statusActive || 'Active' },
    { value: 'paused', label: goalListTranslations?.filters?.statusPaused || 'Paused' },
    { value: 'completed', label: goalListTranslations?.filters?.statusCompleted || 'Completed' },
    { value: 'archived', label: goalListTranslations?.filters?.statusArchived || 'Archived' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'title', label: 'Title' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'status', label: 'Status' },
  ];

  // Items per page options
  const itemsPerPageOptions = [5, 10, 25, 50];

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {goalListTranslations?.messages?.loading || 'Loading goals...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadMyGoals}>
            {commonTranslations?.retry || 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6" data-testid="goals-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {goalListTranslations?.title || 'My Goals'}
          </h1>
          <p className="text-muted-foreground">
            {goalListTranslations?.subtitle || 'Manage and track your goals'}
          </p>
        </div>
        <Button onClick={handleCreateGoal} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          {goalListTranslations?.actions?.createGoal || 'Create New Goal'}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {goalListTranslations?.search?.label || 'Search & Filter'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="search">
                  {goalListTranslations?.search?.label || 'Search'}
                </Label>
                <FieldTooltip 
                  targetId="search" 
                  fieldLabel={goalListTranslations?.search?.label || 'Search'} 
                  hint={goalListTranslations?.hints?.filters?.search}
                  iconLabelTemplate={goalListTranslations?.hints?.iconLabel}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder={goalListTranslations?.search?.placeholder || 'Search goals...'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="status-filter">
                  {goalListTranslations?.filters?.statusLabel || 'Status'}
                </Label>
                <FieldTooltip 
                  targetId="status-filter" 
                  fieldLabel={goalListTranslations?.filters?.statusLabel || 'Status'} 
                  hint={goalListTranslations?.hints?.filters?.status}
                  iconLabelTemplate={goalListTranslations?.hints?.iconLabel}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={goalListTranslations?.filters?.allStatuses || 'All Statuses'} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sort-order">Order</Label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      {paginatedGoals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {goalListTranslations?.table?.noGoals || 'No goals yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {goalListTranslations?.table?.noGoalsDescription || 'Create your first goal to get started on your journey.'}
            </p>
            <Button onClick={handleCreateGoal}>
              <Plus className="w-4 h-4 mr-2" />
              {goalListTranslations?.actions?.createGoal || 'Create New Goal'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{goalListTranslations?.table?.columns?.title || 'Title'}</TableHead>
                    <TableHead>{goalListTranslations?.table?.columns?.description || 'Description'}</TableHead>
                    <TableHead>{goalListTranslations?.table?.columns?.deadline || 'Deadline'}</TableHead>
                    <TableHead>{goalListTranslations?.table?.columns?.status || 'Status'}</TableHead>
                    <TableHead>{goalListTranslations?.table?.columns?.category || 'Category'}</TableHead>
                    <TableHead className="text-right">{goalListTranslations?.table?.columns?.actions || 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGoals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium">{goal.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {goal.description || '-'}
                      </TableCell>
                      <TableCell>
                        {goal.deadline ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {formatDeadline(goal.deadline)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColorClass(goal.status as GoalStatus)}
                        >
                          {formatGoalStatus(goal.status as GoalStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {goal.category || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <GoalActions
                          goalId={goal.id}
                          goalTitle={goal.title}
                          currentStatus={goal.status as GoalStatus}
                          onEdit={handleEditGoal}
                          onDelete={handleDeleteGoal}
                          onStatusChange={handleStatusChange}
                          onViewDetails={handleViewDetails}
                          variant="compact"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {paginatedGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{goal.title}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`ml-2 ${getStatusColorClass(goal.status as GoalStatus)}`}
                    >
                      {formatGoalStatus(goal.status as GoalStatus)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {goal.deadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDeadline(goal.deadline)}
                      </div>
                    )}
                    {goal.category && (
                      <div className="text-sm text-muted-foreground">
                        Category: {goal.category}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <GoalActions
                      goalId={goal.id}
                      goalTitle={goal.title}
                      currentStatus={goal.status as GoalStatus}
                      onEdit={handleEditGoal}
                      onDelete={handleDeleteGoal}
                      onStatusChange={handleStatusChange}
                      onViewDetails={handleViewDetails}
                      variant="minimal"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {goalListTranslations?.pagination?.showing || 'Showing'} {startIndex + 1} - {Math.min(endIndex, filteredAndSortedGoals.length)} {goalListTranslations?.pagination?.of || 'of'} {filteredAndSortedGoals.length} {goalListTranslations?.pagination?.results || 'results'}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="items-per-page" className="text-sm">Items per page:</Label>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {itemsPerPageOptions.map((option) => (
                            <SelectItem key={option} value={option.toString()}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default GoalsListPage;
