export type Language = 'en' | 'es' | 'fr';

export interface CollaborationsTranslations {
  collaborations: {
    invite: {
      title: string;
      subtitle: string;
      emailOrUsername: string;
      message: string;
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
      reply: string;
      edit: string;
      delete: string;
      placeholder: string;
      empty: string;
      beFirst: string;
      loading: string;
      errors: {
        generic: string;
        createFailed: string;
        updateFailed: string;
        deleteFailed: string;
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
      expired: string;
      empty: string;
      loading: string;
      errors: {
        generic: string;
        acceptFailed: string;
        declineFailed: string;
      };
    };
  };
}

export const collaborationsTranslations: Record<Language, CollaborationsTranslations> = {
  en: {
    collaborations: {
      invite: {
        title: "Invite Collaborator",
        subtitle: "Invite someone to collaborate on this {resourceType}",
        emailOrUsername: "Email or Username",
        message: "Message",
        placeholder: "Enter email or username",
        helpText: "Enter an email address or username",
        messagePlaceholder: "Optional message...",
        send: "Send Invitation",
        sending: "Sending...",
        success: {
          title: "Invitation Sent",
          description: "Invitation sent successfully"
        },
        errors: {
          userNotFound: "User not found",
          generic: "Failed to send invitation"
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
        reply: "Reply",
        edit: "Edit",
        delete: "Delete",
        placeholder: "Write a comment... Use @ to mention someone",
        empty: "No comments yet",
        beFirst: "Be the first to comment",
        loading: "Loading comments...",
        errors: {
          generic: "Failed to load comments",
          createFailed: "Failed to create comment",
          updateFailed: "Failed to update comment",
          deleteFailed: "Failed to delete comment"
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
        expired: "Expired",
        empty: "No invitations",
        loading: "Loading invitations...",
        errors: {
          generic: "Failed to load invitations",
          acceptFailed: "Failed to accept invitation",
          declineFailed: "Failed to decline invitation"
        }
      }
    }
  },
  es: {
    collaborations: {
      invite: {
        title: "Invitar Colaborador",
        subtitle: "Invita a alguien a colaborar en este {resourceType}",
        emailOrUsername: "Correo o Nombre de Usuario",
        message: "Mensaje",
        placeholder: "Ingresa correo o nombre de usuario",
        helpText: "Ingresa una dirección de correo o nombre de usuario",
        messagePlaceholder: "Mensaje opcional...",
        send: "Enviar Invitación",
        sending: "Enviando...",
        success: {
          title: "Invitación Enviada",
          description: "Invitación enviada exitosamente"
        },
        errors: {
          userNotFound: "Usuario no encontrado",
          generic: "Error al enviar invitación"
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
        reply: "Responder",
        edit: "Editar",
        delete: "Eliminar",
        placeholder: "Escribe un comentario... Usa @ para mencionar a alguien",
        empty: "Aún no hay comentarios",
        beFirst: "Sé el primero en comentar",
        loading: "Cargando comentarios...",
        errors: {
          generic: "Error al cargar comentarios",
          createFailed: "Error al crear comentario",
          updateFailed: "Error al actualizar comentario",
          deleteFailed: "Error al eliminar comentario"
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
        expired: "Expirada",
        empty: "No hay invitaciones",
        loading: "Cargando invitaciones...",
        errors: {
          generic: "Error al cargar invitaciones",
          acceptFailed: "Error al aceptar invitación",
          declineFailed: "Error al declinar invitación"
        }
      }
    }
  },
  fr: {
    collaborations: {
      invite: {
        title: "Inviter un Collaborateur",
        subtitle: "Invitez quelqu'un à collaborer sur ce {resourceType}",
        emailOrUsername: "Email ou Nom d'Utilisateur",
        message: "Message",
        placeholder: "Entrez email ou nom d'utilisateur",
        helpText: "Entrez une adresse email ou un nom d'utilisateur",
        messagePlaceholder: "Message optionnel...",
        send: "Envoyer l'Invitation",
        sending: "Envoi...",
        success: {
          title: "Invitation Envoyée",
          description: "Invitation envoyée avec succès"
        },
        errors: {
          userNotFound: "Utilisateur non trouvé",
          generic: "Échec de l'envoi de l'invitation"
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
        reply: "Répondre",
        edit: "Modifier",
        delete: "Supprimer",
        placeholder: "Écrivez un commentaire... Utilisez @ pour mentionner quelqu'un",
        empty: "Aucun commentaire pour le moment",
        beFirst: "Soyez le premier à commenter",
        loading: "Chargement des commentaires...",
        errors: {
          generic: "Échec du chargement des commentaires",
          createFailed: "Échec de la création du commentaire",
          updateFailed: "Échec de la mise à jour du commentaire",
          deleteFailed: "Échec de la suppression du commentaire"
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
        expired: "Expirée",
        empty: "Aucune invitation",
        loading: "Chargement des invitations...",
        errors: {
          generic: "Échec du chargement des invitations",
          acceptFailed: "Échec de l'acceptation de l'invitation",
          declineFailed: "Échec du refus de l'invitation"
        }
      }
    }
  }
};

