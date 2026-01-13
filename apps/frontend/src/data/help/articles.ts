/**
 * Help Articles Data
 */

import { Language } from '@/i18n/common';

export interface HelpArticleTranslations {
  title: string;
  excerpt: string;
  content: string;
}

export interface HelpArticle {
  slug: string;
  translations: Record<Language, HelpArticleTranslations>;
  category: string;
}

export const helpArticles: HelpArticle[] = [
  {
    slug: 'getting-started-guide',
    translations: {
      en: {
        title: 'Getting Started with GoalsGuild',
        excerpt: 'A comprehensive guide to help you get started with GoalsGuild and make the most of the platform.',
        content: `# Getting Started with GoalsGuild

Welcome to GoalsGuild! This guide will help you get started and make the most of our platform.

## Creating Your First Goal

1. Click the "Create Goal" button on your dashboard
2. Enter your goal title and description
3. Set a deadline
4. Choose a category
5. Answer NLP questions to help break down your goal
6. Review and create your goal

## Breaking Down Goals into Tasks

Once you've created a goal, you can add tasks:
- Click "Add Task" on your goal
- Enter task details
- Set due dates
- Mark tasks as complete as you progress

## Joining Guilds

Guilds are communities of people working toward similar goals:
- Browse guilds from the Guilds page
- Join public guilds instantly
- Request to join private guilds
- Create your own guild

## Using Quests

Quests gamify your goal achievement:
- Create quests from the Quests page
- Set targets and rewards
- Track your progress
- Earn XP and badges

## Need More Help?

Check out our other help articles or contact support.`,
      },
      es: {
        title: 'Cómo Empezar con GoalsGuild',
        excerpt: 'Una guía completa para ayudarte a comenzar con GoalsGuild y aprovechar al máximo la plataforma.',
        content: `# Cómo Empezar con GoalsGuild

¡Bienvenido a GoalsGuild! Esta guía te ayudará a comenzar y aprovechar al máximo nuestra plataforma.

## Crear Tu Primera Meta

1. Haz clic en el botón "Crear Meta" en tu panel
2. Ingresa el título y descripción de tu meta
3. Establece una fecha límite
4. Elige una categoría
5. Responde preguntas de NLP para ayudar a desglosar tu meta
6. Revisa y crea tu meta

## Dividir Metas en Tareas

Una vez que hayas creado una meta, puedes agregar tareas:
- Haz clic en "Agregar Tarea" en tu meta
- Ingresa los detalles de la tarea
- Establece fechas de vencimiento
- Marca las tareas como completadas a medida que progresas

## Unirse a Gremios

Los gremios son comunidades de personas que trabajan hacia metas similares:
- Explora gremios desde la página de Gremios
- Únete a gremios públicos instantáneamente
- Solicita unirte a gremios privados
- Crea tu propio gremio

## Usar Misiones

Las misiones gamifican el logro de tus metas:
- Crea misiones desde la página de Misiones
- Establece objetivos y recompensas
- Rastrea tu progreso
- Gana XP e insignias

## ¿Necesitas Más Ayuda?

Consulta nuestros otros artículos de ayuda o contacta al soporte.`,
      },
      fr: {
        title: 'Commencer avec GoalsGuild',
        excerpt: 'Un guide complet pour vous aider à commencer avec GoalsGuild et tirer le meilleur parti de la plateforme.',
        content: `# Commencer avec GoalsGuild

Bienvenue sur GoalsGuild! Ce guide vous aidera à commencer et à tirer le meilleur parti de notre plateforme.

## Créer Votre Premier Objectif

1. Cliquez sur le bouton "Créer un Objectif" sur votre tableau de bord
2. Entrez le titre et la description de votre objectif
3. Définissez une date limite
4. Choisissez une catégorie
5. Répondez aux questions NLP pour aider à décomposer votre objectif
6. Examinez et créez votre objectif

## Décomposer les Objectifs en Tâches

Une fois que vous avez créé un objectif, vous pouvez ajouter des tâches:
- Cliquez sur "Ajouter une Tâche" sur votre objectif
- Entrez les détails de la tâche
- Définissez les dates d'échéance
- Marquez les tâches comme terminées au fur et à mesure de vos progrès

## Rejoindre des Guildes

Les guildes sont des communautés de personnes travaillant vers des objectifs similaires:
- Parcourez les guildes depuis la page Guildes
- Rejoignez les guildes publiques instantanément
- Demandez à rejoindre les guildes privées
- Créez votre propre guilde

## Utiliser les Quêtes

Les quêtes gamifient la réalisation de vos objectifs:
- Créez des quêtes depuis la page Quêtes
- Définissez des cibles et des récompenses
- Suivez vos progrès
- Gagnez de l'XP et des badges

## Besoin d'Aide?

Consultez nos autres articles d'aide ou contactez le support.`,
      },
    },
    category: 'getting-started',
  },
  {
    slug: 'creating-effective-goals',
    translations: {
      en: {
        title: 'Creating Effective Goals',
        excerpt: 'Learn how to create goals that are specific, measurable, and achievable.',
        content: `# Creating Effective Goals

Setting effective goals is crucial for success. Here's how to create goals that work.

## Be Specific

Instead of "get fit," try "run a 5K in under 30 minutes by March 2024."

## Make It Measurable

Include numbers or metrics so you can track progress:
- "Lose 10 pounds"
- "Read 12 books"
- "Save $5,000"

## Set Deadlines

Give yourself a realistic timeline. Deadlines create urgency and help you stay focused.

## Break It Down

Break large goals into smaller milestones and tasks:
- Milestone 1: Build up to running 1 mile
- Milestone 2: Run 2 miles continuously
- Milestone 3: Complete a 5K run

## Review Regularly

Check your progress weekly and adjust as needed.`,
      },
      es: {
        title: 'Crear Metas Efectivas',
        excerpt: 'Aprende a crear metas que sean específicas, medibles y alcanzables.',
        content: `# Crear Metas Efectivas

Establecer metas efectivas es crucial para el éxito. Aquí te mostramos cómo crear metas que funcionen.

## Sé Específico

En lugar de "ponerse en forma", intenta "correr un 5K en menos de 30 minutos para marzo de 2024."

## Hazlo Medible

Incluye números o métricas para que puedas rastrear el progreso:
- "Perder 10 libras"
- "Leer 12 libros"
- "Ahorrar $5,000"

## Establece Fechas Límite

Date un plazo realista. Las fechas límite crean urgencia y te ayudan a mantenerte enfocado.

## Divídelo

Divide metas grandes en hitos y tareas más pequeños:
- Hito 1: Construir hasta correr 1 milla
- Hito 2: Correr 2 millas continuamente
- Hito 3: Completar una carrera de 5K

## Revisa Regularmente

Revisa tu progreso semanalmente y ajusta según sea necesario.`,
      },
      fr: {
        title: 'Créer des Objectifs Efficaces',
        excerpt: 'Apprenez à créer des objectifs spécifiques, mesurables et atteignables.',
        content: `# Créer des Objectifs Efficaces

Fixer des objectifs efficaces est crucial pour le succès. Voici comment créer des objectifs qui fonctionnent.

## Soyez Spécifique

Au lieu de "se mettre en forme", essayez "courir un 5K en moins de 30 minutes d'ici mars 2024."

## Rendez-le Mesurable

Incluez des chiffres ou des métriques pour pouvoir suivre les progrès:
- "Perdre 10 livres"
- "Lire 12 livres"
- "Économiser 5 000 $"

## Fixez des Dates Limites

Donnez-vous un délai réaliste. Les dates limites créent de l'urgence et vous aident à rester concentré.

## Décomposez-le

Décomposez les grands objectifs en jalons et tâches plus petits:
- Jalon 1: Construire jusqu'à courir 1 mile
- Jalon 2: Courir 2 miles continuellement
- Jalon 3: Compléter une course de 5K

## Examinez Régulièrement

Vérifiez vos progrès hebdomadairement et ajustez au besoin.`,
      },
    },
    category: 'goals-quests',
  },
  {
    slug: 'guild-management',
    translations: {
      en: {
        title: 'Managing Your Guild',
        excerpt: 'Tips for creating and managing successful guilds.',
        content: `# Managing Your Guild

As a guild leader, you have tools to help your community thrive.

## Setting Up Your Guild

1. Choose a clear focus and theme
2. Write a compelling description
3. Set guild rules and guidelines
4. Choose privacy settings

## Growing Your Guild

- Invite friends and colleagues
- Share your guild on social media
- Post in relevant communities
- Welcome new members warmly

## Maintaining Engagement

- Plan regular activities
- Encourage member participation
- Recognize achievements
- Foster collaboration

## Handling Issues

- Address conflicts promptly
- Listen to member feedback
- Maintain a positive environment
- Be fair and consistent`,
      },
      es: {
        title: 'Gestionar Tu Gremio',
        excerpt: 'Consejos para crear y gestionar gremios exitosos.',
        content: `# Gestionar Tu Gremio

Como líder de gremio, tienes herramientas para ayudar a tu comunidad a prosperar.

## Configurar Tu Gremio

1. Elige un enfoque y tema claros
2. Escribe una descripción convincente
3. Establece reglas y pautas del gremio
4. Elige configuraciones de privacidad

## Hacer Crecer Tu Gremio

- Invita a amigos y colegas
- Comparte tu gremio en redes sociales
- Publica en comunidades relevantes
- Da la bienvenida a nuevos miembros cálidamente

## Mantener el Compromiso

- Planifica actividades regulares
- Fomenta la participación de los miembros
- Reconoce los logros
- Fomenta la colaboración

## Manejar Problemas

- Aborda conflictos rápidamente
- Escucha los comentarios de los miembros
- Mantén un ambiente positivo
- Sé justo y consistente`,
      },
      fr: {
        title: 'Gérer Votre Guilde',
        excerpt: 'Conseils pour créer et gérer des guildes réussies.',
        content: `# Gérer Votre Guilde

En tant que leader de guilde, vous avez des outils pour aider votre communauté à prospérer.

## Configurer Votre Guilde

1. Choisissez un focus et un thème clairs
2. Rédigez une description convaincante
3. Définissez les règles et directives de la guilde
4. Choisissez les paramètres de confidentialité

## Faire Grandir Votre Guilde

- Invitez des amis et des collègues
- Partagez votre guilde sur les réseaux sociaux
- Publiez dans des communautés pertinentes
- Accueillez chaleureusement les nouveaux membres

## Maintenir l'Engagement

- Planifiez des activités régulières
- Encouragez la participation des membres
- Reconnaissez les réalisations
- Favorisez la collaboration

## Gérer les Problèmes

- Abordez les conflits rapidement
- Écoutez les commentaires des membres
- Maintenez un environnement positif
- Soyez juste et cohérent`,
      },
    },
    category: 'guilds',
  },
  {
    slug: 'subscription-faq',
    translations: {
      en: {
        title: 'Subscription and Billing FAQ',
        excerpt: 'Common questions about subscriptions, billing, and credits.',
        content: `# Subscription and Billing FAQ

## Subscription Plans

GoalsGuild offers three subscription tiers:

### Free Tier
- Basic goal tracking
- Limited quests
- Community features

### Journeyman
- Unlimited goals and quests
- Advanced analytics
- Priority support

### Patron
- All Journeyman features
- Exclusive badges
- Early access to features

## Billing

- Subscriptions are billed monthly or annually
- You can upgrade or downgrade at any time
- Cancellations take effect at the end of your billing period

## Credits

Credits are used for premium features:
- AI-powered goal breakdowns
- Advanced quest templates
- Premium guild features

You can purchase credits from the Subscription page.`,
      },
      es: {
        title: 'Preguntas Frecuentes sobre Suscripción y Facturación',
        excerpt: 'Preguntas comunes sobre suscripciones, facturación y créditos.',
        content: `# Preguntas Frecuentes sobre Suscripción y Facturación

## Planes de Suscripción

GoalsGuild ofrece tres niveles de suscripción:

### Nivel Gratis
- Seguimiento básico de metas
- Misiones limitadas
- Características comunitarias

### Aprendiz
- Metas y misiones ilimitadas
- Análisis avanzados
- Soporte prioritario

### Patrón
- Todas las características de Aprendiz
- Insignias exclusivas
- Acceso anticipado a funciones

## Facturación

- Las suscripciones se facturan mensual o anualmente
- Puedes actualizar o degradar en cualquier momento
- Las cancelaciones tienen efecto al final de tu período de facturación

## Créditos

Los créditos se usan para características premium:
- Desgloses de metas impulsados por IA
- Plantillas de misiones avanzadas
- Características premium de gremios

Puedes comprar créditos desde la página de Suscripción.`,
      },
      fr: {
        title: 'FAQ sur l\'Abonnement et la Facturation',
        excerpt: 'Questions courantes sur les abonnements, la facturation et les crédits.',
        content: `# FAQ sur l'Abonnement et la Facturation

## Plans d'Abonnement

GoalsGuild propose trois niveaux d'abonnement:

### Niveau Gratuit
- Suivi d'objectifs de base
- Quêtes limitées
- Fonctionnalités communautaires

### Compagnon
- Objectifs et quêtes illimités
- Analyses avancées
- Support prioritaire

### Patron
- Toutes les fonctionnalités Compagnon
- Badges exclusifs
- Accès anticipé aux fonctionnalités

## Facturation

- Les abonnements sont facturés mensuellement ou annuellement
- Vous pouvez mettre à niveau ou rétrograder à tout moment
- Les annulations prennent effet à la fin de votre période de facturation

## Crédits

Les crédits sont utilisés pour les fonctionnalités premium:
- Décompositions d'objectifs alimentées par l'IA
- Modèles de quêtes avancés
- Fonctionnalités premium de guilde

Vous pouvez acheter des crédits depuis la page Abonnement.`,
      },
    },
    category: 'billing',
  },
  {
    slug: 'troubleshooting',
    translations: {
      en: {
        title: 'Troubleshooting Common Issues',
        excerpt: 'Solutions to common problems and issues.',
        content: `# Troubleshooting Common Issues

## Can't Log In

- Check your email and password
- Try resetting your password
- Clear your browser cache
- Try a different browser

## Goals Not Saving

- Check your internet connection
- Refresh the page
- Try logging out and back in
- Clear browser cache

## Notifications Not Working

- Check notification settings in your profile
- Ensure browser notifications are enabled
- Check spam folder for emails

## Performance Issues

- Clear browser cache
- Disable browser extensions
- Try a different browser
- Check your internet connection

## Still Having Issues?

Contact our support team for assistance.`,
      },
      es: {
        title: 'Solución de Problemas Comunes',
        excerpt: 'Soluciones a problemas y cuestiones comunes.',
        content: `# Solución de Problemas Comunes

## No Puedo Iniciar Sesión

- Verifica tu correo electrónico y contraseña
- Intenta restablecer tu contraseña
- Limpia la caché de tu navegador
- Prueba un navegador diferente

## Las Metas No Se Guardan

- Verifica tu conexión a internet
- Actualiza la página
- Intenta cerrar sesión y volver a iniciar sesión
- Limpia la caché del navegador

## Las Notificaciones No Funcionan

- Verifica la configuración de notificaciones en tu perfil
- Asegúrate de que las notificaciones del navegador estén habilitadas
- Revisa la carpeta de spam para correos electrónicos

## Problemas de Rendimiento

- Limpia la caché del navegador
- Deshabilita las extensiones del navegador
- Prueba un navegador diferente
- Verifica tu conexión a internet

## ¿Aún Tienes Problemas?

Contacta a nuestro equipo de soporte para obtener ayuda.`,
      },
      fr: {
        title: 'Dépannage des Problèmes Courants',
        excerpt: 'Solutions aux problèmes et questions courants.',
        content: `# Dépannage des Problèmes Courants

## Impossible de Se Connecter

- Vérifiez votre e-mail et mot de passe
- Essayez de réinitialiser votre mot de passe
- Effacez le cache de votre navigateur
- Essayez un navigateur différent

## Les Objectifs Ne Se Sauvegardent Pas

- Vérifiez votre connexion Internet
- Actualisez la page
- Essayez de vous déconnecter et de vous reconnecter
- Effacez le cache du navigateur

## Les Notifications Ne Fonctionnent Pas

- Vérifiez les paramètres de notification dans votre profil
- Assurez-vous que les notifications du navigateur sont activées
- Vérifiez le dossier spam pour les e-mails

## Problèmes de Performance

- Effacez le cache du navigateur
- Désactivez les extensions du navigateur
- Essayez un navigateur différent
- Vérifiez votre connexion Internet

## Vous Avez Encore des Problèmes?

Contactez notre équipe de support pour obtenir de l'aide.`,
      },
    },
    category: 'troubleshooting',
  },
];
