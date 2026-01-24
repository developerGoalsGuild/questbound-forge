export type Language = 'en' | 'es' | 'fr';

export interface GoalActionsTranslations {
  actions: {
    edit: string;
    delete: string;
    viewTasks: string;
    viewDetails: string;
    changeStatus: string;
  };
  status: {
    active: string;
    paused: string;
    completed: string;
    archived: string;
  };
    confirmations: {
      deleteTitle: string;
      deleteMessage: string;
      deleteConfirm: string;
      deleteCancel: string;
      deleting: string;
    };
  messages: {
    deleteSuccess: string;
    deleteError: string;
    statusUpdateSuccess: string;
    statusUpdateError: string;
    loading: string;
  };
  tooltips: {
    edit: string;
    delete: string;
    viewTasks: string;
    viewDetails: string;
    changeStatus: string;
  };
}

export const goalActionsTranslations: Record<Language, GoalActionsTranslations> = {
  en: {
    actions: {
      edit: 'Edit Goal',
      delete: 'Delete Goal',
      viewTasks: 'View Tasks',
      viewDetails: 'View Details',
      changeStatus: 'Change Status',
    },
    status: {
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      archived: 'Archived',
    },
    confirmations: {
      deleteTitle: 'Delete Goal',
      deleteMessage: 'Are you sure you want to delete "{goalTitle}"? This action cannot be undone.',
      deleteConfirm: 'Delete',
      deleteCancel: 'Cancel',
      deleting: 'Deleting...',
    },
    messages: {
      deleteSuccess: 'Goal deleted successfully',
      deleteError: 'Failed to delete goal',
      statusUpdateSuccess: 'Goal status updated successfully',
      statusUpdateError: 'Failed to update goal status',
      loading: 'Processing...',
    },
    tooltips: {
      edit: 'Edit this goal',
      delete: 'Delete this goal',
      viewTasks: 'View tasks for this goal',
      viewDetails: 'View goal details',
      changeStatus: 'Change goal status',
    },
  },
  es: {
    actions: {
      edit: 'Editar Objetivo',
      delete: 'Eliminar Objetivo',
      viewTasks: 'Ver Tareas',
      viewDetails: 'Ver Detalles',
      changeStatus: 'Cambiar Estado',
    },
    status: {
      active: 'Activo',
      paused: 'Pausado',
      completed: 'Completado',
      archived: 'Archivado',
    },
    confirmations: {
      deleteTitle: 'Eliminar Objetivo',
      deleteMessage: '¿Estás seguro de que quieres eliminar "{goalTitle}"? Esta acción no se puede deshacer.',
      deleteConfirm: 'Eliminar',
      deleteCancel: 'Cancelar',
      deleting: 'Eliminando...',
    },
    messages: {
      deleteSuccess: 'Objetivo eliminado exitosamente',
      deleteError: 'Error al eliminar objetivo',
      statusUpdateSuccess: 'Estado del objetivo actualizado exitosamente',
      statusUpdateError: 'Error al actualizar estado del objetivo',
      loading: 'Procesando...',
    },
    tooltips: {
      edit: 'Editar este objetivo',
      delete: 'Eliminar este objetivo',
      viewTasks: 'Ver tareas de este objetivo',
      viewDetails: 'Ver detalles del objetivo',
      changeStatus: 'Cambiar estado del objetivo',
    },
  },
  fr: {
    actions: {
      edit: 'Modifier l\'Objectif',
      delete: 'Supprimer l\'Objectif',
      viewTasks: 'Voir les Tâches',
      viewDetails: 'Voir les Détails',
      changeStatus: 'Changer le Statut',
    },
    status: {
      active: 'Actif',
      paused: 'En Pause',
      completed: 'Terminé',
      archived: 'Archivé',
    },
    confirmations: {
      deleteTitle: 'Supprimer l\'Objectif',
      deleteMessage: 'Êtes-vous sûr de vouloir supprimer "{goalTitle}" ? Cette action ne peut pas être annulée.',
      deleteConfirm: 'Supprimer',
      deleteCancel: 'Annuler',
      deleting: 'Suppression...',
    },
    messages: {
      deleteSuccess: 'Objectif supprimé avec succès',
      deleteError: 'Échec de la suppression de l\'objectif',
      statusUpdateSuccess: 'Statut de l\'objectif mis à jour avec succès',
      statusUpdateError: 'Échec de la mise à jour du statut de l\'objectif',
      loading: 'Traitement en cours...',
    },
    tooltips: {
      edit: 'Modifier cet objectif',
      delete: 'Supprimer cet objectif',
      viewTasks: 'Voir les tâches de cet objectif',
      viewDetails: 'Voir les détails de l\'objectif',
      changeStatus: 'Changer le statut de l\'objectif',
    },
  },
};
