/**
 * Privacy policy translations
 */

import { Language } from './common';

export interface PrivacyTranslations {
  title: string;
  subtitle: string;
  print: string;
  lastUpdated: string;
  tableOfContents: string;
  sections: {
    introduction: string;
    dataCollection: string;
    dataUsage: string;
    dataSharing: string;
    userRights: string;
    cookies: string;
    contact: string;
  };
  contact: {
    title: string;
    description: string;
    email: {
      label: string;
      value: string;
    };
    address: {
      label: string;
      value: string;
    };
  };
}

export const privacyTranslations: Record<Language, PrivacyTranslations> = {
  en: {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your data',
    print: 'Print',
    lastUpdated: 'Last Updated',
    tableOfContents: 'Table of Contents',
    sections: {
      introduction: 'Introduction',
      dataCollection: 'Data Collection',
      dataUsage: 'Data Usage',
      userRights: 'User Rights',
      dataSharing: 'Data Sharing',
      cookies: 'Cookies Policy',
      contact: 'Contact Information',
    },
    contact: {
      title: 'Questions About Privacy?',
      description: 'If you have questions about this Privacy Policy, please contact us:',
      email: {
        label: 'Email',
        value: 'privacy@goalsguild.com',
      },
      address: {
        label: 'Address',
        value: 'GoalsGuild Privacy Team',
      },
    },
  },
  es: {
    title: 'Política de Privacidad',
    subtitle: 'Cómo recopilamos, usamos y protegemos tus datos',
    print: 'Imprimir',
    lastUpdated: 'Última Actualización',
    tableOfContents: 'Tabla de Contenidos',
    sections: {
      introduction: 'Introducción',
      dataCollection: 'Recopilación de Datos',
      dataUsage: 'Uso de Datos',
      userRights: 'Derechos del Usuario',
      dataSharing: 'Compartir Datos',
      cookies: 'Política de Cookies',
      contact: 'Información de Contacto',
    },
    contact: {
      title: '¿Preguntas sobre Privacidad?',
      description: 'Si tienes preguntas sobre esta Política de Privacidad, por favor contáctanos:',
      email: {
        label: 'Correo Electrónico',
        value: 'privacy@goalsguild.com',
      },
      address: {
        label: 'Dirección',
        value: 'Equipo de Privacidad de GoalsGuild',
      },
    },
  },
  fr: {
    title: 'Politique de Confidentialité',
    subtitle: 'Comment nous collectons, utilisons et protégeons vos données',
    print: 'Imprimer',
    lastUpdated: 'Dernière Mise à Jour',
    tableOfContents: 'Table des Matières',
    sections: {
      introduction: 'Introduction',
      dataCollection: 'Collecte de Données',
      dataUsage: 'Utilisation des Données',
      userRights: 'Droits de l\'Utilisateur',
      dataSharing: 'Partage de Données',
      cookies: 'Politique des Cookies',
      contact: 'Informations de Contact',
    },
    contact: {
      title: 'Des Questions sur la Confidentialité?',
      description: 'Si vous avez des questions sur cette Politique de Confidentialité, veuillez nous contacter:',
      email: {
        label: 'E-mail',
        value: 'privacy@goalsguild.com',
      },
      address: {
        label: 'Adresse',
        value: 'Équipe de Confidentialité GoalsGuild',
      },
    },
  },
};
