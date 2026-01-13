/**
 * Terms of Service Content
 * 
 * Full terms of service text organized by sections.
 */

import { Language } from '@/i18n/common';

export interface TermsSectionTranslations {
  title: string;
  content: string[];
  items?: string[];
}

export interface TermsSection {
  id: string;
  translations: Record<Language, TermsSectionTranslations>;
}

export interface TermsOfServiceData {
  lastUpdated: Record<Language, string>;
  sections: TermsSection[];
}

export const termsOfServiceContent: TermsOfServiceData = {
  lastUpdated: {
    en: 'December 23, 2024',
    es: '23 de diciembre de 2024',
    fr: '23 décembre 2024',
  },
  sections: [
    {
      id: 'acceptance',
      translations: {
        en: {
          title: 'Acceptance of Terms',
          content: [
            'By accessing and using GoalsGuild, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our service.',
            'We reserve the right to modify these terms at any time. Your continued use of the service after changes constitutes acceptance of the modified terms.',
          ],
        },
        es: {
          title: 'Aceptación de Términos',
          content: [
            'Al acceder y usar GoalsGuild, aceptas y acuerdas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con estos términos, no puedes usar nuestro servicio.',
            'Nos reservamos el derecho de modificar estos términos en cualquier momento. Tu uso continuo del servicio después de los cambios constituye la aceptación de los términos modificados.',
          ],
        },
        fr: {
          title: 'Acceptation des Conditions',
          content: [
            'En accédant et en utilisant GoalsGuild, vous acceptez et convenez d\'être lié par ces Conditions d\'Utilisation. Si vous n\'êtes pas d\'accord avec ces conditions, vous ne pouvez pas utiliser notre service.',
            'Nous nous réservons le droit de modifier ces conditions à tout moment. Votre utilisation continue du service après les modifications constitue l\'acceptation des conditions modifiées.',
          ],
        },
      },
    },
    {
      id: 'accounts',
      translations: {
        en: {
          title: 'User Accounts',
          content: [
            'To use certain features of GoalsGuild, you must create an account. You agree to:',
          ],
          items: [
            'Provide accurate, current, and complete information',
            'Maintain and update your account information',
            'Maintain the security of your password',
            'Accept responsibility for all activities under your account',
            'Notify us immediately of any unauthorized access',
            'Be at least 13 years old (or the age of majority in your jurisdiction)',
          ],
        },
        es: {
          title: 'Cuentas de Usuario',
          content: [
            'Para usar ciertas funciones de GoalsGuild, debes crear una cuenta. Aceptas:',
          ],
          items: [
            'Proporcionar información precisa, actual y completa',
            'Mantener y actualizar la información de tu cuenta',
            'Mantener la seguridad de tu contraseña',
            'Aceptar la responsabilidad de todas las actividades bajo tu cuenta',
            'Notificarnos inmediatamente de cualquier acceso no autorizado',
            'Tener al menos 13 años (o la mayoría de edad en tu jurisdicción)',
          ],
        },
        fr: {
          title: 'Comptes Utilisateurs',
          content: [
            'Pour utiliser certaines fonctionnalités de GoalsGuild, vous devez créer un compte. Vous acceptez de:',
          ],
          items: [
            'Fournir des informations précises, actuelles et complètes',
            'Maintenir et mettre à jour les informations de votre compte',
            'Maintenir la sécurité de votre mot de passe',
            'Accepter la responsabilité de toutes les activités sous votre compte',
            'Nous notifier immédiatement de tout accès non autorisé',
            'Avoir au moins 13 ans (ou l\'âge de la majorité dans votre juridiction)',
          ],
        },
      },
    },
    {
      id: 'usage',
      translations: {
        en: {
          title: 'Service Usage Rules',
          content: [
            'You agree not to:',
          ],
          items: [
            'Violate any applicable laws or regulations',
            'Infringe on intellectual property rights',
            'Transmit harmful code, viruses, or malware',
            'Harass, abuse, or harm other users',
            'Impersonate others or provide false information',
            'Interfere with or disrupt the service',
            'Use automated systems to access the service without permission',
            'Collect user information without consent',
            'Use the service for illegal or unauthorized purposes',
          ],
        },
        es: {
          title: 'Reglas de Uso del Servicio',
          content: [
            'Aceptas no:',
          ],
          items: [
            'Violar cualquier ley o regulación aplicable',
            'Infringir los derechos de propiedad intelectual',
            'Transmitir código dañino, virus o malware',
            'Acosar, abusar o dañar a otros usuarios',
            'Suplantar a otros o proporcionar información falsa',
            'Interferir o interrumpir el servicio',
            'Usar sistemas automatizados para acceder al servicio sin permiso',
            'Recopilar información de usuarios sin consentimiento',
            'Usar el servicio para fines ilegales o no autorizados',
          ],
        },
        fr: {
          title: 'Règles d\'Utilisation du Service',
          content: [
            'Vous acceptez de ne pas:',
          ],
          items: [
            'Violer toute loi ou réglementation applicable',
            'Porter atteinte aux droits de propriété intellectuelle',
            'Transmettre du code nuisible, des virus ou des logiciels malveillants',
            'Harceler, abuser ou nuire à d\'autres utilisateurs',
            'Usurper l\'identité d\'autres personnes ou fournir de fausses informations',
            'Interférer ou perturber le service',
            'Utiliser des systèmes automatisés pour accéder au service sans autorisation',
            'Collecter des informations utilisateur sans consentement',
            'Utiliser le service à des fins illégales ou non autorisées',
          ],
        },
      },
    },
    {
      id: 'intellectual-property',
      translations: {
        en: {
          title: 'Intellectual Property',
          content: [
            'The GoalsGuild service, including its design, features, and functionality, is owned by GoalsGuild and protected by copyright, trademark, and other intellectual property laws.',
            'You retain ownership of content you create and post on GoalsGuild. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with the service.',
            'You may not copy, modify, distribute, sell, or lease any part of our service without our written permission.',
          ],
        },
        es: {
          title: 'Propiedad Intelectual',
          content: [
            'El servicio de GoalsGuild, incluyendo su diseño, características y funcionalidad, es propiedad de GoalsGuild y está protegido por derechos de autor, marcas registradas y otras leyes de propiedad intelectual.',
            'Conservas la propiedad del contenido que creas y publicas en GoalsGuild. Al publicar contenido, nos otorgas una licencia mundial, no exclusiva y libre de regalías para usar, mostrar y distribuir tu contenido en relación con el servicio.',
            'No puedes copiar, modificar, distribuir, vender o arrendar ninguna parte de nuestro servicio sin nuestro permiso por escrito.',
          ],
        },
        fr: {
          title: 'Propriété Intellectuelle',
          content: [
            'Le service GoalsGuild, y compris sa conception, ses fonctionnalités et sa fonctionnalité, est la propriété de GoalsGuild et est protégé par les droits d\'auteur, les marques de commerce et d\'autres lois sur la propriété intellectuelle.',
            'Vous conservez la propriété du contenu que vous créez et publiez sur GoalsGuild. En publiant du contenu, vous nous accordez une licence mondiale, non exclusive et sans redevance pour utiliser, afficher et distribuer votre contenu en relation avec le service.',
            'Vous ne pouvez pas copier, modifier, distribuer, vendre ou louer une partie de notre service sans notre autorisation écrite.',
          ],
        },
      },
    },
    {
      id: 'liability',
      translations: {
        en: {
          title: 'Limitation of Liability',
          content: [
            'GoalsGuild is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.',
            'To the maximum extent permitted by law, GoalsGuild shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses.',
            'Our total liability for any claims arising from your use of the service shall not exceed the amount you paid us in the 12 months preceding the claim.',
          ],
        },
        es: {
          title: 'Limitación de Responsabilidad',
          content: [
            'GoalsGuild se proporciona "tal cual" sin garantías de ningún tipo. No garantizamos que el servicio será ininterrumpido, seguro o libre de errores.',
            'En la máxima medida permitida por la ley, GoalsGuild no será responsable de ningún daño indirecto, incidental, especial, consecuente o punitivo, incluyendo pérdida de ganancias, datos u otras pérdidas intangibles.',
            'Nuestra responsabilidad total por cualquier reclamo que surja de tu uso del servicio no excederá la cantidad que nos pagaste en los 12 meses anteriores al reclamo.',
          ],
        },
        fr: {
          title: 'Limitation de Responsabilité',
          content: [
            'GoalsGuild est fourni "tel quel" sans garanties d\'aucune sorte. Nous ne garantissons pas que le service sera ininterrompu, sécurisé ou sans erreur.',
            'Dans la mesure maximale permise par la loi, GoalsGuild ne sera pas responsable de tout dommage indirect, accessoire, spécial, consécutif ou punitif, y compris la perte de profits, de données ou d\'autres pertes intangibles.',
            'Notre responsabilité totale pour toute réclamation découlant de votre utilisation du service ne dépassera pas le montant que vous nous avez payé dans les 12 mois précédant la réclamation.',
          ],
        },
      },
    },
    {
      id: 'termination',
      translations: {
        en: {
          title: 'Termination',
          content: [
            'We may terminate or suspend your account and access to the service immediately, without prior notice, for any reason, including if you breach these Terms of Service.',
            'You may terminate your account at any time by contacting us or using the account deletion feature in your settings.',
            'Upon termination, your right to use the service will cease immediately. We may delete your account and data, subject to our data retention policies.',
          ],
        },
        es: {
          title: 'Terminación',
          content: [
            'Podemos terminar o suspender tu cuenta y el acceso al servicio inmediatamente, sin previo aviso, por cualquier razón, incluyendo si violas estos Términos de Servicio.',
            'Puedes terminar tu cuenta en cualquier momento contactándonos o usando la función de eliminación de cuenta en tu configuración.',
            'Al terminar, tu derecho a usar el servicio cesará inmediatamente. Podemos eliminar tu cuenta y datos, sujeto a nuestras políticas de retención de datos.',
          ],
        },
        fr: {
          title: 'Résiliation',
          content: [
            'Nous pouvons résilier ou suspendre votre compte et l\'accès au service immédiatement, sans préavis, pour quelque raison que ce soit, y compris si vous violez ces Conditions d\'Utilisation.',
            'Vous pouvez résilier votre compte à tout moment en nous contactant ou en utilisant la fonctionnalité de suppression de compte dans vos paramètres.',
            'Lors de la résiliation, votre droit d\'utiliser le service cessera immédiatement. Nous pouvons supprimer votre compte et vos données, sous réserve de nos politiques de conservation des données.',
          ],
        },
      },
    },
    {
      id: 'changes',
      translations: {
        en: {
          title: 'Changes to Terms',
          content: [
            'We reserve the right to modify or replace these Terms of Service at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.',
            'What constitutes a material change will be determined at our sole discretion. Your continued use of the service after changes constitutes acceptance of the new terms.',
            'If you do not agree to the new terms, you must stop using the service and may delete your account.',
          ],
        },
        es: {
          title: 'Cambios a los Términos',
          content: [
            'Nos reservamos el derecho de modificar o reemplazar estos Términos de Servicio en cualquier momento. Si una revisión es material, proporcionaremos al menos 30 días de aviso antes de que cualquier nuevo término entre en vigor.',
            'Lo que constituye un cambio material será determinado a nuestra sola discreción. Tu uso continuo del servicio después de los cambios constituye la aceptación de los nuevos términos.',
            'Si no estás de acuerdo con los nuevos términos, debes dejar de usar el servicio y puedes eliminar tu cuenta.',
          ],
        },
        fr: {
          title: 'Modifications des Conditions',
          content: [
            'Nous nous réservons le droit de modifier ou de remplacer ces Conditions d\'Utilisation à tout moment. Si une révision est importante, nous fournirons un préavis d\'au moins 30 jours avant que les nouvelles conditions n\'entrent en vigueur.',
            'Ce qui constitue un changement important sera déterminé à notre seule discrétion. Votre utilisation continue du service après les modifications constitue l\'acceptation des nouvelles conditions.',
            'Si vous n\'êtes pas d\'accord avec les nouvelles conditions, vous devez cesser d\'utiliser le service et pouvez supprimer votre compte.',
          ],
        },
      },
    },
  ],
};
