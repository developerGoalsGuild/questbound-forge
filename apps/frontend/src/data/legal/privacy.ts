/**
 * Privacy Policy Content
 * 
 * Full privacy policy text organized by sections.
 */

import { Language } from '@/i18n/common';

export interface PrivacySectionTranslations {
  title: string;
  content: string[];
  items?: string[];
}

export interface PrivacySection {
  id: string;
  translations: Record<Language, PrivacySectionTranslations>;
}

export interface PrivacyPolicyData {
  lastUpdated: Record<Language, string>;
  sections: PrivacySection[];
}

export const privacyPolicyContent: PrivacyPolicyData = {
  lastUpdated: {
    en: 'December 23, 2024',
    es: '23 de diciembre de 2024',
    fr: '23 décembre 2024',
  },
  sections: [
    {
      id: 'introduction',
      translations: {
        en: {
          title: 'Introduction',
          content: [
            'Welcome to GoalsGuild. We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.',
            'By using GoalsGuild, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.',
          ],
        },
        es: {
          title: 'Introducción',
          content: [
            'Bienvenido a GoalsGuild. Estamos comprometidos a proteger tu privacidad y asegurar que tengas una experiencia positiva en nuestra plataforma. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos tu información cuando usas nuestro servicio.',
            'Al usar GoalsGuild, aceptas la recopilación y el uso de información de acuerdo con esta política. Si no estás de acuerdo con nuestras políticas y prácticas, por favor no uses nuestro servicio.',
          ],
        },
        fr: {
          title: 'Introduction',
          content: [
            'Bienvenue sur GoalsGuild. Nous nous engageons à protéger votre vie privée et à vous assurer une expérience positive sur notre plateforme. Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre service.',
            'En utilisant GoalsGuild, vous acceptez la collecte et l\'utilisation d\'informations conformément à cette politique. Si vous n\'êtes pas d\'accord avec nos politiques et pratiques, veuillez ne pas utiliser notre service.',
          ],
        },
      },
    },
    {
      id: 'data-collection',
      translations: {
        en: {
          title: 'Data Collection',
          content: [
            'We collect information that you provide directly to us, including:',
            'We also automatically collect certain information when you use our service:',
          ],
          items: [
            'Account information (email, username, password)',
            'Profile information (name, bio, preferences)',
            'Goal and quest data that you create',
            'Content you post, including comments and messages',
            'Payment information (processed securely through Stripe)',
            'Support communications',
            'Device information (IP address, browser type, operating system)',
            'Usage data (pages visited, features used, time spent)',
            'Cookies and similar tracking technologies',
          ],
        },
        es: {
          title: 'Recopilación de Datos',
          content: [
            'Recopilamos información que nos proporcionas directamente, incluyendo:',
            'También recopilamos automáticamente cierta información cuando usas nuestro servicio:',
          ],
          items: [
            'Información de cuenta (correo electrónico, nombre de usuario, contraseña)',
            'Información de perfil (nombre, biografía, preferencias)',
            'Datos de metas y misiones que creas',
            'Contenido que publicas, incluyendo comentarios y mensajes',
            'Información de pago (procesada de forma segura a través de Stripe)',
            'Comunicaciones de soporte',
            'Información del dispositivo (dirección IP, tipo de navegador, sistema operativo)',
            'Datos de uso (páginas visitadas, funciones usadas, tiempo dedicado)',
            'Cookies y tecnologías de seguimiento similares',
          ],
        },
        fr: {
          title: 'Collecte de Données',
          content: [
            'Nous collectons les informations que vous nous fournissez directement, notamment:',
            'Nous collectons également automatiquement certaines informations lorsque vous utilisez notre service:',
          ],
          items: [
            'Informations de compte (e-mail, nom d\'utilisateur, mot de passe)',
            'Informations de profil (nom, biographie, préférences)',
            'Données d\'objectifs et de quêtes que vous créez',
            'Contenu que vous publiez, y compris les commentaires et messages',
            'Informations de paiement (traitées en toute sécurité via Stripe)',
            'Communications de support',
            'Informations sur l\'appareil (adresse IP, type de navigateur, système d\'exploitation)',
            'Données d\'utilisation (pages visitées, fonctionnalités utilisées, temps passé)',
            'Cookies et technologies de suivi similaires',
          ],
        },
      },
    },
    {
      id: 'data-usage',
      translations: {
        en: {
          title: 'How We Use Your Data',
          content: [
            'We use the information we collect to:',
          ],
          items: [
            'Provide, maintain, and improve our services',
            'Process transactions and send related information',
            'Send you technical notices and support messages',
            'Respond to your comments and questions',
            'Monitor and analyze usage patterns',
            'Detect, prevent, and address technical issues',
            'Personalize your experience',
            'Send you marketing communications (with your consent)',
          ],
        },
        es: {
          title: 'Cómo Usamos Tus Datos',
          content: [
            'Usamos la información que recopilamos para:',
          ],
          items: [
            'Proporcionar, mantener y mejorar nuestros servicios',
            'Procesar transacciones y enviar información relacionada',
            'Enviarte avisos técnicos y mensajes de soporte',
            'Responder a tus comentarios y preguntas',
            'Monitorear y analizar patrones de uso',
            'Detectar, prevenir y abordar problemas técnicos',
            'Personalizar tu experiencia',
            'Enviarte comunicaciones de marketing (con tu consentimiento)',
          ],
        },
        fr: {
          title: 'Comment Nous Utilisons Vos Données',
          content: [
            'Nous utilisons les informations que nous collectons pour:',
          ],
          items: [
            'Fournir, maintenir et améliorer nos services',
            'Traiter les transactions et envoyer des informations connexes',
            'Vous envoyer des avis techniques et des messages de support',
            'Répondre à vos commentaires et questions',
            'Surveiller et analyser les modèles d\'utilisation',
            'Détecter, prévenir et résoudre les problèmes techniques',
            'Personnaliser votre expérience',
            'Vous envoyer des communications marketing (avec votre consentement)',
          ],
        },
      },
    },
    {
      id: 'data-sharing',
      translations: {
        en: {
          title: 'Data Sharing and Disclosure',
          content: [
            'We do not sell your personal information. We may share your information in the following circumstances:',
          ],
          items: [
            'With service providers who assist us in operating our platform (e.g., AWS, Stripe)',
            'When you choose to make content public or share it with collaborators',
            'To comply with legal obligations or protect our rights',
            'In connection with a business transfer (merger, acquisition, etc.)',
            'With your explicit consent',
          ],
        },
        es: {
          title: 'Compartir y Divulgar Datos',
          content: [
            'No vendemos tu información personal. Podemos compartir tu información en las siguientes circunstancias:',
          ],
          items: [
            'Con proveedores de servicios que nos ayudan a operar nuestra plataforma (por ejemplo, AWS, Stripe)',
            'Cuando eliges hacer el contenido público o compartirlo con colaboradores',
            'Para cumplir con obligaciones legales o proteger nuestros derechos',
            'En relación con una transferencia comercial (fusión, adquisición, etc.)',
            'Con tu consentimiento explícito',
          ],
        },
        fr: {
          title: 'Partage et Divulgation de Données',
          content: [
            'Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos informations dans les circonstances suivantes:',
          ],
          items: [
            'Avec les fournisseurs de services qui nous aident à exploiter notre plateforme (par exemple, AWS, Stripe)',
            'Lorsque vous choisissez de rendre le contenu public ou de le partager avec des collaborateurs',
            'Pour se conformer aux obligations légales ou protéger nos droits',
            'En relation avec un transfert commercial (fusion, acquisition, etc.)',
            'Avec votre consentement explicite',
          ],
        },
      },
    },
    {
      id: 'user-rights',
      translations: {
        en: {
          title: 'Your Rights',
          content: [
            'Depending on your location, you may have the following rights regarding your personal data:',
            'To exercise these rights, please contact us at privacy@goalsguild.com.',
          ],
          items: [
            'Access: Request a copy of your personal data',
            'Correction: Request correction of inaccurate data',
            'Deletion: Request deletion of your personal data',
            'Portability: Request transfer of your data',
            'Objection: Object to processing of your data',
            'Restriction: Request restriction of processing',
            'Withdraw Consent: Withdraw consent at any time',
          ],
        },
        es: {
          title: 'Tus Derechos',
          content: [
            'Dependiendo de tu ubicación, puedes tener los siguientes derechos con respecto a tus datos personales:',
            'Para ejercer estos derechos, por favor contáctanos en privacy@goalsguild.com.',
          ],
          items: [
            'Acceso: Solicitar una copia de tus datos personales',
            'Corrección: Solicitar corrección de datos inexactos',
            'Eliminación: Solicitar eliminación de tus datos personales',
            'Portabilidad: Solicitar transferencia de tus datos',
            'Oposición: Oponerte al procesamiento de tus datos',
            'Restricción: Solicitar restricción del procesamiento',
            'Retirar Consentimiento: Retirar el consentimiento en cualquier momento',
          ],
        },
        fr: {
          title: 'Vos Droits',
          content: [
            'Selon votre emplacement, vous pouvez avoir les droits suivants concernant vos données personnelles:',
            'Pour exercer ces droits, veuillez nous contacter à privacy@goalsguild.com.',
          ],
          items: [
            'Accès: Demander une copie de vos données personnelles',
            'Correction: Demander la correction de données inexactes',
            'Suppression: Demander la suppression de vos données personnelles',
            'Portabilité: Demander le transfert de vos données',
            'Opposition: Vous opposer au traitement de vos données',
            'Restriction: Demander la restriction du traitement',
            'Retirer le Consentement: Retirer le consentement à tout moment',
          ],
        },
      },
    },
    {
      id: 'cookies',
      translations: {
        en: {
          title: 'Cookies Policy',
          content: [
            'We use cookies and similar technologies to enhance your experience. Types of cookies we use:',
            'You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some features of our service.',
          ],
          items: [
            'Essential cookies: Required for the service to function',
            'Analytics cookies: Help us understand how you use our service',
            'Preference cookies: Remember your settings and preferences',
            'Marketing cookies: Used to deliver relevant advertisements',
          ],
        },
        es: {
          title: 'Política de Cookies',
          content: [
            'Usamos cookies y tecnologías similares para mejorar tu experiencia. Tipos de cookies que usamos:',
            'Puedes controlar las cookies a través de la configuración de tu navegador. Sin embargo, deshabilitar ciertas cookies puede limitar tu capacidad de usar algunas funciones de nuestro servicio.',
          ],
          items: [
            'Cookies esenciales: Requeridas para que el servicio funcione',
            'Cookies de análisis: Nos ayudan a entender cómo usas nuestro servicio',
            'Cookies de preferencias: Recuerdan tu configuración y preferencias',
            'Cookies de marketing: Usadas para entregar anuncios relevantes',
          ],
        },
        fr: {
          title: 'Politique des Cookies',
          content: [
            'Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience. Types de cookies que nous utilisons:',
            'Vous pouvez contrôler les cookies via les paramètres de votre navigateur. Cependant, la désactivation de certains cookies peut limiter votre capacité à utiliser certaines fonctionnalités de notre service.',
          ],
          items: [
            'Cookies essentiels: Requis pour que le service fonctionne',
            'Cookies d\'analyse: Nous aident à comprendre comment vous utilisez notre service',
            'Cookies de préférences: Se souviennent de vos paramètres et préférences',
            'Cookies marketing: Utilisés pour diffuser des publicités pertinentes',
          ],
        },
      },
    },
    {
      id: 'contact',
      translations: {
        en: {
          title: 'Contact Us',
          content: [
            'If you have questions about this Privacy Policy or our data practices, please contact us:',
          ],
          items: [
            'Email: privacy@goalsguild.com',
            'Address: GoalsGuild Privacy Team',
          ],
        },
        es: {
          title: 'Contáctanos',
          content: [
            'Si tienes preguntas sobre esta Política de Privacidad o nuestras prácticas de datos, por favor contáctanos:',
          ],
          items: [
            'Correo Electrónico: privacy@goalsguild.com',
            'Dirección: Equipo de Privacidad de GoalsGuild',
          ],
        },
        fr: {
          title: 'Contactez-nous',
          content: [
            'Si vous avez des questions sur cette Politique de Confidentialité ou nos pratiques de données, veuillez nous contacter:',
          ],
          items: [
            'E-mail: privacy@goalsguild.com',
            'Adresse: Équipe de Confidentialité GoalsGuild',
          ],
        },
      },
    },
  ],
};
