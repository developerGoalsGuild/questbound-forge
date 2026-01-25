export type Language = 'en' | 'es' | 'fr';

export interface CollaborationsTranslations {
  invites: {
    page: {
      title: string;
      description: string;
    };
    title: string;
    subtitle: string;
    loading: string;
    refresh: string;
    emptyTitle: string;
    emptyDescription: string;
    errorTitle: string;
    errorDescription: string;
    retry: string;
    invitedYou: string;
    noMessage: string;
    accept: string;
    decline: string;
    acceptSuccess: {
      title: string;
      description: string;
    };
    declineSuccess: {
      title: string;
      description: string;
    };
    acceptError: {
      title: string;
      description: string;
    };
    declineError: {
      title: string;
      description: string;
    };
    resourceTypes: {
      goal: string;
      quest: string;
      task: string;
    };
  };
  invite: {
    title: string;
    subtitle: string;
    emailOrUsername: string;
    message: string;
    messageOptional: string;
    placeholder: string;
    helpText: string;
    messagePlaceholder: string;
    send: string;
    sending: string;
    success: {
      title: string;
      description: string;
    };
    errors: {
      userNotFound: string;
      generic: string;
      duplicateInvite: string;
      alreadyCollaborator: string;
    };
    validation: {
      required: string;
      invalidFormat: string;
      messageTooLong: string;
    };
  };
    collaborators: {
      title: string;
      empty: string;
      invite: string;
      inviteFirst: string;
      cleanup: string;
      cleanupTooltip: string;
      cleanupSuccess: {
        title: string;
        description: string;
      };
      cleanupError: {
        title: string;
        description: string;
      };
      owner: string;
      you: string;
      joined: string;
      remove: {
      confirm: {
        title: string;
        description: string;
      };
      success: {
        title: string;
        description: string;
      };
      errors: {
        noPermission: {
          title: string;
          description: string;
        };
        generic: {
          title: string;
          description: string;
        };
      };
    };
    errors: {
      noPermission: string;
      resourceNotFound: string;
      generic: string;
    };
  };
  comments: {
    title: string;
    add: string;
    addComment: string;
    reply: string;
    edit: string;
    delete: string;
    react: string;
    cancel: string;
    submit: string;
    update: string;
    edited: string;
    placeholder: string;
    empty: string;
    beFirst: string;
    loading: string;
    unknownTime: string;
    deleteConfirm: string;
    replyTo: string;
    replies: string;
    replySingular: string;
    success: {
      added: string;
      deleted: string;
      reacted: string;
    };
    errors: {
      generic: string;
      createFailed: string;
      updateFailed: string;
      deleteFailed: string;
      reactFailed: string;
    };
  };
  reactions: {
    add: string;
    remove: string;
    emoji: {
      thumbsUp: string;
      thumbsDown: string;
      heart: string;
      laugh: string;
      surprised: string;
      sad: string;
      party: string;
      rocket: string;
    };
  };
  invitations: {
    title: string;
    pending: string;
    accepted: string;
    declined: string;
    expired: string;
    accept: string;
    decline: string;
    expiresIn: string;
    empty: string;
    loading: string;
    errors: {
      generic: string;
      acceptFailed: string;
      declineFailed: string;
    };
  };
  myCollaborations: {
    title: string;
    subtitle: string;
    loading: string;
    errorTitle: string;
    errorDescription: string;
    tryAgain: string;
    filterByType: string;
    all: string;
    goals: string;
    quests: string;
    tasks: string;
    noCollaborationsTitle: string;
    noCollaborationsAll: string;
    noCollaborationsType: string;
    inviteHint: string;
    joined: string;
    owner: string;
    collaborator: string;
    view: string;
    showing: string;
    of: string;
    collaborationsCount: string;
    unknownDate: string;
    resourceTypes: {
      goal: string;
      quest: string;
      task: string;
      resource: string;
    };
  };
}

export const collaborationsTranslations: Record<Language, CollaborationsTranslations> = {
  en: {
    invites: {
      page: {
        title: "Collaboration Invites",
        description: "View and manage your collaboration invitations from other users."
      },
      title: "Collaboration Invites",
      subtitle: "Manage your collaboration invitations",
      loading: "Loading invites...",
      refresh: "Refresh",
      emptyTitle: "No Invites",
      emptyDescription: "You don't have any collaboration invites at the moment.",
      errorTitle: "Failed to Load Invites",
      errorDescription: "There was an error loading your collaboration invites.",
      retry: "Try Again",
      invitedYou: "invited you to collaborate on",
      noMessage: "No message provided",
      accept: "Accept",
      decline: "Decline",
      acceptSuccess: {
        title: "Invite Accepted",
        description: "You have successfully accepted the collaboration invite."
      },
      declineSuccess: {
        title: "Invite Declined",
        description: "You have declined the collaboration invite."
      },
      acceptError: {
        title: "Failed to Accept Invite",
        description: "There was an error accepting the invite."
      },
      declineError: {
        title: "Failed to Decline Invite",
        description: "There was an error declining the invite."
      },
      resourceTypes: {
        goal: "Goal",
        quest: "Quest",
        task: "Task"
      }
    },
    invite: {
      title: "Invite Collaborator",
      subtitle: "Invite someone to collaborate on this {resourceType}",
      emailOrUsername: "Email or Nickname",
      message: "Message",
      messageOptional: "Message (optional)",
      placeholder: "Enter email or nickname",
      helpText: "Enter an email address or nickname. If using email, make sure the user has an account.",
      messagePlaceholder: "Optional message...",
      send: "Send Invitation",
      sending: "Sending...",
      success: {
        title: "Invitation Sent",
        description: "Invitation sent successfully"
      },
      errors: {
        userNotFound: "User not found",
        generic: "Failed to send invitation",
        duplicateInvite: "You have already sent a collaboration invite to {identifier}. Please wait for them to respond to the existing invite, or check if they have already accepted it.",
        alreadyCollaborator: "{identifier} is already a collaborator on this resource. No invitation is needed as they already have access."
      },
      validation: {
        required: "This field is required",
        invalidFormat: "Invalid email or username format",
        messageTooLong: "Message is too long"
      }
    },
    collaborators: {
      title: "Collaborators",
      empty: "No collaborators yet",
      invite: "Invite",
      inviteFirst: "Invite your first collaborator",
      cleanup: "Cleanup",
      cleanupTooltip: "Clean up orphaned invite records for removed collaborators",
      cleanupSuccess: {
        title: "Cleanup Complete",
        description: "Orphaned invites have been cleaned up successfully"
      },
      cleanupError: {
        title: "Cleanup Failed",
        description: "Failed to cleanup orphaned invites. Please try again."
      },
      owner: "Owner",
      you: "You",
      joined: "Joined {date}",
      remove: {
        confirm: {
          title: "Remove Collaborator",
          description: "Are you sure you want to remove {username} from this collaboration?"
        },
        success: {
          title: "Collaborator Removed",
          description: "{username} has been removed from the collaboration"
        },
        errors: {
          noPermission: {
            title: "Permission Denied",
            description: "You don't have permission to remove collaborators"
          },
          generic: {
            title: "Failed to Remove",
            description: "Failed to remove collaborator"
          }
        }
      },
      errors: {
        noPermission: "You don't have permission to view collaborators",
        resourceNotFound: "Resource not found",
        generic: "Failed to load collaborators"
      }
    },
    comments: {
      title: "Comments",
      add: "Add Comment",
      addComment: "Add a comment...",
      reply: "Reply",
      edit: "Edit",
      delete: "Delete",
      react: "React",
      cancel: "Cancel",
      submit: "Comment",
      update: "Update",
      edited: "Edited",
      placeholder: "Write a comment...",
      empty: "No comments yet",
      beFirst: "Be the first to share your thoughts!",
      loading: "Loading comments...",
      unknownTime: "Unknown time",
      deleteConfirm: "Are you sure you want to delete this comment?",
      replyTo: "Reply to {username}...",
      replies: "replies",
      replySingular: "reply",
      success: {
        added: "Comment added",
        deleted: "Comment deleted",
        reacted: "Reaction added"
      },
      errors: {
        generic: "Failed to load comments",
        createFailed: "Failed to add comment",
        updateFailed: "Failed to update comment",
        deleteFailed: "Failed to delete comment",
        reactFailed: "Failed to react to comment"
      }
    },
    reactions: {
      add: "Add Reaction",
      remove: "Remove Reaction",
      emoji: {
        thumbsUp: "👍",
        thumbsDown: "👎",
        heart: "❤️",
        laugh: "😂",
        surprised: "😮",
        sad: "😢",
        party: "🎉",
        rocket: "🚀"
      }
    },
    invitations: {
      title: "Invitations",
      pending: "Pending",
      accepted: "Accepted",
      declined: "Declined",
      expired: "Expired",
      accept: "Accept",
      decline: "Decline",
      expiresIn: "Expires in {time}",
      empty: "No invitations",
      loading: "Loading invitations...",
      errors: {
        generic: "Failed to load invitations",
        acceptFailed: "Failed to accept invitation",
        declineFailed: "Failed to decline invitation"
      }
    },
    myCollaborations: {
      title: "My Collaborations",
      subtitle: "Quests and goals where you are collaborating with others",
      loading: "Loading your collaborations...",
      errorTitle: "Failed to Load Collaborations",
      errorDescription: "There was an error loading your collaborations. Please try again.",
      tryAgain: "Try Again",
      filterByType: "Filter by type:",
      all: "All",
      goals: "Goals",
      quests: "Quests",
      tasks: "Tasks",
      noCollaborationsTitle: "No Collaborations Found",
      noCollaborationsAll: "You're not collaborating on any quests or goals yet.",
      noCollaborationsType: "You're not collaborating on any {type}s yet.",
      inviteHint: "Ask someone to invite you to collaborate on their quest or goal!",
      joined: "Joined",
      owner: "Owner",
      collaborator: "Collaborator",
      view: "View",
      showing: "Showing",
      of: "of",
      collaborationsCount: "collaborations",
      unknownDate: "Unknown date",
      resourceTypes: {
        goal: "Goal",
        quest: "Quest",
        task: "Task",
        resource: "Resource"
      }
    }
  },
  es: {
    invites: {
      page: {
        title: "Invitaciones de Colaboración",
        description: "Ver y gestionar tus invitaciones de colaboración de otros usuarios."
      },
      title: "Invitaciones de Colaboración",
      subtitle: "Gestiona tus invitaciones de colaboración",
      loading: "Cargando invitaciones...",
      refresh: "Actualizar",
      emptyTitle: "Sin Invitaciones",
      emptyDescription: "No tienes invitaciones de colaboración en este momento.",
      errorTitle: "Error al Cargar Invitaciones",
      errorDescription: "Hubo un error al cargar tus invitaciones de colaboración.",
      retry: "Intentar de Nuevo",
      invitedYou: "te invitó a colaborar en",
      noMessage: "No se proporcionó mensaje",
      accept: "Aceptar",
      decline: "Rechazar",
      acceptSuccess: {
        title: "Invitación Aceptada",
        description: "Has aceptado exitosamente la invitación de colaboración."
      },
      declineSuccess: {
        title: "Invitación Rechazada",
        description: "Has rechazado la invitación de colaboración."
      },
      acceptError: {
        title: "Error al Aceptar Invitación",
        description: "Hubo un error al aceptar la invitación."
      },
      declineError: {
        title: "Error al Rechazar Invitación",
        description: "Hubo un error al rechazar la invitación."
      },
      resourceTypes: {
        goal: "Objetivo",
        quest: "Misión",
        task: "Tarea"
      }
    },
    invite: {
      title: "Invitar Colaborador",
      subtitle: "Invita a alguien a colaborar en este {resourceType}",
      emailOrUsername: "Correo o Apodo",
      message: "Mensaje",
      messageOptional: "Mensaje (opcional)",
      placeholder: "Ingresa correo o apodo",
      helpText: "Ingresa una dirección de correo o apodo. Si usas correo, asegúrate de que el usuario tenga una cuenta.",
      messagePlaceholder: "Mensaje opcional...",
      send: "Enviar Invitación",
      sending: "Enviando...",
      success: {
        title: "Invitación Enviada",
        description: "Invitación enviada exitosamente"
      },
      errors: {
        userNotFound: "Usuario no encontrado",
        generic: "Error al enviar invitación",
        duplicateInvite: "Ya has enviado una invitación de colaboración a {identifier}. Por favor espera a que respondan a la invitación existente, o verifica si ya la han aceptado.",
        alreadyCollaborator: "{identifier} ya es colaborador en este recurso. No se necesita invitación ya que ya tiene acceso."
      },
      validation: {
        required: "Este campo es obligatorio",
        invalidFormat: "Formato de correo o nombre de usuario inválido",
        messageTooLong: "Mensaje demasiado largo"
      }
    },
    collaborators: {
      title: "Colaboradores",
      empty: "Aún no hay colaboradores",
      invite: "Invitar",
      inviteFirst: "Invita a tu primer colaborador",
      cleanup: "Limpiar",
      cleanupTooltip: "Limpiar registros de invitaciones huérfanas para colaboradores removidos",
      cleanupSuccess: {
        title: "Limpieza Completada",
        description: "Las invitaciones huérfanas han sido limpiadas exitosamente"
      },
      cleanupError: {
        title: "Error en la Limpieza",
        description: "Error al limpiar invitaciones huérfanas. Por favor intenta de nuevo."
      },
      owner: "Propietario",
      you: "Tú",
      joined: "Se unió {date}",
      remove: {
        confirm: {
          title: "Remover Colaborador",
          description: "¿Estás seguro de que quieres remover a {username} de esta colaboración?"
        },
        success: {
          title: "Colaborador Removido",
          description: "{username} ha sido removido de la colaboración"
        },
        errors: {
          noPermission: {
            title: "Permiso Denegado",
            description: "No tienes permiso para remover colaboradores"
          },
          generic: {
            title: "Error al Remover",
            description: "Error al remover colaborador"
          }
        }
      },
      errors: {
        noPermission: "No tienes permiso para ver colaboradores",
        resourceNotFound: "Recurso no encontrado",
        generic: "Error al cargar colaboradores"
      }
    },
    comments: {
      title: "Comentarios",
      add: "Agregar Comentario",
      addComment: "Agregar un comentario...",
      reply: "Responder",
      edit: "Editar",
      delete: "Eliminar",
      react: "Reaccionar",
      cancel: "Cancelar",
      submit: "Comentar",
      update: "Actualizar",
      edited: "Editado",
      placeholder: "Escribe un comentario...",
      empty: "Aún no hay comentarios",
      beFirst: "¡Sé el primero en compartir tus pensamientos!",
      loading: "Cargando comentarios...",
      unknownTime: "Tiempo desconocido",
      deleteConfirm: "¿Estás seguro de que quieres eliminar este comentario?",
      replyTo: "Responder a {username}...",
      replies: "respuestas",
      replySingular: "respuesta",
      success: {
        added: "Comentario agregado",
        deleted: "Comentario eliminado",
        reacted: "Reacción agregada"
      },
      errors: {
        generic: "Error al cargar comentarios",
        createFailed: "Error al agregar comentario",
        updateFailed: "Error al actualizar comentario",
        deleteFailed: "Error al eliminar comentario",
        reactFailed: "Error al reaccionar al comentario"
      }
    },
    reactions: {
      add: "Agregar Reacción",
      remove: "Remover Reacción",
      emoji: {
        thumbsUp: "👍",
        thumbsDown: "👎",
        heart: "❤️",
        laugh: "😂",
        surprised: "😮",
        sad: "😢",
        party: "🎉",
        rocket: "🚀"
      }
    },
    invitations: {
      title: "Invitaciones",
      pending: "Pendiente",
      accepted: "Aceptada",
      declined: "Declinada",
      expired: "Expirada",
      accept: "Aceptar",
      decline: "Declinar",
      expiresIn: "Expira en {time}",
      empty: "No hay invitaciones",
      loading: "Cargando invitaciones...",
      errors: {
        generic: "Error al cargar invitaciones",
        acceptFailed: "Error al aceptar invitación",
        declineFailed: "Error al declinar invitación"
      }
    },
    myCollaborations: {
      title: "Mis Colaboraciones",
      subtitle: "Misiones y objetivos donde estás colaborando con otros",
      loading: "Cargando tus colaboraciones...",
      errorTitle: "Error al Cargar Colaboraciones",
      errorDescription: "Hubo un error al cargar tus colaboraciones. Por favor intenta de nuevo.",
      tryAgain: "Intentar de Nuevo",
      filterByType: "Filtrar por tipo:",
      all: "Todos",
      goals: "Objetivos",
      quests: "Misiones",
      tasks: "Tareas",
      noCollaborationsTitle: "No Se Encontraron Colaboraciones",
      noCollaborationsAll: "Aún no estás colaborando en ninguna misión u objetivo.",
      noCollaborationsType: "Aún no estás colaborando en ningún/a {type}.",
      inviteHint: "¡Pide a alguien que te invite a colaborar en su misión u objetivo!",
      joined: "Unido",
      owner: "Propietario",
      collaborator: "Colaborador",
      view: "Ver",
      showing: "Mostrando",
      of: "de",
      collaborationsCount: "colaboraciones",
      unknownDate: "Fecha desconocida",
      resourceTypes: {
        goal: "Objetivo",
        quest: "Misión",
        task: "Tarea",
        resource: "Recurso"
      }
    }
  },
  fr: {
    invites: {
      page: {
        title: "Invitations de Collaboration",
        description: "Voir et gérer vos invitations de collaboration d'autres utilisateurs."
      },
      title: "Invitations de Collaboration",
      subtitle: "Gérez vos invitations de collaboration",
      loading: "Chargement des invitations...",
      refresh: "Actualiser",
      emptyTitle: "Aucune Invitation",
      emptyDescription: "Vous n'avez aucune invitation de collaboration pour le moment.",
      errorTitle: "Échec du Chargement des Invitations",
      errorDescription: "Une erreur s'est produite lors du chargement de vos invitations de collaboration.",
      retry: "Réessayer",
      invitedYou: "vous a invité à collaborer sur",
      noMessage: "Aucun message fourni",
      accept: "Accepter",
      decline: "Refuser",
      acceptSuccess: {
        title: "Invitation Acceptée",
        description: "Vous avez accepté avec succès l'invitation de collaboration."
      },
      declineSuccess: {
        title: "Invitation Refusée",
        description: "Vous avez refusé l'invitation de collaboration."
      },
      acceptError: {
        title: "Échec de l'Acceptation de l'Invitation",
        description: "Une erreur s'est produite lors de l'acceptation de l'invitation."
      },
      declineError: {
        title: "Échec du Refus de l'Invitation",
        description: "Une erreur s'est produite lors du refus de l'invitation."
      },
      resourceTypes: {
        goal: "Objectif",
        quest: "Quête",
        task: "Tâche"
      }
    },
    invite: {
      title: "Inviter un Collaborateur",
      subtitle: "Invitez quelqu'un à collaborer sur ce {resourceType}",
      emailOrUsername: "Email ou Surnom",
      message: "Message",
      messageOptional: "Message (optionnel)",
      placeholder: "Entrez email ou surnom",
      helpText: "Entrez une adresse email ou un surnom. Si vous utilisez un email, assurez-vous que l'utilisateur a un compte.",
      messagePlaceholder: "Message optionnel...",
      send: "Envoyer l'Invitation",
      sending: "Envoi...",
      success: {
        title: "Invitation Envoyée",
        description: "Invitation envoyée avec succès"
      },
      errors: {
        userNotFound: "Utilisateur non trouvé",
        generic: "Échec de l'envoi de l'invitation",
        duplicateInvite: "Vous avez déjà envoyé une invitation de collaboration à {identifier}. Veuillez attendre qu'ils répondent à l'invitation existante, ou vérifiez s'ils l'ont déjà acceptée.",
        alreadyCollaborator: "{identifier} est déjà collaborateur sur cette ressource. Aucune invitation n'est nécessaire car ils ont déjà accès."
      },
      validation: {
        required: "Ce champ est obligatoire",
        invalidFormat: "Format d'email ou nom d'utilisateur invalide",
        messageTooLong: "Message trop long"
      }
    },
    collaborators: {
      title: "Collaborateurs",
      empty: "Aucun collaborateur pour le moment",
      invite: "Inviter",
      inviteFirst: "Invitez votre premier collaborateur",
      cleanup: "Nettoyer",
      cleanupTooltip: "Nettoyer les enregistrements d'invitations orphelines pour les collaborateurs retirés",
      cleanupSuccess: {
        title: "Nettoyage Terminé",
        description: "Les invitations orphelines ont été nettoyées avec succès"
      },
      cleanupError: {
        title: "Échec du Nettoyage",
        description: "Échec du nettoyage des invitations orphelines. Veuillez réessayer."
      },
      owner: "Propriétaire",
      you: "Vous",
      joined: "Rejoint {date}",
      remove: {
        confirm: {
          title: "Retirer le Collaborateur",
          description: "Êtes-vous sûr de vouloir retirer {username} de cette collaboration ?"
        },
        success: {
          title: "Collaborateur Retiré",
          description: "{username} a été retiré de la collaboration"
        },
        errors: {
          noPermission: {
            title: "Permission Refusée",
            description: "Vous n'avez pas la permission de retirer des collaborateurs"
          },
          generic: {
            title: "Échec de la Suppression",
            description: "Échec de la suppression du collaborateur"
          }
        }
      },
      errors: {
        noPermission: "Vous n'avez pas la permission de voir les collaborateurs",
        resourceNotFound: "Ressource non trouvée",
        generic: "Échec du chargement des collaborateurs"
      }
    },
    comments: {
      title: "Commentaires",
      add: "Ajouter un Commentaire",
      addComment: "Ajouter un commentaire...",
      reply: "Répondre",
      edit: "Modifier",
      delete: "Supprimer",
      react: "Réagir",
      cancel: "Annuler",
      submit: "Commenter",
      update: "Mettre à jour",
      edited: "Modifié",
      placeholder: "Écrivez un commentaire...",
      empty: "Aucun commentaire pour le moment",
      beFirst: "Soyez le premier à partager vos pensées !",
      loading: "Chargement des commentaires...",
      unknownTime: "Temps inconnu",
      deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce commentaire ?",
      replyTo: "Répondre à {username}...",
      replies: "réponses",
      replySingular: "réponse",
      success: {
        added: "Commentaire ajouté",
        deleted: "Commentaire supprimé",
        reacted: "Réaction ajoutée"
      },
      errors: {
        generic: "Échec du chargement des commentaires",
        createFailed: "Échec de l'ajout du commentaire",
        updateFailed: "Échec de la mise à jour du commentaire",
        deleteFailed: "Échec de la suppression du commentaire",
        reactFailed: "Échec de la réaction au commentaire"
      }
    },
    reactions: {
      add: "Ajouter une Réaction",
      remove: "Retirer la Réaction",
      emoji: {
        thumbsUp: "👍",
        thumbsDown: "👎",
        heart: "❤️",
        laugh: "😂",
        surprised: "😮",
        sad: "😢",
        party: "🎉",
        rocket: "🚀"
      }
    },
    invitations: {
      title: "Invitations",
      pending: "En attente",
      accepted: "Acceptée",
      declined: "Refusée",
      expired: "Expirée",
      accept: "Accepter",
      decline: "Refuser",
      expiresIn: "Expire dans {time}",
      empty: "Aucune invitation",
      loading: "Chargement des invitations...",
      errors: {
        generic: "Échec du chargement des invitations",
        acceptFailed: "Échec de l'acceptation de l'invitation",
        declineFailed: "Échec du refus de l'invitation"
      }
    },
    myCollaborations: {
      title: "Mes Collaborations",
      subtitle: "Quêtes et objectifs où vous collaborez avec d'autres",
      loading: "Chargement de vos collaborations...",
      errorTitle: "Échec du Chargement des Collaborations",
      errorDescription: "Une erreur s'est produite lors du chargement de vos collaborations. Veuillez réessayer.",
      tryAgain: "Réessayer",
      filterByType: "Filtrer par type :",
      all: "Tous",
      goals: "Objectifs",
      quests: "Quêtes",
      tasks: "Tâches",
      noCollaborationsTitle: "Aucune Collaboration Trouvée",
      noCollaborationsAll: "Vous ne collaborez sur aucune quête ou objectif pour l'instant.",
      noCollaborationsType: "Vous ne collaborez sur aucun/e {type} pour l'instant.",
      inviteHint: "Demandez à quelqu'un de vous inviter à collaborer sur sa quête ou son objectif !",
      joined: "Rejoint",
      owner: "Propriétaire",
      collaborator: "Collaborateur",
      view: "Voir",
      showing: "Affichage de",
      of: "sur",
      collaborationsCount: "collaborations",
      unknownDate: "Date inconnue",
      resourceTypes: {
        goal: "Objectif",
        quest: "Quête",
        task: "Tâche",
        resource: "Ressource"
      }
    }
  }
};