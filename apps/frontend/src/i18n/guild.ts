/**
 * Internationalization (i18n) translations for guild features.
 *
 * This module provides translations for all guild-related UI text,
 * following the project's i18n patterns and structure.
 */

export interface GuildTranslations {
  title: string;
  page: {
    title: string;
    subtitle: string;
    errorTitle: string;
    errorMessage: string;
    retry: string;
    createSuccess: string;
  };
  create: {
    title: string;
    subtitle: string;
    editTitle: string;
    form: {
      name: {
        label: string;
        placeholder: string;
        help: string;
        error: {
          required: string;
          tooShort: string;
          tooLong: string;
          invalid: string;
          taken: string;
        };
      };
      description: {
        label: string;
        placeholder: string;
        help: string;
        error: {
          tooLong: string;
        };
      };
      tags: {
        label: string;
        placeholder: string;
        help: string;
        addTag: string;
        removeTag: string;
        maxReached: string;
        count: string;
        error: {
          tooMany: string;
          invalid: string;
        };
      };
      guildType: {
        label: string;
        placeholder: string;
        help: string;
        options: {
          public: string;
          private: string;
          approval: string;
        };
        descriptions: {
          public: string;
          private: string;
          approval: string;
        };
      };
      avatar: {
        label: 'Guild Avatar';
        help: 'Upload a custom avatar for your guild (optional)';
        upload: 'Upload Avatar';
        change: 'Change Avatar';
        remove: 'Remove Avatar';
        confirm: 'Confirm Upload';
        cancel: 'Cancel';
        error: {
          invalidType: 'Please select a valid image file (JPEG, PNG, or WebP)';
          tooLarge: 'File size must be less than 5MB';
          uploadFailed: 'Avatar upload failed';
        };
        success: string;
        error: string;
      };
      validation: {
        fixErrors: string;
        cancelConfirm: string;
      };
    };
    actions: {
      create: string;
      creating: string;
      cancel: string;
    };
  };
  list: {
    title: string;
    filtersAndSearch: string;
    filterByTags: string;
    clearFilters: string;
    guildsFound: string;
    guild: string;
    guilds: string;
    createGuild: string;
    search: {
      placeholder: string;
    };
    filters: {
      all: string;
      myGuilds: string;
      public: string;
    };
    sort: {
      label: string;
      newest: string;
      oldest: string;
      members: string;
      activity: string;
    };
    view: {
      grid: string;
      list: string;
    };
    empty: {
      title: string;
      description: string;
      action: string;
    };
  };
  details: {
    loading: string;
    notFound: string;
    notMember: string;
    tabs: {
      overview: string;
      members: string;
      goals: string;
      quests: string;
      analytics: string;
      comments: string;
      chat: string;
      joinRequests: string;
      moderation: string;
    };
    avatar: {
      title: string;
      upload: string;
      change: string;
      remove: string;
      confirm: string;
      cancel: string;
      help: string;
      uploading: string;
      removing: string;
      chooseImage: string;
      helpFormats: string;
      helpSize: string;
      helpRecommended: string;
      helpCompression: string;
      error: {
        invalidType: string;
        tooLarge: string;
        uploadFailed: string;
        removeFailed: string;
      };
      success: {
        uploaded: string;
        removed: string;
      };
    };
    actions: {
      join: string;
      joining: string;
      leave: string;
      leaving: string;
      settings: string;
      invite: string;
      pendingRequest: string;
      requestToJoin: string;
      viewGuild: string;
      edit: string;
      delete: string;
    };
    stats: {
      members: string;
      goals: string;
      quests: string;
      created: string;
    };
    types: {
      public: string;
      private: string;
      approval: string;
    };
    overview: {
      guildInfo: string;
      visibility: string;
      visibilityPublic: string;
      visibilityPrivate: string;
      created: string;
      owner: string;
      createdBy: string;
      editAvatarHint: string;
    };
  };
  members: {
    title: string;
    search: {
      placeholder: string;
    };
    role: {
      owner: string;
      moderator: string;
      member: string;
    };
    actions: {
      remove: string;
      viewProfile: string;
      assignModerator: string;
      removeModerator: string;
      blockUser: string;
      unblockUser: string;
      toggleCommentPermission: string;
      removeFromGuild: string;
    };
    empty: string;
    joined: string;
    blockedFromCommenting: string;
  };
  joinRequests: {
    title: string;
    empty: string;
    reviewTitle?: string;
    reviewDescription?: string;
    requested?: string;
    reasonLabel?: string;
    reasonPlaceholder?: string;
    actions: {
      approve: string;
      reject: string;
      viewProfile?: string;
    };
    status: {
      pending: string;
      approved: string;
      rejected: string;
    };
    requestToJoin: {
      title: string;
      description?: string;
      message: string;
      placeholder: string;
      submit: string;
      submitting: string;
      cancel?: string;
      success?: string;
      error?: string;
    };
  };
  moderation: {
    title: string;
    noMembers: string;
    actions: {
      blockUser: string;
      unblockUser: string;
      removeComment: string;
      toggleCommentPermission: string;
      disableComments: string;
      enableComments: string;
    };
    descriptions: {
      blockUser: string;
      unblockUser: string;
      disableComments: string;
      enableComments: string;
    };
    confirmations: {
      blockUser: string;
      unblockUser: string;
      removeComment: string;
      transferOwnership: string;
    };
    reasons: {
      spam: string;
      inappropriate: string;
      harassment: string;
      other: string;
    };
    labels: {
      reasonOptional: string;
      customReason: string;
      selectReason: string;
      addDetails: string;
      cancel: string;
      blocked: string;
      noComments: string;
    };
  };
  ownership: {
    transfer: {
      title: string;
      selectNewOwner: string;
      selectMember: string;
      reason: string;
      reasonPlaceholder: string;
      confirm: string;
      confirming: string;
      success: string;
      warning: string;
      warningTitle: string;
      warningMessage: string;
      finalWarning: string;
      finalWarningMessage: string;
      cancel: string;
      characters: string;
    };
  };
  validation: {
    nameRequired: string;
    nameTooShort: string;
    nameTooLong: string;
    nameInvalid: string;
    nameTaken: string;
    descriptionTooLong: string;
    tagTooShort: string;
    tagTooLong: string;
    tagInvalid: string;
    tooManyTags: string;
  };
  messages: {
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    joinSuccess: string;
    leaveSuccess: string;
    removeSuccess: string;
    error: string;
    confirmLeave: string;
    confirmDelete: string;
    confirmRemove: string;
  };
  analytics: {
    title: string;
    dashboard: string;
    memberLeaderboard: string;
    members: string;
    goals: string;
    quests: string;
    xp: string;
    today: string;
    yesterday: string;
    daysAgo: string;
    weeksAgo: string;
    monthsAgo: string;
    never: string;
    showingTop: string;
    of: string;
    active: string;
    completed: string;
    weeklyActivity: string;
    memberEngagement: string;
    topPerformers: string;
    highestActivity: string;
    memberActivityRate: string;
    questCompletionRate: string;
    performanceMetrics: string;
    thisWeeksSummary: string;
    newMembers: string;
    questsCompleted: string;
    activityScore: string;
    loading: string;
    error: string;
    retry: string;
    noData: string;
    controls: string;
    refreshData: string;
    lastUpdated: string;
    lastActivity: string;
  };
  rankings: {
    title: string;
    subtitle: string;
    score: string;
    loading: string;
    errorTitle: string;
    tryAgain: string;
    searchPlaceholder: string;
    backToGuilds: string;
    refresh: string;
    updated: string;
    topPerformers: string;
    allRankings: string;
    filters: {
      all: string;
      public: string;
      private: string;
      top10: string;
      top50: string;
    };
    sort: {
      rank: string;
      score: string;
      members: string;
      activity: string;
    };
    stats: {
      members: string;
      pts: string;
      totalGuilds: string;
      totalMembers: string;
      totalScore: string;
      avgActivity: string;
    };
    empty: {
      title: string;
      adjustFilters: string;
      noGuilds: string;
    };
    showingTop: string;
    ofGuilds: string;
    totalScore: string;
    performanceScore: string;
    performanceDescription: string;
    scoreInfo: {
      title: string;
      description: string;
      formula: {
        activityScore: string;
        growthBonus: string;
        totalScore: string;
      };
      examples: {
        title: string;
        newGuild: string;
        establishedGuild: string;
        topGuild: string;
      };
      tips: {
        title: string;
        memberGrowth: string;
        newGuildBoost: string;
        activityMatters: string;
      };
    };
  };
      comments: {
        title: string;
        post: string;
        reply: string;
        edit: string;
        delete: string;
        like: string;
        unlike: string;
        placeholder: string;
        replyPlaceholder: string;
        noComments: string;
        noCommentsDescription: string;
        loading: string;
        error: string;
        errorLoading: string;
        retry: string;
        owner: string;
        edited: string;
        showReplies: string;
        hideReplies: string;
        replyCount: string;
        repliesCount: string;
        characters: string;
        blockUser: string;
        removeFromGuild: string;
        confirmDeleteComment: string;
        confirmBlockUser: string;
        confirmRemoveUser: string;
        justNow: string;
        membersOnly: {
          title: string;
          message: string;
          joinButton: string;
        };
        blocked: {
          title: string;
          message: string;
          contactModerator: string;
        };
        commentingDisabled: {
          title: string;
          message: string;
          contactModerator: string;
        };
      };
      quests: {
        title: string;
        subtitle: string;
        create: string;
        createTitle: string;
        createDescription: string;
        noQuests: string;
        noQuestsDescription: string;
        noQuestsDescriptionMember: string;
        loading: string;
        error: string;
        status: {
          all: string;
          active: string;
          draft: string;
          archived: string;
          cancelled: string;
          completed: string;
          failed: string;
        };
        types: {
          quantitative: string;
          percentual: string;
        };
        difficulty: {
          easy: string;
          medium: string;
          hard: string;
        };
        form: {
          title: string;
          titlePlaceholder: string;
          description: string;
          descriptionPlaceholder: string;
          category: string;
          difficulty: string;
          rewardXp: string;
          questType: string;
          tags: string;
          tagsPlaceholder: string;
          tagsHelp: string;
          deadline: string;
          quantitative: {
            title: string;
            targetCount: string;
            targetCountPlaceholder: string;
            countScope: string;
            countScopeGoals: string;
            countScopeTasks: string;
            countScopeGuildQuest: string;
            targetQuestId: string;
            targetQuestIdPlaceholder: string;
            periodDays: string;
            periodDaysPlaceholder: string;
          };
          percentual: {
            title: string;
            percentualType: string;
            goalTaskCompletion: string;
            memberCompletion: string;
            targetPercentage: string;
            targetPercentagePlaceholder: string;
            linkedGoalIds: string;
            linkedGoalIdsPlaceholder: string;
            linkedTaskIds: string;
            linkedTaskIdsPlaceholder: string;
            percentualCountScope: string;
            percentualCountScopeGoals: string;
            percentualCountScopeTasks: string;
            percentualCountScopeBoth: string;
          };
          validation: {
            titleRequired: string;
            titleTooShort: string;
            categoryRequired: string;
            targetCountRequired: string;
            targetCountInvalid: string;
            countScopeRequired: string;
            targetQuestIdRequired: string;
            percentualTypeRequired: string;
            targetPercentageRequired: string;
            targetPercentageInvalid: string;
            linkedGoalTaskRequired: string;
            percentualCountScopeRequired: string;
          };
        };
        actions: {
          create: string;
          creating: string;
          edit: string;
          delete: string;
          archive: string;
          complete: string;
          completing: string;
          completed: string;
          viewProgress: string;
        };
        messages: {
          createSuccess: string;
          updateSuccess: string;
          deleteSuccess: string;
          archiveSuccess: string;
          completeSuccess: string;
          activateSuccess: string;
          finishSuccess: string;
          alreadyCompleted: string;
          onlyActiveComplete: string;
          onlyDraftEdit: string;
          onlyDraftDelete: string;
          onlyActiveArchive: string;
          onlyDraftActivate: string;
          onlyActiveFinish: string;
        };
        finishDialog: {
          title: string;
          warningTitle: string;
          warningMessage: string;
          successTitle: string;
          successMessage: string;
          confirmMessage: string;
          cancel: string;
          confirm: string;
          finishing: string;
        };
        progress: {
          goalsCompleted: string;
          tasksCompleted: string;
          guildQuestsCompleted: string;
          completionPercentage: string;
          membersCompleted: string;
          targetPercentage: string;
        };
        metadata: {
          rewardXp: string;
          category: string;
          deadline: string;
          completedBy: string;
        };
      };
      activities: {
        title: string;
        loading: string;
        error: string;
        empty: string;
        emptyDescription: string;
        types: {
          quest_created: string;
          quest_activated: string;
          quest_completed: string;
          quest_failed: string;
          member_joined: string;
          member_left: string;
        };
        messages: {
          questCreated: string;
          questActivated: string;
          questCompleted: string;
          questFailed: string;
          memberJoined: string;
          memberLeft: string;
        };
      };
  edit: {
    title: string;
    subtitle: string;
    basicInfo: string;
    settings: string;
    avatar: string;
    members: string;
    guildName: string;
    guildAvatar: string;
    guildNamePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    guildType: string;
    selectGuildType: string;
    publicGuild: string;
    privateGuild: string;
    approvalGuild: string;
    addTag: string;
    tagsHelp: string;
    allowJoinRequests: string;
    allowJoinRequestsDesc: string;
    requireApproval: string;
    requireApprovalDesc: string;
    locked: string;
    requireApprovalLockedDesc: string;
    allowComments: string;
    allowCommentsDesc: string;
    uploadAvatar: string;
    avatarHelp: string;
    preview: string;
    remove: string;
    memberManagement: string;
    memberManagementComingSoon: string;
    cancel: string;
      save: string;
      uploadingAvatar: string;
      loading: string;
    errorTitle: string;
    errorMessage: string;
    permissionDenied: string;
    permissionMessage: string;
    backToGuilds: string;
    backToGuild: string;
    guildNotFound: string;
    guildNotFoundMessage: string;
    edit: string;
    guilds: string;
  };
  memberManagement: {
    title: string;
    subtitle: string;
    loading: string;
    error: string;
    noMembers: string;
    joinedOn: string;
    promote: string;
    demote: string;
    remove: string;
    cancel: string;
    removeMember: string;
    removeMemberDesc: string;
    promoteModerator: string;
    promoteModeratorDesc: string;
    demoteModerator: string;
    demoteModeratorDesc: string;
    memberRemoved: string;
    memberPromoted: string;
    memberDemoted: string;
  };
}

export const guildTranslations: Record<string, GuildTranslations> = {
  en: {
    title: 'Guilds',
    page: {
      title: 'Guilds',
      subtitle: 'Discover and manage your guilds',
      errorTitle: 'Error Loading Guilds',
      errorMessage: 'There was an error loading your guilds. Please try again.',
      retry: 'Retry',
      createSuccess: 'Guild created successfully!'
    },
    create: {
      title: 'Create Guild',
      subtitle: 'Build a community around shared goals and interests',
      editTitle: 'Edit Guild',
      form: {
        name: {
          label: 'Guild Name',
          placeholder: 'Enter guild name',
          help: 'Choose a unique name that represents your community (3-50 characters)',
          error: {
            required: 'Guild name is required',
            tooShort: 'Guild name must be at least 3 characters long',
            tooLong: 'Guild name must be less than 50 characters',
            invalid: 'Guild name can only contain letters, numbers, spaces, hyphens, and underscores',
            taken: 'This guild name is already taken',
          },
        },
        description: {
          label: 'Description',
          placeholder: 'Describe your guild\'s purpose and goals',
          help: 'Optional description to help others understand your guild (max 500 characters)',
          error: {
            tooLong: 'Description must be less than 500 characters',
          },
        },
        tags: {
          label: 'Tags',
          placeholder: 'Add tags to help others find your guild',
          help: 'Add up to 10 tags to categorize your guild',
          addTag: 'Add tag',
          removeTag: 'Remove',
          maxReached: 'Maximum',
          count: 'tags',
          error: {
            tooMany: 'Maximum 10 tags allowed',
            invalid: 'Tags can only contain letters, numbers, and spaces',
          },
        },
        guildType: {
          label: 'Guild Type',
          placeholder: 'Select guild type',
          help: 'Choose the type of guild you want to create',
          options: {
            public: 'Public',
            private: 'Private',
            approval: 'Approval Required',
          },
          descriptions: {
            public: 'Anyone can discover and join without approval',
            private: 'Invite-only, no public joining allowed',
            approval: 'Requires owner or moderator approval to join',
          },
        },
        avatar: {
          label: 'Guild Avatar',
          help: 'Upload a custom avatar for your guild (optional)',
          success: 'Avatar uploaded successfully!',
          error: 'Avatar upload failed',
        },
        validation: {
          fixErrors: 'Please fix the errors above before submitting.',
          cancelConfirm: 'Are you sure you want to cancel? Your changes will be lost.',
        },
      },
      actions: {
        create: 'Create Guild',
        creating: 'Creating...',
        cancel: 'Cancel',
      },
    },
    list: {
      title: 'My Guilds',
      filtersAndSearch: 'Filters & Search',
      filterByTags: 'Filter by tags:',
      clearFilters: 'Clear Filters',
      guildsFound: 'found',
      guild: 'guild',
      guilds: 'guilds',
      createGuild: 'Create Guild',
      search: {
        placeholder: 'Search guilds...',
      },
      filters: {
        all: 'All Guilds',
        myGuilds: 'My Guilds',
        public: 'Public Guilds',
      },
      sort: {
        label: 'Sort by',
        newest: 'Newest',
        oldest: 'Oldest',
        members: 'Most Members',
        activity: 'Most Active',
      },
      view: {
        grid: 'Grid View',
        list: 'List View',
      },
      empty: {
        title: 'No guilds yet',
        description: 'Create your first guild to start building a community around shared goals.',
        action: 'Create Guild',
      },
    },
    details: {
      loading: 'Loading guild...',
      notFound: 'Guild not found',
      notMember: 'You are not a member of this guild',
        tabs: {
          overview: 'Chronicle',
          members: 'Roster',
          goals: 'Goals',
          quests: 'Quests',
          analytics: 'Ledger',
          comments: 'Scrolls',
          chat: 'Guild Hall',
          joinRequests: 'Petitions',
          moderation: 'Stewardship',
        },
        avatar: {
          title: 'Guild Avatar',
          upload: 'Upload Avatar',
          change: 'Change Avatar',
          remove: 'Remove Avatar',
          confirm: 'Confirm Upload',
          cancel: 'Cancel',
          help: 'Upload a custom avatar for your guild',
          uploading: 'Uploading...',
          removing: 'Removing...',
          chooseImage: 'Choose Image',
          helpFormats: 'Supported formats: JPEG, PNG, WebP',
          helpSize: 'Maximum size: 10MB (will be resized to 500KB)',
          helpRecommended: 'Recommended: 512x512 pixels',
          helpCompression: 'Images will be automatically compressed',
          error: {
            invalidType: 'Please select a valid image file (JPEG, PNG, or WebP)',
            tooLarge: 'File size must be less than 5MB',
            uploadFailed: 'Avatar upload failed',
            removeFailed: 'Failed to remove avatar',
          },
          success: {
            uploaded: 'Avatar updated successfully!',
            removed: 'Avatar removed successfully!',
          },
        },
      actions: {
        join: 'Join Guild',
        joining: 'Joining...',
        leave: 'Leave Guild',
        leaving: 'Leaving...',
        settings: 'Settings',
        invite: 'Invite Members',
        pendingRequest: 'Pending Request',
        requestToJoin: 'Request to Join',
        viewGuild: 'View guild',
        edit: 'Edit',
        delete: 'Delete',
      },
      stats: {
        members: 'Members',
        goals: 'Goals',
        quests: 'Quests',
        created: 'Created',
      },
      types: {
        public: 'Public guild',
        private: 'Private guild',
        approval: 'Approval required guild',
      },
      overview: {
        guildInfo: 'Guild Information',
        visibility: 'Visibility',
        visibilityPublic: 'Public',
        visibilityPrivate: 'Private',
        created: 'Created',
        owner: 'Owner',
        createdBy: 'by',
        editAvatarHint: 'Click "Edit" to change the avatar',
      },
    },
    members: {
      title: 'Guild Members',
      search: {
        placeholder: 'Search members...',
      },
      role: {
        owner: 'Owner',
        moderator: 'Moderator',
        member: 'Member',
      },
      actions: {
        remove: 'Remove Member',
        viewProfile: 'View Profile',
        assignModerator: 'Make Moderator',
        removeModerator: 'Remove Moderator',
        blockUser: 'Block User',
        unblockUser: 'Unblock User',
        toggleCommentPermission: 'Toggle Comment Permission',
        removeFromGuild: 'Remove from Guild',
      },
      empty: 'No members found',
      joined: 'Joined',
      blockedFromCommenting: '(Blocked from commenting)',
    },
    joinRequests: {
      title: 'Join Requests',
      empty: 'No pending join requests',
      reviewTitle: 'Review Join Request',
      reviewDescription: 'Review the join request from',
      requested: 'Requested',
      reasonLabel: 'Reason (optional)',
      reasonPlaceholder: 'Add a reason for your decision...',
      actions: {
        approve: 'Approve',
        reject: 'Reject',
        viewProfile: 'View Profile',
      },
      status: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
      },
      requestToJoin: {
        title: 'Request to Join',
        description: 'requires approval to join. Send a request with a message explaining why you\'d like to join.',
        message: 'Message (optional)',
        placeholder: 'Tell us why you\'d like to join this guild...',
        submit: 'Send Request',
        submitting: 'Sending...',
        cancel: 'Cancel',
        success: 'Join request sent successfully!',
        error: 'Failed to send join request',
      },
    },
    moderation: {
      title: 'Moderation',
      noMembers: 'No members available for moderation',
      actions: {
        blockUser: 'Block User',
        unblockUser: 'Unblock User',
        removeComment: 'Remove Comment',
        toggleCommentPermission: 'Toggle Comment Permission',
        disableComments: 'Disable Comments',
        enableComments: 'Enable Comments',
      },
      descriptions: {
        blockUser: 'Block {username} from accessing the guild',
        unblockUser: 'Unblock {username} and restore guild access',
        disableComments: 'Disable commenting for {username}',
        enableComments: 'Enable commenting for {username}',
      },
      confirmations: {
        blockUser: 'Are you sure you want to block this user? They will not be able to access the guild.',
        unblockUser: 'Are you sure you want to unblock this user?',
        removeComment: 'Are you sure you want to remove this comment?',
        transferOwnership: 'Are you sure you want to transfer ownership? This action cannot be undone.',
      },
      reasons: {
        spam: 'Spam',
        inappropriate: 'Inappropriate Content',
        harassment: 'Harassment',
        other: 'Other',
      },
      labels: {
        reasonOptional: 'Reason (optional)',
        customReason: 'Custom reason (optional)',
        selectReason: 'Select a reason',
        addDetails: 'Add additional details...',
        cancel: 'Cancel',
        blocked: 'Blocked',
        noComments: 'No Comments',
      },
    },
    ownership: {
      transfer: {
        title: 'Transfer Guild Ownership',
        selectNewOwner: 'Select New Owner',
        selectMember: 'Select a member',
        reason: 'Reason (optional)',
        reasonPlaceholder: 'Why are you transferring ownership?',
        confirm: 'Transfer Ownership',
        confirming: 'Transferring...',
        success: 'Guild ownership transferred successfully',
        warning: 'Transfer Ownership',
        warningTitle: 'Transfer Ownership',
        warningMessage: 'This action cannot be undone. You will become a regular member.',
        finalWarning: 'Warning',
        finalWarningMessage: 'This action cannot be undone. You will lose ownership privileges.',
        cancel: 'Cancel',
        characters: 'characters',
      },
    },
    validation: {
      nameRequired: 'Guild name is required',
      nameTooShort: 'Guild name must be at least 3 characters long',
      nameTooLong: 'Guild name must be less than 50 characters',
      nameInvalid: 'Guild name can only contain letters, numbers, spaces, hyphens, and underscores',
      nameTaken: 'This guild name is already taken',
      descriptionTooLong: 'Description must be less than 500 characters',
      tagTooShort: 'Each tag must be at least 2 characters long',
      tagTooLong: 'Each tag must be less than 20 characters',
      tagInvalid: 'Tags can only contain letters, numbers, and spaces',
      tooManyTags: 'Maximum 10 tags allowed',
    },
    messages: {
      createSuccess: 'Guild created successfully!',
      updateSuccess: 'Guild updated successfully!',
      deleteSuccess: 'Guild deleted successfully!',
      joinSuccess: 'Successfully joined the guild!',
      leaveSuccess: 'Successfully left the guild!',
      removeSuccess: 'Member removed successfully!',
      error: 'An error occurred. Please try again.',
      confirmLeave: 'Are you sure you want to leave this guild?',
      confirmDelete: 'Are you sure you want to delete this guild? This action cannot be undone.',
      confirmRemove: 'Are you sure you want to remove this member from the guild?',
    },
    analytics: {
      title: 'Guild Analytics',
      dashboard: 'Guild Analytics Dashboard',
      memberLeaderboard: 'Member Leaderboard',
      members: 'Members',
      goals: 'Goals',
      quests: 'Quests',
      xp: 'XP',
      today: 'Today',
      yesterday: 'Yesterday',
      daysAgo: 'days ago',
      weeksAgo: 'weeks ago',
      monthsAgo: 'months ago',
      never: 'Never',
      showingTop: 'Showing top',
      of: 'of',
      active: 'active',
      completed: 'completed',
      weeklyActivity: 'Weekly Activity',
      memberEngagement: 'Member engagement this week',
      topPerformers: 'Top Performers',
      highestActivity: 'Members with highest activity',
      memberActivityRate: 'Member Activity Rate',
      questCompletionRate: 'Quest Completion Rate',
      performanceMetrics: 'Performance Metrics',
      thisWeeksSummary: "This Week's Summary",
      newMembers: 'New Members',
      questsCompleted: 'Quests Completed',
      activityScore: 'Activity Score',
      loading: 'Loading Analytics...',
      error: 'Analytics Error',
      retry: 'Retry',
      noData: 'No analytics data available for this guild.',
      controls: 'Analytics Controls',
      refreshData: 'Refresh Data',
      lastUpdated: 'Last updated',
      lastActivity: 'Last activity',
    },
    rankings: {
      title: 'Guild Rankings',
      subtitle: 'Discover the top-performing guilds in the community',
      score: 'Score',
      loading: 'Loading Rankings...',
      errorTitle: 'Error Loading Rankings',
      tryAgain: 'Try Again',
      searchPlaceholder: 'Search guilds...',
      backToGuilds: 'Back to Guilds',
      refresh: 'Refresh',
      updated: 'Updated',
      topPerformers: 'Top Performers',
      allRankings: 'All Guild Rankings',
      filters: {
        all: 'All Guilds',
        public: 'Public',
        private: 'Private',
        top10: 'Top 10',
        top50: 'Top 50',
      },
      sort: {
        rank: 'Rank',
        score: 'Score',
        members: 'Members',
        activity: 'Activity',
      },
      stats: {
        members: 'members',
        pts: 'pts',
        totalGuilds: 'Total Guilds',
        totalMembers: 'Total Members',
        totalScore: 'Total Score',
        avgActivity: 'Avg Activity',
      },
      empty: {
        title: 'No guilds found',
        adjustFilters: 'Try adjusting your search or filters.',
        noGuilds: 'No guilds are available at the moment.',
      },
      showingTop: 'Showing top',
      ofGuilds: 'of',
      totalScore: 'Total Score',
      performanceScore: 'Performance Score',
      performanceDescription: 'Based on member activity and quest progress',
      scoreInfo: {
        title: 'How Guild Scores Are Calculated',
        description: 'Guild scores are calculated based on member count, growth, and goals completed by members to encourage active, growing communities.',
        formula: {
          activityScore: 'Activity Score = Members × 10 points',
          growthBonus: 'Growth Bonus = (30 - days old) × 2 points (for guilds under 30 days)',
          goalsCompleted: 'Goals Completed = Completed goals by members in last 30 days × 10 points',
          socialEngagement: 'Social Engagement = Comments + Likes in last 30 days × 1 point each',
          totalScore: 'Total Score = Activity Score + Growth Bonus + Goals Completed + Social Engagement',
        },
        examples: {
          title: 'Examples',
          newGuild: 'New Guild (10 days, 20 members, 5 goals, 20 comments/likes): 200 + 40 + 50 + 20 = 310 points',
          establishedGuild: 'Established Guild (60 days, 50 members, 15 goals, 50 comments/likes): 500 + 0 + 150 + 50 = 700 points',
          topGuild: 'Top Guild (5 days, 100 members, 25 goals, 100 comments/likes): 1000 + 50 + 250 + 100 = 1400 points',
        },
        tips: {
          title: 'Tips to Improve Your Score',
          memberGrowth: '• Focus on growing your member base (10 points per member)',
          newGuildBoost: '• New guilds get bonus points for the first 30 days',
          goalsCompleted: '• Encourage members to complete their goals (10 points per completed goal)',
          socialEngagement: '• Foster community interaction through comments and likes (1 point each)',
          activityMatters: '• Create an engaging environment that promotes both goal achievement and social interaction',
        },
      },
    },
    comments: {
      title: 'Guild Comments',
      post: 'Comment',
      reply: 'Reply',
      edit: 'Edit',
      delete: 'Delete',
      like: 'Like',
      unlike: 'Unlike',
      placeholder: 'Share your thoughts with the guild...',
      replyPlaceholder: 'Write a reply...',
      noComments: 'No comments yet',
      noCommentsDescription: 'Be the first to start the conversation! Share your thoughts with the guild.',
      loading: 'Loading comments...',
      error: 'Failed to load comments',
      errorLoading: 'Error Loading Comments',
      retry: 'Retry',
      owner: 'Owner',
      edited: '(edited)',
      showReplies: 'Show',
      hideReplies: 'Hide',
      replyCount: 'reply',
      repliesCount: 'replies',
      characters: 'characters',
      blockUser: 'Block User',
      removeFromGuild: 'Remove from Guild',
      confirmDeleteComment: 'Are you sure you want to delete this comment?',
      confirmBlockUser: 'Are you sure you want to block {username} from commenting?',
      confirmRemoveUser: 'Are you sure you want to remove {username} from the guild?',
      justNow: 'just now',
      membersOnly: {
        title: 'Members Only',
        message: 'You need to be a member of this guild to view and post comments.',
        joinButton: 'Join Guild',
      },
      blocked: {
        title: 'Access Restricted',
        message: 'You have been blocked from accessing the comments section of this guild.',
        contactModerator: 'Contact a guild moderator if you believe this is an error.',
      },
      commentingDisabled: {
        title: 'Commenting Disabled',
        message: 'You are not allowed to post comments in this guild.',
        contactModerator: 'Contact a guild moderator if you believe this is an error.',
      },
    },
    quests: {
      title: 'Guild Quests',
      subtitle: 'Manage and complete guild quests',
      create: 'Create Quest',
      createTitle: 'Create New Guild Quest',
      createDescription: 'Create a quantitative or percentual quest for your guild members',
      noQuests: 'No quests yet',
      noQuestsDescription: 'Create your first guild quest to engage your members',
      noQuestsDescriptionMember: 'No quests have been created for this guild yet',
      loading: 'Loading quests...',
      error: 'Failed to load quests',
      status: {
        all: 'All',
        active: 'Active',
        draft: 'Draft',
        archived: 'Archived',
        cancelled: 'Cancelled',
        completed: 'Completed',
        failed: 'Failed',
      },
      types: {
        quantitative: 'Quantitative',
        percentual: 'Percentual',
      },
      difficulty: {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
      },
      form: {
        title: 'Title',
        titlePlaceholder: 'Quest title',
        description: 'Description',
        descriptionPlaceholder: 'Quest description (optional)',
        category: 'Category',
        difficulty: 'Difficulty',
        rewardXp: 'Reward XP',
        questType: 'Quest Type',
        tags: 'Tags',
        tagsPlaceholder: 'Add tag',
        tagsHelp: 'Optional, max 10 tags',
        deadline: 'Deadline',
        quantitative: {
          title: 'Quantitative Quest Settings',
          targetCount: 'Target Count',
          targetCountPlaceholder: 'e.g., 10',
          countScope: 'Count Scope',
          countScopeGoals: 'User Goals (from members)',
          countScopeTasks: 'Tasks',
          countScopeGuildQuest: 'Guild Quests',
          targetQuestId: 'Target Quest ID',
          targetQuestIdPlaceholder: 'Quest ID to count completions',
          periodDays: 'Period Duration (days, optional)',
          periodDaysPlaceholder: 'Leave empty for no period limit',
        },
        percentual: {
          title: 'Percentual Quest Settings',
          percentualType: 'Percentual Type',
          goalTaskCompletion: 'Goal/Task Completion',
          memberCompletion: 'Member Completion',
          targetPercentage: 'Target Percentage (0-100)',
          targetPercentagePlaceholder: 'e.g., 80',
          linkedGoalIds: 'Linked User Goal IDs (comma-separated, from guild members)',
          linkedGoalIdsPlaceholder: 'goal-id-1, goal-id-2',
          linkedTaskIds: 'Linked Task IDs (comma-separated)',
          linkedTaskIdsPlaceholder: 'task-id-1, task-id-2',
          percentualCountScope: 'Count Scope',
          percentualCountScopeGoals: 'User Goals (from members)',
          percentualCountScopeTasks: 'Tasks',
          percentualCountScopeBoth: 'Both',
        },
        validation: {
          titleRequired: 'Title must be at least 3 characters',
          titleTooShort: 'Title must be at least 3 characters',
          categoryRequired: 'Please select a category',
          targetCountRequired: 'Target count must be at least 1',
          targetCountInvalid: 'Target count must be at least 1',
          countScopeRequired: 'Please select a count scope',
          targetQuestIdRequired: 'Please specify a target quest ID',
          percentualTypeRequired: 'Please select a percentual type',
          targetPercentageRequired: 'Target percentage must be between 0 and 100',
          targetPercentageInvalid: 'Target percentage must be between 0 and 100',
          linkedGoalTaskRequired: 'Please link at least one goal or task',
          percentualCountScopeRequired: 'Please select a count scope',
        },
      },
      actions: {
        create: 'Create Quest',
        creating: 'Creating...',
        edit: 'Edit',
        delete: 'Delete',
        archive: 'Archive',
        complete: 'Complete Quest',
        completing: 'Completing...',
        completed: 'Completed',
        viewProgress: 'View Progress',
      },
      messages: {
        createSuccess: 'Quest created successfully',
        updateSuccess: 'Quest updated successfully',
        deleteSuccess: 'Quest deleted successfully',
        archiveSuccess: 'Quest archived successfully',
        completeSuccess: 'Quest completed!',
        activateSuccess: 'Quest activated successfully',
        finishSuccess: 'Quest finished successfully',
        alreadyCompleted: 'You have already completed this quest',
        onlyActiveComplete: 'Only active quests can be completed',
        onlyDraftEdit: 'Only draft quests can be edited',
        onlyDraftDelete: 'Only draft quests can be deleted',
        onlyActiveArchive: 'Only active quests can be archived',
        onlyDraftActivate: 'Only draft quests can be activated',
        onlyActiveFinish: 'Only active quests can be finished',
      },
      finishDialog: {
        title: 'Finish Quest',
        warningTitle: 'Warning: Goals Not Reached',
        warningMessage: 'This quest will be marked as Failed. No points will be awarded and it will not count toward guild ranking.',
        successTitle: 'Goals Reached',
        successMessage: 'This quest will be marked as Completed. Points will be awarded and it will count toward guild ranking.',
        confirmMessage: 'Are you sure you want to finish this quest? This action cannot be undone.',
        cancel: 'Cancel',
        confirm: 'Finish Quest',
        finishing: 'Finishing...',
      },
      progress: {
        goalsCompleted: 'Goals completed',
        tasksCompleted: 'Tasks completed',
        guildQuestsCompleted: 'Guild quests completed',
        completionPercentage: 'Completion Percentage',
        membersCompleted: 'Members Completed',
        targetPercentage: 'Target Percentage',
      },
      metadata: {
        rewardXp: 'Reward XP',
        category: 'Category',
        deadline: 'Deadline',
        completedBy: 'completed',
      },
    },
    activities: {
      title: 'Recent Activities',
      loading: 'Loading activities...',
      error: 'Failed to load activities',
      empty: 'No activities yet',
      emptyDescription: 'Activity feed will appear here as members interact with the guild',
      types: {
        quest_created: 'quest created',
        quest_activated: 'quest activated',
        quest_completed: 'quest completed',
        quest_failed: 'quest failed',
        member_joined: 'member joined',
        member_left: 'member left',
      },
      messages: {
        questCreated: 'created quest',
        questActivated: 'activated quest',
        questCompleted: 'completed quest',
        questFailed: 'quest failed',
        memberJoined: 'joined the guild',
        memberLeft: 'left the guild',
      },
    },
    edit: {
      title: 'Edit Guild',
      subtitle: 'Update your guild information and settings',
      basicInfo: 'Basic Info',
      settings: 'Settings',
      avatar: 'Avatar',
      members: 'Members',
      guildName: 'Guild Name',
      guildAvatar: 'Guild Avatar',
      guildNamePlaceholder: 'Enter guild name',
      description: 'Description',
      descriptionPlaceholder: 'Enter guild description',
      guildType: 'Guild Type',
      selectGuildType: 'Select guild type',
      publicGuild: 'Public',
      privateGuild: 'Private',
      approvalGuild: 'Approval Required',
      addTag: 'Add tag...',
      tagsHelp: 'Press Enter or comma to add tags. Maximum 10 tags.',
      allowJoinRequests: 'Allow Join Requests',
      allowJoinRequestsDesc: 'Allow users to request to join this guild',
      requireApproval: 'Require Approval',
      requireApprovalDesc: 'Require approval for new members to join',
      locked: 'Locked',
      requireApprovalLockedDesc: 'This setting is locked because the guild type is "Approval Required". Change the guild type to modify this setting.',
      allowComments: 'Allow Comments',
      allowCommentsDesc: 'Allow members to post comments in this guild',
      uploadAvatar: 'Upload New Avatar',
      avatarHelp: 'JPG, PNG or WebP. Max size 5MB.',
      preview: 'Preview',
      remove: 'Remove',
      memberManagement: 'Member Management',
      memberManagementComingSoon: 'Member management features coming soon',
      cancel: 'Cancel',
      save: 'Save Changes',
      uploadingAvatar: 'Uploading Avatar...',
      loading: 'Loading guild details...',
      errorTitle: 'Error Loading Guild',
      errorMessage: 'Unable to load guild details. Please try again.',
      permissionDenied: 'Permission Denied',
      permissionMessage: 'You do not have permission to edit this guild.',
      backToGuilds: 'Back to Guilds',
      backToGuild: 'Back to Guild',
      guildNotFound: 'Guild Not Found',
      guildNotFoundMessage: 'The guild you are looking for does not exist.',
      edit: 'Edit',
      guilds: 'Guilds',
    },
    memberManagement: {
      title: 'Member Management',
      subtitle: 'Manage guild members and their roles',
      loading: 'Loading members...',
      error: 'Failed to load members',
      noMembers: 'No members found',
      joinedOn: 'Joined on',
      promote: 'Promote',
      demote: 'Demote',
      remove: 'Remove',
      cancel: 'Cancel',
      removeMember: 'Remove Member',
      removeMemberDesc: 'Are you sure you want to remove {username} from this guild?',
      promoteModerator: 'Promote to Moderator',
      promoteModeratorDesc: 'Are you sure you want to promote {username} to moderator?',
      demoteModerator: 'Demote Moderator',
      demoteModeratorDesc: 'Are you sure you want to demote {username} from moderator?',
      memberRemoved: 'Member removed successfully',
      memberPromoted: 'Member promoted successfully',
      memberDemoted: 'Member demoted successfully',
    },
  },
  es: {
    title: 'Gremios',
    page: {
      title: 'Gremios',
      subtitle: 'Descubre y gestiona tus gremios',
      errorTitle: 'Error al Cargar Gremios',
      errorMessage: 'Hubo un error al cargar tus gremios. Por favor intenta de nuevo.',
      retry: 'Reintentar',
      createSuccess: '¡Gremio creado exitosamente!'
    },
    create: {
      title: 'Crear Gremio',
      subtitle: 'Construye una comunidad alrededor de objetivos e intereses compartidos',
      editTitle: 'Editar Gremio',
      form: {
        name: {
          label: 'Nombre del Gremio',
          placeholder: 'Ingresa el nombre del gremio',
          help: 'Elige un nombre único que represente tu comunidad (3-50 caracteres)',
          error: {
            required: 'El nombre del gremio es requerido',
            tooShort: 'El nombre del gremio debe tener al menos 3 caracteres',
            tooLong: 'El nombre del gremio debe tener menos de 50 caracteres',
            invalid: 'El nombre del gremio solo puede contener letras, números, espacios, guiones y guiones bajos',
            taken: 'Este nombre de gremio ya está en uso',
          },
        },
        description: {
          label: 'Descripción',
          placeholder: 'Describe el propósito y objetivos de tu gremio',
          help: 'Descripción opcional para ayudar a otros a entender tu gremio (máx 500 caracteres)',
          error: {
            tooLong: 'La descripción debe tener menos de 500 caracteres',
          },
        },
        tags: {
          label: 'Etiquetas',
          placeholder: 'Agrega etiquetas para ayudar a otros a encontrar tu gremio',
          help: 'Agrega hasta 10 etiquetas para categorizar tu gremio',
          addTag: 'Agregar etiqueta',
          removeTag: 'Eliminar',
          maxReached: 'Máximo',
          count: 'etiquetas',
          error: {
            tooMany: 'Máximo 10 etiquetas permitidas',
            invalid: 'Las etiquetas solo pueden contener letras, números y espacios',
          },
        },
        guildType: {
          label: 'Tipo de Gremio',
          placeholder: 'Seleccionar tipo de gremio',
          help: 'Elige el tipo de gremio que quieres crear',
          options: {
            public: 'Público',
            private: 'Privado',
            approval: 'Requiere Aprobación',
          },
          descriptions: {
            public: 'Cualquiera puede descubrir y unirse sin aprobación',
            private: 'Solo por invitación, no se permite unirse públicamente',
            approval: 'Requiere aprobación del propietario o moderador para unirse',
          },
        },
        avatar: {
          label: 'Avatar del Gremio',
          help: 'Sube un avatar personalizado para tu gremio (opcional)',
          success: '¡Avatar subido exitosamente!',
          error: 'Error al subir avatar',
        },
        validation: {
          fixErrors: 'Por favor corrige los errores arriba antes de enviar.',
          cancelConfirm: '¿Estás seguro de que quieres cancelar? Tus cambios se perderán.',
        },
      },
      actions: {
        create: 'Crear Gremio',
        creating: 'Creando...',
        cancel: 'Cancelar',
      },
    },
    list: {
      title: 'Mis Gremios',
      filtersAndSearch: 'Filtros y Búsqueda',
      filterByTags: 'Filtrar por etiquetas:',
      clearFilters: 'Limpiar Filtros',
      guildsFound: 'encontrados',
      guild: 'gremio',
      guilds: 'gremios',
      createGuild: 'Crear Gremio',
      search: {
        placeholder: 'Buscar gremios...',
      },
      filters: {
        all: 'Todos los Gremios',
        myGuilds: 'Mis Gremios',
        public: 'Gremios Públicos',
      },
      sort: {
        label: 'Ordenar por',
        newest: 'Más Recientes',
        oldest: 'Más Antiguos',
        members: 'Más Miembros',
        activity: 'Más Activos',
      },
      view: {
        grid: 'Vista de Cuadrícula',
        list: 'Vista de Lista',
      },
      empty: {
        title: 'Aún no hay gremios',
        description: 'Crea tu primer gremio para comenzar a construir una comunidad alrededor de objetivos compartidos.',
        action: 'Crear Gremio',
      },
    },
    details: {
      loading: 'Cargando gremio...',
      notFound: 'Gremio no encontrado',
      notMember: 'No eres miembro de este gremio',
        tabs: {
          overview: 'Crónica',
          members: 'Registro',
          goals: 'Objetivos',
          quests: 'Misiones',
          analytics: 'Libro de Cuentas',
          comments: 'Pergaminos',
          chat: 'Salón del Gremio',
          joinRequests: 'Peticiones',
          moderation: 'Mayordomía',
        },
        avatar: {
          title: 'Avatar del Gremio',
          upload: 'Subir Avatar',
          change: 'Cambiar Avatar',
          remove: 'Eliminar Avatar',
          confirm: 'Confirmar Subida',
          cancel: 'Cancelar',
          help: 'Sube un avatar personalizado para tu gremio',
          uploading: 'Subiendo...',
          removing: 'Eliminando...',
          chooseImage: 'Elegir Imagen',
          helpFormats: 'Formatos soportados: JPEG, PNG, WebP',
          helpSize: 'Tamaño máximo: 10MB (se redimensionará a 500KB)',
          helpRecommended: 'Recomendado: 512x512 píxeles',
          helpCompression: 'Las imágenes se comprimirán automáticamente',
          error: {
            invalidType: 'Por favor selecciona un archivo de imagen válido (JPEG, PNG, o WebP)',
            tooLarge: 'El tamaño del archivo debe ser menor a 5MB',
            uploadFailed: 'Error al subir el avatar',
            removeFailed: 'Error al eliminar el avatar',
          },
          success: {
            uploaded: '¡Avatar actualizado exitosamente!',
            removed: '¡Avatar eliminado exitosamente!',
          },
        },
      actions: {
        join: 'Unirse al Gremio',
        joining: 'Uniéndose...',
        leave: 'Abandonar Gremio',
        leaving: 'Abandonando...',
        settings: 'Configuración',
        invite: 'Invitar Miembros',
        pendingRequest: 'Solicitud Pendiente',
        requestToJoin: 'Solicitar Ingreso',
        viewGuild: 'Ver gremio',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      stats: {
        members: 'Miembros',
        goals: 'Objetivos',
        quests: 'Misiones',
        created: 'Creado',
      },
      types: {
        public: 'Gremio público',
        private: 'Gremio privado',
        approval: 'Gremio con aprobación requerida',
      },
      overview: {
        guildInfo: 'Información del Gremio',
        visibility: 'Visibilidad',
        visibilityPublic: 'Público',
        visibilityPrivate: 'Privado',
        created: 'Creado',
        owner: 'Propietario',
        createdBy: 'por',
        editAvatarHint: 'Haz clic en "Editar" para cambiar el avatar',
      },
    },
    members: {
      title: 'Miembros del Gremio',
      search: {
        placeholder: 'Buscar miembros...',
      },
      role: {
        owner: 'Propietario',
        moderator: 'Moderador',
        member: 'Miembro',
      },
      actions: {
        remove: 'Eliminar Miembro',
        viewProfile: 'Ver Perfil',
        assignModerator: 'Hacer Moderador',
        removeModerator: 'Remover Moderador',
        blockUser: 'Bloquear Usuario',
        unblockUser: 'Desbloquear Usuario',
        toggleCommentPermission: 'Alternar Permiso de Comentarios',
        removeFromGuild: 'Eliminar del Gremio',
      },
      empty: 'No se encontraron miembros',
      joined: 'Se unió',
      blockedFromCommenting: '(Bloqueado de comentar)',
    },
    joinRequests: {
      title: 'Solicitudes de Ingreso',
      empty: 'No hay solicitudes de ingreso pendientes',
      reviewTitle: 'Revisar Solicitud de Ingreso',
      reviewDescription: 'Revisar la solicitud de ingreso de',
      requested: 'Solicitado',
      reasonLabel: 'Razón (opcional)',
      reasonPlaceholder: 'Agrega una razón para tu decisión...',
      actions: {
        approve: 'Aprobar',
        reject: 'Rechazar',
        viewProfile: 'Ver Perfil',
      },
      status: {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
      },
      requestToJoin: {
        title: 'Solicitar Ingreso al Gremio',
        description: 'requiere aprobación para unirse. Envía una solicitud con un mensaje explicando por qué te gustaría unirte.',
        message: 'Mensaje (opcional)',
        placeholder: 'Dile al gremio por qué quieres unirte...',
        submit: 'Enviar Solicitud',
        submitting: 'Enviando...',
        cancel: 'Cancelar',
        success: '¡Solicitud de unión enviada exitosamente!',
        error: 'Error al enviar solicitud de unión',
      },
    },
    moderation: {
      title: 'Moderación',
      noMembers: 'No hay miembros disponibles para moderación',
      actions: {
        blockUser: 'Bloquear Usuario',
        unblockUser: 'Desbloquear Usuario',
        removeComment: 'Eliminar Comentario',
        toggleCommentPermission: 'Alternar Permiso de Comentarios',
        disableComments: 'Deshabilitar Comentarios',
        enableComments: 'Habilitar Comentarios',
      },
      descriptions: {
        blockUser: 'Bloquear a {username} del acceso al gremio',
        unblockUser: 'Desbloquear a {username} y restaurar acceso al gremio',
        disableComments: 'Deshabilitar comentarios para {username}',
        enableComments: 'Habilitar comentarios para {username}',
      },
      confirmations: {
        blockUser: '¿Estás seguro de que quieres bloquear a este usuario? No podrá acceder al gremio.',
        unblockUser: '¿Estás seguro de que quieres desbloquear a este usuario?',
        removeComment: '¿Estás seguro de que quieres eliminar este comentario?',
        transferOwnership: '¿Estás seguro de que quieres transferir la propiedad? Esta acción no se puede deshacer.',
      },
      reasons: {
        spam: 'Spam',
        inappropriate: 'Contenido Inapropiado',
        harassment: 'Acoso',
        other: 'Otro',
      },
      labels: {
        reasonOptional: 'Razón (opcional)',
        customReason: 'Razón personalizada (opcional)',
        selectReason: 'Selecciona una razón',
        addDetails: 'Agrega detalles adicionales...',
        cancel: 'Cancelar',
        blocked: 'Bloqueado',
        noComments: 'Sin Comentarios',
      },
    },
    ownership: {
      transfer: {
        title: 'Transferir Propiedad del Gremio',
        selectNewOwner: 'Seleccionar Nuevo Propietario',
        selectMember: 'Selecciona un miembro',
        reason: 'Razón (opcional)',
        reasonPlaceholder: '¿Por qué estás transfiriendo la propiedad?',
        confirm: 'Transferir Propiedad',
        confirming: 'Transfiriendo...',
        success: 'Propiedad del gremio transferida exitosamente',
        warning: 'Transferir Propiedad',
        warningTitle: 'Transferir Propiedad',
        warningMessage: 'Esta acción no se puede deshacer. Te convertirás en un miembro regular.',
        finalWarning: 'Advertencia',
        finalWarningMessage: 'Esta acción no se puede deshacer. Perderás los privilegios de propietario.',
        cancel: 'Cancelar',
        characters: 'caracteres',
      },
    },
    validation: {
      nameRequired: 'El nombre del gremio es requerido',
      nameTooShort: 'El nombre del gremio debe tener al menos 3 caracteres',
      nameTooLong: 'El nombre del gremio debe tener menos de 50 caracteres',
      nameInvalid: 'El nombre del gremio solo puede contener letras, números, espacios, guiones y guiones bajos',
      nameTaken: 'Este nombre de gremio ya está en uso',
      descriptionTooLong: 'La descripción debe tener menos de 500 caracteres',
      tagTooShort: 'Cada etiqueta debe tener al menos 2 caracteres',
      tagTooLong: 'Cada etiqueta debe tener menos de 20 caracteres',
      tagInvalid: 'Las etiquetas solo pueden contener letras, números y espacios',
      tooManyTags: 'Máximo 10 etiquetas permitidas',
    },
    edit: {
      title: 'Editar Gremio',
      subtitle: 'Actualiza la información y configuración de tu gremio',
      basicInfo: 'Información Básica',
      settings: 'Configuración',
      avatar: 'Avatar',
      members: 'Miembros',
      guildName: 'Nombre del Gremio',
      guildAvatar: 'Avatar del Gremio',
      guildNamePlaceholder: 'Ingresa el nombre del gremio',
      description: 'Descripción',
      descriptionPlaceholder: 'Ingresa la descripción del gremio',
      guildType: 'Tipo de Gremio',
      selectGuildType: 'Seleccionar tipo de gremio',
      publicGuild: 'Público',
      privateGuild: 'Privado',
      approvalGuild: 'Requiere Aprobación',
      addTag: 'Agregar etiqueta...',
      tagsHelp: 'Presiona Enter o coma para agregar etiquetas. Máximo 10 etiquetas.',
      allowJoinRequests: 'Permitir Solicitudes de Ingreso',
      allowJoinRequestsDesc: 'Permitir que los usuarios soliciten unirse a este gremio',
      requireApproval: 'Requerir Aprobación',
      requireApprovalDesc: 'Requerir aprobación para que nuevos miembros se unan',
      locked: 'Bloqueado',
      requireApprovalLockedDesc: 'Esta configuración está bloqueada porque el tipo de gremio es "Requiere Aprobación". Cambia el tipo de gremio para modificar esta configuración.',
      allowComments: 'Permitir Comentarios',
      allowCommentsDesc: 'Permitir que los miembros publiquen comentarios en este gremio',
      uploadAvatar: 'Subir Nuevo Avatar',
      avatarHelp: 'JPG, PNG o WebP. Tamaño máximo 5MB.',
      preview: 'Vista Previa',
      remove: 'Eliminar',
      memberManagement: 'Gestión de Miembros',
      saveChanges: 'Guardar Cambios',
      saving: 'Guardando...',
      cancel: 'Cancelar',
      uploadingAvatar: 'Subiendo avatar...',
    },
    messages: {
      createSuccess: '¡Gremio creado exitosamente!',
      updateSuccess: '¡Gremio actualizado exitosamente!',
      deleteSuccess: '¡Gremio eliminado exitosamente!',
      joinSuccess: '¡Te uniste al gremio exitosamente!',
      leaveSuccess: '¡Abandonaste el gremio exitosamente!',
      removeSuccess: '¡Miembro eliminado exitosamente!',
      error: 'Ocurrió un error. Por favor intenta de nuevo.',
      confirmLeave: '¿Estás seguro de que quieres abandonar este gremio?',
      confirmDelete: '¿Estás seguro de que quieres eliminar este gremio? Esta acción no se puede deshacer.',
      confirmRemove: '¿Estás seguro de que quieres eliminar este miembro del gremio?',
    },
    analytics: {
      title: 'Analíticas del Gremio',
      dashboard: 'Panel de Analíticas del Gremio',
      memberLeaderboard: 'Tabla de Líderes de Miembros',
      members: 'Miembros',
      goals: 'Objetivos',
      quests: 'Misiones',
      xp: 'XP',
      today: 'Hoy',
      yesterday: 'Ayer',
      daysAgo: 'días atrás',
      weeksAgo: 'semanas atrás',
      monthsAgo: 'meses atrás',
      never: 'Nunca',
      showingTop: 'Mostrando los mejores',
      of: 'de',
      active: 'activos',
      completed: 'completadas',
      weeklyActivity: 'Actividad Semanal',
      memberEngagement: 'Participación de miembros esta semana',
      topPerformers: 'Mejores Miembros',
      highestActivity: 'Miembros con mayor actividad',
      memberActivityRate: 'Tasa de Actividad de Miembros',
      questCompletionRate: 'Tasa de Misiones Completadas',
      performanceMetrics: 'Métricas de Rendimiento',
      thisWeeksSummary: 'Resumen de Esta Semana',
      newMembers: 'Nuevos Miembros',
      questsCompleted: 'Misiones Completadas',
      activityScore: 'Puntuación de Actividad',
      loading: 'Cargando Analíticas...',
      error: 'Error de Analíticas',
      retry: 'Reintentar',
      noData: 'No hay datos de analíticas disponibles para este gremio.',
      controls: 'Controles de Analíticas',
      refreshData: 'Actualizar Datos',
      lastUpdated: 'Última actualización',
      lastActivity: 'Última actividad',
    },
    rankings: {
      title: 'Clasificaciones de Gremios',
      subtitle: 'Descubre los gremios con mejor desempeño en la comunidad',
      score: 'Puntuación',
      loading: 'Cargando Clasificaciones...',
      errorTitle: 'Error al Cargar Clasificaciones',
      tryAgain: 'Intentar de Nuevo',
      searchPlaceholder: 'Buscar gremios...',
      backToGuilds: 'Volver a Gremios',
      refresh: 'Actualizar',
      updated: 'Actualizado',
      topPerformers: 'Mejores Rendimientos',
      allRankings: 'Todas las Clasificaciones',
      filters: {
        all: 'Todos los Gremios',
        public: 'Públicos',
        private: 'Privados',
        top10: 'Top 10',
        top50: 'Top 50',
      },
      sort: {
        rank: 'Posición',
        score: 'Puntuación',
        members: 'Miembros',
        activity: 'Actividad',
      },
      stats: {
        members: 'miembros',
        pts: 'pts',
        totalGuilds: 'Total de Gremios',
        totalMembers: 'Total de Miembros',
        totalScore: 'Puntuación Total',
        avgActivity: 'Actividad Prom.',
      },
      empty: {
        title: 'No se encontraron gremios',
        adjustFilters: 'Intenta ajustar tu búsqueda o filtros.',
        noGuilds: 'No hay gremios disponibles en este momento.',
      },
      showingTop: 'Mostrando los mejores',
      ofGuilds: 'de',
      totalScore: 'Puntuación Total',
      performanceScore: 'Puntuación de Rendimiento',
      performanceDescription: 'Basado en la actividad de miembros y progreso de misiones',
      scoreInfo: {
        title: 'Cómo se Calculan las Puntuaciones de Guild',
        description: 'Las puntuaciones de guild se calculan basándose en el número de miembros, crecimiento y objetivos completados por los miembros para fomentar comunidades activas y en crecimiento.',
        formula: {
          activityScore: 'Puntuación de Actividad = Miembros × 10 puntos',
          growthBonus: 'Bono de Crecimiento = (30 - días de antigüedad) × 2 puntos (para guilds menores de 30 días)',
          goalsCompleted: 'Objetivos Completados = Objetivos completados por miembros en los últimos 30 días × 10 puntos',
          socialEngagement: 'Compromiso Social = Comentarios + Likes en los últimos 30 días × 1 punto cada uno',
          totalScore: 'Puntuación Total = Puntuación de Actividad + Bono de Crecimiento + Objetivos Completados + Compromiso Social',
        },
        examples: {
          title: 'Ejemplos',
          newGuild: 'Guild Nueva (10 días, 20 miembros, 5 objetivos, 20 comentarios/likes): 200 + 40 + 50 + 20 = 310 puntos',
          establishedGuild: 'Guild Establecida (60 días, 50 miembros, 15 objetivos, 50 comentarios/likes): 500 + 0 + 150 + 50 = 700 puntos',
          topGuild: 'Guild Top (5 días, 100 miembros, 25 objetivos, 100 comentarios/likes): 1000 + 50 + 250 + 100 = 1400 puntos',
        },
        tips: {
          title: 'Consejos para Mejorar tu Puntuación',
          memberGrowth: '• Enfócate en hacer crecer tu base de miembros (10 puntos por miembro)',
          newGuildBoost: '• Las guilds nuevas obtienen puntos bonus durante los primeros 30 días',
          goalsCompleted: '• Fomenta que los miembros completen sus objetivos (10 puntos por objetivo completado)',
          socialEngagement: '• Fomenta la interacción comunitaria a través de comentarios y likes (1 punto cada uno)',
          activityMatters: '• Crea un ambiente atractivo que promueva tanto el logro de objetivos como la interacción social',
        },
      },
    },
    comments: {
      title: 'Comentarios del Gremio',
      post: 'Comentar',
      reply: 'Responder',
      edit: 'Editar',
      delete: 'Eliminar',
      like: 'Me gusta',
      unlike: 'No me gusta',
      placeholder: 'Comparte tus pensamientos con el gremio...',
      replyPlaceholder: 'Escribe una respuesta...',
      noComments: 'Aún no hay comentarios',
      noCommentsDescription: '¡Sé el primero en iniciar la conversación! Comparte tus pensamientos con el gremio.',
      loading: 'Cargando comentarios...',
      error: 'Error al cargar comentarios',
      errorLoading: 'Error al Cargar Comentarios',
      retry: 'Reintentar',
      owner: 'Propietario',
      edited: '(editado)',
      showReplies: 'Mostrar',
      hideReplies: 'Ocultar',
      replyCount: 'respuesta',
      repliesCount: 'respuestas',
      characters: 'caracteres',
      blockUser: 'Bloquear Usuario',
      removeFromGuild: 'Eliminar del Gremio',
      confirmDeleteComment: '¿Estás seguro de que quieres eliminar este comentario?',
      confirmBlockUser: '¿Estás seguro de que quieres bloquear a {username} de comentar?',
      confirmRemoveUser: '¿Estás seguro de que quieres eliminar a {username} del gremio?',
      justNow: 'ahora mismo',
      membersOnly: {
        title: 'Solo Miembros',
        message: 'Necesitas ser miembro de este gremio para ver y publicar comentarios.',
        joinButton: 'Unirse al Gremio',
      },
      blocked: {
        title: 'Acceso Restringido',
        message: 'Has sido bloqueado del acceso a la sección de comentarios de este gremio.',
        contactModerator: 'Contacta a un moderador del gremio si crees que esto es un error.',
      },
      commentingDisabled: {
        title: 'Comentarios Deshabilitados',
        message: 'No tienes permitido publicar comentarios en este gremio.',
        contactModerator: 'Contacta a un moderador del gremio si crees que esto es un error.',
      },
    },
    quests: {
      title: 'Misiones del Gremio',
      subtitle: 'Gestiona y completa misiones del gremio',
      create: 'Crear Misión',
      createTitle: 'Crear Nueva Misión del Gremio',
      createDescription: 'Crea una misión cuantitativa o porcentual para los miembros de tu gremio',
      noQuests: 'Aún no hay misiones',
      noQuestsDescription: 'Crea tu primera misión del gremio para involucrar a tus miembros',
      noQuestsDescriptionMember: 'Aún no se han creado misiones para este gremio',
      loading: 'Cargando misiones...',
      error: 'Error al cargar misiones',
      status: {
        all: 'Todas',
        active: 'Activas',
        draft: 'Borrador',
        archived: 'Archivadas',
        cancelled: 'Canceladas',
        completed: 'Completada',
        failed: 'Fallida',
      },
      types: {
        quantitative: 'Cuantitativa',
        percentual: 'Porcentual',
      },
      difficulty: {
        easy: 'Fácil',
        medium: 'Media',
        hard: 'Difícil',
      },
      form: {
        title: 'Título',
        titlePlaceholder: 'Título de la misión',
        description: 'Descripción',
        descriptionPlaceholder: 'Descripción de la misión (opcional)',
        category: 'Categoría',
        difficulty: 'Dificultad',
        rewardXp: 'XP de Recompensa',
        questType: 'Tipo de Misión',
        tags: 'Etiquetas',
        tagsPlaceholder: 'Agregar etiqueta',
        tagsHelp: 'Opcional, máx 10 etiquetas',
        deadline: 'Fecha límite',
        quantitative: {
          title: 'Configuración de Misión Cuantitativa',
          targetCount: 'Cantidad Objetivo',
          targetCountPlaceholder: 'ej., 10',
          countScope: 'Alcance del Conteo',
          countScopeGoals: 'Objetivos de Usuario (de miembros)',
          countScopeTasks: 'Tareas',
          countScopeGuildQuest: 'Misiones del Gremio',
          targetQuestId: 'ID de Misión Objetivo',
          targetQuestIdPlaceholder: 'ID de misión para contar completados',
          periodDays: 'Duración del Período (días, opcional)',
          periodDaysPlaceholder: 'Dejar vacío para sin límite de período',
        },
        percentual: {
          title: 'Configuración de Misión Porcentual',
          percentualType: 'Tipo Porcentual',
          goalTaskCompletion: 'Completar Objetivo/Tarea',
          memberCompletion: 'Completar por Miembros',
          targetPercentage: 'Porcentaje Objetivo (0-100)',
          targetPercentagePlaceholder: 'ej., 80',
          linkedGoalIds: 'IDs de Objetivos de Usuario Vinculados (separados por comas, de miembros del gremio)',
          linkedGoalIdsPlaceholder: 'objetivo-id-1, objetivo-id-2',
          linkedTaskIds: 'IDs de Tareas Vinculadas (separadas por comas)',
          linkedTaskIdsPlaceholder: 'tarea-id-1, tarea-id-2',
          percentualCountScope: 'Alcance del Conteo',
          percentualCountScopeGoals: 'Objetivos de Usuario (de miembros)',
          percentualCountScopeTasks: 'Tareas',
          percentualCountScopeBoth: 'Ambos',
        },
        validation: {
          titleRequired: 'El título debe tener al menos 3 caracteres',
          titleTooShort: 'El título debe tener al menos 3 caracteres',
          categoryRequired: 'Por favor selecciona una categoría',
          targetCountRequired: 'La cantidad objetivo debe ser al menos 1',
          targetCountInvalid: 'La cantidad objetivo debe ser al menos 1',
          countScopeRequired: 'Por favor selecciona un alcance de conteo',
          targetQuestIdRequired: 'Por favor especifica un ID de misión objetivo',
          percentualTypeRequired: 'Por favor selecciona un tipo porcentual',
          targetPercentageRequired: 'El porcentaje objetivo debe estar entre 0 y 100',
          targetPercentageInvalid: 'El porcentaje objetivo debe estar entre 0 y 100',
          linkedGoalTaskRequired: 'Por favor vincula al menos un objetivo o tarea',
          percentualCountScopeRequired: 'Por favor selecciona un alcance de conteo',
        },
      },
      actions: {
        create: 'Crear Misión',
        creating: 'Creando...',
        edit: 'Editar',
        delete: 'Eliminar',
        archive: 'Archivar',
        complete: 'Completar Misión',
        completing: 'Completando...',
        completed: 'Completada',
        viewProgress: 'Ver Progreso',
      },
      messages: {
        createSuccess: 'Misión creada exitosamente',
        updateSuccess: 'Misión actualizada exitosamente',
        deleteSuccess: 'Misión eliminada exitosamente',
        archiveSuccess: 'Misión archivada exitosamente',
        completeSuccess: '¡Misión completada!',
        activateSuccess: 'Misión activada exitosamente',
        finishSuccess: 'Misión finalizada exitosamente',
        alreadyCompleted: 'Ya has completado esta misión',
        onlyActiveComplete: 'Solo las misiones activas pueden completarse',
        onlyDraftEdit: 'Solo las misiones en borrador pueden editarse',
        onlyDraftDelete: 'Solo las misiones en borrador pueden eliminarse',
        onlyActiveArchive: 'Solo las misiones activas pueden archivarse',
        onlyDraftActivate: 'Solo las misiones en borrador pueden activarse',
        onlyActiveFinish: 'Solo las misiones activas pueden finalizarse',
      },
      finishDialog: {
        title: 'Finalizar Misión',
        warningTitle: 'Advertencia: Objetivos No Alcanzados',
        warningMessage: 'Esta misión será marcada como Fallida. No se otorgarán puntos y no contará para la clasificación del gremio.',
        successTitle: 'Objetivos Alcanzados',
        successMessage: 'Esta misión será marcada como Completada. Se otorgarán puntos y contará para la clasificación del gremio.',
        confirmMessage: '¿Estás seguro de que quieres finalizar esta misión? Esta acción no se puede deshacer.',
        cancel: 'Cancelar',
        confirm: 'Finalizar Misión',
        finishing: 'Finalizando...',
      },
      progress: {
        goalsCompleted: 'Objetivos completados',
        tasksCompleted: 'Tareas completadas',
        guildQuestsCompleted: 'Misiones del gremio completadas',
        completionPercentage: 'Porcentaje de Completado',
        membersCompleted: 'Miembros Completados',
        targetPercentage: 'Porcentaje Objetivo',
      },
      metadata: {
        rewardXp: 'XP de Recompensa',
        category: 'Categoría',
        deadline: 'Fecha límite',
        completedBy: 'completado por',
      },
    },
    activities: {
      title: 'Actividades Recientes',
      loading: 'Cargando actividades...',
      error: 'Error al cargar actividades',
      empty: 'Aún no hay actividades',
      emptyDescription: 'El feed de actividades aparecerá aquí cuando los miembros interactúen con el gremio',
      types: {
        quest_created: 'misión creada',
        quest_activated: 'misión activada',
        quest_completed: 'misión completada',
        quest_failed: 'misión fallida',
        member_joined: 'miembro se unió',
        member_left: 'miembro se fue',
      },
      messages: {
        questCreated: 'creó la misión',
        questActivated: 'activó la misión',
        questCompleted: 'completó la misión',
        questFailed: 'misión fallida',
        memberJoined: 'se unió al gremio',
        memberLeft: 'dejó el gremio',
      },
    },
    memberManagement: {
      title: 'Gestión de Miembros',
      subtitle: 'Gestiona los miembros del gremio y sus roles',
      loading: 'Cargando miembros...',
      error: 'Error al cargar miembros',
      noMembers: 'No se encontraron miembros',
      joinedOn: 'Se unió el',
      promote: 'Promover',
      demote: 'Degradar',
      remove: 'Eliminar',
      cancel: 'Cancelar',
      removeMember: 'Eliminar Miembro',
      removeMemberDesc: '¿Estás seguro de que quieres eliminar a {username} de este gremio?',
      promoteModerator: 'Promover a Moderador',
      promoteModeratorDesc: '¿Estás seguro de que quieres promover a {username} a moderador?',
      demoteModerator: 'Degradar Moderador',
      demoteModeratorDesc: '¿Estás seguro de que quieres degradar a {username} de moderador?',
      memberRemoved: 'Miembro eliminado exitosamente',
      memberPromoted: 'Miembro promovido exitosamente',
      memberDemoted: 'Miembro degradado exitosamente',
    },
  },
  fr: {
    title: 'Guildes',
    page: {
      title: 'Guildes',
      subtitle: 'Découvrez et gérez vos guildes',
      errorTitle: 'Erreur de Chargement des Guildes',
      errorMessage: 'Une erreur s\'est produite lors du chargement de vos guildes. Veuillez réessayer.',
      retry: 'Réessayer',
      createSuccess: 'Guilde créée avec succès !'
    },
    create: {
      title: 'Créer une Guilde',
      subtitle: 'Construisez une communauté autour d\'objectifs et d\'intérêts partagés',
      editTitle: 'Modifier la Guilde',
      form: {
        name: {
          label: 'Nom de la Guilde',
          placeholder: 'Entrez le nom de la guilde',
          help: 'Choisissez un nom unique qui représente votre communauté (3-50 caractères)',
          error: {
            required: 'Le nom de la guilde est requis',
            tooShort: 'Le nom de la guilde doit contenir au moins 3 caractères',
            tooLong: 'Le nom de la guilde doit contenir moins de 50 caractères',
            invalid: 'Le nom de la guilde ne peut contenir que des lettres, chiffres, espaces, tirets et traits de soulignement',
            taken: 'Ce nom de guilde est déjà pris',
          },
        },
        description: {
          label: 'Description',
          placeholder: 'Décrivez le but et les objectifs de votre guilde',
          help: 'Description optionnelle pour aider les autres à comprendre votre guilde (max 500 caractères)',
          error: {
            tooLong: 'La description doit contenir moins de 500 caractères',
          },
        },
        tags: {
          label: 'Étiquettes',
          placeholder: 'Ajoutez des étiquettes pour aider les autres à trouver votre guilde',
          help: 'Ajoutez jusqu\'à 10 étiquettes pour catégoriser votre guilde',
          addTag: 'Ajouter une étiquette',
          removeTag: 'Supprimer',
          maxReached: 'Maximum',
          count: 'étiquettes',
          error: {
            tooMany: 'Maximum 10 étiquettes autorisées',
            invalid: 'Les étiquettes ne peuvent contenir que des lettres, chiffres et espaces',
          },
        },
        guildType: {
          label: 'Type de Guilde',
          placeholder: 'Sélectionner le type de guilde',
          help: 'Choisissez le type de guilde que vous voulez créer',
          options: {
            public: 'Publique',
            private: 'Privée',
            approval: 'Nécessite une Approbation',
          },
          descriptions: {
            public: 'N\'importe qui peut découvrir et rejoindre sans approbation',
            private: 'Sur invitation uniquement, pas d\'adhésion publique autorisée',
            approval: 'Nécessite l\'approbation du propriétaire ou modérateur pour rejoindre',
          },
        },
        avatar: {
          label: 'Avatar de la Guilde',
          help: 'Téléchargez un avatar personnalisé pour votre guilde (optionnel)',
          success: 'Avatar téléchargé avec succès !',
          error: 'Échec du téléchargement de l\'avatar',
        },
        validation: {
          fixErrors: 'Veuillez corriger les erreurs ci-dessus avant de soumettre.',
          cancelConfirm: 'Êtes-vous sûr de vouloir annuler ? Vos modifications seront perdues.',
        },
      },
      actions: {
        create: 'Créer la Guilde',
        creating: 'Création...',
        cancel: 'Annuler',
      },
    },
    list: {
      title: 'Mes Guildes',
      filtersAndSearch: 'Filtres et Recherche',
      filterByTags: 'Filtrer par étiquettes :',
      clearFilters: 'Effacer les Filtres',
      guildsFound: 'trouvées',
      guild: 'guilde',
      guilds: 'guildes',
      createGuild: 'Créer une Guilde',
      search: {
        placeholder: 'Rechercher des guildes...',
      },
      filters: {
        all: 'Toutes les Guildes',
        myGuilds: 'Mes Guildes',
        public: 'Guildes Publiques',
      },
      sort: {
        label: 'Trier par',
        newest: 'Plus Récentes',
        oldest: 'Plus Anciennes',
        members: 'Plus de Membres',
        activity: 'Plus Actives',
      },
      view: {
        grid: 'Vue Grille',
        list: 'Vue Liste',
      },
      empty: {
        title: 'Aucune guilde pour le moment',
        description: 'Créez votre première guilde pour commencer à construire une communauté autour d\'objectifs partagés.',
        action: 'Créer une Guilde',
      },
    },
    details: {
      loading: 'Chargement de la guilde...',
      notFound: 'Guilde non trouvée',
      notMember: 'Vous n\'êtes pas membre de cette guilde',
        tabs: {
          overview: 'Chronique',
          members: 'Rôle',
          goals: 'Objectifs',
          quests: 'Quêtes',
          analytics: 'Registre',
          comments: 'Parchemins',
          chat: 'Salle de Guilde',
          joinRequests: 'Pétitions',
          moderation: 'Intendance',
        },
        avatar: {
          title: 'Avatar de la Guilde',
          upload: 'Télécharger Avatar',
          change: 'Changer Avatar',
          remove: 'Supprimer Avatar',
          confirm: 'Confirmer Téléchargement',
          cancel: 'Annuler',
          help: 'Téléchargez un avatar personnalisé pour votre guilde',
          uploading: 'Téléchargement...',
          removing: 'Suppression...',
          chooseImage: 'Choisir Image',
          helpFormats: 'Formats supportés : JPEG, PNG, WebP',
          helpSize: 'Taille maximale : 10Mo (sera redimensionné à 500Ko)',
          helpRecommended: 'Recommandé : 512x512 pixels',
          helpCompression: 'Les images seront automatiquement compressées',
          error: {
            invalidType: 'Veuillez sélectionner un fichier image valide (JPEG, PNG, ou WebP)',
            tooLarge: 'La taille du fichier doit être inférieure à 5MB',
            uploadFailed: 'Échec du téléchargement de l\'avatar',
            removeFailed: 'Échec de la suppression de l\'avatar',
          },
          success: {
            uploaded: 'Avatar mis à jour avec succès !',
            removed: 'Avatar supprimé avec succès !',
          },
        },
      actions: {
        join: 'Rejoindre la Guilde',
        joining: 'Adhésion...',
        leave: 'Quitter la Guilde',
        leaving: 'Départ...',
        settings: 'Paramètres',
        invite: 'Inviter des Membres',
        pendingRequest: 'Demande en Attente',
        requestToJoin: 'Demander à Rejoindre',
        viewGuild: 'Voir la guilde',
        edit: 'Modifier',
        delete: 'Supprimer',
      },
      stats: {
        members: 'Membres',
        goals: 'Objectifs',
        quests: 'Quêtes',
        created: 'Créé',
      },
      types: {
        public: 'Guilde publique',
        private: 'Guilde privée',
        approval: 'Guilde nécessitant approbation',
      },
      overview: {
        guildInfo: 'Informations de la Guilde',
        visibility: 'Visibilité',
        visibilityPublic: 'Publique',
        visibilityPrivate: 'Privée',
        created: 'Créé',
        owner: 'Propriétaire',
        createdBy: 'par',
        editAvatarHint: 'Cliquez sur "Modifier" pour changer l\'avatar',
      },
    },
    members: {
      title: 'Membres de la Guilde',
      search: {
        placeholder: 'Rechercher des membres...',
      },
      role: {
        owner: 'Propriétaire',
        moderator: 'Modérateur',
        member: 'Membre',
      },
      actions: {
        remove: 'Supprimer le Membre',
        viewProfile: 'Voir le Profil',
        assignModerator: 'Nommer Modérateur',
        removeModerator: 'Retirer Modérateur',
        blockUser: 'Bloquer l\'Utilisateur',
        unblockUser: 'Débloquer l\'Utilisateur',
        toggleCommentPermission: 'Basculer Permission de Commentaire',
        removeFromGuild: 'Retirer de la Guilde',
      },
      empty: 'Aucun membre trouvé',
      joined: 'A rejoint',
      blockedFromCommenting: '(Bloqué des commentaires)',
    },
    joinRequests: {
      title: 'Demandes d\'Adhésion',
      empty: 'Aucune demande d\'adhésion en attente',
      reviewTitle: 'Examiner la Demande d\'Adhésion',
      reviewDescription: 'Examiner la demande d\'adhésion de',
      requested: 'Demandé',
      reasonLabel: 'Raison (optionnelle)',
      reasonPlaceholder: 'Ajoutez une raison pour votre décision...',
      actions: {
        approve: 'Approuver',
        reject: 'Rejeter',
        viewProfile: 'Voir le Profil',
      },
      status: {
        pending: 'En Attente',
        approved: 'Approuvé',
        rejected: 'Rejeté',
      },
      requestToJoin: {
        title: 'Demander à Rejoindre la Guilde',
        description: 'nécessite une approbation pour rejoindre. Envoyez une demande avec un message expliquant pourquoi vous aimeriez rejoindre.',
        message: 'Message (optionnel)',
        placeholder: 'Dites à la guilde pourquoi vous voulez la rejoindre...',
        submit: 'Envoyer la Demande',
        submitting: 'Envoi...',
        cancel: 'Annuler',
        success: 'Demande d\'adhésion envoyée avec succès !',
        error: 'Échec de l\'envoi de la demande d\'adhésion',
      },
    },
    moderation: {
      title: 'Modération',
      noMembers: 'Aucun membre disponible pour la modération',
      actions: {
        blockUser: 'Bloquer l\'Utilisateur',
        unblockUser: 'Débloquer l\'Utilisateur',
        removeComment: 'Supprimer le Commentaire',
        toggleCommentPermission: 'Basculer Permission de Commentaire',
        disableComments: 'Désactiver les Commentaires',
        enableComments: 'Activer les Commentaires',
      },
      descriptions: {
        blockUser: 'Bloquer {username} de l\'accès à la guilde',
        unblockUser: 'Débloquer {username} et restaurer l\'accès à la guilde',
        disableComments: 'Désactiver les commentaires pour {username}',
        enableComments: 'Activer les commentaires pour {username}',
      },
      confirmations: {
        blockUser: 'Êtes-vous sûr de vouloir bloquer cet utilisateur ? Il ne pourra plus accéder à la guilde.',
        unblockUser: 'Êtes-vous sûr de vouloir débloquer cet utilisateur ?',
        removeComment: 'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
        transferOwnership: 'Êtes-vous sûr de vouloir transférer la propriété ? Cette action ne peut pas être annulée.',
      },
      reasons: {
        spam: 'Spam',
        inappropriate: 'Contenu Inapproprié',
        harassment: 'Harcèlement',
        other: 'Autre',
      },
      labels: {
        reasonOptional: 'Raison (optionnel)',
        customReason: 'Raison personnalisée (optionnel)',
        selectReason: 'Sélectionnez une raison',
        addDetails: 'Ajouter des détails supplémentaires...',
        cancel: 'Annuler',
        blocked: 'Bloqué',
        noComments: 'Pas de Commentaires',
      },
    },
    ownership: {
      transfer: {
        title: 'Transférer la Propriété de la Guilde',
        selectNewOwner: 'Sélectionner le Nouveau Propriétaire',
        selectMember: 'Sélectionnez un membre',
        reason: 'Raison (optionnelle)',
        reasonPlaceholder: 'Pourquoi transférez-vous la propriété ?',
        confirm: 'Transférer la Propriété',
        confirming: 'Transfert...',
        success: 'Propriété de la guilde transférée avec succès',
        warning: 'Transférer la Propriété',
        warningTitle: 'Transférer la Propriété',
        warningMessage: 'Cette action ne peut pas être annulée. Vous deviendrez un membre régulier.',
        finalWarning: 'Avertissement',
        finalWarningMessage: 'Cette action ne peut pas être annulée. Vous perdrez les privilèges de propriétaire.',
        cancel: 'Annuler',
        characters: 'caractères',
      },
    },
    validation: {
      nameRequired: 'Le nom de la guilde est requis',
      nameTooShort: 'Le nom de la guilde doit contenir au moins 3 caractères',
      nameTooLong: 'Le nom de la guilde doit contenir moins de 50 caractères',
      nameInvalid: 'Le nom de la guilde ne peut contenir que des lettres, chiffres, espaces, tirets et traits de soulignement',
      nameTaken: 'Ce nom de guilde est déjà pris',
      descriptionTooLong: 'La description doit contenir moins de 500 caractères',
      tagTooShort: 'Chaque étiquette doit contenir au moins 2 caractères',
      tagTooLong: 'Chaque étiquette doit contenir moins de 20 caractères',
      tagInvalid: 'Les étiquettes ne peuvent contenir que des lettres, chiffres et espaces',
      tooManyTags: 'Maximum 10 étiquettes autorisées',
    },
    messages: {
      createSuccess: 'Guilde créée avec succès !',
      updateSuccess: 'Guilde mise à jour avec succès !',
      deleteSuccess: 'Guilde supprimée avec succès !',
      joinSuccess: 'Vous avez rejoint la guilde avec succès !',
      leaveSuccess: 'Vous avez quitté la guilde avec succès !',
      removeSuccess: 'Membre supprimé avec succès !',
      error: 'Une erreur s\'est produite. Veuillez réessayer.',
      confirmLeave: 'Êtes-vous sûr de vouloir quitter cette guilde ?',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette guilde ? Cette action ne peut pas être annulée.',
      confirmRemove: 'Êtes-vous sûr de vouloir supprimer ce membre de la guilde ?',
    },
    analytics: {
      title: 'Analytiques de la Guilde',
      dashboard: 'Tableau de Bord des Analytiques',
      memberLeaderboard: 'Classement des Membres',
      members: 'Membres',
      goals: 'Objectifs',
      quests: 'Quêtes',
      xp: 'XP',
      today: 'Aujourd\'hui',
      yesterday: 'Hier',
      daysAgo: 'jours',
      weeksAgo: 'semaines',
      monthsAgo: 'mois',
      never: 'Jamais',
      showingTop: 'Affichage des meilleurs',
      of: 'de',
      active: 'actifs',
      completed: 'complétées',
      weeklyActivity: 'Activité Hebdomadaire',
      memberEngagement: 'Engagement des membres cette semaine',
      topPerformers: 'Meilleurs Membres',
      highestActivity: 'Membres avec la plus haute activité',
      memberActivityRate: "Taux d'Activité des Membres",
      questCompletionRate: 'Taux de Quêtes Complétées',
      performanceMetrics: 'Métriques de Performance',
      thisWeeksSummary: 'Résumé de Cette Semaine',
      newMembers: 'Nouveaux Membres',
      questsCompleted: 'Quêtes Complétées',
      activityScore: "Score d'Activité",
      loading: 'Chargement des Analytiques...',
      error: 'Erreur des Analytiques',
      retry: 'Réessayer',
      noData: "Aucune donnée d'analytique disponible pour cette guilde.",
      controls: 'Contrôles des Analytiques',
      refreshData: 'Actualiser les Données',
      lastUpdated: 'Dernière mise à jour',
      lastActivity: 'Dernière activité',
    },
    activities: {
      title: 'Activités Récentes',
      loading: 'Chargement des activités...',
      error: 'Échec du chargement des activités',
      empty: 'Aucune activité pour le moment',
      emptyDescription: 'Le fil d\'activités apparaîtra ici lorsque les membres interagiront avec la guilde',
      types: {
        quest_created: 'quête créée',
        quest_activated: 'quête activée',
        quest_completed: 'quête complétée',
        quest_failed: 'quête échouée',
        member_joined: 'membre rejoint',
        member_left: 'membre parti',
      },
      messages: {
        questCreated: 'a créé la quête',
        questActivated: 'a activé la quête',
        questCompleted: 'a complété la quête',
        questFailed: 'quête échouée',
        memberJoined: 'a rejoint la guilde',
        memberLeft: 'a quitté la guilde',
      },
    },
    memberManagement: {
      title: 'Gestion des Membres',
      subtitle: 'Gérez les membres de la guilde et leurs rôles',
      loading: 'Chargement des membres...',
      error: 'Échec du chargement des membres',
      noMembers: 'Aucun membre trouvé',
      joinedOn: 'A rejoint le',
      promote: 'Promouvoir',
      demote: 'Rétrograder',
      remove: 'Supprimer',
      cancel: 'Annuler',
      removeMember: 'Supprimer le Membre',
      removeMemberDesc: 'Êtes-vous sûr de vouloir supprimer {username} de cette guilde ?',
      promoteModerator: 'Promouvoir Modérateur',
      promoteModeratorDesc: 'Êtes-vous sûr de vouloir promouvoir {username} en modérateur ?',
      demoteModerator: 'Rétrograder Modérateur',
      demoteModeratorDesc: 'Êtes-vous sûr de vouloir rétrograder {username} de modérateur ?',
      memberRemoved: 'Membre supprimé avec succès',
      memberPromoted: 'Membre promu avec succès',
      memberDemoted: 'Membre rétrogradé avec succès',
    },
    rankings: {
      title: 'Classements des Guildes',
      subtitle: 'Découvrez les guildes les plus performantes de la communauté',
      score: 'Score',
      loading: 'Chargement des Classements...',
      errorTitle: 'Erreur de Chargement des Classements',
      tryAgain: 'Réessayer',
      searchPlaceholder: 'Rechercher des guildes...',
      backToGuilds: 'Retour aux Guildes',
      refresh: 'Actualiser',
      updated: 'Mis à jour',
      topPerformers: 'Meilleures Performances',
      allRankings: 'Tous les Classements',
      filters: {
        all: 'Toutes les Guildes',
        public: 'Publiques',
        private: 'Privées',
        top10: 'Top 10',
        top50: 'Top 50',
      },
      sort: {
        rank: 'Rang',
        score: 'Score',
        members: 'Membres',
        activity: 'Activité',
      },
      stats: {
        members: 'membres',
        pts: 'pts',
        totalGuilds: 'Total Guildes',
        totalMembers: 'Total Membres',
        totalScore: 'Score Total',
        avgActivity: 'Activité Moy.',
      },
      empty: {
        title: 'Aucune guilde trouvée',
        adjustFilters: 'Essayez d\'ajuster votre recherche ou vos filtres.',
        noGuilds: 'Aucune guilde n\'est disponible pour le moment.',
      },
      showingTop: 'Affichage des meilleurs',
      ofGuilds: 'sur',
      totalScore: 'Score Total',
      performanceScore: 'Score de Performance',
      performanceDescription: 'Basé sur l\'activité des membres et la progression des quêtes',
      scoreInfo: {
        title: 'Comment les Scores de Guild sont Calculés',
        description: 'Les scores de guild sont calculés en fonction du nombre de membres, de la croissance et des objectifs complétés par les membres pour encourager des communautés actives et en croissance.',
        formula: {
          activityScore: 'Score d\'Activité = Membres × 10 points',
          growthBonus: 'Bonus de Croissance = (30 - jours d\'âge) × 2 points (pour les guilds de moins de 30 jours)',
          goalsCompleted: 'Objectifs Complétés = Objectifs complétés par les membres dans les 30 derniers jours × 10 points',
          socialEngagement: 'Engagement Social = Commentaires + Likes dans les 30 derniers jours × 1 point chacun',
          totalScore: 'Score Total = Score d\'Activité + Bonus de Croissance + Objectifs Complétés + Engagement Social',
        },
        examples: {
          title: 'Exemples',
          newGuild: 'Guild Nouvelle (10 jours, 20 membres, 5 objectifs, 20 commentaires/likes) : 200 + 40 + 50 + 20 = 310 points',
          establishedGuild: 'Guild Établie (60 jours, 50 membres, 15 objectifs, 50 commentaires/likes) : 500 + 0 + 150 + 50 = 700 points',
          topGuild: 'Guild Top (5 jours, 100 membres, 25 objectifs, 100 commentaires/likes) : 1000 + 50 + 250 + 100 = 1400 points',
        },
        tips: {
          title: 'Conseils pour Améliorer votre Score',
          memberGrowth: '• Concentrez-vous sur la croissance de votre base de membres (10 points par membre)',
          newGuildBoost: '• Les nouvelles guilds reçoivent des points bonus pendant les 30 premiers jours',
          goalsCompleted: '• Encouragez les membres à compléter leurs objectifs (10 points par objectif complété)',
          socialEngagement: '• Favorisez l\'interaction communautaire par les commentaires et likes (1 point chacun)',
          activityMatters: '• Créez un environnement engageant qui promeut à la fois l\'accomplissement d\'objectifs et l\'interaction sociale',
        },
      },
    },
    comments: {
      title: 'Commentaires de la Guilde',
      post: 'Commenter',
      reply: 'Répondre',
      edit: 'Modifier',
      delete: 'Supprimer',
      like: 'J\'aime',
      unlike: 'Je n\'aime plus',
      placeholder: 'Partagez vos pensées avec la guilde...',
      replyPlaceholder: 'Écrivez une réponse...',
      noComments: 'Aucun commentaire pour le moment',
      noCommentsDescription: 'Soyez le premier à lancer la conversation ! Partagez vos pensées avec la guilde.',
      loading: 'Chargement des commentaires...',
      error: 'Échec du chargement des commentaires',
      errorLoading: 'Erreur de Chargement des Commentaires',
      retry: 'Réessayer',
      owner: 'Propriétaire',
      edited: '(modifié)',
      showReplies: 'Afficher',
      hideReplies: 'Masquer',
      replyCount: 'réponse',
      repliesCount: 'réponses',
      characters: 'caractères',
      blockUser: 'Bloquer l\'Utilisateur',
      removeFromGuild: 'Retirer de la Guilde',
      confirmDeleteComment: 'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
      confirmBlockUser: 'Êtes-vous sûr de vouloir bloquer {username} des commentaires ?',
      confirmRemoveUser: 'Êtes-vous sûr de vouloir retirer {username} de la guilde ?',
      justNow: 'à l\'instant',
      membersOnly: {
        title: 'Membres Seulement',
        message: 'Vous devez être membre de cette guilde pour voir et publier des commentaires.',
        joinButton: 'Rejoindre la Guilde',
      },
      blocked: {
        title: 'Accès Restreint',
        message: 'Vous avez été bloqué de l\'accès à la section des commentaires de cette guilde.',
        contactModerator: 'Contactez un modérateur de la guilde si vous pensez que c\'est une erreur.',
      },
      commentingDisabled: {
        title: 'Commentaires Désactivés',
        message: 'Vous n\'êtes pas autorisé à publier des commentaires dans cette guilde.',
        contactModerator: 'Contactez un modérateur de la guilde si vous pensez que c\'est une erreur.',
      },
    },
    edit: {
      title: 'Modifier la Guilde',
      subtitle: 'Mettez à jour les informations et paramètres de votre guilde',
      basicInfo: 'Informations de Base',
      settings: 'Paramètres',
      avatar: 'Avatar',
      members: 'Membres',
      guildName: 'Nom de la Guilde',
      guildAvatar: 'Avatar de la Guilde',
      guildNamePlaceholder: 'Entrez le nom de la guilde',
      description: 'Description',
      descriptionPlaceholder: 'Entrez la description de la guilde',
      guildType: 'Type de Guilde',
      selectGuildType: 'Sélectionner le type de guilde',
      publicGuild: 'Publique',
      privateGuild: 'Privée',
      approvalGuild: 'Nécessite une Approbation',
      addTag: 'Ajouter une étiquette...',
      tagsHelp: 'Appuyez sur Entrée ou virgule pour ajouter des étiquettes. Maximum 10 étiquettes.',
      allowJoinRequests: 'Autoriser les Demandes d\'Adhésion',
      allowJoinRequestsDesc: 'Autoriser les utilisateurs à demander à rejoindre cette guilde',
      requireApproval: 'Exiger une Approbation',
      requireApprovalDesc: 'Exiger une approbation pour que de nouveaux membres rejoignent',
      locked: 'Verrouillé',
      requireApprovalLockedDesc: 'Ce paramètre est verrouillé car le type de guilde est "Nécessite une Approbation". Changez le type de guilde pour modifier ce paramètre.',
      allowComments: 'Autoriser les Commentaires',
      allowCommentsDesc: 'Autoriser les membres à publier des commentaires dans cette guilde',
      uploadAvatar: 'Télécharger un Nouvel Avatar',
      avatarHelp: 'JPG, PNG ou WebP. Taille maximale 5MB.',
      preview: 'Aperçu',
      remove: 'Supprimer',
      memberManagement: 'Gestion des Membres',
      saveChanges: 'Enregistrer les Modifications',
      saving: 'Enregistrement...',
      cancel: 'Annuler',
      uploadingAvatar: 'Téléchargement de l\'avatar...',
    },
    quests: {
      title: 'Quêtes de la Guilde',
      subtitle: 'Gérez et complétez les quêtes de la guilde',
      create: 'Créer une Quête',
      createTitle: 'Créer une Nouvelle Quête de Guilde',
      createDescription: 'Créez une quête quantitative ou en pourcentage pour les membres de votre guilde',
      noQuests: 'Aucune quête pour le moment',
      noQuestsDescription: 'Créez votre première quête de guilde pour engager vos membres',
      noQuestsDescriptionMember: 'Aucune quête n\'a encore été créée pour cette guilde',
      loading: 'Chargement des quêtes...',
      error: 'Échec du chargement des quêtes',
      status: {
        all: 'Toutes',
        active: 'Actives',
        draft: 'Brouillon',
        archived: 'Archivées',
        cancelled: 'Annulées',
        completed: 'Complétée',
        failed: 'Échouée',
      },
      types: {
        quantitative: 'Quantitative',
        percentual: 'En Pourcentage',
      },
      difficulty: {
        easy: 'Facile',
        medium: 'Moyenne',
        hard: 'Difficile',
      },
      form: {
        title: 'Titre',
        titlePlaceholder: 'Titre de la quête',
        description: 'Description',
        descriptionPlaceholder: 'Description de la quête (optionnel)',
        category: 'Catégorie',
        difficulty: 'Difficulté',
        rewardXp: 'XP de Récompense',
        questType: 'Type de Quête',
        tags: 'Étiquettes',
        tagsPlaceholder: 'Ajouter une étiquette',
        tagsHelp: 'Optionnel, max 10 étiquettes',
        deadline: 'Date limite',
        quantitative: {
          title: 'Paramètres de Quête Quantitative',
          targetCount: 'Nombre Cible',
          targetCountPlaceholder: 'ex. 10',
          countScope: 'Portée du Compte',
          countScopeGoals: 'Objectifs d\'Utilisateur (des membres)',
          countScopeTasks: 'Tâches',
          countScopeGuildQuest: 'Quêtes de Guilde',
          targetQuestId: 'ID de Quête Cible',
          targetQuestIdPlaceholder: 'ID de quête pour compter les complétions',
          periodDays: 'Durée de la Période (jours, optionnel)',
          periodDaysPlaceholder: 'Laisser vide pour aucune limite de période',
        },
        percentual: {
          title: 'Paramètres de Quête en Pourcentage',
          percentualType: 'Type de Pourcentage',
          goalTaskCompletion: 'Complétion Objectif/Tâche',
          memberCompletion: 'Complétion par Membres',
          targetPercentage: 'Pourcentage Cible (0-100)',
          targetPercentagePlaceholder: 'ex. 80',
          linkedGoalIds: 'IDs d\'Objectifs d\'Utilisateur Liés (séparés par des virgules, des membres de la guilde)',
          linkedGoalIdsPlaceholder: 'objectif-id-1, objectif-id-2',
          linkedTaskIds: 'IDs de Tâches Liées (séparés par des virgules)',
          linkedTaskIdsPlaceholder: 'tâche-id-1, tâche-id-2',
          percentualCountScope: 'Portée du Compte',
          percentualCountScopeGoals: 'Objectifs d\'Utilisateur (des membres)',
          percentualCountScopeTasks: 'Tâches',
          percentualCountScopeBoth: 'Les Deux',
        },
        validation: {
          titleRequired: 'Le titre doit contenir au moins 3 caractères',
          titleTooShort: 'Le titre doit contenir au moins 3 caractères',
          categoryRequired: 'Veuillez sélectionner une catégorie',
          targetCountRequired: 'Le nombre cible doit être d\'au moins 1',
          targetCountInvalid: 'Le nombre cible doit être d\'au moins 1',
          countScopeRequired: 'Veuillez sélectionner une portée de compte',
          targetQuestIdRequired: 'Veuillez spécifier un ID de quête cible',
          percentualTypeRequired: 'Veuillez sélectionner un type de pourcentage',
          targetPercentageRequired: 'Le pourcentage cible doit être entre 0 et 100',
          targetPercentageInvalid: 'Le pourcentage cible doit être entre 0 et 100',
          linkedGoalTaskRequired: 'Veuillez lier au moins un objectif ou une tâche',
          percentualCountScopeRequired: 'Veuillez sélectionner une portée de compte',
        },
      },
      actions: {
        create: 'Créer une Quête',
        creating: 'Création...',
        edit: 'Modifier',
        delete: 'Supprimer',
        archive: 'Archiver',
        complete: 'Compléter la Quête',
        completing: 'Complétion...',
        completed: 'Complétée',
        viewProgress: 'Voir le Progrès',
      },
      messages: {
        createSuccess: 'Quête créée avec succès',
        updateSuccess: 'Quête mise à jour avec succès',
        deleteSuccess: 'Quête supprimée avec succès',
        archiveSuccess: 'Quête archivée avec succès',
        completeSuccess: 'Quête complétée !',
        activateSuccess: 'Quête activée avec succès',
        finishSuccess: 'Quête terminée avec succès',
        alreadyCompleted: 'Vous avez déjà complété cette quête',
        onlyActiveComplete: 'Seules les quêtes actives peuvent être complétées',
        onlyDraftEdit: 'Seules les quêtes en brouillon peuvent être modifiées',
        onlyDraftDelete: 'Seules les quêtes en brouillon peuvent être supprimées',
        onlyActiveArchive: 'Seules les quêtes actives peuvent être archivées',
        onlyDraftActivate: 'Seules les quêtes en brouillon peuvent être activées',
        onlyActiveFinish: 'Seules les quêtes actives peuvent être terminées',
      },
      finishDialog: {
        title: 'Terminer la Quête',
        warningTitle: 'Avertissement : Objectifs Non Atteints',
        warningMessage: 'Cette quête sera marquée comme Échouée. Aucun point ne sera attribué et elle ne comptera pas pour le classement de la guilde.',
        successTitle: 'Objectifs Atteints',
        successMessage: 'Cette quête sera marquée comme Complétée. Des points seront attribués et elle comptera pour le classement de la guilde.',
        confirmMessage: 'Êtes-vous sûr de vouloir terminer cette quête ? Cette action ne peut pas être annulée.',
        cancel: 'Annuler',
        confirm: 'Terminer la Quête',
        finishing: 'Finalisation...',
      },
      progress: {
        goalsCompleted: 'Objectifs complétés',
        tasksCompleted: 'Tâches complétées',
        guildQuestsCompleted: 'Quêtes de guilde complétées',
        completionPercentage: 'Pourcentage de Complétion',
        membersCompleted: 'Membres Complétés',
        targetPercentage: 'Pourcentage Cible',
      },
      metadata: {
        rewardXp: 'XP de Récompense',
        category: 'Catégorie',
        deadline: 'Date limite',
        completedBy: 'complétée par',
      },
    },
  },
};

/**
 * Get guild translations for a specific language
 */
export const getGuildTranslations = (language: string = 'en'): GuildTranslations => {
  // Ensure we're using a valid language key
  const validLanguage = (language === 'en' || language === 'es' || language === 'fr') ? language : 'en';
  const result = guildTranslations[validLanguage] || guildTranslations.en;
  return result;
};

/**
 * Get a specific translation key with fallback
 */
export const getGuildTranslation = (
  key: string,
  language: string = 'en',
  fallback?: string
): string => {
  const translations = getGuildTranslations(language);
  const keys = key.split('.');
  
  let value: any = translations;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return fallback || key;
    }
  }
  
  return typeof value === 'string' ? value : (fallback || key);
};

/**
 * Translation keys for easy access
 */
export const GUILD_TRANSLATION_KEYS = {
  TITLE: 'title',
  CREATE_TITLE: 'create.title',
  CREATE_SUBTITLE: 'create.subtitle',
  FORM_NAME_LABEL: 'create.form.name.label',
  FORM_NAME_PLACEHOLDER: 'create.form.name.placeholder',
  FORM_NAME_HELP: 'create.form.name.help',
  FORM_DESCRIPTION_LABEL: 'create.form.description.label',
  FORM_DESCRIPTION_PLACEHOLDER: 'create.form.description.placeholder',
  FORM_TAGS_LABEL: 'create.form.tags.label',
  FORM_TAGS_PLACEHOLDER: 'create.form.tags.placeholder',
  FORM_IS_PUBLIC_LABEL: 'create.form.isPublic.label',
  FORM_IS_PUBLIC_HELP: 'create.form.isPublic.help',
  ACTIONS_CREATE: 'create.actions.create',
  ACTIONS_CREATING: 'create.actions.creating',
  ACTIONS_CANCEL: 'create.actions.cancel',
  LIST_TITLE: 'list.title',
  LIST_SEARCH_PLACEHOLDER: 'list.search.placeholder',
  LIST_EMPTY_TITLE: 'list.empty.title',
  LIST_EMPTY_DESCRIPTION: 'list.empty.description',
  LIST_EMPTY_ACTION: 'list.empty.action',
  DETAILS_LOADING: 'details.loading',
  DETAILS_NOT_FOUND: 'details.notFound',
  DETAILS_JOIN: 'details.actions.join',
  DETAILS_LEAVE: 'details.actions.leave',
  DETAILS_SETTINGS: 'details.actions.settings',
  MEMBERS_TITLE: 'members.title',
  MEMBERS_SEARCH_PLACEHOLDER: 'members.search.placeholder',
  MEMBERS_ROLE_OWNER: 'members.role.owner',
  MEMBERS_ROLE_MEMBER: 'members.role.member',
  VALIDATION_NAME_REQUIRED: 'validation.nameRequired',
  VALIDATION_NAME_TOO_SHORT: 'validation.nameTooShort',
  VALIDATION_NAME_TOO_LONG: 'validation.nameTooLong',
  VALIDATION_NAME_INVALID: 'validation.nameInvalid',
  VALIDATION_NAME_TAKEN: 'validation.nameTaken',
  VALIDATION_DESCRIPTION_TOO_LONG: 'validation.descriptionTooLong',
  VALIDATION_TOO_MANY_TAGS: 'validation.tooManyTags',
  MESSAGES_CREATE_SUCCESS: 'messages.createSuccess',
  MESSAGES_UPDATE_SUCCESS: 'messages.updateSuccess',
  MESSAGES_DELETE_SUCCESS: 'messages.deleteSuccess',
  MESSAGES_JOIN_SUCCESS: 'messages.joinSuccess',
  MESSAGES_LEAVE_SUCCESS: 'messages.leaveSuccess',
  MESSAGES_ERROR: 'messages.error',
  MESSAGES_CONFIRM_LEAVE: 'messages.confirmLeave',
  MESSAGES_CONFIRM_DELETE: 'messages.confirmDelete',
  MESSAGES_CONFIRM_REMOVE: 'messages.confirmRemove',
} as const;
