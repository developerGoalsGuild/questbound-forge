export type Language = 'en' | 'es' | 'fr';

export interface ChatTranslations {
  page: {
    title: string;
    subtitle: string;
    authRequired: string;
    authRequiredDesc: string;
    chatRooms: string;
    loadingRooms: string;
    members: string;
    live: string;
    production: string;
    demo: string;
  };
  header: {
    guildHall: string;
    roomPrefix: string;
    guild: string;
    general: string;
    connected: string;
    disconnected: string;
    retryConnection: string;
    viewMembers: string;
    roomSettings: string;
  };
  connection: {
    connecting: string;
    connectedToChat: string;
    disconnectedReconnecting: string;
    connectionError: string;
    unknownStatus: string;
    rateLimitExceeded: string;
    retry: string;
  };
  input: {
    placeholder: string;
    connectingPlaceholder: string;
    errorPlaceholder: string;
    rateLimitedPlaceholder: string;
    messagePlaceholder: string;
    rateLimitWarning: string;
    rateLimitExceeded: string;
    replyingTo: string;
    attachFile: string;
    sending: string;
    sendMessage: string;
    stopRecording: string;
    voiceMessage: string;
    helperText: string;
    messageTooLong: string;
    cancelReply: string;
  };
  messages: {
    loading: string;
    chatError: string;
    chatErrorDesc: string;
    retry: string;
    loadMore: string;
    replyingTo: string;
    copied: string;
    copyMessage: string;
    reply: string;
    editMessage: string;
    deleteMessage: string;
    unknownUser: string;
    originalUnavailable: string;
    noContent: string;
  };
  members: {
    title: string;
    member: string;
    memberPlural: string;
    noMembers: string;
    owner: string;
    moderator: string;
    online: string;
    offline: string;
    you: string;
  };
  settings: {
    title: string;
    configureFor: string;
    guildRoom: string;
    roomName: string;
    roomNamePlaceholder: string;
    guildRoomNote: string;
    description: string;
    descriptionPlaceholder: string;
    publicRoom: string;
    publicRoomDesc: string;
    privateRoomDesc: string;
    allowReactions: string;
    allowReactionsDesc: string;
    maxMessageLength: string;
    maxMessageLengthDesc: string;
    activeMembers: string;
    cancel: string;
    saving: string;
    saveChanges: string;
    settingsSaved: string;
    settingsSavedDesc: string;
    errorSaving: string;
    errorSavingDesc: string;
  };
  typing: {
    isTyping: string;
    areTyping: string;
    andOthersTyping: string;
  };
  fallback: {
    generalChat: string;
    generalChatDesc: string;
  };
  emoji: {
    addEmoji: string;
    searchEmojis: string;
    emojiPicker: string;
    selectEmoji: string;
    selectCategory: string;
    selectRecentEmoji: string;
    recent: string;
    categories: {
      recently: string;
      smileys: string;
      people: string;
      animals: string;
      food: string;
      activities: string;
      travel: string;
      objects: string;
      symbols: string;
      flags: string;
    };
  };
  reactions: {
    addReaction: string;
    maxReached: string;
    maxReachedLong: string;
    messageReactions: string;
    reaction: string;
    reactions: string;
    youReacted: string;
    you: string;
    moreReactions: string;
  };
}

export const chatTranslations: Record<Language, ChatTranslations> = {
  en: {
    page: {
      title: "Chat",
      subtitle: "Connect with your guild members and the community",
      authRequired: "Authentication Required",
      authRequiredDesc: "Please log in to access the chat functionality.",
      chatRooms: "Chat Rooms",
      loadingRooms: "Loading rooms...",
      members: "members",
      live: "Live",
      production: "Production",
      demo: "Demo"
    },
    header: {
      guildHall: "Guild Hall",
      roomPrefix: "Room:",
      guild: "Guild",
      general: "General",
      connected: "Connected",
      disconnected: "Disconnected",
      retryConnection: "Retry connection",
      viewMembers: "View members",
      roomSettings: "Room settings"
    },
    connection: {
      connecting: "Connecting to chat...",
      connectedToChat: "Connected to chat",
      disconnectedReconnecting: "Disconnected from chat. Attempting to reconnect...",
      connectionError: "Connection error. Please check your network.",
      unknownStatus: "Unknown connection status",
      rateLimitExceeded: "Rate limit exceeded. You can send messages again in {seconds} seconds.",
      retry: "Retry"
    },
    input: {
      placeholder: "Type a message...",
      connectingPlaceholder: "Connecting to chat...",
      errorPlaceholder: "Connection error",
      rateLimitedPlaceholder: "Rate limited. Please wait...",
      messagePlaceholder: "Message {room}...",
      rateLimitWarning: "You're sending messages too quickly. Please slow down.",
      rateLimitExceeded: "Rate limit exceeded. You can send messages again in {seconds} seconds.",
      replyingTo: "Replying to {user}",
      attachFile: "Attach file",
      sending: "Sending...",
      sendMessage: "Send message",
      stopRecording: "Stop recording",
      voiceMessage: "Voice message",
      helperText: "Press Enter to send, Shift+Enter for new line",
      messageTooLong: "Message too long ({current}/{max})",
      cancelReply: "Cancel reply"
    },
    messages: {
      loading: "Loading messages...",
      chatError: "Chat Error",
      chatErrorDesc: "Something went wrong with the chat. Please try again.",
      retry: "Retry",
      loadMore: "Load More Messages",
      replyingTo: "Replying to",
      copied: "Copied!",
      copyMessage: "Copy message",
      reply: "Reply",
      editMessage: "Edit message",
      deleteMessage: "Delete message",
      unknownUser: "Unknown user",
      originalUnavailable: "Original message unavailable",
      noContent: "No message content"
    },
    members: {
      title: "Room Members",
      member: "member",
      memberPlural: "members",
      noMembers: "No members found",
      owner: "Owner",
      moderator: "Moderator",
      online: "Online",
      offline: "Offline",
      you: "(You)"
    },
    settings: {
      title: "Room Settings",
      configureFor: "Configure settings for",
      guildRoom: "Guild Room",
      roomName: "Room Name",
      roomNamePlaceholder: "Enter room name",
      guildRoomNote: "Guild room names are managed by guild settings",
      description: "Description",
      descriptionPlaceholder: "Enter room description",
      publicRoom: "Public Room",
      publicRoomDesc: "Anyone can join this room",
      privateRoomDesc: "Only invited members can join this room",
      allowReactions: "Allow Reactions",
      allowReactionsDesc: "Allow users to react to messages with emojis",
      maxMessageLength: "Max Message Length",
      maxMessageLengthDesc: "Maximum characters allowed per message (100 - 10,000)",
      activeMembers: "Active Members",
      cancel: "Cancel",
      saving: "Saving...",
      saveChanges: "Save Changes",
      settingsSaved: "Settings saved",
      settingsSavedDesc: "Room settings have been updated successfully.",
      errorSaving: "Error saving settings",
      errorSavingDesc: "Failed to update room settings"
    },
    typing: {
      isTyping: "{user} is typing...",
      areTyping: "{user1} and {user2} are typing...",
      andOthersTyping: "{user} and {count} others are typing..."
    },
    fallback: {
      generalChat: "General Chat",
      generalChatDesc: "Main discussion room for all users"
    },
    emoji: {
      addEmoji: "Add emoji",
      searchEmojis: "Search emojis...",
      emojiPicker: "Emoji picker",
      selectEmoji: "Select emoji",
      selectCategory: "Select category",
      selectRecentEmoji: "Select recent emoji",
      recent: "Recent",
      categories: {
        recently: "Recently Used",
        smileys: "Smileys",
        people: "People",
        animals: "Animals",
        food: "Food",
        activities: "Activities",
        travel: "Travel",
        objects: "Objects",
        symbols: "Symbols",
        flags: "Flags"
      }
    },
    reactions: {
      addReaction: "Add reaction",
      maxReached: "Maximum reactions reached",
      maxReachedLong: "Maximum of 5 reactions reached",
      messageReactions: "Message reactions",
      reaction: "reaction",
      reactions: "reactions",
      youReacted: "you reacted",
      you: "You",
      moreReactions: "more reaction"
    }
  },
  es: {
    page: {
      title: "Chat",
      subtitle: "Conéctate con los miembros de tu gremio y la comunidad",
      authRequired: "Autenticación Requerida",
      authRequiredDesc: "Por favor inicia sesión para acceder a la funcionalidad de chat.",
      chatRooms: "Salas de Chat",
      loadingRooms: "Cargando salas...",
      members: "miembros",
      live: "En vivo",
      production: "Producción",
      demo: "Demo"
    },
    header: {
      guildHall: "Sala del Gremio",
      roomPrefix: "Sala:",
      guild: "Gremio",
      general: "General",
      connected: "Conectado",
      disconnected: "Desconectado",
      retryConnection: "Reintentar conexión",
      viewMembers: "Ver miembros",
      roomSettings: "Configuración de sala"
    },
    connection: {
      connecting: "Conectando al chat...",
      connectedToChat: "Conectado al chat",
      disconnectedReconnecting: "Desconectado del chat. Intentando reconectar...",
      connectionError: "Error de conexión. Por favor verifica tu red.",
      unknownStatus: "Estado de conexión desconocido",
      rateLimitExceeded: "Límite de velocidad excedido. Puedes enviar mensajes de nuevo en {seconds} segundos.",
      retry: "Reintentar"
    },
    input: {
      placeholder: "Escribe un mensaje...",
      connectingPlaceholder: "Conectando al chat...",
      errorPlaceholder: "Error de conexión",
      rateLimitedPlaceholder: "Límite alcanzado. Espera por favor...",
      messagePlaceholder: "Mensaje para {room}...",
      rateLimitWarning: "Estás enviando mensajes demasiado rápido. Por favor, reduce la velocidad.",
      rateLimitExceeded: "Límite de velocidad excedido. Puedes enviar mensajes de nuevo en {seconds} segundos.",
      replyingTo: "Respondiendo a {user}",
      attachFile: "Adjuntar archivo",
      sending: "Enviando...",
      sendMessage: "Enviar mensaje",
      stopRecording: "Detener grabación",
      voiceMessage: "Mensaje de voz",
      helperText: "Presiona Enter para enviar, Shift+Enter para nueva línea",
      messageTooLong: "Mensaje demasiado largo ({current}/{max})",
      cancelReply: "Cancelar respuesta"
    },
    messages: {
      loading: "Cargando mensajes...",
      chatError: "Error de Chat",
      chatErrorDesc: "Algo salió mal con el chat. Por favor intenta de nuevo.",
      retry: "Reintentar",
      loadMore: "Cargar Más Mensajes",
      replyingTo: "Respondiendo a",
      copied: "¡Copiado!",
      copyMessage: "Copiar mensaje",
      reply: "Responder",
      editMessage: "Editar mensaje",
      deleteMessage: "Eliminar mensaje",
      unknownUser: "Usuario desconocido",
      originalUnavailable: "Mensaje original no disponible",
      noContent: "Sin contenido del mensaje"
    },
    members: {
      title: "Miembros de la Sala",
      member: "miembro",
      memberPlural: "miembros",
      noMembers: "No se encontraron miembros",
      owner: "Propietario",
      moderator: "Moderador",
      online: "En línea",
      offline: "Desconectado",
      you: "(Tú)"
    },
    settings: {
      title: "Configuración de Sala",
      configureFor: "Configurar ajustes para",
      guildRoom: "Sala de Gremio",
      roomName: "Nombre de Sala",
      roomNamePlaceholder: "Ingresa el nombre de la sala",
      guildRoomNote: "Los nombres de las salas de gremio se gestionan en la configuración del gremio",
      description: "Descripción",
      descriptionPlaceholder: "Ingresa la descripción de la sala",
      publicRoom: "Sala Pública",
      publicRoomDesc: "Cualquiera puede unirse a esta sala",
      privateRoomDesc: "Solo los miembros invitados pueden unirse a esta sala",
      allowReactions: "Permitir Reacciones",
      allowReactionsDesc: "Permitir a los usuarios reaccionar a los mensajes con emojis",
      maxMessageLength: "Longitud Máxima del Mensaje",
      maxMessageLengthDesc: "Caracteres máximos permitidos por mensaje (100 - 10,000)",
      activeMembers: "Miembros Activos",
      cancel: "Cancelar",
      saving: "Guardando...",
      saveChanges: "Guardar Cambios",
      settingsSaved: "Configuración guardada",
      settingsSavedDesc: "La configuración de la sala se ha actualizado correctamente.",
      errorSaving: "Error al guardar configuración",
      errorSavingDesc: "Error al actualizar la configuración de la sala"
    },
    typing: {
      isTyping: "{user} está escribiendo...",
      areTyping: "{user1} y {user2} están escribiendo...",
      andOthersTyping: "{user} y {count} más están escribiendo..."
    },
    fallback: {
      generalChat: "Chat General",
      generalChatDesc: "Sala de discusión principal para todos los usuarios"
    },
    emoji: {
      addEmoji: "Agregar emoji",
      searchEmojis: "Buscar emojis...",
      emojiPicker: "Selector de emojis",
      selectEmoji: "Seleccionar emoji",
      selectCategory: "Seleccionar categoría",
      selectRecentEmoji: "Seleccionar emoji reciente",
      recent: "Recientes",
      categories: {
        recently: "Usados Recientemente",
        smileys: "Caritas",
        people: "Personas",
        animals: "Animales",
        food: "Comida",
        activities: "Actividades",
        travel: "Viajes",
        objects: "Objetos",
        symbols: "Símbolos",
        flags: "Banderas"
      }
    },
    reactions: {
      addReaction: "Agregar reacción",
      maxReached: "Máximo de reacciones alcanzado",
      maxReachedLong: "Máximo de 5 reacciones alcanzado",
      messageReactions: "Reacciones del mensaje",
      reaction: "reacción",
      reactions: "reacciones",
      youReacted: "reaccionaste",
      you: "Tú",
      moreReactions: "más reacciones"
    }
  },
  fr: {
    page: {
      title: "Chat",
      subtitle: "Connectez-vous avec les membres de votre guilde et la communauté",
      authRequired: "Authentification Requise",
      authRequiredDesc: "Veuillez vous connecter pour accéder à la fonctionnalité de chat.",
      chatRooms: "Salons de Chat",
      loadingRooms: "Chargement des salons...",
      members: "membres",
      live: "En direct",
      production: "Production",
      demo: "Démo"
    },
    header: {
      guildHall: "Salle de la Guilde",
      roomPrefix: "Salon :",
      guild: "Guilde",
      general: "Général",
      connected: "Connecté",
      disconnected: "Déconnecté",
      retryConnection: "Réessayer la connexion",
      viewMembers: "Voir les membres",
      roomSettings: "Paramètres du salon"
    },
    connection: {
      connecting: "Connexion au chat...",
      connectedToChat: "Connecté au chat",
      disconnectedReconnecting: "Déconnecté du chat. Tentative de reconnexion...",
      connectionError: "Erreur de connexion. Veuillez vérifier votre réseau.",
      unknownStatus: "État de connexion inconnu",
      rateLimitExceeded: "Limite de débit dépassée. Vous pourrez envoyer des messages dans {seconds} secondes.",
      retry: "Réessayer"
    },
    input: {
      placeholder: "Écrivez un message...",
      connectingPlaceholder: "Connexion au chat...",
      errorPlaceholder: "Erreur de connexion",
      rateLimitedPlaceholder: "Limite atteinte. Veuillez patienter...",
      messagePlaceholder: "Message pour {room}...",
      rateLimitWarning: "Vous envoyez des messages trop rapidement. Veuillez ralentir.",
      rateLimitExceeded: "Limite de débit dépassée. Vous pourrez envoyer des messages dans {seconds} secondes.",
      replyingTo: "Réponse à {user}",
      attachFile: "Joindre un fichier",
      sending: "Envoi...",
      sendMessage: "Envoyer le message",
      stopRecording: "Arrêter l'enregistrement",
      voiceMessage: "Message vocal",
      helperText: "Appuyez sur Entrée pour envoyer, Maj+Entrée pour nouvelle ligne",
      messageTooLong: "Message trop long ({current}/{max})",
      cancelReply: "Annuler la réponse"
    },
    messages: {
      loading: "Chargement des messages...",
      chatError: "Erreur de Chat",
      chatErrorDesc: "Quelque chose s'est mal passé avec le chat. Veuillez réessayer.",
      retry: "Réessayer",
      loadMore: "Charger Plus de Messages",
      replyingTo: "Réponse à",
      copied: "Copié !",
      copyMessage: "Copier le message",
      reply: "Répondre",
      editMessage: "Modifier le message",
      deleteMessage: "Supprimer le message",
      unknownUser: "Utilisateur inconnu",
      originalUnavailable: "Message original indisponible",
      noContent: "Pas de contenu"
    },
    members: {
      title: "Membres du Salon",
      member: "membre",
      memberPlural: "membres",
      noMembers: "Aucun membre trouvé",
      owner: "Propriétaire",
      moderator: "Modérateur",
      online: "En ligne",
      offline: "Hors ligne",
      you: "(Vous)"
    },
    settings: {
      title: "Paramètres du Salon",
      configureFor: "Configurer les paramètres pour",
      guildRoom: "Salon de Guilde",
      roomName: "Nom du Salon",
      roomNamePlaceholder: "Entrez le nom du salon",
      guildRoomNote: "Les noms des salons de guilde sont gérés dans les paramètres de la guilde",
      description: "Description",
      descriptionPlaceholder: "Entrez la description du salon",
      publicRoom: "Salon Public",
      publicRoomDesc: "Tout le monde peut rejoindre ce salon",
      privateRoomDesc: "Seuls les membres invités peuvent rejoindre ce salon",
      allowReactions: "Autoriser les Réactions",
      allowReactionsDesc: "Permettre aux utilisateurs de réagir aux messages avec des emojis",
      maxMessageLength: "Longueur Maximale du Message",
      maxMessageLengthDesc: "Caractères maximum autorisés par message (100 - 10 000)",
      activeMembers: "Membres Actifs",
      cancel: "Annuler",
      saving: "Enregistrement...",
      saveChanges: "Enregistrer les Modifications",
      settingsSaved: "Paramètres enregistrés",
      settingsSavedDesc: "Les paramètres du salon ont été mis à jour avec succès.",
      errorSaving: "Erreur lors de l'enregistrement",
      errorSavingDesc: "Échec de la mise à jour des paramètres du salon"
    },
    typing: {
      isTyping: "{user} est en train d'écrire...",
      areTyping: "{user1} et {user2} sont en train d'écrire...",
      andOthersTyping: "{user} et {count} autres sont en train d'écrire..."
    },
    fallback: {
      generalChat: "Chat Général",
      generalChatDesc: "Salon de discussion principal pour tous les utilisateurs"
    },
    emoji: {
      addEmoji: "Ajouter un emoji",
      searchEmojis: "Rechercher des emojis...",
      emojiPicker: "Sélecteur d'emojis",
      selectEmoji: "Sélectionner un emoji",
      selectCategory: "Sélectionner une catégorie",
      selectRecentEmoji: "Sélectionner un emoji récent",
      recent: "Récents",
      categories: {
        recently: "Utilisés Récemment",
        smileys: "Sourires",
        people: "Personnes",
        animals: "Animaux",
        food: "Nourriture",
        activities: "Activités",
        travel: "Voyages",
        objects: "Objets",
        symbols: "Symboles",
        flags: "Drapeaux"
      }
    },
    reactions: {
      addReaction: "Ajouter une réaction",
      maxReached: "Maximum de réactions atteint",
      maxReachedLong: "Maximum de 5 réactions atteint",
      messageReactions: "Réactions au message",
      reaction: "réaction",
      reactions: "réactions",
      youReacted: "vous avez réagi",
      you: "Vous",
      moreReactions: "réactions supplémentaires"
    }
  }
};
