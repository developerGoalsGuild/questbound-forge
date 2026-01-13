export type Language = 'en' | 'es' | 'fr';

export interface ContactTranslations {
  title: string;
  subtitle: string;
  methods: {
    emailUs: {
      title: string;
      description: string;
      linkText: string;
    };
    helpCenter: {
      title: string;
      description: string;
      linkText: string;
    };
    support: {
      title: string;
      description: string;
      linkText: string;
    };
  };
  form: {
    title: string;
    description: string;
    fields: {
      name: {
        label: string;
        placeholder: string;
        required: string;
      };
      email: {
        label: string;
        placeholder: string;
        required: string;
        invalid: string;
      };
      subject: {
        label: string;
        placeholder: string;
        required: string;
      };
      message: {
        label: string;
        placeholder: string;
        required: string;
      };
    };
    submit: {
      sending: string;
      send: string;
    };
    success: string;
    error: string;
  };
}

export const contactTranslations: Record<Language, ContactTranslations> = {
  en: {
    title: 'Get in Touch',
    subtitle: 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
    methods: {
      emailUs: {
        title: 'Email Us',
        description: 'Send us an email anytime',
        linkText: 'hello@goalsguild.com',
      },
      helpCenter: {
        title: 'Help Center',
        description: 'Find answers to common questions',
        linkText: 'Visit Help Center',
      },
      support: {
        title: 'Support',
        description: 'Get help from our support team',
        linkText: 'Get Support',
      },
    },
    form: {
      title: 'Send us a Message',
      description: 'Fill out the form below and we\'ll get back to you within 24 hours.',
      fields: {
        name: {
          label: 'Name',
          placeholder: 'Your name',
          required: 'Name is required',
        },
        email: {
          label: 'Email',
          placeholder: 'your.email@example.com',
          required: 'Email is required',
          invalid: 'Please enter a valid email address',
        },
        subject: {
          label: 'Subject',
          placeholder: 'What\'s this about?',
          required: 'Subject is required',
        },
        message: {
          label: 'Message',
          placeholder: 'Tell us more about your question or inquiry...',
          required: 'Message is required',
        },
      },
      submit: {
        sending: 'Sending...',
        send: 'Send Message',
      },
      success: 'Message sent successfully! We\'ll get back to you soon.',
      error: 'Something went wrong. Please try again later.',
    },
  },
  es: {
    title: 'Ponte en Contacto',
    subtitle: '¿Tienes preguntas? Nos encantaría saber de ti. Envíanos un mensaje y te responderemos lo antes posible.',
    methods: {
      emailUs: {
        title: 'Envíanos un Correo',
        description: 'Envíanos un correo electrónico en cualquier momento',
        linkText: 'hello@goalsguild.com',
      },
      helpCenter: {
        title: 'Centro de Ayuda',
        description: 'Encuentra respuestas a preguntas comunes',
        linkText: 'Visitar Centro de Ayuda',
      },
      support: {
        title: 'Soporte',
        description: 'Obtén ayuda de nuestro equipo de soporte',
        linkText: 'Obtener Soporte',
      },
    },
    form: {
      title: 'Envíanos un Mensaje',
      description: 'Completa el formulario a continuación y te responderemos en un plazo de 24 horas.',
      fields: {
        name: {
          label: 'Nombre',
          placeholder: 'Tu nombre',
          required: 'El nombre es obligatorio',
        },
        email: {
          label: 'Correo electrónico',
          placeholder: 'tu.correo@ejemplo.com',
          required: 'El correo electrónico es obligatorio',
          invalid: 'Por favor ingresa una dirección de correo electrónico válida',
        },
        subject: {
          label: 'Asunto',
          placeholder: '¿De qué se trata?',
          required: 'El asunto es obligatorio',
        },
        message: {
          label: 'Mensaje',
          placeholder: 'Cuéntanos más sobre tu pregunta o consulta...',
          required: 'El mensaje es obligatorio',
        },
      },
      submit: {
        sending: 'Enviando...',
        send: 'Enviar Mensaje',
      },
      success: '¡Mensaje enviado exitosamente! Te responderemos pronto.',
      error: 'Algo salió mal. Por favor intenta de nuevo más tarde.',
    },
  },
  fr: {
    title: 'Contactez-nous',
    subtitle: 'Vous avez des questions? Nous aimerions avoir de vos nouvelles. Envoyez-nous un message et nous vous répondrons dès que possible.',
    methods: {
      emailUs: {
        title: 'Envoyez-nous un Email',
        description: 'Envoyez-nous un email à tout moment',
        linkText: 'hello@goalsguild.com',
      },
      helpCenter: {
        title: 'Centre d\'Aide',
        description: 'Trouvez des réponses aux questions courantes',
        linkText: 'Visiter le Centre d\'Aide',
      },
      support: {
        title: 'Support',
        description: 'Obtenez de l\'aide de notre équipe de support',
        linkText: 'Obtenir de l\'Aide',
      },
    },
    form: {
      title: 'Envoyez-nous un Message',
      description: 'Remplissez le formulaire ci-dessous et nous vous répondrons dans les 24 heures.',
      fields: {
        name: {
          label: 'Nom',
          placeholder: 'Votre nom',
          required: 'Le nom est requis',
        },
        email: {
          label: 'Email',
          placeholder: 'votre.email@exemple.com',
          required: 'L\'email est requis',
          invalid: 'Veuillez entrer une adresse email valide',
        },
        subject: {
          label: 'Sujet',
          placeholder: 'De quoi s\'agit-il?',
          required: 'Le sujet est requis',
        },
        message: {
          label: 'Message',
          placeholder: 'Dites-nous en plus sur votre question ou demande...',
          required: 'Le message est requis',
        },
      },
      submit: {
        sending: 'Envoi...',
        send: 'Envoyer le Message',
      },
      success: 'Message envoyé avec succès! Nous vous répondrons bientôt.',
      error: 'Quelque chose s\'est mal passé. Veuillez réessayer plus tard.',
    },
  },
};
