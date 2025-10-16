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
