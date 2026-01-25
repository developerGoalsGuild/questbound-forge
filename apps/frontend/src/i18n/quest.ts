/**
 * Quest translations for GoalsGuild application
 * 
 * This file contains all quest-related translations including:
 * - Status labels (draft, active, completed, cancelled, failed)
 * - Difficulty levels (easy, medium, hard)
 * - Form labels and validation messages
 * - Action buttons and confirmations
 * - Error messages and notifications
 * 
 * Structure follows the established pattern from other translation files
 * and aligns with getQuestStatusKey and getQuestDifficultyKey helpers.
 */

export interface QuestTranslations {
  // Root level page titles and descriptions
  title: string;
  description: string;
  
  // Status translations
  status: {
    draft: string;
    active: string;
    completed: string;
    cancelled: string;
    failed: string;
  };
  
  // Difficulty translations
  difficulty: {
    easy: string;
    medium: string;
    hard: string;
  };

  // Count scope translations
  countScope: {
    completed_tasks: string;
    completed_goals: string;
  };
  
  // Form fields
  fields: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    rewardXp: string;
    tags: string;
    deadline: string;
    privacy: string;
    kind: string;
    linkedGoals: string;
    linkedTasks: string;
    linkedItems: string;
    linkedItemsDescription: string;
    goals: string;
    tasks: string;
    dependsOnQuests: string;
    targetCount: string;
    countScope: string;
    period: string;
    days: string;
    createdAt: string;
    updatedAt: string;
    startedAt: string;
  };

  // Filters
  filters: {
    title: string;
    search: string;
    searchPlaceholder: string;
    searchAriaLabel: string;
    status: string;
    statusPlaceholder: string;
    difficulty: string;
    difficultyPlaceholder: string;
    category: string;
    categoryPlaceholder: string;
    clear: string;
    clearAll: string;
    clearFilters: string;
    active: string;
    activeFilters: string;
    activeCount: string;
    showing: string;
  };

  // Tooltips
  tooltips: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    rewardXp: string;
    privacy: string;
    kind: string;
    tags: string;
    targetCount: string;
    countScope: string;
    period: string;
    deadline: string;
    progressQuantitative: string;
    progressLinked: string;
    editButton: string;
    startButton: string;
    startDisabled: string;
    startDisabledQuantitative: string;
    deleteButton: string;
    viewButton: string;
    cancelButton: string;
    failButton: string;
    viewCompletedButton: string;
    linkedGoals: string;
    linkedTasks: string;
    filters: string;
    statusFilter: string;
    difficultyFilter: string;
    categoryFilter: string;
    clearFilters: string;
    createQuest: string;
    retry: string;
  };
  
  // Validation messages
  validation: {
    titleRequired: string;
    titleMinLength: string;
    titleMaxLength: string;
    titleEmpty: string;
    descriptionMaxLength: string;
    categoryRequired: string;
    categoryInvalid: string;
    difficultyRequired: string;
    privacyRequired: string;
    kindRequired: string;
    targetCountRequired: string;
    countScopeRequired: string;
    periodRequired: string;
    deadlineRequired: string;
    deadlineFuture: string;
    invalidConfiguration: string;
    rewardXpMin: string;
    rewardXpMax: string;
    rewardXpInteger: string;
    tagsMaxCount: string;
    tagMaxLength: string;
    deadlineInvalid: string;
    targetCountPositive: string;
    periodPositive: string;
    quantitativeFieldsRequired: string;
    linkedItemsRequired: string;
    linkedGoalsRequired: string;
    linkedTasksRequired: string;
    reasonMaxLength: string;
  };
  
  // Actions
  actions: {
    create: string;
    edit: string;
    start: string;
    cancel: string;
    fail: string;
    delete: string;
    save: string;
    saving: string;
    canceling: string;
    deleting: string;
    starting: string;
    failing: string;
    retry: string;
    refresh: string;
    updateQuest: string;
    updating: string;
    next: string;
    previous: string;
    createQuest: string;
    creating: string;
    back: string;
    finish: string;
    finishing: string;
    view: string;
  };
  
  // Messages
  messages: {
    createSuccess: string;
    editSuccess: string;
    startSuccess: string;
    cancelSuccess: string;
    failSuccess: string;
    deleteSuccess: string;
    createError: string;
    editError: string;
    startError: string;
    cancelError: string;
    failError: string;
    deleteError: string;
    loadError: string;
    networkError: string;
    validationError: string;
    permissionError: string;
    notFoundError: string;
    conflictError: string;
    serverError: string;
    unexpectedError: string;
    notStarted: string;
    loadFailed: string;
    cannotEdit: string;
    noGoals: string;
    noTasks: string;
    loading: string;
    calculated: string;
    autoCalculated: string;
    rewardCalculatedNote: string;
    selectedGoals: string;
    selectedTasks: string;
  };

  // Goal Integration
  goalIntegration: {
    title: string;
    statistics: string;
    questsList: string;
    noQuests: string;
    createQuest: string;
    viewAll: string;
    moreQuests: string;
    viewAllQuests: string;
    createFirstQuest: string;
    error: string;
    emptyState: {
      title: string;
      description: string;
    };
  };

  // Dashboard
  dashboard: {
    title: string;
    description: string;
    viewDashboard: string;
    statistics: {
      title: string;
      comingSoon: string;
    };
    quickActions: {
      title: string;
      createQuest: string;
      viewAllQuests: string;
      joinChallenges: string;
      viewActivity: string;
    };
    tabs: {
      title: string;
      myQuests: string;
      followingQuests: string;
      templates: string;
      comingSoon: string;
      myQuestsPlaceholder: string;
      followingQuestsPlaceholder: string;
      templatesPlaceholder: string;
    };
  };

  // Create
  create: {
    title: string;
    description: string;
    fromTemplateTitle: string;
    fromTemplateDescription: string;
  };

  // Sections
  sections: {
    quantitativeInfo: string;
    linkedItems: string;
    details: string;
  };
  
  // Confirmations
  confirmations: {
    deleteQuest: string;
    cancelQuest: string;
    failQuest: string;
    startQuest: string;
    deleteConfirm: string;
    cancelConfirm: string;
    failConfirm: string;
    startConfirm: string;
  };
  
  // Categories
  categories: {
    Health: string;
    Work: string;
    Personal: string;
    Learning: string;
    Fitness: string;
    Creative: string;
    Financial: string;
    Social: string;
    Spiritual: string;
    Hobby: string;
    Travel: string;
    Other: string;
  };

  // Category descriptions
  categoryDescriptions: {
    Health: string;
    Work: string;
    Personal: string;
    Learning: string;
    Fitness: string;
    Creative: string;
    Financial: string;
    Social: string;
    Spiritual: string;
    Hobby: string;
    Travel: string;
    Other: string;
  };
  
  // Privacy levels
  privacy: {
    public: string;
    followers: string;
    private: string;
  };
  
  // Quest types
  kinds: {
    linked: string;
    quantitative: string;
  };
  
  // Count scope options
  countScopeOptions: {
    any: string;
    linked: string;
  };
  
  // Deadlines
  deadline: {
    none: string;
    invalid: string;
    past: string;
    tooSoon: string;
  };
  
  // Progress
  progress: {
    calculating: string;
    completed: string;
    inProgress: string;
    notStarted: string;
    percentage: string;
    remaining: string;
    status: string;
    linkedProgress: string;
    quantitativeProgress: string;
    completedItems: string;
    totalItems: string;
    targetReached: string;
    progressUpdated: string;
  };
  
  // Steps
  steps: {
    basicInfo: string;
    basicInfoDescription: string;
    advancedOptions: string;
    advancedOptionsDescription: string;
    review: string;
    reviewDescription: string;
    step: string;
    of: string;
  };
  
  // Placeholders
  placeholders: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    privacy: string;
    kind: string;
    tags: string;
    targetCount: string;
    countScope: string;
    periodDays: string;
    noDescription: string;
  };
  
  // Help text
  help: {
    requiredFields: string;
  };
  
  // Loading
  loading: {
    loadingQuest: string;
  };

  // Notifications (6.2)
  notifications: {
    title: string;
    preferences: {
      title: string;
      questStarted: string;
      questCompleted: string;
      questFailed: string;
      progressMilestones: string;
      deadlineWarnings: string;
      streakAchievements: string;
      challengeUpdates: string;
      channels: {
        title: string;
        inApp: string;
        email: string;
        push: string;
      };
      language: {
        title: string;
        english: string;
        spanish: string;
        french: string;
        currentLanguage: string;
        selectLanguage: string;
      };
    };
    messages: {
      questStarted: string;
      questCompleted: string;
      questFailed: string;
      progressMilestone: string;
      deadlineWarning: string;
      streakAchieved: string;
      challengeJoined: string;
      languageChanged: string;
    };
  };

  // Analytics translations
  analytics: {
    title: string;
    description: string;
    lastUpdated: string;
    noData: string;
    noCategoryData: string;
    noProductivityData: string;
    clickToView: string;
    actions: {
      retry: string;
    };
    periods: {
      daily: string;
      weekly: string;
      monthly: string;
      allTime: string;
    };
    metrics: {
      totalQuests: string;
      completedQuests: string;
      successRate: string;
      averageCompletionTime: string;
      bestStreak: string;
      currentStreak: string;
      xpEarned: string;
    };
    charts: {
      trends: string;
      trendsDescription: string;
      completionRate: string;
      xpEarned: string;
      questsCreated: string;
      categoryPerformance: string;
      categoryPerformanceDescription: string;
      productivityByHour: string;
      productivityByHourDescription: string;
    };
    legend: {
      lessActive: string;
      moreActive: string;
    };
    stats: {
      totalQuestsCompleted: string;
      totalXpEarned: string;
      mostProductiveHour: string;
    };
    insights: {
      overallPerformance: string;
      streakInfo: string;
      mostProductiveCategory: string;
      mostProductiveHour: string;
      mostProductiveHourText: string;
      questsCompleted: string;
      withSuccessRate: string;
      successRate: string;
      trendAnalysis: string;
      trendImproving: string;
      trendDeclining: string;
      trendStable: string;
      consistencyScore: string;
      consistencyDescription: string;
    };
  };

  // Templates translations
  templates: {
    title: string;
    create: string;
    edit: string;
    delete: string;
    view: string;
    useTemplate: string;
    saveAsTemplate: string;
    privacy: {
      public: string;
      followers: string;
      private: string;
      publicDescription: string;
      followersDescription: string;
      privateDescription: string;
    };
    actions: {
      createFromTemplate: string;
      createTemplate: string;
      saveAsTemplate: string;
      useTemplate: string;
      editTemplate: string;
      deleteTemplate: string;
      viewTemplate: string;
      loadMore: string;
    };
    search: {
      placeholder: string;
      noResults: string;
      clearFilters: string;
    };
    filters: {
      category: string;
      difficulty: string;
      privacy: string;
      kind: string;
      allCategories: string;
      allDifficulties: string;
      allPrivacy: string;
      allKinds: string;
      clear: string;
    };
    sort: {
      title: string;
      createdAt: string;
      updatedAt: string;
      difficulty: string;
      rewardXp: string;
    };
    results: {
      templates: string;
    };
    messages: {
      createSuccess: string;
      updateSuccess: string;
      deleteSuccess: string;
      deleteConfirm: string;
      noTemplates: string;
      noResults: string;
      loadError: string;
      createError: string;
      updateError: string;
      deleteError: string;
      notFound: string;
      notFoundDescription: string;
    };
    details: {
      templateInfo: string;
      privacy: string;
    };
    card: {
      openMenu: string;
      targets: string;
      more: string;
      created: string;
      updated: string;
      search: string;
      total: string;
    };
    form: {
      title: string;
      description: string;
      category: string;
      difficulty: string;
      rewardXp: string;
      tags: string;
      privacy: string;
      kind: string;
      targetCount: string;
      countScope: string;
      instructions: string;
      estimatedDuration: string;
      titlePlaceholder: string;
      descriptionPlaceholder: string;
      tagsPlaceholder: string;
      targetCountPlaceholder: string;
      categoryPlaceholder: string;
      difficultyPlaceholder: string;
      privacyPlaceholder: string;
      kindPlaceholder: string;
      instructionsPlaceholder: string;
      steps: {
        basicInfo: string;
        basicInfoDesc: string;
        advancedOptions: string;
        advancedOptionsDesc: string;
        review: string;
        reviewDesc: string;
      };
      step: string;
      of: string;
      creating: string;
      create: string;
    };
    validation: {
      titleRequired: string;
      titleMinLength: string;
      titleMaxLength: string;
      descriptionMaxLength: string;
      categoryRequired: string;
      difficultyRequired: string;
      rewardXpRequired: string;
      rewardXpMin: string;
      rewardXpMax: string;
      tagsMaxCount: string;
      tagMaxLength: string;
      targetCountRequired: string;
      targetCountMin: string;
      targetCountMax: string;
      countScopeRequired: string;
    };
  };
}

/**
 * Quest translations for English (en)
 */
export const questTranslations: Record<'en' | 'es' | 'fr', QuestTranslations> = {
  en: {
    title: 'Create Quest',
    description: 'Create a new quest to track your progress',
    status: {
      draft: 'Draft',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      failed: 'Failed'
    },
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard'
    },
    countScope: {
      completed_tasks: 'Completed Tasks',
      completed_goals: 'Completed Goals',
    },
    fields: {
      title: 'Title',
      description: 'Description',
      category: 'Category',
      difficulty: 'Difficulty',
      rewardXp: 'Reward XP',
      tags: 'Tags',
      deadline: 'Deadline',
      privacy: 'Privacy',
      kind: 'Quest Type',
      linkedGoals: 'Linked Goals',
      linkedTasks: 'Linked Tasks',
      linkedItems: 'Linked Goals & Tasks',
      linkedItemsDescription: 'Select the goals and tasks that this quest will track.',
      goals: 'Goals',
      tasks: 'Tasks',
      dependsOnQuests: 'Depends On Quests',
      targetCount: 'Target Count',
      countScope: 'Count Scope',
      period: 'Quest Period',
      days: 'days',
      createdAt: 'Created',
      updatedAt: 'Updated',
      startedAt: 'Started'
    },

    // Tooltips
    tooltips: {
      title: 'Enter a clear, descriptive title for your quest. This will help you identify it later.',
      description: 'Provide a detailed description of your quest. This helps you and others understand what needs to be accomplished.',
      category: 'Choose the category that best fits your quest. This helps organize and filter your quests.',
      difficulty: 'Select the difficulty level. Quest reward XP is calculated automatically based on scope, period, and difficulty.',
      rewardXp: 'Reward XP is calculated automatically based on quest scope (number of items), period (duration), and difficulty level. The calculation uses a base of 50 XP with multipliers for complexity.',
      privacy: 'Set the privacy level for your quest. Public quests are visible to everyone, followers-only to your followers, and private only to you.',
      kind: 'Choose the quest type. Linked quests are tied to specific goals and tasks, while quantitative quests track completion counts over time.',
      tags: 'Add tags to help categorize and find your quest. Use descriptive keywords separated by commas.',
      targetCount: 'How many completed tasks or goals do you want to achieve? Enter a number greater than 0.',
      countScope: 'Choose what to count for this quest: completed tasks or completed goals within the specified period.',
      period: 'How often should this quest be checked for progress? Choose the time interval for counting completed tasks or goals.',
      deadline: 'Set an optional deadline for your quest. This helps create urgency and track progress over time.',
      progressQuantitative: 'Progress for quantitative quests is calculated based on completed tasks or goals within the specified period.',
      progressLinked: 'Progress for linked quests is calculated based on completion of linked goals and tasks.',
      editButton: 'Edit this quest to modify its details, settings, or requirements.',
      startButton: 'Start this quest to begin tracking your progress and earning rewards.',
      startDisabled: 'This quest cannot be started in its current state.',
      startDisabledQuantitative: 'Cannot start quantitative quest without count scope. Please edit the quest first.',
      deleteButton: 'Permanently delete this quest. This action cannot be undone.',
      viewButton: 'View detailed information about this active quest and its progress.',
      cancelButton: 'Cancel this quest. You won\'t receive rewards and progress will be lost.',
      failButton: 'Mark this quest as failed. This will end the quest without rewards.',
      viewCompletedButton: 'View details and results of this completed quest.',
      linkedGoals: 'Select active goals to link to this quest. Quest progress will be based on completion of these goals.',
      linkedTasks: 'Select specific tasks to link to this quest. Quest progress will be based on completion of these tasks.',
      filters: 'Use these filters to find specific quests. You can search by title, filter by status, difficulty, or category.',
      statusFilter: 'Filter quests by their current status: Draft, Active, Completed, Cancelled, or Failed.',
      difficultyFilter: 'Filter quests by difficulty level: Easy (50 XP), Medium (100 XP), or Hard (200 XP).',
      categoryFilter: 'Filter quests by category: Health, Work, Personal, Learning, Fitness, Creative, Financial, Social, Spiritual, Hobby, Travel, or Other.',
      clearFilters: 'Clear all active filters and show all quests.',
      createQuest: 'Create a new quest to track your progress and earn rewards.',
      retry: 'Retry loading quests. This will attempt to fetch your quests again.'
    },
    validation: {
      titleRequired: 'Title is required',
      titleMinLength: 'Title must be at least 3 characters',
      titleMaxLength: 'Title must be no more than 100 characters',
      titleEmpty: 'Title cannot be empty',
      descriptionMaxLength: 'Description must be no more than 500 characters',
      categoryRequired: 'Category is required',
      difficultyRequired: 'Difficulty is required',
      privacyRequired: 'Privacy is required',
      kindRequired: 'Quest type is required',
      targetCountRequired: 'Target count is required for quantitative quests',
      countScopeRequired: 'Count scope is required for quantitative quests',
      periodRequired: 'Period is required for quantitative quests',
      deadlineRequired: 'Deadline is required',
      deadlineFuture: 'Deadline must be in the future',
      invalidConfiguration: 'Invalid Configuration',
      categoryInvalid: 'Invalid category',
      rewardXpMin: 'Reward XP must be at least 0',
      rewardXpMax: 'Reward XP must be no more than 1000',
      rewardXpInteger: 'Reward XP must be a whole number',
      tagsMaxCount: 'Maximum 10 tags allowed',
      tagMaxLength: 'Each tag must be no more than 20 characters',
      deadlineInvalid: 'Invalid deadline',
      targetCountPositive: 'Target count must be greater than 0',
      periodPositive: 'Period must be greater than 0 days',
      quantitativeFieldsRequired: 'Quantitative quests require targetCount, countScope, and periodDays',
      linkedItemsRequired: 'Linked quests must have at least one goal or task when started',
      linkedGoalsRequired: 'At least one goal is required for linked quests',
      linkedTasksRequired: 'At least one task is required for linked quests',
      reasonMaxLength: 'Reason must be no more than 200 characters'
    },
    actions: {
      create: 'Create',
      edit: 'Edit',
      start: 'Start',
      cancel: 'Cancel',
      fail: 'Mark as Failed',
      creating: 'Creating...',
      delete: 'Delete',
      save: 'Save',
      saving: 'Saving...',
      canceling: 'Canceling...',
      deleting: 'Deleting...',
      starting: 'Starting...',
      failing: 'Marking as Failed...',
      retry: 'Retry',
      refresh: 'Refresh',
      updateQuest: 'Update Quest',
      updating: 'Updating...',
      next: 'Next',
      previous: 'Previous',
      createQuest: 'Create Quest',
     
      back: 'Back',
      finish: 'Finish',
      finishing: 'Finishing...',
      view: 'View'
    },
    messages: {
      createSuccess: 'Quest created successfully',
      editSuccess: 'Quest updated successfully',
      startSuccess: 'Quest started successfully',
      cancelSuccess: 'Quest cancelled successfully',
      failSuccess: 'Quest marked as failed',
      deleteSuccess: 'Quest deleted successfully',
      createError: 'Failed to create quest',
      editError: 'Failed to update quest',
      startError: 'Failed to start quest',
      cancelError: 'Failed to cancel quest',
      failError: 'Failed to mark quest as failed',
      deleteError: 'Failed to delete quest',
      loadError: 'Failed to load quests',
      networkError: 'Network error. Please check your connection.',
      validationError: 'Please fix the validation errors',
      permissionError: 'You do not have permission to perform this action',
      notFoundError: 'Quest not found',
      conflictError: 'Quest was modified by another operation. Please refresh and try again',
      serverError: 'Server error. Please try again later',
      unexpectedError: 'An unexpected error occurred',
      notStarted: 'Not Started',
      loadFailed: 'Failed to load quest. Please try again.',
      cannotEdit: 'Cannot edit quest. This quest is currently {status}. Only draft quests can be edited.',
      noGoals: 'No goals available. Create some goals first.',
      noTasks: 'No tasks available for selected goals.',
      loading: 'Loading quest...',
      calculated: 'Calculated automatically',
      autoCalculated: 'Auto-calculated',
      rewardCalculatedNote: 'Reward XP is calculated automatically based on quest scope, period, and difficulty.',
      selectedGoals: 'Selected Goals:',
      selectedTasks: 'Selected Tasks:'
    },

    sections: {
      quantitativeInfo: 'Quantitative Quest Details',
      linkedItems: 'Linked Items',
      details: 'Quest Details'
    },
    confirmations: {
      deleteQuest: 'Delete Quest',
      cancelQuest: 'Cancel Quest',
      failQuest: 'Mark as Failed',
      startQuest: 'Start Quest',
      deleteConfirm: 'Are you sure you want to delete this quest? This action cannot be undone.',
      cancelConfirm: 'Are you sure you want to cancel this quest?',
      failConfirm: 'Are you sure you want to mark this quest as failed?',
      startConfirm: 'Are you sure you want to start this quest?'
    },
    categories: {
      Health: 'Health',
      Work: 'Work',
      Personal: 'Personal',
      Learning: 'Learning',
      Fitness: 'Fitness',
      Creative: 'Creative',
      Financial: 'Financial',
      Social: 'Social',
      Spiritual: 'Spiritual',
      Hobby: 'Hobby',
      Travel: 'Travel',
      Other: 'Other'
    },
    categoryDescriptions: {
      Health: 'Physical and mental health related quests',
      Work: 'Professional and career development quests',
      Personal: 'Personal growth and self-improvement quests',
      Learning: 'Education and skill development quests',
      Fitness: 'Physical fitness and exercise quests',
      Creative: 'Artistic and creative expression quests',
      Financial: 'Money management and financial goals',
      Social: 'Social connections and relationships',
      Spiritual: 'Spiritual growth and mindfulness quests',
      Hobby: 'Recreational and hobby-related quests',
      Travel: 'Travel and adventure quests',
      Other: 'Other types of quests'
    },
    privacy: {
      public: 'Public',
      followers: 'Followers Only',
      private: 'Private'
    },
    kinds: {
      linked: 'Linked Quest',
      quantitative: 'Quantitative Quest'
    },
    countScopeOptions: {
      any: 'Any',
      linked: 'Linked Items Only'
    },
    deadline: {
      none: 'No deadline',
      invalid: 'Invalid deadline',
      past: 'Deadline has passed',
      tooSoon: 'Deadline must be at least 1 hour in the future'
    },
    progress: {
      calculating: 'Calculating progress...',
      completed: 'Completed',
      inProgress: 'Progress',
      notStarted: 'Not Started',
      percentage: 'Progress',
      remaining: 'remaining',
      status: 'Status:',
      linkedProgress: 'Linked Progress',
      quantitativeProgress: 'Quantitative Progress',
      completedItems: 'Completed Items',
      totalItems: 'Total Items',
      targetReached: 'Target Reached',
      progressUpdated: 'Progress Updated'
    },
    steps: {
      basicInfo: 'Basic Info',
      basicInfoDescription: 'Provide the essential details for your quest.',
      advancedOptions: 'Advanced',
      advancedOptionsDescription: 'Configure additional quest settings.',
      review: 'Review',
      reviewDescription: 'Review your quest details before creating.',
      step: 'Step',
      of: 'of'
    },
    placeholders: {
      title: 'Enter quest title...',
      description: 'Describe your quest...',
      category: 'Select category...',
      difficulty: 'Select difficulty...',
      privacy: 'Select privacy...',
      kind: 'Select quest type...',
      tags: 'Add a tag...',
      targetCount: 'Enter target count...',
      countScope: 'Select count scope...',
      periodDays: 'Enter number of days...',
      noDescription: 'No description provided'
    },
    help: {
      requiredFields: 'Fields marked with * are required'
    },
    loading: {
      loadingQuest: 'Loading quest...'
    },
    filters: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search quests...',
      searchAriaLabel: 'Search quests',
      status: 'Status',
      statusPlaceholder: 'All statuses',
      difficulty: 'Difficulty',
      difficultyPlaceholder: 'All difficulties',
      category: 'Category',
      categoryPlaceholder: 'All categories',
      clear: 'Clear',
      clearAll: 'Clear All',
      clearFilters: 'Clear all filters',
      active: 'active',
      activeFilters: 'active filters',
      activeCount: '{{count}} active filters',
      showing: 'Showing',
    },
    notifications: {
      title: 'Quest Notifications',
      preferences: {
        title: 'Notification Preferences',
        questStarted: 'Quest Started',
        questCompleted: 'Quest Completed',
        questFailed: 'Quest Failed',
        progressMilestones: 'Progress Milestones',
        deadlineWarnings: 'Deadline Warnings',
        streakAchievements: 'Streak Achievements',
        challengeUpdates: 'Challenge Updates',
        channels: {
          title: 'Notification Channels',
          inApp: 'In-App Notifications',
          email: 'Email Notifications',
          push: 'Push Notifications'
        },
        language: {
          title: 'Preferred Language',
          english: 'English',
          spanish: 'Spanish',
          french: 'French',
          currentLanguage: 'Current Language',
          selectLanguage: 'Select Language'
        }
      },
      messages: {
        questStarted: 'Quest "{title}" has been started!',
        questCompleted: 'Congratulations! Quest "{title}" completed!',
        questFailed: 'Quest "{title}" has failed',
        progressMilestone: 'You\'ve reached {percentage}% on quest "{title}"!',
        deadlineWarning: 'Quest "{title}" deadline is approaching!',
        streakAchieved: 'Amazing! You\'ve achieved a {days}-day quest streak!',
        challengeJoined: 'You\'ve joined the challenge "{title}"',
        languageChanged: 'Language changed successfully'
      }
    },
    goalIntegration: {
      title: 'Goal Quests',
      statistics: 'Quest Progress',
      questsList: 'Associated Quests',
      noQuests: 'No quests yet',
      createQuest: 'Create Quest',
      viewAll: 'View All',
      moreQuests: 'And {count} more quests...',
      viewAllQuests: 'View All Quests',
      createFirstQuest: 'Create Your First Quest',
      error: 'Failed to load goal quests',
      emptyState: {
        title: 'No quests for this goal',
        description: 'Create quests to break down this goal into actionable steps.',
      },
    },
    templates: {
      title: 'Quest Templates',
      create: 'Create Template',
      edit: 'Edit Template',
      delete: 'Delete Template',
      view: 'View Template',
      useTemplate: 'Use Template',
      saveAsTemplate: 'Save as Template',
      privacy: {
        public: 'Public',
        followers: 'Followers',
        private: 'Private',
        publicDescription: 'Anyone can see and use this template',
        followersDescription: 'Only your followers can see and use this template',
        privateDescription: 'Only you can see and use this template'
      },
      actions: {
        createFromTemplate: 'Create from Template',
        createTemplate: 'Create Template',
        saveAsTemplate: 'Save as Template',
        useTemplate: 'Use Template',
        editTemplate: 'Edit Template',
        deleteTemplate: 'Delete Template',
        viewTemplate: 'View Template',
        loadMore: 'Load More'
      },
      search: {
        placeholder: 'Search templates...',
        noResults: 'No templates match your filters',
        clearFilters: 'Clear Filters'
      },
      filters: {
        category: 'Category',
        difficulty: 'Difficulty',
        privacy: 'Privacy',
        kind: 'Kind',
        allCategories: 'All Categories',
        allDifficulties: 'All Difficulties',
        allPrivacy: 'All Privacy',
        allKinds: 'All Kinds',
        clear: 'Clear Filters'
      },
      sort: {
        title: 'Title',
        createdAt: 'Created',
        updatedAt: 'Updated',
        difficulty: 'Difficulty',
        rewardXp: 'XP'
      },
      results: {
        templates: 'templates'
      },
      messages: {
        createSuccess: 'Template created successfully',
        updateSuccess: 'Template updated successfully',
        deleteSuccess: 'Template deleted successfully',
        deleteConfirm: 'Are you sure you want to delete this template? This action cannot be undone.',
        noTemplates: 'No templates found',
        noResults: 'No templates match your filters',
        loadError: 'Failed to load templates',
        createError: 'Failed to create template',
        updateError: 'Failed to update template',
        deleteError: 'Failed to delete template',
        notFound: 'Template Not Found',
        notFoundDescription: 'The template you are looking for could not be found or may have been deleted.'
      },
      details: {
        templateInfo: 'Template Info',
        privacy: 'Privacy'
      },
      card: {
        openMenu: 'Open menu',
        targets: 'targets',
        more: 'more',
        created: 'Created',
        updated: 'Updated',
        search: 'Search',
        total: 'total'
      },
      form: {
        title: 'Template Title',
        description: 'Description',
        category: 'Category',
        difficulty: 'Difficulty',
        rewardXp: 'XP Reward',
        tags: 'Tags',
        privacy: 'Privacy Level',
        kind: 'Quest Type',
        targetCount: 'Target Count',
        countScope: 'Count Scope',
        instructions: 'Instructions',
        estimatedDuration: 'Estimated Duration (days)',
        titlePlaceholder: 'Enter template title...',
        descriptionPlaceholder: 'Enter template description...',
        tagsPlaceholder: 'Add tags...',
        targetCountPlaceholder: 'Enter target count...',
        categoryPlaceholder: 'Select category...',
        difficultyPlaceholder: 'Select difficulty...',
        privacyPlaceholder: 'Select privacy...',
        kindPlaceholder: 'Select kind...',
        instructionsPlaceholder: 'Add any specific instructions for using this template...',
        steps: {
          basicInfo: 'Basic Information',
          basicInfoDesc: 'Enter the basic details for your template',
          advancedOptions: 'Advanced Options',
          advancedOptionsDesc: 'Configure privacy, tags, and rewards',
          review: 'Review',
          reviewDesc: 'Review your template before creating'
        },
        step: 'Step',
        of: 'of',
        creating: 'Creating...',
        create: 'Create Template'
      },
      validation: {
        titleRequired: 'Title is required',
        titleMinLength: 'Title must be at least 3 characters',
        titleMaxLength: 'Title must be 100 characters or less',
        descriptionMaxLength: 'Description must be 500 characters or less',
        categoryRequired: 'Category is required',
        difficultyRequired: 'Difficulty is required',
        rewardXpRequired: 'XP reward is required',
        rewardXpMin: 'XP reward must be at least 0',
        rewardXpMax: 'XP reward must be 1000 or less',
        tagsMaxCount: 'Maximum 10 tags allowed',
        tagMaxLength: 'Each tag must be 20 characters or less',
        targetCountRequired: 'Target count is required for quantitative quests',
        targetCountMin: 'Target count must be at least 1',
        targetCountMax: 'Target count must be 1000 or less',
        countScopeRequired: 'Count scope is required for quantitative quests'
      }
    },
    analytics: {
      title: 'Quest Analytics',
      description: 'Track your quest performance and productivity patterns',
      lastUpdated: 'Last updated',
      noData: 'No analytics data available. Complete some quests to see your performance insights.',
      noCategoryData: 'No category data available. Complete quests in different categories to see performance insights.',
      noProductivityData: 'No productivity data available. Complete quests to see your activity patterns.',
      clickToView: 'Click to view detailed analytics',
      actions: {
        retry: 'Retry'
      },
      periods: {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        allTime: 'All Time'
      },
      metrics: {
        totalQuests: 'Total Quests',
        completedQuests: 'Completed Quests',
        successRate: 'Success Rate',
        averageCompletionTime: 'Average Completion Time',
        bestStreak: 'Best Streak',
        currentStreak: 'Current Streak',
        xpEarned: 'XP Earned'
      },
      charts: {
        trends: 'Trends',
        trendsDescription: 'Track your quest performance over time',
        completionRate: 'Completion Rate',
        xpEarned: 'XP Earned',
        questsCreated: 'Quests Created',
        categoryPerformance: 'Category Performance',
        categoryPerformanceDescription: 'Success rates by quest category',
        productivityByHour: 'Productivity by Hour',
        productivityByHourDescription: 'When you complete quests throughout the day'
      },
      legend: {
        lessActive: 'Less Active',
        moreActive: 'More Active'
      },
      stats: {
        totalQuestsCompleted: 'Total Quests Completed',
        totalXpEarned: 'Total XP Earned',
        mostProductiveHour: 'Most Productive Hour'
      },
      insights: {
        overallPerformance: 'Overall Performance',
        streakInfo: 'Streak Information',
        mostProductiveCategory: 'Best Category',
        mostProductiveHour: 'Peak Hour',
        mostProductiveHourText: 'You complete most quests around',
        questsCompleted: 'quests completed',
        withSuccessRate: 'with',
        successRate: 'success rate',
        trendAnalysis: 'Trend Analysis',
        trendImproving: 'Your performance is improving!',
        trendDeclining: 'Your performance has declined recently.',
        trendStable: 'Your performance is stable.',
        consistencyScore: 'Consistency Score',
        consistencyDescription: 'Based on your best streak vs total quests'
      }
    },
    dashboard: {
      title: 'Quest Dashboard',
      description: 'Track your quest progress and statistics',
      viewDashboard: 'View Dashboard',
      statistics: {
        title: 'Quest Statistics',
        comingSoon: 'Statistics coming soon...'
      },
      quickActions: {
        title: 'Quick Actions',
        createQuest: 'Create Quest',
        viewAllQuests: 'View All',
        joinChallenges: 'Challenges',
        viewActivity: 'Activity'
      },
      tabs: {
        title: 'Quest Overview',
        myQuests: 'My Quests',
        followingQuests: 'Following',
        templates: 'Templates',
        comingSoon: 'Quest tabs coming soon...',
        myQuestsPlaceholder: 'My quests content will be implemented here.',
        followingQuestsPlaceholder: 'Following quests content will be implemented here.',
        templatesPlaceholder: 'Quest templates will be displayed here.'
      }
    },

    create: {
      title: 'Create Quest',
      description: 'Create a new quest to track your progress and achieve your goals.',
      fromTemplateTitle: 'Create Quest from Template',
      fromTemplateDescription: 'Create a quest based on the template. You can modify any fields before creating.'
    }
  },
  es: {
    title: 'Crear Misión',
    description: 'Crea una nueva misión para rastrear tu progreso',
    status: {
      draft: 'Borrador',
      active: 'Activo',
      completed: 'Completado',
      cancelled: 'Cancelado',
      failed: 'Fallido'
    },
    difficulty: {
      easy: 'Fácil',
      medium: 'Medio',
      hard: 'Difícil'
    },
    countScope: {
      completed_tasks: 'Tareas Completadas',
      completed_goals: 'Objetivos Completados',
    },
    fields: {
      title: 'Título',
      description: 'Descripción',
      category: 'Categoría',
      difficulty: 'Dificultad',
      rewardXp: 'XP de Recompensa',
      tags: 'Etiquetas',
      deadline: 'Fecha Límite',
      privacy: 'Privacidad',
      kind: 'Tipo de Misión',
      linkedGoals: 'Objetivos Vinculados',
      linkedTasks: 'Tareas Vinculadas',
      linkedItems: 'Objetivos y Tareas Vinculados',
      linkedItemsDescription: 'Selecciona los objetivos y tareas que esta misión rastreará.',
      goals: 'Objetivos',
      tasks: 'Tareas',
      dependsOnQuests: 'Depende de Misiones',
      targetCount: 'Cantidad Objetivo',
      countScope: 'Alcance del Conteo',
      period: 'Período de la Misión',
      days: 'días',
      createdAt: 'Creado',
      updatedAt: 'Actualizado',
      startedAt: 'Iniciado'
    },

    // Tooltips
    tooltips: {
      title: 'Ingresa un título claro y descriptivo para tu misión. Esto te ayudará a identificarla más tarde.',
      description: 'Proporciona una descripción detallada de tu misión. Esto te ayuda a ti y a otros a entender qué se necesita lograr.',
      category: 'Elige la categoría que mejor se ajuste a tu misión. Esto ayuda a organizar y filtrar tus misiones.',
      difficulty: 'Selecciona el nivel de dificultad. La XP de recompensa de la misión se calcula automáticamente según el alcance, el período y la dificultad.',
      rewardXp: 'La XP de recompensa se calcula automáticamente según el alcance de la misión (número de elementos), el período (duración) y el nivel de dificultad. El cálculo utiliza una base de 50 XP con multiplicadores por complejidad.',
      privacy: 'Establece el nivel de privacidad para tu misión. Las misiones públicas son visibles para todos, solo seguidores para tus seguidores, y privadas solo para ti.',
      kind: 'Elige el tipo de misión. Las misiones vinculadas están ligadas a metas y tareas específicas, mientras que las misiones cuantitativas rastrean conteos de finalización a lo largo del tiempo.',
      tags: 'Agrega etiquetas para ayudar a categorizar y encontrar tu misión. Usa palabras clave descriptivas separadas por comas.',
      targetCount: '¿Cuántas tareas o metas completadas quieres lograr? Ingresa un número mayor que 0.',
      countScope: 'Elige qué contar para esta misión: tareas completadas o metas completadas dentro del período especificado.',
      period: '¿Con qué frecuencia debe verificarse el progreso de esta misión? Elige el intervalo de tiempo para contar tareas o metas completadas.',
      deadline: 'Establece una fecha límite opcional para tu misión. Esto ayuda a crear urgencia y rastrear el progreso a lo largo del tiempo.',
      progressQuantitative: 'El progreso para misiones cuantitativas se calcula basado en tareas o metas completadas dentro del período especificado.',
      progressLinked: 'El progreso para misiones vinculadas se calcula basado en la finalización de metas y tareas vinculadas.',
      editButton: 'Edita esta misión para modificar sus detalles, configuraciones o requisitos.',
      startButton: 'Inicia esta misión para comenzar a rastrear tu progreso y ganar recompensas.',
      startDisabled: 'Esta misión no se puede iniciar en su estado actual.',
      startDisabledQuantitative: 'No se puede iniciar una misión cuantitativa sin alcance de conteo. Por favor edita la misión primero.',
      deleteButton: 'Elimina permanentemente esta misión. Esta acción no se puede deshacer.',
      viewButton: 'Ve información detallada sobre esta misión activa y su progreso.',
      cancelButton: 'Cancela esta misión. No recibirás recompensas y se perderá el progreso.',
      failButton: 'Marca esta misión como fallida. Esto terminará la misión sin recompensas.',
      viewCompletedButton: 'Ve detalles y resultados de esta misión completada.',
      linkedGoals: 'Selecciona objetivos activos para vincular a esta misión. El progreso de la misión se basará en la finalización de estos objetivos.',
      linkedTasks: 'Selecciona tareas específicas para vincular a esta misión. El progreso de la misión se basará en la finalización de estas tareas.',
      filters: 'Usa estos filtros para encontrar misiones específicas. Puedes buscar por título, filtrar por estado, dificultad o categoría.',
      statusFilter: 'Filtra misiones por su estado actual: Borrador, Activo, Completado, Cancelado o Fallido.',
      difficultyFilter: 'Filtra misiones por nivel de dificultad: Fácil (50 XP), Medio (100 XP) o Difícil (200 XP).',
      categoryFilter: 'Filtra misiones por categoría: Salud, Trabajo, Personal, Aprendizaje, Fitness, Creativo, Financiero, Social, Espiritual, Hobby, Viaje u Otro.',
      clearFilters: 'Limpiar todos los filtros activos y mostrar todas las misiones.',
      createQuest: 'Crea una nueva misión para rastrear tu progreso y ganar recompensas.',
      retry: 'Reintentar cargar misiones. Esto intentará obtener tus misiones nuevamente.'
    },
    validation: {
      titleRequired: 'El título es requerido',
      titleMinLength: 'El título debe tener al menos 3 caracteres',
      titleMaxLength: 'El título no puede tener más de 100 caracteres',
      titleEmpty: 'El título no puede estar vacío',
      descriptionMaxLength: 'La descripción no puede tener más de 500 caracteres',
      categoryRequired: 'La categoría es requerida',
      difficultyRequired: 'La dificultad es requerida',
      privacyRequired: 'La privacidad es requerida',
      kindRequired: 'El tipo de misión es requerido',
      targetCountRequired: 'El conteo objetivo es requerido para misiones cuantitativas',
      countScopeRequired: 'El alcance del conteo es requerido para misiones cuantitativas',
      periodRequired: 'El período es requerido para misiones cuantitativas',
      deadlineRequired: 'La fecha límite es requerida',
      deadlineFuture: 'La fecha límite debe estar en el futuro',
      invalidConfiguration: 'Configuración Inválida',
      categoryInvalid: 'Categoría inválida',
      rewardXpMin: 'La XP de recompensa debe ser al menos 0',
      rewardXpMax: 'La XP de recompensa no puede ser más de 1000',
      rewardXpInteger: 'La XP de recompensa debe ser un número entero',
      tagsMaxCount: 'Máximo 10 etiquetas permitidas',
      tagMaxLength: 'Cada etiqueta debe tener máximo 20 caracteres',
      deadlineInvalid: 'Fecha límite inválida',
      targetCountPositive: 'La cantidad objetivo debe ser mayor que 0',
      periodPositive: 'El período debe ser mayor que 0 días',
      quantitativeFieldsRequired: 'Las misiones cuantitativas requieren cantidad objetivo, alcance del conteo y período',
      linkedItemsRequired: 'Las misiones vinculadas deben tener al menos un objetivo o tarea cuando se inicien',
      linkedGoalsRequired: 'Al menos un objetivo es requerido para misiones vinculadas',
      linkedTasksRequired: 'Al menos una tarea es requerida para misiones vinculadas',
      reasonMaxLength: 'La razón no puede tener más de 200 caracteres'
    },
    actions: {
      create: 'Crear',
      edit: 'Editar',
      start: 'Iniciar',
      cancel: 'Cancelar',
      fail: 'Marcar como Fallida',
      creating: 'Creando...',
      delete: 'Eliminar',
      save: 'Guardar',
      saving: 'Guardando...',
      canceling: 'Cancelando...',
      deleting: 'Eliminando...',
      starting: 'Iniciando...',
      failing: 'Marcando como Fallida...',
      retry: 'Reintentar',
      refresh: 'Actualizar',
      updateQuest: 'Actualizar Misión',
      updating: 'Actualizando...',
      next: 'Siguiente',
      previous: 'Anterior',
      createQuest: 'Crear Misión',
      
      back: 'Atrás',
      finish: 'Finalizar',
      finishing: 'Finalizando...',
      view: 'Ver'
    },
    filters: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar misiones...',
      searchAriaLabel: 'Buscar misiones',
      status: 'Estado',
      statusPlaceholder: 'Todos los estados',
      difficulty: 'Dificultad',
      difficultyPlaceholder: 'Todas las dificultades',
      category: 'Categoría',
      categoryPlaceholder: 'Todas las categorías',
      clear: 'Limpiar',
      clearAll: 'Limpiar Todo',
      clearFilters: 'Limpiar todos los filtros',
      active: 'activos',
      activeFilters: 'filtros activos',
      activeCount: '{{count}} filtros activos',
      showing: 'Mostrando',
    },
    messages: {
      createSuccess: 'Misión creada exitosamente',
      editSuccess: 'Misión actualizada exitosamente',
      startSuccess: 'Misión iniciada exitosamente',
      cancelSuccess: 'Misión cancelada exitosamente',
      failSuccess: 'Misión marcada como fallida',
      deleteSuccess: 'Misión eliminada exitosamente',
      createError: 'Error al crear la misión',
      editError: 'Error al actualizar la misión',
      startError: 'Error al iniciar la misión',
      cancelError: 'Error al cancelar la misión',
      failError: 'Error al marcar la misión como fallida',
      deleteError: 'Error al eliminar la misión',
      loadError: 'Error al cargar las misiones',
      networkError: 'Error de red. Por favor verifica tu conexión.',
      validationError: 'Por favor corrige los errores de validación',
      permissionError: 'No tienes permisos para realizar esta acción',
      notFoundError: 'Misión no encontrada',
      conflictError: 'La misión fue modificada por otra operación. Por favor actualiza e intenta de nuevo',
      serverError: 'Error del servidor. Por favor intenta más tarde',
      unexpectedError: 'Ocurrió un error inesperado',
      notStarted: 'No Iniciado',
      loadFailed: 'Error al cargar la misión. Por favor intenta de nuevo.',
      cannotEdit: 'No se puede editar la misión. Esta misión está actualmente {status}. Solo las misiones en borrador pueden ser editadas.',
      noGoals: 'No hay objetivos disponibles. Crea algunos objetivos primero.',
      noTasks: 'No hay tareas disponibles para los objetivos seleccionados.',
      loading: 'Cargando misión...',
      calculated: 'Calculado automáticamente',
      autoCalculated: 'Auto-calculado',
      rewardCalculatedNote: 'La XP de recompensa se calcula automáticamente según el alcance de la misión, el período y la dificultad.',
      selectedGoals: 'Objetivos Seleccionados:',
      selectedTasks: 'Tareas Seleccionadas:'
    },

    sections: {
      quantitativeInfo: 'Detalles de Misión Cuantitativa',
      linkedItems: 'Elementos Vinculados',
      details: 'Detalles de la Misión'
    },
    confirmations: {
      deleteQuest: 'Eliminar Misión',
      cancelQuest: 'Cancelar Misión',
      failQuest: 'Marcar como Fallida',
      startQuest: 'Iniciar Misión',
      deleteConfirm: '¿Estás seguro de que quieres eliminar esta misión? Esta acción no se puede deshacer.',
      cancelConfirm: '¿Estás seguro de que quieres cancelar esta misión?',
      failConfirm: '¿Estás seguro de que quieres marcar esta misión como fallida?',
      startConfirm: '¿Estás seguro de que quieres iniciar esta misión?'
    },
    categories: {
      Health: 'Salud',
      Work: 'Trabajo',
      Personal: 'Personal',
      Learning: 'Aprendizaje',
      Fitness: 'Fitness',
      Creative: 'Creativo',
      Financial: 'Financiero',
      Social: 'Social',
      Spiritual: 'Espiritual',
      Hobby: 'Pasatiempo',
      Travel: 'Viaje',
      Other: 'Otro'
    },
    categoryDescriptions: {
      Health: 'Misiones relacionadas con salud física y mental',
      Work: 'Misiones de desarrollo profesional y carrera',
      Personal: 'Misiones de crecimiento personal y superación',
      Learning: 'Misiones de educación y desarrollo de habilidades',
      Fitness: 'Misiones de ejercicio y condición física',
      Creative: 'Misiones de expresión artística y creativa',
      Financial: 'Gestión del dinero y metas financieras',
      Social: 'Conexiones sociales y relaciones',
      Spiritual: 'Misiones de crecimiento espiritual y mindfulness',
      Hobby: 'Misiones recreativas y de pasatiempos',
      Travel: 'Misiones de viaje y aventura',
      Other: 'Otros tipos de misiones'
    },
    privacy: {
      public: 'Público',
      followers: 'Solo Seguidores',
      private: 'Privado'
    },
    kinds: {
      linked: 'Misión Vinculada',
      quantitative: 'Misión Cuantitativa'
    },
    countScopeOptions: {
      any: 'Cualquiera',
      linked: 'Solo Elementos Vinculados'
    },
    deadline: {
      none: 'Sin fecha límite',
      invalid: 'Fecha límite inválida',
      past: 'La fecha límite ha pasado',
      tooSoon: 'La fecha límite debe ser al menos 1 hora en el futuro'
    },
    progress: {
      calculating: 'Calculando progreso...',
      completed: 'Completado',
      inProgress: 'Progreso',
      notStarted: 'No Iniciado',
      percentage: 'Progreso',
      remaining: 'restantes',
      status: 'Estado:',
      linkedProgress: 'Progreso Vinculado',
      quantitativeProgress: 'Progreso Cuantitativo',
      completedItems: 'Elementos Completados',
      totalItems: 'Total de Elementos',
      targetReached: 'Objetivo Alcanzado',
      progressUpdated: 'Progreso Actualizado'
    },
    steps: {
      basicInfo: 'Información Básica',
      basicInfoDescription: 'Proporciona los detalles esenciales para tu misión.',
      advancedOptions: 'Avanzado',
      advancedOptionsDescription: 'Configura opciones adicionales de la misión.',
      review: 'Revisar',
      reviewDescription: 'Revisa los detalles de tu misión antes de crear.',
      step: 'Paso',
      of: 'de'
    },
    placeholders: {
      title: 'Ingresa el título de la misión...',
      description: 'Describe tu misión...',
      category: 'Selecciona categoría...',
      difficulty: 'Selecciona dificultad...',
      privacy: 'Selecciona privacidad...',
      kind: 'Selecciona tipo de misión...',
      tags: 'Agrega una etiqueta...',
      targetCount: 'Ingresa cantidad objetivo...',
      countScope: 'Selecciona alcance del conteo...',
      periodDays: 'Ingresa número de días...',
      noDescription: 'No se proporcionó descripción'
    },
    help: {
      requiredFields: 'Los campos marcados con * son obligatorios'
    },
    loading: {
      loadingQuest: 'Cargando misión...'
    },
    notifications: {
      title: 'Notificaciones de Misiones',
      preferences: {
        title: 'Preferencias de Notificación',
        questStarted: 'Misión Iniciada',
        questCompleted: 'Misión Completada',
        questFailed: 'Misión Fallida',
        progressMilestones: 'Hitos de Progreso',
        deadlineWarnings: 'Avisos de Fecha Límite',
        streakAchievements: 'Logros de Racha',
        challengeUpdates: 'Actualizaciones de Desafío',
        channels: {
          title: 'Canales de Notificación',
          inApp: 'Notificaciones en la Aplicación',
          email: 'Notificaciones por Correo',
          push: 'Notificaciones Push'
        },
        language: {
          title: 'Idioma Preferido',
          english: 'Inglés',
          spanish: 'Español',
          french: 'Francés',
          currentLanguage: 'Idioma Actual',
          selectLanguage: 'Seleccionar Idioma'
        }
      },
      messages: {
        questStarted: '¡La misión "{title}" ha comenzado!',
        questCompleted: '¡Felicitaciones! ¡Misión "{title}" completada!',
        questFailed: 'La misión "{title}" ha fallado',
        progressMilestone: '¡Has alcanzado {percentage}% en la misión "{title}"!',
        deadlineWarning: '¡La fecha límite de la misión "{title}" se acerca!',
        streakAchieved: '¡Increíble! ¡Has logrado una racha de {days} días!',
        challengeJoined: 'Te has unido al desafío "{title}"',
        languageChanged: 'Idioma cambiado exitosamente'
      }
    },
    templates: {
      title: 'Plantillas de Misiones',
      create: 'Crear Plantilla',
      edit: 'Editar Plantilla',
      delete: 'Eliminar Plantilla',
      view: 'Ver Plantilla',
      useTemplate: 'Usar Plantilla',
      saveAsTemplate: 'Guardar como Plantilla',
      privacy: {
        public: 'Público',
        followers: 'Seguidores',
        private: 'Privado',
        publicDescription: 'Cualquiera puede ver y usar esta plantilla',
        followersDescription: 'Solo tus seguidores pueden ver y usar esta plantilla',
        privateDescription: 'Solo tú puedes ver y usar esta plantilla'
      },
      actions: {
        createFromTemplate: 'Crear desde Plantilla',
        createTemplate: 'Crear Plantilla',
        saveAsTemplate: 'Guardar como Plantilla',
        useTemplate: 'Usar Plantilla',
        editTemplate: 'Editar Plantilla',
        deleteTemplate: 'Eliminar Plantilla',
        viewTemplate: 'Ver Plantilla',
        loadMore: 'Cargar Más'
      },
      search: {
        placeholder: 'Buscar plantillas...',
        noResults: 'No hay plantillas que coincidan con tus filtros',
        clearFilters: 'Limpiar Filtros'
      },
      filters: {
        category: 'Categoría',
        difficulty: 'Dificultad',
        privacy: 'Privacidad',
        kind: 'Tipo',
        allCategories: 'Todas las Categorías',
        allDifficulties: 'Todas las Dificultades',
        allPrivacy: 'Toda la Privacidad',
        allKinds: 'Todos los Tipos',
        clear: 'Limpiar Filtros'
      },
      sort: {
        title: 'Título',
        createdAt: 'Creado',
        updatedAt: 'Actualizado',
        difficulty: 'Dificultad',
        rewardXp: 'XP'
      },
      results: {
        templates: 'plantillas'
      },
      messages: {
        createSuccess: 'Plantilla creada exitosamente',
        updateSuccess: 'Plantilla actualizada exitosamente',
        deleteSuccess: 'Plantilla eliminada exitosamente',
        deleteConfirm: '¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer.',
        noTemplates: 'No se encontraron plantillas',
        noResults: 'No hay plantillas que coincidan con tus filtros',
        loadError: 'Error al cargar plantillas',
        createError: 'Error al crear plantilla',
        updateError: 'Error al actualizar plantilla',
        deleteError: 'Error al eliminar plantilla',
        notFound: 'Plantilla No Encontrada',
        notFoundDescription: 'La plantilla que buscas no se pudo encontrar o puede haber sido eliminada.'
      },
      details: {
        templateInfo: 'Información de la Plantilla',
        privacy: 'Privacidad'
      },
      card: {
        openMenu: 'Abrir menú',
        targets: 'objetivos',
        more: 'más',
        created: 'Creado',
        updated: 'Actualizado',
        search: 'Búsqueda',
        total: 'total'
      },
      form: {
        title: 'Título de la Plantilla',
        description: 'Descripción',
        category: 'Categoría',
        difficulty: 'Dificultad',
        rewardXp: 'Recompensa XP',
        tags: 'Etiquetas',
        privacy: 'Nivel de Privacidad',
        kind: 'Tipo de Misión',
        targetCount: 'Cantidad Objetivo',
        countScope: 'Alcance del Conteo',
        instructions: 'Instrucciones',
        estimatedDuration: 'Duración Estimada (días)',
        titlePlaceholder: 'Ingresa el título de la plantilla...',
        descriptionPlaceholder: 'Ingresa la descripción de la plantilla...',
        tagsPlaceholder: 'Agregar etiquetas...',
        targetCountPlaceholder: 'Ingresa la cantidad objetivo...',
        categoryPlaceholder: 'Selecciona categoría...',
        difficultyPlaceholder: 'Selecciona dificultad...',
        privacyPlaceholder: 'Selecciona privacidad...',
        kindPlaceholder: 'Selecciona tipo...',
        instructionsPlaceholder: 'Agrega instrucciones específicas para usar esta plantilla...',
        steps: {
          basicInfo: 'Información Básica',
          basicInfoDesc: 'Ingresa los detalles básicos para tu plantilla',
          advancedOptions: 'Opciones Avanzadas',
          advancedOptionsDesc: 'Configura privacidad, etiquetas y recompensas',
          review: 'Revisar',
          reviewDesc: 'Revisa tu plantilla antes de crear'
        },
        step: 'Paso',
        of: 'de',
        creating: 'Creando...',
        create: 'Crear Plantilla'
      },
      validation: {
        titleRequired: 'El título es requerido',
        titleMinLength: 'El título debe tener al menos 3 caracteres',
        titleMaxLength: 'El título debe tener 100 caracteres o menos',
        descriptionMaxLength: 'La descripción debe tener 500 caracteres o menos',
        categoryRequired: 'La categoría es requerida',
        difficultyRequired: 'La dificultad es requerida',
        rewardXpRequired: 'La recompensa XP es requerida',
        rewardXpMin: 'La recompensa XP debe ser al menos 0',
        rewardXpMax: 'La recompensa XP debe ser 1000 o menos',
        tagsMaxCount: 'Máximo 10 etiquetas permitidas',
        tagMaxLength: 'Cada etiqueta debe tener 20 caracteres o menos',
        targetCountRequired: 'La cantidad objetivo es requerida para misiones cuantitativas',
        targetCountMin: 'La cantidad objetivo debe ser al menos 1',
        targetCountMax: 'La cantidad objetivo debe ser 1000 o menos',
        countScopeRequired: 'El alcance del conteo es requerido para misiones cuantitativas'
      }
    },
    analytics: {
      title: 'Análisis de Misiones',
      description: 'Rastrea el rendimiento de tus misiones y patrones de productividad',
      lastUpdated: 'Última actualización',
      noData: 'No hay datos de análisis disponibles. Completa algunas misiones para ver tus insights de rendimiento.',
      noCategoryData: 'No hay datos de categoría disponibles. Completa misiones en diferentes categorías para ver insights de rendimiento.',
      noProductivityData: 'No hay datos de productividad disponibles. Completa misiones para ver tus patrones de actividad.',
      clickToView: 'Haz clic para ver análisis detallados',
      actions: {
        retry: 'Reintentar'
      },
      periods: {
        daily: 'Diario',
        weekly: 'Semanal',
        monthly: 'Mensual',
        allTime: 'Todo el Tiempo'
      },
      metrics: {
        totalQuests: 'Total de Misiones',
        completedQuests: 'Misiones Completadas',
        successRate: 'Tasa de Éxito',
        averageCompletionTime: 'Tiempo Promedio de Finalización',
        bestStreak: 'Mejor Racha',
        currentStreak: 'Racha Actual',
        xpEarned: 'XP Ganado'
      },
      charts: {
        trends: 'Tendencias',
        trendsDescription: 'Rastrea el rendimiento de tus misiones a lo largo del tiempo',
        completionRate: 'Tasa de Finalización',
        xpEarned: 'XP Ganado',
        questsCreated: 'Misiones Creadas',
        categoryPerformance: 'Rendimiento por Categoría',
        categoryPerformanceDescription: 'Tasas de éxito por categoría de misión',
        productivityByHour: 'Productividad por Hora',
        productivityByHourDescription: 'Cuándo completas misiones durante el día'
      },
      legend: {
        lessActive: 'Menos Activo',
        moreActive: 'Más Activo'
      },
      stats: {
        totalQuestsCompleted: 'Total de Misiones Completadas',
        totalXpEarned: 'Total de XP Ganado',
        mostProductiveHour: 'Hora Más Productiva'
      },
      insights: {
        overallPerformance: 'Rendimiento General',
        streakInfo: 'Información de Racha',
        mostProductiveCategory: 'Mejor Categoría',
        mostProductiveHour: 'Hora Pico',
        mostProductiveHourText: 'Completas la mayoría de misiones alrededor de',
        questsCompleted: 'misiones completadas',
        withSuccessRate: 'con',
        successRate: 'tasa de éxito',
        trendAnalysis: 'Análisis de Tendencia',
        trendImproving: '¡Tu rendimiento está mejorando!',
        trendDeclining: 'Tu rendimiento ha declinado recientemente.',
        trendStable: 'Tu rendimiento es estable.',
        consistencyScore: 'Puntuación de Consistencia',
        consistencyDescription: 'Basado en tu mejor racha vs total de misiones'
      }
    },
    goalIntegration: {
      title: 'Misiones de Meta',
      statistics: 'Progreso de Misiones',
      questsList: 'Misiones Asociadas',
      noQuests: 'Sin misiones aún',
      createQuest: 'Crear Misión',
      viewAll: 'Ver Todas',
      moreQuests: 'Y {count} misiones más...',
      viewAllQuests: 'Ver Todas las Misiones',
      createFirstQuest: 'Crear Tu Primera Misión',
      error: 'Error al cargar misiones de meta',
      emptyState: {
        title: 'Sin misiones para esta meta',
        description: 'Crea misiones para dividir esta meta en pasos accionables.',
      },
    },
    dashboard: {
      title: 'Panel de Misiones',
      description: 'Rastrea el progreso y estadísticas de tus misiones',
      viewDashboard: 'Ver Panel',
      statistics: {
        title: 'Estadísticas de Misiones',
        comingSoon: 'Estadísticas próximamente...'
      },
      quickActions: {
        title: 'Acciones Rápidas',
        createQuest: 'Crear Misión',
        viewAllQuests: 'Ver Todas',
        joinChallenges: 'Desafíos',
        viewActivity: 'Actividad'
      },
      tabs: {
        title: 'Resumen de Misiones',
        myQuests: 'Mis Misiones',
        followingQuests: 'Siguiendo',
        templates: 'Plantillas',
        comingSoon: 'Pestañas de misiones próximamente...',
        myQuestsPlaceholder: 'El contenido de mis misiones se implementará aquí.',
        followingQuestsPlaceholder: 'El contenido de misiones seguidas se implementará aquí.',
        templatesPlaceholder: 'Las plantillas de misiones se mostrarán aquí.'
      }
    },

    create: {
      title: 'Crear Misión',
      description: 'Crea una nueva misión para rastrear tu progreso y alcanzar tus objetivos.',
      fromTemplateTitle: 'Crear Misión desde Plantilla',
      fromTemplateDescription: 'Crea una misión basada en la plantilla. Puedes modificar cualquier campo antes de crear.'
    }
  },
  fr: {
    title: 'Créer une Quête',
    description: 'Créez une nouvelle quête pour suivre vos progrès',
    status: {
      draft: 'Brouillon',
      active: 'Actif',
      completed: 'Terminé',
      cancelled: 'Annulé',
      failed: 'Échoué'
    },
    difficulty: {
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile'
    },
    countScope: {
      completed_tasks: 'Tâches Terminées',
      completed_goals: 'Objectifs Terminés',
    },
    fields: {
      title: 'Titre',
      description: 'Description',
      category: 'Catégorie',
      difficulty: 'Difficulté',
      rewardXp: 'XP de Récompense',
      tags: 'Étiquettes',
      deadline: 'Date Limite',
      privacy: 'Confidentialité',
      kind: 'Type de Quête',
      linkedGoals: 'Objectifs Liés',
      linkedTasks: 'Tâches Liées',
      linkedItems: 'Objectifs et Tâches Liés',
      linkedItemsDescription: 'Sélectionnez les objectifs et tâches que cette quête suivra.',
      goals: 'Objectifs',
      tasks: 'Tâches',
      dependsOnQuests: 'Dépend des Quêtes',
      targetCount: 'Nombre Cible',
      countScope: 'Portée du Comptage',
      period: 'Période de la Quête',
      days: 'jours',
      createdAt: 'Créé',
      updatedAt: 'Mis à jour',
      startedAt: 'Démarré'
    },

    // Tooltips
    tooltips: {
      title: 'Entrez un titre clair et descriptif pour votre quête. Cela vous aidera à l\'identifier plus tard.',
      description: 'Fournissez une description détaillée de votre quête. Cela vous aide, vous et les autres, à comprendre ce qui doit être accompli.',
      category: 'Choisissez la catégorie qui correspond le mieux à votre quête. Cela aide à organiser et filtrer vos quêtes.',
      difficulty: 'Sélectionnez le niveau de difficulté. L\'XP de récompense de la quête est calculée automatiquement selon la portée, la période et la difficulté.',
      rewardXp: 'L\'XP de récompense est calculée automatiquement selon la portée de la quête (nombre d\'éléments), la période (durée) et le niveau de difficulté. Le calcul utilise une base de 50 XP avec des multiplicateurs pour la complexité.',
      privacy: 'Définissez le niveau de confidentialité pour votre quête. Les quêtes publiques sont visibles par tous, les abonnés seulement par vos abonnés, et privées seulement par vous.',
      kind: 'Choisissez le type de quête. Les quêtes liées sont liées à des objectifs et tâches spécifiques, tandis que les quêtes quantitatives suivent les comptes de finalisation au fil du temps.',
      tags: 'Ajoutez des étiquettes pour aider à catégoriser et trouver votre quête. Utilisez des mots-clés descriptifs séparés par des virgules.',
      targetCount: 'Combien de tâches ou d\'objectifs complétés voulez-vous atteindre ? Entrez un nombre supérieur à 0.',
      countScope: 'Choisissez ce qu\'il faut compter pour cette quête : tâches complétées ou objectifs complétés dans la période spécifiée.',
      period: 'À quelle fréquence cette quête doit-elle être vérifiée pour le progrès ? Choisissez l\'intervalle de temps pour compter les tâches ou objectifs complétés.',
      deadline: 'Définissez une date limite optionnelle pour votre quête. Cela aide à créer de l\'urgence et à suivre les progrès au fil du temps.',
      progressQuantitative: 'Le progrès pour les quêtes quantitatives est calculé basé sur les tâches ou objectifs complétés dans la période spécifiée.',
      progressLinked: 'Le progrès pour les quêtes liées est calculé basé sur l\'achèvement des objectifs et tâches liés.',
      editButton: 'Modifiez cette quête pour changer ses détails, paramètres ou exigences.',
      startButton: 'Démarrez cette quête pour commencer à suivre votre progrès et gagner des récompenses.',
      startDisabled: 'Cette quête ne peut pas être démarrée dans son état actuel.',
      startDisabledQuantitative: 'Impossible de démarrer une quête quantitative sans portée de comptage. Veuillez d\'abord modifier la quête.',
      deleteButton: 'Supprimez définitivement cette quête. Cette action ne peut pas être annulée.',
      viewButton: 'Voir les informations détaillées sur cette quête active et son progrès.',
      cancelButton: 'Annulez cette quête. Vous ne recevrez pas de récompenses et le progrès sera perdu.',
      failButton: 'Marquez cette quête comme échouée. Cela terminera la quête sans récompenses.',
      viewCompletedButton: 'Voir les détails et résultats de cette quête complétée.',
      linkedGoals: 'Sélectionnez des objectifs actifs à lier à cette quête. Le progrès de la quête sera basé sur l\'achèvement de ces objectifs.',
      linkedTasks: 'Sélectionnez des tâches spécifiques à lier à cette quête. Le progrès de la quête sera basé sur l\'achèvement de ces tâches.',
      filters: 'Utilisez ces filtres pour trouver des quêtes spécifiques. Vous pouvez rechercher par titre, filtrer par statut, difficulté ou catégorie.',
      statusFilter: 'Filtrez les quêtes par leur statut actuel : Brouillon, Actif, Complété, Annulé ou Échoué.',
      difficultyFilter: 'Filtrez les quêtes par niveau de difficulté : Facile (50 XP), Moyen (100 XP) ou Difficile (200 XP).',
      categoryFilter: 'Filtrez les quêtes par catégorie : Santé, Travail, Personnel, Apprentissage, Fitness, Créatif, Financier, Social, Spirituel, Loisir, Voyage ou Autre.',
      clearFilters: 'Effacer tous les filtres actifs et afficher toutes les quêtes.',
      createQuest: 'Créer une nouvelle quête pour suivre votre progrès et gagner des récompenses.',
      retry: 'Réessayer de charger les quêtes. Cela tentera de récupérer vos quêtes à nouveau.'
    },
    validation: {
      titleRequired: 'Le titre est requis',
      titleMinLength: 'Le titre doit avoir au moins 3 caractères',
      titleMaxLength: 'Le titre ne peut pas dépasser 100 caractères',
      titleEmpty: 'Le titre ne peut pas être vide',
      descriptionMaxLength: 'La description ne peut pas dépasser 500 caractères',
      categoryRequired: 'La catégorie est requise',
      difficultyRequired: 'La difficulté est requise',
      privacyRequired: 'La confidentialité est requise',
      kindRequired: 'Le type de quête est requis',
      targetCountRequired: 'Le nombre cible est requis pour les quêtes quantitatives',
      countScopeRequired: 'La portée du comptage est requise pour les quêtes quantitatives',
      periodRequired: 'La période est requise pour les quêtes quantitatives',
      deadlineRequired: 'La date limite est requise',
      deadlineFuture: 'La date limite doit être dans le futur',
      invalidConfiguration: 'Configuration Invalide',
      categoryInvalid: 'Catégorie invalide',
      rewardXpMin: 'L\'XP de récompense doit être au moins 0',
      rewardXpMax: 'L\'XP de récompense ne peut pas dépasser 1000',
      rewardXpInteger: 'L\'XP de récompense doit être un nombre entier',
      tagsMaxCount: 'Maximum 10 étiquettes autorisées',
      tagMaxLength: 'Chaque étiquette doit avoir maximum 20 caractères',
      deadlineInvalid: 'Date limite invalide',
      targetCountPositive: 'Le nombre cible doit être supérieur à 0',
      periodPositive: 'La période doit être supérieure à 0 jours',
      quantitativeFieldsRequired: 'Les quêtes quantitatives nécessitent un nombre cible, une portée de comptage et une période',
      linkedItemsRequired: 'Les quêtes liées doivent avoir au moins un objectif ou une tâche lors du démarrage',
      linkedGoalsRequired: 'Au moins un objectif est requis pour les quêtes liées',
      linkedTasksRequired: 'Au moins une tâche est requise pour les quêtes liées',
      reasonMaxLength: 'La raison ne peut pas dépasser 200 caractères'
    },
    actions: {
      create: 'Créer',
      edit: 'Modifier',
      start: 'Démarrer',
      cancel: 'Annuler',
      fail: 'Marquer comme Échoué',
      creating: 'Création...',
      delete: 'Supprimer',
      save: 'Sauvegarder',
      saving: 'Sauvegarde...',
      canceling: 'Annulation...',
      deleting: 'Suppression...',
      starting: 'Démarrage...',
      failing: 'Marquage comme Échoué...',
      retry: 'Réessayer',
      refresh: 'Actualiser',
      updateQuest: 'Mettre à jour la Quête',
      updating: 'Mise à jour...',
      next: 'Suivant',
      previous: 'Précédent',
      createQuest: 'Créer une Quête',
      
      back: 'Retour',
      finish: 'Terminer',
      finishing: 'Finalisation...',
      view: 'Voir'
    },
    messages: {
      createSuccess: 'Quête créée avec succès',
      editSuccess: 'Quête mise à jour avec succès',
      startSuccess: 'Quête démarrée avec succès',
      cancelSuccess: 'Quête annulée avec succès',
      failSuccess: 'Quête marquée comme échouée',
      deleteSuccess: 'Quête supprimée avec succès',
      createError: 'Échec de la création de la quête',
      editError: 'Échec de la mise à jour de la quête',
      startError: 'Échec du démarrage de la quête',
      cancelError: 'Échec de l\'annulation de la quête',
      failError: 'Échec du marquage de la quête comme échouée',
      deleteError: 'Échec de la suppression de la quête',
      loadError: 'Échec du chargement des quêtes',
      networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',
      validationError: 'Veuillez corriger les erreurs de validation',
      permissionError: 'Vous n\'avez pas la permission d\'effectuer cette action',
      notFoundError: 'Quête non trouvée',
      conflictError: 'La quête a été modifiée par une autre opération. Veuillez actualiser et réessayer',
      serverError: 'Erreur serveur. Veuillez réessayer plus tard',
      unexpectedError: 'Une erreur inattendue s\'est produite',
      notStarted: 'Non Démarré',
      loadFailed: 'Échec du chargement de la quête. Veuillez réessayer.',
      cannotEdit: 'Impossible de modifier la quête. Cette quête est actuellement {status}. Seules les quêtes en brouillon peuvent être modifiées.',
      noGoals: 'Aucun objectif disponible. Créez d\'abord des objectifs.',
      noTasks: 'Aucune tâche disponible pour les objectifs sélectionnés.',
      loading: 'Chargement de la quête...',
      calculated: 'Calculé automatiquement',
      autoCalculated: 'Auto-calculé',
      rewardCalculatedNote: 'L\'XP de récompense est calculée automatiquement selon la portée de la quête, la période et la difficulté.',
      selectedGoals: 'Objectifs Sélectionnés:',
      selectedTasks: 'Tâches Sélectionnées:'
    },

    sections: {
      quantitativeInfo: 'Détails de Quête Quantitative',
      linkedItems: 'Éléments Liés',
      details: 'Détails de la Quête'
    },
    confirmations: {
      deleteQuest: 'Supprimer Quête',
      cancelQuest: 'Annuler Quête',
      failQuest: 'Marquer comme Échoué',
      startQuest: 'Démarrer Quête',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cette quête ? Cette action ne peut pas être annulée.',
      cancelConfirm: 'Êtes-vous sûr de vouloir annuler cette quête ?',
      failConfirm: 'Êtes-vous sûr de vouloir marquer cette quête comme échouée ?',
      startConfirm: 'Êtes-vous sûr de vouloir démarrer cette quête ?'
    },
    categories: {
      Health: 'Santé',
      Work: 'Travail',
      Personal: 'Personnel',
      Learning: 'Apprentissage',
      Fitness: 'Fitness',
      Creative: 'Créatif',
      Financial: 'Financier',
      Social: 'Social',
      Spiritual: 'Spirituel',
      Hobby: 'Loisir',
      Travel: 'Voyage',
      Other: 'Autre'
    },
    categoryDescriptions: {
      Health: 'Quêtes liées à la santé physique et mentale',
      Work: 'Quêtes de développement professionnel et de carrière',
      Personal: 'Quêtes de croissance personnelle et d\'amélioration de soi',
      Learning: 'Quêtes d\'éducation et de développement de compétences',
      Fitness: 'Quêtes de forme physique et d\'exercice',
      Creative: 'Quêtes d\'expression artistique et créative',
      Financial: 'Gestion de l\'argent et objectifs financiers',
      Social: 'Connexions sociales et relations',
      Spiritual: 'Quêtes de croissance spirituelle et de pleine conscience',
      Hobby: 'Quêtes récréatives et de loisirs',
      Travel: 'Quêtes de voyage et d\'aventure',
      Other: 'Autres types de quêtes'
    },
    privacy: {
      public: 'Public',
      followers: 'Abonnés Seulement',
      private: 'Privé'
    },
    kinds: {
      linked: 'Quête Liée',
      quantitative: 'Quête Quantitative'
    },
    countScopeOptions: {
      any: 'N\'importe',
      linked: 'Éléments Liés Seulement'
    },
    deadline: {
      none: 'Aucune date limite',
      invalid: 'Date limite invalide',
      past: 'La date limite est passée',
      tooSoon: 'La date limite doit être au moins 1 heure dans le futur'
    },
    progress: {
      calculating: 'Calcul du progrès...',
      completed: 'Terminé',
      inProgress: 'Progrès',
      notStarted: 'Non Démarré',
      percentage: 'Progrès',
      remaining: 'restants',
      status: 'Statut:',
      linkedProgress: 'Progrès Lié',
      quantitativeProgress: 'Progrès Quantitatif',
      completedItems: 'Éléments Terminés',
      totalItems: 'Total des Éléments',
      targetReached: 'Objectif Atteint',
      progressUpdated: 'Progrès Mis à Jour'
    },
    steps: {
      basicInfo: 'Informations de Base',
      basicInfoDescription: 'Fournissez les détails essentiels pour votre quête.',
      advancedOptions: 'Avancé',
      advancedOptionsDescription: 'Configurez les paramètres supplémentaires de la quête.',
      review: 'Révision',
      reviewDescription: 'Révisez les détails de votre quête avant de créer.',
      step: 'Étape',
      of: 'de'
    },
    placeholders: {
      title: 'Entrez le titre de la quête...',
      description: 'Décrivez votre quête...',
      category: 'Sélectionnez la catégorie...',
      difficulty: 'Sélectionnez la difficulté...',
      privacy: 'Sélectionnez la confidentialité...',
      kind: 'Sélectionnez le type de quête...',
      tags: 'Ajoutez une étiquette...',
      targetCount: 'Entrez le nombre cible...',
      countScope: 'Sélectionnez la portée du comptage...',
      periodDays: 'Entrez le nombre de jours...',
      noDescription: 'Aucune description fournie'
    },
    help: {
      requiredFields: 'Les champs marqués d\'un * sont obligatoires'
    },
    loading: {
      loadingQuest: 'Chargement de la quête...'
    },
    notifications: {
      title: 'Notifications de Quête',
      preferences: {
        title: 'Préférences de Notification',
        questStarted: 'Quête Commencée',
        questCompleted: 'Quête Terminée',
        questFailed: 'Quête Échouée',
        progressMilestones: 'Jalons de Progrès',
        deadlineWarnings: 'Avertissements d\'Échéance',
        streakAchievements: 'Succès de Série',
        challengeUpdates: 'Mises à Jour de Défi',
        channels: {
          title: 'Canaux de Notification',
          inApp: 'Notifications dans l\'Application',
          email: 'Notifications par Email',
          push: 'Notifications Push'
        },
        language: {
          title: 'Langue Préférée',
          english: 'Anglais',
          spanish: 'Espagnol',
          french: 'Français',
          currentLanguage: 'Langue Actuelle',
          selectLanguage: 'Sélectionner la Langue'
        }
      },
      messages: {
        questStarted: 'La quête "{title}" a commencé !',
        questCompleted: 'Félicitations ! Quête "{title}" terminée !',
        questFailed: 'La quête "{title}" a échoué',
        progressMilestone: 'Vous avez atteint {percentage}% sur la quête "{title}" !',
        deadlineWarning: 'L\'échéance de la quête "{title}" approche !',
        streakAchieved: 'Incroyable ! Vous avez atteint une série de {days} jours !',
        challengeJoined: 'Vous avez rejoint le défi "{title}"',
        languageChanged: 'Langue changée avec succès'
      }
    },
    templates: {
      title: 'Modèles de Quêtes',
      create: 'Créer un Modèle',
      edit: 'Modifier le Modèle',
      delete: 'Supprimer le Modèle',
      view: 'Voir le Modèle',
      useTemplate: 'Utiliser le Modèle',
      saveAsTemplate: 'Enregistrer comme Modèle',
      privacy: {
        public: 'Public',
        followers: 'Abonnés',
        private: 'Privé',
        publicDescription: 'Tout le monde peut voir et utiliser ce modèle',
        followersDescription: 'Seuls vos abonnés peuvent voir et utiliser ce modèle',
        privateDescription: 'Seul vous pouvez voir et utiliser ce modèle'
      },
      actions: {
        createFromTemplate: 'Créer à partir du Modèle',
        createTemplate: 'Créer un Modèle',
        saveAsTemplate: 'Enregistrer comme Modèle',
        useTemplate: 'Utiliser le Modèle',
        editTemplate: 'Modifier le Modèle',
        deleteTemplate: 'Supprimer le Modèle',
        viewTemplate: 'Voir le Modèle',
        loadMore: 'Charger Plus'
      },
      search: {
        placeholder: 'Rechercher des modèles...',
        noResults: 'Aucun modèle ne correspond à vos filtres',
        clearFilters: 'Effacer les Filtres'
      },
      filters: {
        category: 'Catégorie',
        difficulty: 'Difficulté',
        privacy: 'Confidentialité',
        kind: 'Type',
        allCategories: 'Toutes les Catégories',
        allDifficulties: 'Toutes les Difficultés',
        allPrivacy: 'Toute la Confidentialité',
        allKinds: 'Tous les Types',
        clear: 'Effacer les Filtres'
      },
      sort: {
        title: 'Titre',
        createdAt: 'Créé',
        updatedAt: 'Mis à Jour',
        difficulty: 'Difficulté',
        rewardXp: 'XP'
      },
      results: {
        templates: 'modèles'
      },
      messages: {
        createSuccess: 'Modèle créé avec succès',
        updateSuccess: 'Modèle mis à jour avec succès',
        deleteSuccess: 'Modèle supprimé avec succès',
        deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action ne peut pas être annulée.',
        noTemplates: 'Aucun modèle trouvé',
        noResults: 'Aucun modèle ne correspond à vos filtres',
        loadError: 'Échec du chargement des modèles',
        createError: 'Échec de la création du modèle',
        updateError: 'Échec de la mise à jour du modèle',
        deleteError: 'Échec de la suppression du modèle',
        notFound: 'Modèle Non Trouvé',
        notFoundDescription: 'Le modèle que vous recherchez n\'a pas pu être trouvé ou a peut-être été supprimé.'
      },
      details: {
        templateInfo: 'Informations du Modèle',
        privacy: 'Confidentialité'
      },
      card: {
        openMenu: 'Ouvrir le menu',
        targets: 'cibles',
        more: 'plus',
        created: 'Créé',
        updated: 'Mis à jour',
        search: 'Recherche',
        total: 'total'
      },
      form: {
        title: 'Titre du Modèle',
        description: 'Description',
        category: 'Catégorie',
        difficulty: 'Difficulté',
        rewardXp: 'Récompense XP',
        tags: 'Étiquettes',
        privacy: 'Niveau de Confidentialité',
        kind: 'Type de Quête',
        targetCount: 'Nombre Cible',
        countScope: 'Portée du Comptage',
        instructions: 'Instructions',
        estimatedDuration: 'Durée Estimée (jours)',
        titlePlaceholder: 'Entrez le titre du modèle...',
        descriptionPlaceholder: 'Entrez la description du modèle...',
        tagsPlaceholder: 'Ajouter des étiquettes...',
        targetCountPlaceholder: 'Entrez le nombre cible...',
        categoryPlaceholder: 'Sélectionnez la catégorie...',
        difficultyPlaceholder: 'Sélectionnez la difficulté...',
        privacyPlaceholder: 'Sélectionnez la confidentialité...',
        kindPlaceholder: 'Sélectionnez le type...',
        instructionsPlaceholder: 'Ajoutez des instructions spécifiques pour utiliser ce modèle...',
        steps: {
          basicInfo: 'Informations de Base',
          basicInfoDesc: 'Entrez les détails de base pour votre modèle',
          advancedOptions: 'Options Avancées',
          advancedOptionsDesc: 'Configurez la confidentialité, les étiquettes et les récompenses',
          review: 'Révision',
          reviewDesc: 'Révisez votre modèle avant de créer'
        },
        step: 'Étape',
        of: 'de',
        creating: 'Création...',
        create: 'Créer le Modèle'
      },
      validation: {
        titleRequired: 'Le titre est requis',
        titleMinLength: 'Le titre doit contenir au moins 3 caractères',
        titleMaxLength: 'Le titre doit contenir 100 caractères ou moins',
        descriptionMaxLength: 'La description doit contenir 500 caractères ou moins',
        categoryRequired: 'La catégorie est requise',
        difficultyRequired: 'La difficulté est requise',
        rewardXpRequired: 'La récompense XP est requise',
        rewardXpMin: 'La récompense XP doit être au moins 0',
        rewardXpMax: 'La récompense XP doit être 1000 ou moins',
        tagsMaxCount: 'Maximum 10 étiquettes autorisées',
        tagMaxLength: 'Chaque étiquette doit contenir 20 caractères ou moins',
        targetCountRequired: 'Le nombre cible est requis pour les quêtes quantitatives',
        targetCountMin: 'Le nombre cible doit être au moins 1',
        targetCountMax: 'Le nombre cible doit être 1000 ou moins',
        countScopeRequired: 'La portée du comptage est requise pour les quêtes quantitatives'
      }
    },
    analytics: {
      title: 'Analyses de Quêtes',
      description: 'Suivez les performances de vos quêtes et les modèles de productivité',
      lastUpdated: 'Dernière mise à jour',
      noData: 'Aucune donnée d\'analyse disponible. Terminez quelques quêtes pour voir vos insights de performance.',
      noCategoryData: 'Aucune donnée de catégorie disponible. Terminez des quêtes dans différentes catégories pour voir les insights de performance.',
      noProductivityData: 'Aucune donnée de productivité disponible. Terminez des quêtes pour voir vos modèles d\'activité.',
      clickToView: 'Cliquez pour voir les analyses détaillées',
      actions: {
        retry: 'Réessayer'
      },
      periods: {
        daily: 'Quotidien',
        weekly: 'Hebdomadaire',
        monthly: 'Mensuel',
        allTime: 'Tout le Temps'
      },
      metrics: {
        totalQuests: 'Total des Quêtes',
        completedQuests: 'Quêtes Terminées',
        successRate: 'Taux de Réussite',
        averageCompletionTime: 'Temps Moyen de Finalisation',
        bestStreak: 'Meilleure Série',
        currentStreak: 'Série Actuelle',
        xpEarned: 'XP Gagné'
      },
      charts: {
        trends: 'Tendances',
        trendsDescription: 'Suivez les performances de vos quêtes au fil du temps',
        completionRate: 'Taux de Finalisation',
        xpEarned: 'XP Gagné',
        questsCreated: 'Quêtes Créées',
        categoryPerformance: 'Performance par Catégorie',
        categoryPerformanceDescription: 'Taux de réussite par catégorie de quête',
        productivityByHour: 'Productivité par Heure',
        productivityByHourDescription: 'Quand vous terminez des quêtes pendant la journée'
      },
      legend: {
        lessActive: 'Moins Actif',
        moreActive: 'Plus Actif'
      },
      stats: {
        totalQuestsCompleted: 'Total des Quêtes Terminées',
        totalXpEarned: 'Total XP Gagné',
        mostProductiveHour: 'Heure la Plus Productive'
      },
      insights: {
        overallPerformance: 'Performance Globale',
        streakInfo: 'Informations de Série',
        mostProductiveCategory: 'Meilleure Catégorie',
        mostProductiveHour: 'Heure de Pointe',
        mostProductiveHourText: 'Vous terminez la plupart des quêtes vers',
        questsCompleted: 'quêtes terminées',
        withSuccessRate: 'avec',
        successRate: 'taux de réussite',
        trendAnalysis: 'Analyse de Tendance',
        trendImproving: 'Votre performance s\'améliore !',
        trendDeclining: 'Votre performance a décliné récemment.',
        trendStable: 'Votre performance est stable.',
        consistencyScore: 'Score de Consistance',
        consistencyDescription: 'Basé sur votre meilleure série vs total des quêtes'
      }
    },
    goalIntegration: {
      title: 'Quêtes d\'Objectif',
      statistics: 'Progrès des Quêtes',
      questsList: 'Quêtes Associées',
      noQuests: 'Pas encore de quêtes',
      createQuest: 'Créer une Quête',
      viewAll: 'Voir Tout',
      moreQuests: 'Et {count} quêtes de plus...',
      viewAllQuests: 'Voir Toutes les Quêtes',
      createFirstQuest: 'Créer Votre Première Quête',
      error: 'Échec du chargement des quêtes d\'objectif',
      emptyState: {
        title: 'Aucune quête pour cet objectif',
        description: 'Créez des quêtes pour diviser cet objectif en étapes actionnables.',
      },
    },
    filters: {
      title: 'Filtres',
      search: 'Rechercher',
      searchPlaceholder: 'Rechercher des quêtes...',
      searchAriaLabel: 'Rechercher des quêtes',
      status: 'Statut',
      statusPlaceholder: 'Tous les statuts',
      difficulty: 'Difficulté',
      difficultyPlaceholder: 'Toutes les difficultés',
      category: 'Catégorie',
      categoryPlaceholder: 'Toutes les catégories',
      clear: 'Effacer',
      clearAll: 'Tout Effacer',
      clearFilters: 'Effacer tous les filtres',
      active: 'actifs',
      activeFilters: 'filtres actifs',
      activeCount: '{{count}} filtres actifs',
      showing: 'Affichage',
    },
    dashboard: {
      title: 'Tableau de Bord des Quêtes',
      description: 'Suivez vos progrès et statistiques de quête',
      viewDashboard: 'Voir le Tableau',
      statistics: {
        title: 'Statistiques des Quêtes',
        comingSoon: 'Statistiques bientôt disponibles...'
      },
      quickActions: {
        title: 'Actions Rapides',
        createQuest: 'Créer une Quête',
        viewAllQuests: 'Voir Tout',
        joinChallenges: 'Défis',
        viewActivity: 'Activité'
      },
      tabs: {
        title: 'Aperçu des Quêtes',
        myQuests: 'Mes Quêtes',
        followingQuests: 'Abonnements',
        templates: 'Modèles',
        comingSoon: 'Onglets de quête bientôt disponibles...',
        myQuestsPlaceholder: 'Le contenu de mes quêtes sera implémenté ici.',
        followingQuestsPlaceholder: 'Le contenu des quêtes suivies sera implémenté ici.',
        templatesPlaceholder: 'Les modèles de quêtes seront affichés ici.'
      }
    },

    create: {
      title: 'Créer une Quête',
      description: 'Créez une nouvelle quête pour suivre vos progrès et atteindre vos objectifs.',
      fromTemplateTitle: 'Créer une Quête à partir d\'un Modèle',
      fromTemplateDescription: 'Créez une quête basée sur le modèle. Vous pouvez modifier tous les champs avant de créer.'
    }
  }
};


