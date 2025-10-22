/**
 * Internationalization (i18n) translations for guild features.
 *
 * This module provides translations for all guild-related UI text,
 * following the project's i18n patterns and structure.
 */

export interface GuildTranslations {
  title: string;
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
    };
    avatar: {
      title: string;
      upload: string;
      change: string;
      remove: string;
      confirm: string;
      cancel: string;
      help: string;
      error: {
        invalidType: string;
        tooLarge: string;
        uploadFailed: string;
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
    };
    stats: {
      members: string;
      goals: string;
      quests: string;
      created: string;
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
    };
    empty: string;
  };
  joinRequests: {
    title: string;
    empty: string;
    actions: {
      approve: string;
      reject: string;
      viewProfile: string;
    };
    status: {
      pending: string;
      approved: string;
      rejected: string;
    };
    requestToJoin: {
      title: string;
      message: string;
      placeholder: string;
      submit: string;
      submitting: string;
    };
  };
  moderation: {
    title: string;
    actions: {
      blockUser: string;
      unblockUser: string;
      removeComment: string;
      toggleCommentPermission: string;
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
  };
  ownership: {
    transfer: {
      title: string;
      selectNewOwner: string;
      reason: string;
      reasonPlaceholder: string;
      confirm: string;
      confirming: string;
      success: string;
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
  };
  rankings: {
    title: string;
    score: string;
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
    post: string;
    reply: string;
    edit: string;
    delete: string;
    like: string;
    unlike: string;
    placeholder: string;
    replyPlaceholder: string;
    noComments: string;
    loading: string;
    error: string;
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
  edit: {
    title: string;
    subtitle: string;
    basicInfo: string;
    settings: string;
    avatar: string;
    members: string;
    guildName: string;
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
      joinRequests: {
        title: string;
        empty: string;
        reviewTitle: string;
        reviewDescription: string;
        requested: string;
        reasonLabel: string;
        reasonPlaceholder: string;
        actions: {
          approve: string;
          reject: string;
        };
        status: {
          pending: string;
          approved: string;
          rejected: string;
        };
        requestToJoin: {
          title: string;
          description: string;
          message: string;
          placeholder: string;
          submit: string;
          submitting: string;
          cancel: string;
          success: string;
          error: string;
        };
      };
}

export const guildTranslations: Record<string, GuildTranslations> = {
  en: {
    title: 'Guilds',
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
          overview: 'Overview',
          members: 'Members',
          goals: 'Goals',
          quests: 'Quests',
          analytics: 'Analytics',
          comments: 'Comments',
        },
        avatar: {
          title: 'Guild Avatar',
          upload: 'Upload Avatar',
          change: 'Change Avatar',
          remove: 'Remove Avatar',
          confirm: 'Confirm Upload',
          cancel: 'Cancel',
          help: 'Upload a custom avatar for your guild',
          error: {
            invalidType: 'Please select a valid image file (JPEG, PNG, or WebP)',
            tooLarge: 'File size must be less than 5MB',
            uploadFailed: 'Avatar upload failed',
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
      },
      stats: {
        members: 'Members',
        goals: 'Goals',
        quests: 'Quests',
        created: 'Created',
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
        assignModerator: 'Assign as Moderator',
        removeModerator: 'Remove as Moderator',
        blockUser: 'Block User',
        unblockUser: 'Unblock User',
        toggleCommentPermission: 'Toggle Comment Permission',
      },
      empty: 'No members found',
    },
    joinRequests: {
      title: 'Join Requests',
      empty: 'No pending join requests',
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
        title: 'Request to Join Guild',
        message: 'Message (optional)',
        placeholder: 'Tell the guild why you want to join...',
        submit: 'Send Request',
        submitting: 'Sending...',
      },
    },
    moderation: {
      title: 'Moderation',
      actions: {
        blockUser: 'Block User',
        unblockUser: 'Unblock User',
        removeComment: 'Remove Comment',
        toggleCommentPermission: 'Toggle Comment Permission',
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
    },
    ownership: {
      transfer: {
        title: 'Transfer Guild Ownership',
        selectNewOwner: 'Select New Owner',
        reason: 'Reason (optional)',
        reasonPlaceholder: 'Why are you transferring ownership?',
        confirm: 'Transfer Ownership',
        confirming: 'Transferring...',
        success: 'Guild ownership transferred successfully',
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
      lastActivity: 'Last activity',
    },
    rankings: {
      title: 'Rankings',
      score: 'Score',
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
      post: 'Comment',
      reply: 'Reply',
      edit: 'Edit',
      delete: 'Delete',
      like: 'Like',
      unlike: 'Unlike',
      placeholder: 'Write a comment...',
      replyPlaceholder: 'Write a reply...',
      noComments: 'No comments yet',
      loading: 'Loading comments...',
      error: 'Failed to load comments',
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
    edit: {
      title: 'Edit Guild',
      subtitle: 'Update your guild information and settings',
      basicInfo: 'Basic Info',
      settings: 'Settings',
      avatar: 'Avatar',
      members: 'Members',
      guildName: 'Guild Name',
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
  },
  es: {
    title: 'Gremios',
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
          overview: 'Resumen',
          members: 'Miembros',
          goals: 'Objetivos',
          quests: 'Misiones',
          analytics: 'Analíticas',
          comments: 'Comentarios',
        },
        avatar: {
          title: 'Avatar del Gremio',
          upload: 'Subir Avatar',
          change: 'Cambiar Avatar',
          remove: 'Eliminar Avatar',
          confirm: 'Confirmar Subida',
          cancel: 'Cancelar',
          help: 'Sube un avatar personalizado para tu gremio',
          error: {
            invalidType: 'Por favor selecciona un archivo de imagen válido (JPEG, PNG, o WebP)',
            tooLarge: 'El tamaño del archivo debe ser menor a 5MB',
            uploadFailed: 'Error al subir el avatar',
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
      },
      stats: {
        members: 'Miembros',
        goals: 'Objetivos',
        quests: 'Misiones',
        created: 'Creado',
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
        assignModerator: 'Asignar como Moderador',
        removeModerator: 'Remover como Moderador',
        blockUser: 'Bloquear Usuario',
        unblockUser: 'Desbloquear Usuario',
        toggleCommentPermission: 'Alternar Permiso de Comentarios',
      },
      empty: 'No se encontraron miembros',
    },
    joinRequests: {
      title: 'Solicitudes de Ingreso',
      empty: 'No hay solicitudes de ingreso pendientes',
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
      actions: {
        blockUser: 'Bloquear Usuario',
        unblockUser: 'Desbloquear Usuario',
        removeComment: 'Eliminar Comentario',
        toggleCommentPermission: 'Alternar Permiso de Comentarios',
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
    },
    ownership: {
      transfer: {
        title: 'Transferir Propiedad del Gremio',
        selectNewOwner: 'Seleccionar Nuevo Propietario',
        reason: 'Razón (opcional)',
        reasonPlaceholder: '¿Por qué estás transfiriendo la propiedad?',
        confirm: 'Transferir Propiedad',
        confirming: 'Transfiriendo...',
        success: 'Propiedad del gremio transferida exitosamente',
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
      lastActivity: 'Última actividad',
    },
    rankings: {
      title: 'Clasificaciones',
      score: 'Puntuación',
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
      post: 'Comentar',
      reply: 'Responder',
      edit: 'Editar',
      delete: 'Eliminar',
      like: 'Me gusta',
      unlike: 'No me gusta',
      placeholder: 'Escribe un comentario...',
      replyPlaceholder: 'Escribe una respuesta...',
      noComments: 'Aún no hay comentarios',
      loading: 'Cargando comentarios...',
      error: 'Error al cargar comentarios',
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
      },
      status: {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
      },
    },
  },
  fr: {
    title: 'Guildes',
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
          overview: 'Aperçu',
          members: 'Membres',
          goals: 'Objectifs',
          quests: 'Quêtes',
          analytics: 'Analytiques',
          comments: 'Commentaires',
        },
        avatar: {
          title: 'Avatar de la Guilde',
          upload: 'Télécharger Avatar',
          change: 'Changer Avatar',
          remove: 'Supprimer Avatar',
          confirm: 'Confirmer Téléchargement',
          cancel: 'Annuler',
          help: 'Téléchargez un avatar personnalisé pour votre guilde',
          error: {
            invalidType: 'Veuillez sélectionner un fichier image valide (JPEG, PNG, ou WebP)',
            tooLarge: 'La taille du fichier doit être inférieure à 5MB',
            uploadFailed: 'Échec du téléchargement de l\'avatar',
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
      },
      stats: {
        members: 'Membres',
        goals: 'Objectifs',
        quests: 'Quêtes',
        created: 'Créé',
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
        assignModerator: 'Assigner comme Modérateur',
        removeModerator: 'Retirer comme Modérateur',
        blockUser: 'Bloquer l\'Utilisateur',
        unblockUser: 'Débloquer l\'Utilisateur',
        toggleCommentPermission: 'Basculer Permission de Commentaire',
      },
      empty: 'Aucun membre trouvé',
    },
    joinRequests: {
      title: 'Demandes d\'Adhésion',
      empty: 'Aucune demande d\'adhésion en attente',
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
      actions: {
        blockUser: 'Bloquer l\'Utilisateur',
        unblockUser: 'Débloquer l\'Utilisateur',
        removeComment: 'Supprimer le Commentaire',
        toggleCommentPermission: 'Basculer Permission de Commentaire',
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
    },
    ownership: {
      transfer: {
        title: 'Transférer la Propriété de la Guilde',
        selectNewOwner: 'Sélectionner le Nouveau Propriétaire',
        reason: 'Raison (optionnelle)',
        reasonPlaceholder: 'Pourquoi transférez-vous la propriété ?',
        confirm: 'Transférer la Propriété',
        confirming: 'Transfert...',
        success: 'Propriété de la guilde transférée avec succès',
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
      lastActivity: 'Dernière activité',
    },
    rankings: {
      title: 'Classements',
      score: 'Score',
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
      post: 'Commenter',
      reply: 'Répondre',
      edit: 'Modifier',
      delete: 'Supprimer',
      like: 'J\'aime',
      unlike: 'Je n\'aime plus',
      placeholder: 'Écrivez un commentaire...',
      replyPlaceholder: 'Écrivez une réponse...',
      noComments: 'Aucun commentaire pour le moment',
      loading: 'Chargement des commentaires...',
      error: 'Échec du chargement des commentaires',
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
      },
      status: {
        pending: 'En Attente',
        approved: 'Approuvé',
        rejected: 'Rejeté',
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
  },
};

/**
 * Get guild translations for a specific language
 */
export const getGuildTranslations = (language: string = 'en'): GuildTranslations => {
  return guildTranslations[language] || guildTranslations.en;
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
