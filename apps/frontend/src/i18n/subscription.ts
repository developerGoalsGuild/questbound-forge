/**
 * Subscription translations
 */

export interface SubscriptionTranslations {
  subscription: {
    title: string;
    subtitle: string;
    mostPopular: string;
    currentBadge: string;
    freeTierNotice: string;
    selected: string;
    selectedPlan: string;
    freePlanTabLabel: string;
    freePlan: {
      name: string;
      price: string;
      period: string;
      description: string;
      features: string[];
    };
    allPlansInclude: string;
    allPlansFeatures: {
      goalTracking: string;
      communityAccess: string;
      mobileApp: string;
    };
    needHelp: string;
    contactSupport: string;
    currentPlan: string;
    upgrade: string;
    downgrade: string;
    cancel: string;
    manage: string;
    billingPortal: string;
    active: string;
    canceled: string;
    pastDue: string;
    trialing: string;
    incomplete?: string;
    incompleteExpired?: string;
    plans: {
      initiate: PlanTranslations;
      journeyman: PlanTranslations;
      sage: PlanTranslations;
      guildmaster: PlanTranslations;
    };
    credits: CreditTranslations;
    checkout: CheckoutTranslations;
    billing: BillingTranslations;
    founder: FounderTranslations;
    errors: ErrorTranslations;
    messages: MessageTranslations;
    planTier?: string;
    status?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: string;
    noActiveSubscription?: string;
    planFeatures?: string;
  };
}

interface PlanTranslations {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

interface CreditTranslations {
  title: string;
  balance: string;
  credits: string;
  lastTopUp: string;
  lastReset: string;
  topUp: string;
  amount: string;
  minAmount: string;
  addCredits: string;
  insufficient: string;
  buyMore: string;
}

interface CheckoutTranslations {
  redirecting: string;
  success: string;
  canceled: string;
  error: string;
  processing: string;
  verifying: string;
  delayed: string;
}

interface BillingTranslations {
  title: string;
  currentPlan: string;
  nextBilling: string;
  cancelAtPeriodEnd: string;
  cancelNow: string;
  reactivate: string;
  manageBilling: string;
  portal: string;
}

interface FounderTranslations {
  title: string;
  foundingMember: FounderPassTranslations;
  guildBuilder: FounderPassTranslations;
}

interface FounderPassTranslations {
  name: string;
  price: string;
  description: string;
  features: string[];
}

interface ErrorTranslations {
  loadFailed: string;
  checkoutFailed: string;
  cancelFailed: string;
  portalFailed: string;
  balanceFailed: string;
  topUpFailed: string;
  updateFailed: string;
}

interface MessageTranslations {
  updated: string;
  updateSuccess: string;
  processing: string;
}

export const subscriptionTranslations = {
  en: {
    subscription: {
      title: 'Choose Your Path',
      subtitle: 'Select the plan that best fits your journey to success',
      mostPopular: 'Most Popular',
      currentBadge: 'Current',
      freeTierNotice: "You're currently on the free tier. Select a plan above to upgrade and unlock premium features.",
      selected: 'Selected',
      selectedPlan: 'Selected Plan',
      freePlanTabLabel: 'Free',
      freePlan: {
        name: 'Free Tier',
        price: '$0',
        period: '/month',
        description: 'Get started with basic features',
        features: [
          'Basic quest templates',
          'Community access',
          'Standard support',
        ],
      },
      allPlansInclude: 'All Plans Include',
      allPlansFeatures: {
        goalTracking: 'Goal Tracking',
        communityAccess: 'Community Access',
        mobileApp: 'Mobile App',
      },
      needHelp: 'Need help choosing?',
      contactSupport: 'Contact our support team',
      currentPlan: 'Current Plan',
      upgrade: 'Upgrade',
      downgrade: 'Downgrade',
      cancel: 'Cancel Subscription',
      manage: 'Manage Subscription',
      billingPortal: 'Billing Portal',
      active: 'Active',
      canceled: 'Canceled',
      pastDue: 'Past Due',
      trialing: 'Trialing',
      incomplete: 'Incomplete',
      incompleteExpired: 'Incomplete Expired',
      plans: {
        initiate: {
          name: 'Initiate',
          price: '$1',
          period: '/month',
          description: 'Perfect for getting started',
          features: [
            '10 video generation credits/month',
            'Basic quest templates',
            'Community access',
            'Standard support',
          ],
          cta: 'Get Started',
          popular: false,
        },
        journeyman: {
          name: 'Journeyman',
          price: '$15',
          period: '/month',
          description: 'For serious goal achievers',
          features: [
            '100 video generation credits/month',
            'All quest templates',
            'Advanced analytics',
            'Priority support',
            'Guild creation',
          ],
          cta: 'Subscribe',
          popular: true,
        },
        sage: {
          name: 'Radiant Sage',
          price: '$49',
          period: '/month',
          description: 'Maximum productivity and features',
          features: [
            '500 video generation credits/month',
            'All quest templates',
            'Advanced analytics',
            '24/7 priority support',
            'Unlimited guilds',
            'AI-powered insights',
          ],
          cta: 'Subscribe',
          popular: false,
        },
        guildmaster: {
          name: 'Guildmaster',
          price: 'Custom',
          period: '',
          description: 'Enterprise solutions for teams',
          features: [
            'Unlimited credits',
            'Custom integrations',
            'Dedicated support',
            'Team management',
            'Custom features',
          ],
          cta: 'Contact Sales',
          popular: false,
        },
      },
      credits: {
        title: 'Credit Balance',
        balance: 'Balance',
        credits: 'credits',
        lastTopUp: 'Last Top-Up',
        lastReset: 'Last Reset',
        topUp: 'Top Up Credits',
        amount: 'Amount',
        minAmount: 'Minimum 10 credits ($5)',
        addCredits: 'Add Credits',
        insufficient: 'Insufficient Credits',
        buyMore: 'Buy More Credits',
      },
      checkout: {
        redirecting: 'Redirecting to checkout...',
        success: 'Payment successful!',
        canceled: 'Payment canceled',
        error: 'Payment error occurred',
        processing: 'Processing...',
        verifying: 'Verifying your subscription...',
        delayed: 'Payment is taking longer than expected',
      },
      billing: {
        title: 'Billing & Subscription',
        currentPlan: 'Current Plan',
        nextBilling: 'Next Billing Date',
        cancelAtPeriodEnd: 'Cancels at period end',
        cancelNow: 'Cancel Now',
        reactivate: 'Reactivate Subscription',
        manageBilling: 'Manage Billing',
        portal: 'Billing Portal',
      },
      founder: {
        title: 'Founder Pass',
        foundingMember: {
          name: 'Founding Member',
          price: '$199',
          description: 'Lifetime access with special perks',
          features: [
            'Lifetime access to all features',
            'Founding member badge',
            'Priority support forever',
            'Exclusive community access',
          ],
        },
        guildBuilder: {
          name: 'Guild Builder',
          price: '$499',
          description: 'For guild creators and leaders',
          features: [
            'Everything in Founding Member',
            'Unlimited guild creation',
            'Advanced guild analytics',
            'Guild customization tools',
          ],
        },
      },
      errors: {
        loadFailed: 'Failed to load subscription information',
        checkoutFailed: 'Failed to create checkout session',
        cancelFailed: 'Failed to cancel subscription',
        portalFailed: 'Failed to access billing portal',
        balanceFailed: 'Failed to load credit balance',
        topUpFailed: 'Failed to top up credits',
        updateFailed: 'Failed to update subscription plan',
      },
      messages: {
        updated: 'Subscription updated',
        updateSuccess: 'Your subscription plan has been updated.',
        processing: 'Processing subscription request',
      },
      planTier: 'Plan Tier',
      status: 'Status',
      currentPeriodStart: 'Current Period Start',
      currentPeriodEnd: 'Current Period End',
      cancelAtPeriodEnd: 'This subscription will be canceled at the end of the current period.',
      noActiveSubscription: 'No active subscription. Edit your profile to upgrade.',
      planFeatures: 'Plan Features',
    },
  },
  es: {
    subscription: {
      title: 'Elige Tu Camino',
      subtitle: 'Selecciona el plan que mejor se ajuste a tu viaje al éxito',
      mostPopular: 'Más Popular',
      currentBadge: 'Actual',
      freeTierNotice: 'Actualmente estás en el plan gratuito. Elige un plan arriba para actualizar y desbloquear funciones premium.',
      selected: 'Seleccionado',
      selectedPlan: 'Plan seleccionado',
      freePlanTabLabel: 'Gratis',
      freePlan: {
        name: 'Plan gratuito',
        price: '$0',
        period: '/mes',
        description: 'Comienza con funciones básicas',
        features: [
          'Plantillas de misiones básicas',
          'Acceso a la comunidad',
          'Soporte estándar',
        ],
      },
      allPlansInclude: 'Todos los Planes Incluyen',
      allPlansFeatures: {
        goalTracking: 'Seguimiento de Metas',
        communityAccess: 'Acceso a la Comunidad',
        mobileApp: 'Aplicación Móvil',
      },
      needHelp: '¿Necesitas ayuda para elegir?',
      contactSupport: 'Contacta a nuestro equipo de soporte',
      currentPlan: 'Plan Actual',
      upgrade: 'Actualizar',
      downgrade: 'Degradar',
      cancel: 'Cancelar Suscripción',
      manage: 'Gestionar Suscripción',
      billingPortal: 'Portal de Facturación',
      active: 'Activo',
      canceled: 'Cancelado',
      pastDue: 'Vencido',
      trialing: 'Prueba',
      incomplete: 'Incompleto',
      incompleteExpired: 'Incompleto Expirado',
      plans: {
        initiate: {
          name: 'Iniciado',
          price: '$1',
          period: '/mes',
          description: 'Perfecto para comenzar',
          features: [
            '10 créditos de generación de video/mes',
            'Plantillas de búsqueda básicas',
            'Acceso a la comunidad',
            'Soporte estándar',
          ],
          cta: 'Comenzar',
          popular: false,
        },
        journeyman: {
          name: 'Aprendiz',
          price: '$15',
          period: '/mes',
          description: 'Para logradores de objetivos serios',
          features: [
            '100 créditos de generación de video/mes',
            'Todas las plantillas de búsqueda',
            'Análisis avanzados',
            'Soporte prioritario',
            'Creación de gremios',
          ],
          cta: 'Suscribirse',
          popular: true,
        },
        sage: {
          name: 'Sabio Radiante',
          price: '$49',
          period: '/mes',
          description: 'Máxima productividad y características',
          features: [
            '500 créditos de generación de video/mes',
            'Todas las plantillas de búsqueda',
            'Análisis avanzados',
            'Soporte prioritario 24/7',
            'Gremios ilimitados',
            'Insights impulsados por IA',
          ],
          cta: 'Suscribirse',
          popular: false,
        },
        guildmaster: {
          name: 'Maestro de Gremio',
          price: 'Personalizado',
          period: '',
          description: 'Soluciones empresariales para equipos',
          features: [
            'Créditos ilimitados',
            'Integraciones personalizadas',
            'Soporte dedicado',
            'Gestión de equipos',
            'Características personalizadas',
          ],
          cta: 'Contactar Ventas',
          popular: false,
        },
      },
      credits: {
        title: 'Saldo de Créditos',
        balance: 'Saldo',
        credits: 'créditos',
        lastTopUp: 'Última Recarga',
        lastReset: 'Último Reinicio',
        topUp: 'Recargar Créditos',
        amount: 'Cantidad',
        minAmount: 'Mínimo 10 créditos ($5)',
        addCredits: 'Agregar Créditos',
        insufficient: 'Créditos Insuficientes',
        buyMore: 'Comprar Más Créditos',
      },
      checkout: {
        redirecting: 'Redirigiendo al pago...',
        success: '¡Pago exitoso!',
        canceled: 'Pago cancelado',
        error: 'Ocurrió un error en el pago',
        processing: 'Procesando...',
        verifying: 'Verificando tu suscripción...',
        delayed: 'El pago está tardando más de lo esperado',
      },
      billing: {
        title: 'Facturación y Suscripción',
        currentPlan: 'Plan Actual',
        nextBilling: 'Próxima Fecha de Facturación',
        cancelAtPeriodEnd: 'Se cancela al final del período',
        cancelNow: 'Cancelar Ahora',
        reactivate: 'Reactivar Suscripción',
        manageBilling: 'Gestionar Facturación',
        portal: 'Portal de Facturación',
      },
      founder: {
        title: 'Pase de Fundador',
        foundingMember: {
          name: 'Miembro Fundador',
          price: '$199',
          description: 'Acceso de por vida con beneficios especiales',
          features: [
            'Acceso de por vida a todas las características',
            'Insignia de miembro fundador',
            'Soporte prioritario para siempre',
            'Acceso exclusivo a la comunidad',
          ],
        },
        guildBuilder: {
          name: 'Constructor de Gremios',
          price: '$499',
          description: 'Para creadores y líderes de gremios',
          features: [
            'Todo en Miembro Fundador',
            'Creación ilimitada de gremios',
            'Análisis avanzados de gremios',
            'Herramientas de personalización de gremios',
          ],
        },
      },
      errors: {
        loadFailed: 'Error al cargar información de suscripción',
        checkoutFailed: 'Error al crear sesión de pago',
        cancelFailed: 'Error al cancelar suscripción',
        portalFailed: 'Error al acceder al portal de facturación',
        balanceFailed: 'Error al cargar saldo de créditos',
        topUpFailed: 'Error al recargar créditos',
        updateFailed: 'Error al actualizar el plan de suscripción',
      },
      messages: {
        updated: 'Suscripción actualizada',
        updateSuccess: 'Tu plan de suscripción ha sido actualizado.',
        processing: 'Procesando solicitud de suscripción',
      },
      planTier: 'Nivel del Plan',
      status: 'Estado',
      currentPeriodStart: 'Inicio del Período Actual',
      currentPeriodEnd: 'Fin del Período Actual',
      cancelAtPeriodEnd: 'Esta suscripción se cancelará al final del período actual.',
      noActiveSubscription: 'No hay suscripción activa. Edita tu perfil para actualizar.',
      planFeatures: 'Características del Plan',
    },
  },
  fr: {
    subscription: {
      title: 'Choisissez Votre Chemin',
      subtitle: 'Sélectionnez le plan qui correspond le mieux à votre parcours vers le succès',
      mostPopular: 'Le Plus Populaire',
      currentBadge: 'Actuel',
      freeTierNotice: 'Vous êtes actuellement sur le plan gratuit. Sélectionnez un plan ci-dessus pour passer à la version premium.',
      selected: 'Sélectionné',
      selectedPlan: 'Plan sélectionné',
      freePlanTabLabel: 'Gratuit',
      freePlan: {
        name: 'Formule gratuite',
        price: '0 €',
        period: '/mois',
        description: 'Commencez avec les fonctionnalités de base',
        features: [
          'Modèles de quêtes de base',
          'Accès à la communauté',
          'Support standard',
        ],
      },
      allPlansInclude: 'Tous les Plans Incluent',
      allPlansFeatures: {
        goalTracking: 'Suivi des Objectifs',
        communityAccess: 'Accès à la Communauté',
        mobileApp: 'Application Mobile',
      },
      needHelp: 'Besoin d\'aide pour choisir?',
      contactSupport: 'Contactez notre équipe de support',
      currentPlan: 'Plan Actuel',
      upgrade: 'Mettre à Niveau',
      downgrade: 'Rétrograder',
      cancel: 'Annuler l\'Abonnement',
      manage: 'Gérer l\'Abonnement',
      billingPortal: 'Portail de Facturation',
      active: 'Actif',
      canceled: 'Annulé',
      pastDue: 'En Retard',
      trialing: 'Essai',
      incomplete: 'Incomplet',
      incompleteExpired: 'Incomplet Expiré',
      plans: {
        initiate: {
          name: 'Initié',
          price: '1 €',
          period: '/mois',
          description: 'Parfait pour commencer',
          features: [
            '10 crédits de génération vidéo/mois',
            'Modèles de quête de base',
            'Accès à la communauté',
            'Support standard',
          ],
          cta: 'Commencer',
          popular: false,
        },
        journeyman: {
          name: 'Compagnon',
          price: '15 €',
          period: '/mois',
          description: 'Pour les réalisateurs d\'objectifs sérieux',
          features: [
            '100 crédits de génération vidéo/mois',
            'Tous les modèles de quête',
            'Analyses avancées',
            'Support prioritaire',
            'Création de guilde',
          ],
          cta: 'S\'abonner',
          popular: true,
        },
        sage: {
          name: 'Sage Radieux',
          price: '49 €',
          period: '/mois',
          description: 'Productivité et fonctionnalités maximales',
          features: [
            '500 crédits de génération vidéo/mois',
            'Tous les modèles de quête',
            'Analyses avancées',
            'Support prioritaire 24/7',
            'Guildes illimitées',
            'Insights alimentés par IA',
          ],
          cta: 'S\'abonner',
          popular: false,
        },
        guildmaster: {
          name: 'Maître de Guilde',
          price: 'Personnalisé',
          period: '',
          description: 'Solutions d\'entreprise pour les équipes',
          features: [
            'Crédits illimités',
            'Intégrations personnalisées',
            'Support dédié',
            'Gestion d\'équipe',
            'Fonctionnalités personnalisées',
          ],
          cta: 'Contacter les Ventes',
          popular: false,
        },
      },
      credits: {
        title: 'Solde de Crédits',
        balance: 'Solde',
        credits: 'crédits',
        lastTopUp: 'Dernier Rechargement',
        lastReset: 'Dernier Réinitialisation',
        topUp: 'Recharger les Crédits',
        amount: 'Montant',
        minAmount: 'Minimum 10 crédits (5 €)',
        addCredits: 'Ajouter des Crédits',
        insufficient: 'Crédits Insuffisants',
        buyMore: 'Acheter Plus de Crédits',
      },
      checkout: {
        redirecting: 'Redirection vers le paiement...',
        success: 'Paiement réussi!',
        canceled: 'Paiement annulé',
        error: 'Une erreur de paiement s\'est produite',
        processing: 'Traitement...',
        verifying: 'Vérification de votre abonnement...',
        delayed: 'Le paiement prend plus de temps que prévu',
      },
      billing: {
        title: 'Facturation et Abonnement',
        currentPlan: 'Plan Actuel',
        nextBilling: 'Prochaine Date de Facturation',
        cancelAtPeriodEnd: 'Annule à la fin de la période',
        cancelNow: 'Annuler Maintenant',
        reactivate: 'Réactiver l\'Abonnement',
        manageBilling: 'Gérer la Facturation',
        portal: 'Portail de Facturation',
      },
      founder: {
        title: 'Passe Fondateur',
        foundingMember: {
          name: 'Membre Fondateur',
          price: '199 €',
          description: 'Accès à vie avec avantages spéciaux',
          features: [
            'Accès à vie à toutes les fonctionnalités',
            'Badge de membre fondateur',
            'Support prioritaire à vie',
            'Accès exclusif à la communauté',
          ],
        },
        guildBuilder: {
          name: 'Constructeur de Guilde',
          price: '499 €',
          description: 'Pour les créateurs et leaders de guilde',
          features: [
            'Tout dans Membre Fondateur',
            'Création de guilde illimitée',
            'Analyses avancées de guilde',
            'Outils de personnalisation de guilde',
          ],
        },
      },
      errors: {
        loadFailed: 'Échec du chargement des informations d\'abonnement',
        checkoutFailed: 'Échec de la création de la session de paiement',
        cancelFailed: 'Échec de l\'annulation de l\'abonnement',
        portalFailed: 'Échec de l\'accès au portail de facturation',
        balanceFailed: 'Échec du chargement du solde de crédits',
        topUpFailed: 'Échec du rechargement des crédits',
        updateFailed: 'Échec de la mise à jour du plan d\'abonnement',
      },
      messages: {
        updated: 'Abonnement mis à jour',
        updateSuccess: 'Votre plan d\'abonnement a été mis à jour.',
        processing: 'Traitement de la demande d\'abonnement',
      },
      planTier: 'Niveau du Plan',
      status: 'Statut',
      currentPeriodStart: 'Début de la Période Actuelle',
      currentPeriodEnd: 'Fin de la Période Actuelle',
      cancelAtPeriodEnd: 'Cet abonnement sera annulé à la fin de la période actuelle.',
      noActiveSubscription: 'Aucun abonnement actif. Modifiez votre profil pour mettre à niveau.',
      planFeatures: 'Caractéristiques du Plan',
    },
  },
};

