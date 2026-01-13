/**
 * Terms of Service translations
 */

import { Language } from './common';

export interface TermsTranslations {
  title: string;
  subtitle: string;
  print: string;
  lastUpdated: string;
  tableOfContents: string;
  sections: {
    acceptance: string;
    accounts: string;
    usage: string;
    intellectualProperty: string;
    liability: string;
    termination: string;
    changes: string;
  };
  contact: {
    title: string;
    description: string;
    email: {
      label: string;
      value: string;
    };
  };
}

export const termsTranslations: Record<Language, TermsTranslations> = {
  en: {
    title: 'Terms of Service',
    subtitle: 'The terms and conditions for using GoalsGuild',
    print: 'Print',
    lastUpdated: 'Last Updated',
    tableOfContents: 'Table of Contents',
    sections: {
      acceptance: 'Acceptance of Terms',
      accounts: 'User Accounts',
      usage: 'Service Usage Rules',
      intellectualProperty: 'Intellectual Property',
      liability: 'Limitation of Liability',
      termination: 'Termination',
      changes: 'Changes to Terms',
    },
    contact: {
      title: 'Questions About Terms?',
      description: 'If you have questions about these Terms of Service, please contact us:',
      email: {
        label: 'Email',
        value: 'legal@goalsguild.com',
      },
    },
  },
  es: {
    title: 'Términos de Servicio',
    subtitle: 'Los términos y condiciones para usar GoalsGuild',
    print: 'Imprimir',
    lastUpdated: 'Última Actualización',
    tableOfContents: 'Tabla de Contenidos',
    sections: {
      acceptance: 'Aceptación de Términos',
      accounts: 'Cuentas de Usuario',
      usage: 'Reglas de Uso del Servicio',
      intellectualProperty: 'Propiedad Intelectual',
      liability: 'Limitación de Responsabilidad',
      termination: 'Terminación',
      changes: 'Cambios a los Términos',
    },
    contact: {
      title: '¿Preguntas sobre los Términos?',
      description: 'Si tienes preguntas sobre estos Términos de Servicio, por favor contáctanos:',
      email: {
        label: 'Correo Electrónico',
        value: 'legal@goalsguild.com',
      },
    },
  },
  fr: {
    title: 'Conditions d\'Utilisation',
    subtitle: 'Les termes et conditions pour utiliser GoalsGuild',
    print: 'Imprimer',
    lastUpdated: 'Dernière Mise à Jour',
    tableOfContents: 'Table des Matières',
    sections: {
      acceptance: 'Acceptation des Conditions',
      accounts: 'Comptes Utilisateurs',
      usage: 'Règles d\'Utilisation du Service',
      intellectualProperty: 'Propriété Intellectuelle',
      liability: 'Limitation de Responsabilité',
      termination: 'Résiliation',
      changes: 'Modifications des Conditions',
    },
    contact: {
      title: 'Des Questions sur les Conditions?',
      description: 'Si vous avez des questions sur ces Conditions d\'Utilisation, veuillez nous contacter:',
      email: {
        label: 'E-mail',
        value: 'legal@goalsguild.com',
      },
    },
  },
};
