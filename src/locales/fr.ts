/**
 * src/locales/fr.ts - French translations
 * Direction: LTR
 */

import type { Locale } from './en.ts';
import { en } from './en.ts';

const fr: Locale = {
  ...en,
  lang: 'fr',
  dir: 'ltr' as const,

  nav: {
    tools: 'Outils',
    howToExport: 'Comment exporter',
    privacy: 'Confidentialite',
    savedResults: 'Resultats enregistres',
  },

  results: {
    ...en.results,
    compare: 'Comparer',
  },

  stats: {
    ...en.stats,
    startersSubtitle: 'A entamé la discussion après une période de silence',
    busiestSubtitle: 'Jours avec le plus grand volume de messages',
    silencesSubtitle: 'Plus longs silences entre messages consécutifs',
    heatmapSubtitle: 'Chaque case représente un jour. Plus sombre = plus de messages.',
    speedDistributionSubtitle: 'Délai de réponse aux messages de l’interlocuteur',
    noEmoji: 'Aucun emoji utilisé',
    speedBreakdownTitle: 'Répartition de la vitesse de réponse',
    shortcutsModalTitle: 'Raccourcis clavier',
    shortcutOverview: 'Onglet Aperçu',
    shortcutPerPerson: 'Onglet Par personne',
    shortcutCompare: 'Onglet Comparer',
    shortcutTimeline: 'Onglet Chronologie',
    shortcutActivity: 'Onglet Activité',
    shortcutWords: 'Onglet Mots',
    shortcutPrevNext: 'Onglet suivant / précédent',
    shortcutToggle: 'Basculer entre vue graphique et tableau',
    shortcutHelp: 'Ouvrir l’aide raccourcis',
    shortcutClose: 'Fermer la boîte de dialogue',
  },

  landing: {
    headline: "Decouvrez l'histoire cachee dans vos conversations",
    subheadline:
      "Transformez vos exports WhatsApp en chronologies interactives, rythmes de reponse et dynamiques d'echange — directement dans votre navigateur.",
    badge: '100% cote client · Prive et pret hors ligne',
    bullet1: 'Votre fichier ne quitte jamais votre appareil',
    bullet2: 'Sans compte, sans inscription, sans publicite',
    bullet3: 'Fonctionne hors ligne une fois charge',
    dropzoneLabel: 'Ouvrir votre export de discussion',
    dropzoneHint: 'Glissez-deposez un fichier .txt ou .zip ici, ou cliquez pour parcourir',
    dropzoneFormats: 'Prend en charge les exports WhatsApp depuis iOS et Android',
    orTryDemo: 'Vous souhaitez tester d’abord ?',
    tryDemoBtn: 'Essayer la discussion demo',
    sizeWarning: 'Les fichiers de plus de 30 Mo peuvent prendre plus de temps sur les telephones',
    privacyNote: '⚡ Execute localement dans votre navigateur · Jusqu’a 50 Mo',
    verifyLink: 'Verifiez vous-meme',
    fileSizeLimit: 'Max 50 Mo',
  },

  weekdays: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  months: ['Janv', 'Fevr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sept', 'Oct', 'Nov', 'Dec'],

  faq: {
    title: 'Questions frequentes',
    items: [
      {
        q: 'Mes discussions sont-elles envoyees a un serveur ?',
        a: 'Non. Votre fichier est lu dans votre navigateur via JavaScript. Rien n’est envoye sur Internet. Vous pouvez le verifier en coupant votre connexion avant d’ouvrir un fichier — l’analyseur fonctionne toujours.',
      },
      {
        q: 'Quels formats sont pris en charge ?',
        a: 'Les exports WhatsApp depuis iOS et Android, avec ou sans medias. Le fichier est un .txt ou un .zip contenant un .txt. L’analyseur detecte le format automatiquement.',
      },
      {
        q: 'Y a-t-il une limite de taille de fichier ?',
        a: 'Oui. La limite actuelle est de 50 Mo. Pour les tres grosses discussions, exportez sans medias d’abord (l’export texte seul est generalement inferieur a 5 Mo).',
      },
      {
        q: 'Comment exporter ma discussion ?',
        a: 'Ouvrez la discussion dans WhatsApp, appuyez sur le menu (trois points sur Android, nom du contact sur iOS), choisissez "Exporter la discussion" et selectionnez "Sans medias". Enregistrez le fichier et ouvrez-le ici.',
      },
      {
        q: 'Quelque chose est-il enregistre ?',
        a: 'Rien n’est enregistre par defaut. Quand vous fermez cet onglet, les resultats disparaissent. Il existe une option "Enregistrer sur cet appareil" apres l’analyse, stockant un resume compact dans votre navigateur uniquement.',
      },
      {
        q: 'Quelles sont les limites de confidentialite ?',
        a: 'Votre fichier ne quitte jamais votre appareil, mais les extensions de navigateur installees peuvent lire le contenu de la page. De plus, les participants n’ont pas donne leur consentement — merci de respecter leur vie privee.',
      },
    ],
  },

  toolsPage: {
    title: 'Outils d’analyse de discussion',
    subtitle:
      'Une suite complete de metriques comportementales et chronologiques pour WhatsApp. Tout s’execute hors ligne dans votre navigateur.',
    tryDemo: 'Essayer un exemple',
    inactivity: {
      title: 'Suivi d’inactivite et de reponse',
      desc: 'Detectez les temps morts, les temps de reponse, les periodes de silence et les series d’echanges actifs.',
      badge: 'Rythme et delais',
    },
    counter: {
      title: 'Analyse des messages et du vocabulaire',
      desc: 'Quantifiez le volume de messages, la richesse lexicale, les expressions frequentes et l’usage des emojis.',
      badge: 'Volume et lexique',
    },
    heatmap: {
      title: 'Heures de pointe et carte thermique',
      desc: 'Decouvrez a quelles heures et quels jours de la semaine les discussions sont les plus intenses.',
      badge: 'Carte d’activite',
    },
    compare: {
      title: 'Comparaison face a face',
      desc: 'Comparez directement deux interlocuteurs sur la vitesse, la longueur des messages et les questions posees.',
      badge: 'Duel d’interlocuteurs',
    },
    evidence: {
      title: 'Rapport résumé PDF',
      desc: 'Générez des résumés datés et structurés pour vos archives personnelles ou administratives.',
      badge: 'Rapport résumé',
    },
  },

  howToExport: {
    title: 'Comment exporter votre discussion WhatsApp',
    subtitle: 'Instructions pas a pas pour generer un export texte leger et confidentiel sur n’importe quel appareil.',
    badge: 'Guide · 30 secondes',
    ios: {
      label: 'iPhone (iOS)',
      steps: [
        'Ouvrez WhatsApp et rendez-vous sur la discussion individuelle ou de groupe a inspecter.',
        'Appuyez sur le nom du contact ou du groupe en haut pour ouvrir les informations de discussion.',
        'Faites defiler vers le bas et appuyez sur "Exporter la discussion".',
        'Choisissez "Sans medias". Cela genere un fichier texte leger (moins de 5 Mo) sans photos ni videos.',
        'Enregistrez le fichier sur votre appareil, puis glissez-le directement dans Chatalmanac.',
      ],
    },
    android: {
      label: 'Android',
      steps: [
        'Ouvrez WhatsApp et allez sur la discussion que vous souhaitez analyser.',
        'Appuyez sur le menu a trois points verticaux (⋮) en haut a droite.',
        'Appuyez sur "Plus", puis choisissez "Exporter la discussion".',
        'Choisissez "Sans medias" pour extraire un fichier texte compact sans telecharger des gigaoctets de medias.',
        'Enregistrez le fichier .txt ou .zip sur votre appareil, puis ouvrez-le dans Chatalmanac.',
      ],
    },
    whyWithoutMedia: {
      title: 'Pourquoi choisir "Sans medias" ?',
      summary:
        'L’export sans medias est un fichier texte leger (generalement moins de 5 Mo, meme pour des annees d’echanges). La version avec medias peut depasser plusieurs gigaoctets. Chatalmanac analyse uniquement la dynamique textuelle, les medias sont donc inutiles et exclus pour preserver votre vitesse et votre confidentialite.',
      fastTag: '50x plus rapide et sur',
    },
    readyCta: 'Votre fichier d’export est pret ?',
    dropCta: 'Ouvrir votre fichier maintenant',
    sampleCta: 'Tester d’abord un exemple',
  },

  footer: {
    ctaHeading: 'Pret a decouvrir vos propres conversations ?',
    ctaSubheading: 'Tout le traitement se fait directement dans votre navigateur. Rien n’est envoye a aucun serveur.',
    ctaButton: 'Lancer l’analyse',
    ctaSampleButton: 'Voir un exemple',
    toolsTitle: 'Outils',
    guidesTitle: 'Guides et confidentialite',
    tools: {
      inactivity: 'Suivi d’inactivite et de reponse',
      counter: 'Analyse des messages et du vocabulaire',
      heatmap: 'Heures de pointe et carte thermique',
      compare: 'Comparaison face a face',
      evidence: 'Rapport résumé PDF',
    },
    guides: {
      exportGuide: 'Comment exporter une discussion',
      withoutMedia: 'Pourquoi exporter sans medias',
      privacyVerify: 'Verifier la confidentialite locale',
      savedData: 'Analyses enregistrees hors ligne',
    },
    nonAffiliation:
      'Chatalmanac est un projet independant sans affiliation ou parrainage de WhatsApp ou Meta. Toutes les analyses sont traitees localement.',
    disclaimer: 'Toute analyse se fait dans votre navigateur. Rien n’est envoye a aucun serveur.',
    verifyLink: 'Verifiez vous-meme',
    privacyPolicy: 'Politique de confidentialite',
    license: 'Licence MIT',
    contactPrompt: 'Vous avez des remarques ou des suggestions ?',
    contactEmail: 'devixaweb@gmail.com',
    madeWith: 'Conçu avec',
    by: 'par',
    madeBy: 'Cree par',
    author: 'Tayyab',
    copyright: '© 2026 Chatalmanac. Tous droits reserves.',
  },
};

export default fr;
