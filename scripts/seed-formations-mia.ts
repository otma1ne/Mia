/**
 * Seed des 5 formations réelles MIA Académie (IA & Outils Pro)
 * Structure : 1 formation = 3 modules (MIA Start / MIA Pro / MIA Expert)
 *
 * Non-destructif pour le reste de la DB.
 * Supprime puis recrée uniquement les 5 formations MIA ciblées.
 *
 * Usage : npx tsx scripts/seed-formations-mia.ts
 */

import { PrismaClient, FormationStatus, FormationType, ModuleStatus, ModuleType } from '@prisma/client'

const db = new PrismaClient()

const CATEGORY_NAME = 'Intelligence Artificielle & Outils Pro'

// ─────────────────────────────────────────────────────────────────────────────
// Formations data — 5 subjects × 3 modules (niveaux)
// ─────────────────────────────────────────────────────────────────────────────

type NiveauModule = {
  title:       string
  description: string
  duration:    number   // in minutes
  orderIndex:  number
}

type FormationData = {
  title:       string
  description: string
  modules:     [NiveauModule, NiveauModule, NiveauModule] // [START, PRO, EXPERT]
}

const FORMATIONS: FormationData[] = [
  // ── 1. ChatGPT ──────────────────────────────────────────────────────────
  {
    title: 'Maîtriser ChatGPT et les IA Génératives en entreprise',
    description:
      'Apprenez à exploiter ChatGPT et les grands modèles de langage dans votre quotidien professionnel. ' +
      'De la rédaction de prompts efficaces à la création d\'agents autonomes, cette formation accompagne ' +
      'tous les niveaux — du collaborateur débutant au responsable digital.',
    modules: [
      {
        title:       'MIA Start – Niveau 1 : Découverte de ChatGPT et des IA Génératives (7H)',
        description: 'Introduction aux IA génératives et à ChatGPT · Principes du prompt engineering · ' +
                     'Cas d\'usage bureautiques : rédaction, résumé, traduction, emails · ' +
                     'Limites et bonnes pratiques (confidentialité, hallucinations) · Atelier pratique guidé',
        duration:    420,
        orderIndex:  0,
      },
      {
        title:       'MIA Pro – Niveau 2 : Maîtriser ChatGPT et les IA Génératives en entreprise (14H)',
        description: 'Techniques de prompting avancées (chain-of-thought, few-shot) · ' +
                     'Comparatif GPT-4 / Claude / Gemini · Automatisation de workflows métier · ' +
                     'Intégration avec Microsoft 365 et Google Workspace · ' +
                     'Éthique, RGPD et politique d\'usage en entreprise · Ateliers pratiques',
        duration:    840,
        orderIndex:  1,
      },
      {
        title:       'MIA Expert – Niveau 3 : Concevoir et déployer des solutions IA Génératives (21H)',
        description: 'Architecture LLM : fonctionnement, fine-tuning, RAG · ' +
                     'Déploiement d\'un assistant IA métier (no-code / low-code) · ' +
                     'API OpenAI : requêtes, paramètres, gestion des coûts · ' +
                     'Création d\'agents autonomes avec Make / Zapier / n8n · ' +
                     'Gouvernance IA : cadre juridique, audit, documentation · ' +
                     'Projet fil rouge : déploiement d\'un assistant IA dans un cas réel',
        duration:    1260,
        orderIndex:  2,
      },
    ],
  },

  // ── 2. Excel & IA ───────────────────────────────────────────────────────
  {
    title: 'Excel & IA — Automatiser ses analyses et gagner en productivité',
    description:
      'Combinez la puissance d\'Excel avec l\'intelligence artificielle pour automatiser vos analyses, ' +
      'créer des rapports dynamiques et gagner un temps précieux. ' +
      'De la formule avancée aux macros IA, chaque niveau est ancré dans des cas concrets d\'entreprise.',
    modules: [
      {
        title:       'MIA Start – Niveau 1 : Excel & IA pour gagner en productivité (7H)',
        description: 'Formules incontournables : SI, RECHERCHEV/X, NB.SI, SOMME.SI · ' +
                     'Tableaux croisés dynamiques : création, filtres, segments · ' +
                     'Introduction aux idées intelligentes Excel (IA intégrée) · ' +
                     'Mise en forme conditionnelle avancée · Atelier : analyse d\'un fichier de données réel',
        duration:    420,
        orderIndex:  0,
      },
      {
        title:       'MIA Pro – Niveau 2 : Automatiser ses analyses Excel avec l\'IA (14H)',
        description: 'Power Query : import, nettoyage et transformation de données · ' +
                     'Formules matricielles dynamiques (FILTRE, TRIER, UNIQUE) · ' +
                     'Macros VBA : automatisation de rapports récurrents · ' +
                     'Copilot dans Excel : génération de formules et d\'analyses · ' +
                     'Tableaux de bord professionnels · Atelier : automatisation d\'un reporting mensuel',
        duration:    840,
        orderIndex:  1,
      },
      {
        title:       'MIA Expert – Niveau 3 : Excel & IA avancé — Modélisation et automatisation complète (21H)',
        description: 'Power Pivot et modélisation de données avancée · DAX : mesures calculées, intelligence temporelle · ' +
                     'Connexion Excel ↔ Python pour analyses avancées · ' +
                     'Intégration API : récupérer des données externes dans Excel · ' +
                     'Automatisation bout en bout : Excel + Power Automate + IA · ' +
                     'Projet : construction d\'un outil de reporting automatisé',
        duration:    1260,
        orderIndex:  2,
      },
    ],
  },

  // ── 3. IA & Automatisation ───────────────────────────────────────────────
  {
    title: "IA & Automatisation — Gagnez jusqu'à 2 heures par jour",
    description:
      'Découvrez comment l\'automatisation intelligente peut transformer votre productivité quotidienne. ' +
      'Outils no-code (Make, Zapier, n8n), intégration de l\'IA dans vos processus, ' +
      'et workflows puissants sans écrire une seule ligne de code.',
    modules: [
      {
        title:       "MIA Start – Niveau 1 : IA & Automatisation — Gagnez jusqu'à 2 heures par jour (7H)",
        description: 'Cartographie de ses tâches chronophages et répétitives · ' +
                     'Introduction à Zapier et Make : logique de déclencheurs et d\'actions · ' +
                     'Automatisations simples : emails, notifications, formulaires · ' +
                     'IA dans les automatisations : ChatGPT + Zapier · ' +
                     'Atelier : créer son premier workflow automatisé',
        duration:    420,
        orderIndex:  0,
      },
      {
        title:       "MIA Pro – Niveau 2 : IA & Automatisation — Gagnez jusqu'à 2 heures par jour (14H)",
        description: 'Make (ex-Integromat) : scénarios avancés, itérateurs, agrégateurs · ' +
                     'n8n : solution open-source hébergeable · ' +
                     'Automatisation de la chaîne documentaire : PDF, Drive, email, CRM · ' +
                     'IA dans les workflows : classification, résumé, extraction d\'entités · ' +
                     'Monitoring et gestion des erreurs · ' +
                     'Atelier : automatisation complète d\'un processus RH ou commercial',
        duration:    840,
        orderIndex:  1,
      },
      {
        title:       "MIA Expert – Niveau 3 : IA & Automatisation — Concevoir et déployer des processus intelligents (21H)",
        description: 'Architecture d\'un système d\'automatisation d\'entreprise · ' +
                     'Agents IA autonomes : conception, déploiement, maintenance · ' +
                     'RPA : introduction à Power Automate Desktop · ' +
                     'Connexion aux ERP/CRM via API REST · ' +
                     'Sécurité, logs, audit trail des automatisations · ' +
                     'Projet : déploiement d\'un système d\'automatisation complet en entreprise',
        duration:    1260,
        orderIndex:  2,
      },
    ],
  },

  // ── 4. Microsoft 365 Copilot ─────────────────────────────────────────────
  {
    title: "Booster sa productivité avec Microsoft 365 Copilot et l'IA",
    description:
      'Microsoft 365 Copilot intègre l\'IA directement dans Word, Excel, PowerPoint, Outlook et Teams. ' +
      'Cette formation vous apprend à maîtriser ces fonctionnalités pour rédiger plus vite, ' +
      'analyser des données en langage naturel et collaborer plus efficacement.',
    modules: [
      {
        title:       "MIA Start – Niveau 1 : Booster sa productivité avec Microsoft 365 Copilot et l'IA (7H)",
        description: 'Présentation de Microsoft 365 Copilot et de l\'écosystème IA Microsoft · ' +
                     'Copilot dans Word : rédaction, résumé, reformulation · ' +
                     'Copilot dans Outlook : gestion des emails et du calendrier · ' +
                     'Copilot dans Teams : résumé de réunions, actions automatiques · ' +
                     'Atelier : démo live sur cas réels',
        duration:    420,
        orderIndex:  0,
      },
      {
        title:       "MIA Pro – Niveau 2 : Booster sa productivité avec Microsoft 365 Copilot et l'IA (14H)",
        description: 'Copilot dans Excel : génération de formules, analyse de données · ' +
                     'Copilot dans PowerPoint : création de présentations depuis un document · ' +
                     'Microsoft Designer et la génération d\'images · ' +
                     'Copilot Studio : personnaliser son propre assistant · ' +
                     'Bonnes pratiques et sécurité des données avec Copilot · ' +
                     'Atelier : construction d\'un workflow 365 Copilot complet',
        duration:    840,
        orderIndex:  1,
      },
      {
        title:       "MIA Expert – Niveau 3 : Booster sa productivité avec Microsoft 365 Copilot et l'IA (21H)",
        description: 'Copilot Studio : création d\'agents personnalisés pour l\'entreprise · ' +
                     'Power Platform + Copilot : Power Apps, Power Automate, Power BI · ' +
                     'SharePoint + Copilot : gestion documentaire intelligente · ' +
                     'Gouvernance Microsoft 365 Copilot : licences, politiques, conformité · ' +
                     'Déploiement à l\'échelle : formation et conduite du changement · ' +
                     'Projet : déploiement pilote Copilot dans un département',
        duration:    1260,
        orderIndex:  2,
      },
    ],
  },

  // ── 5. Power BI & IA ────────────────────────────────────────────────────
  {
    title: 'Power BI & IA — Concevoir des tableaux de bord décisionnels',
    description:
      'Transformez vos données brutes en tableaux de bord interactifs et insights décisionnels. ' +
      'Power BI Desktop, modélisation de données, DAX, et IA intégrée pour des analyses ' +
      'prédictives et des visuels automatiques accessibles à tous les niveaux.',
    modules: [
      {
        title:       'MIA Start – Niveau 1 : Power BI & IA — Concevoir des tableaux de bord décisionnels (7H)',
        description: 'Découverte de Power BI Desktop et du service Power BI · ' +
                     'Connexion aux sources de données (Excel, CSV, base de données) · ' +
                     'Création de visuels : graphiques, cartes, jauges · ' +
                     'Filtres, segments et interactions entre visuels · ' +
                     'Publication et partage d\'un rapport',
        duration:    420,
        orderIndex:  0,
      },
      {
        title:       'MIA Pro – Niveau 2 : Power BI & IA — Concevoir des tableaux de bord décisionnels (14H)',
        description: 'Power Query : nettoyage et transformation des données · ' +
                     'Modélisation en étoile : tables de faits et dimensions · ' +
                     'DAX fondamentaux : CALCULATE, FILTER, mesures de base · ' +
                     'IA intégrée : Q&A, décomposition, prévisions automatiques · ' +
                     'Tableaux de bord dynamiques et alertes · ' +
                     'Atelier : reporting commercial complet de A à Z',
        duration:    840,
        orderIndex:  1,
      },
      {
        title:       'MIA Expert – Niveau 3 : Power BI & IA — Concevoir des tableaux de bord décisionnels (21H)',
        description: 'DAX avancé : intelligence temporelle, ratios, classements dynamiques · ' +
                     'Power BI Embedded : intégration dans une application · ' +
                     'Connexion directe à Azure Synapse / SQL Server · ' +
                     'IA et ML dans Power BI : modèles AutoML, Azure Cognitive Services · ' +
                     'Administration Power BI : capacités, sécurité au niveau des lignes · ' +
                     'Projet : conception d\'un datamart et déploiement d\'un portail BI',
        duration:    1260,
        orderIndex:  2,
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seed formations MIA IA & Outils Pro\n')

  // 1. Find or create the category
  let category = await db.category.findFirst({ where: { name: CATEGORY_NAME } })
  if (!category) {
    category = await db.category.create({
      data: {
        name:        CATEGORY_NAME,
        description: 'IA générative, automatisation, outils Microsoft 365 et Power BI pour les professionnels.',
      },
    })
    console.log(`✅ Catégorie créée : "${CATEGORY_NAME}"`)
  } else {
    console.log(`ℹ️  Catégorie existante réutilisée : "${CATEGORY_NAME}"`)
  }

  // 2. For each formation — delete existing (if any) then re-create with 3 modules
  for (const f of FORMATIONS) {
    // Remove existing to allow a clean re-seed
    const existing = await db.formation.findFirst({ where: { title: f.title } })
    if (existing) {
      await db.formation.delete({ where: { id: existing.id } }) // cascades modules, sessions, enrollments
      console.log(`🗑️  Ancienne formation supprimée : "${f.title}"`)
    }

    const formation = await db.formation.create({
      data: {
        title:       f.title,
        description: f.description,
        categoryId:  category.id,
        type:        FormationType.PRESENTIAL,
        status:      FormationStatus.PUBLISHED,
        maxStudents: 12,
        duration:    420,   // 7H — START level (each module has its own duration)
        price:       1200,
      },
    })

    // Create the 3 modules (one per niveau)
    for (const m of f.modules) {
      await db.module.create({
        data: {
          formationId: formation.id,
          title:       m.title,
          description: m.description,
          orderIndex:  m.orderIndex,
          type:        ModuleType.THEORY,
          status:      ModuleStatus.PUBLISHED,
          duration:    m.duration,
        },
      })
    }

    console.log(`✅ "${f.title}"`)
    console.log(`    ├─ Module 0 : MIA Start  (7H)`)
    console.log(`    ├─ Module 1 : MIA Pro   (14H)`)
    console.log(`    └─ Module 2 : MIA Expert (21H)`)
  }

  console.log('\n🎉 Terminé !')
  console.log('──────────────────────────────────────────────────')
  console.log('5 formations × 3 modules = 15 modules au total.')
  console.log('Structure : Formation (sujet) → Module (niveau)')
  console.log('──────────────────────────────────────────────────\n')
}

main()
  .catch(e => { console.error('❌ Erreur :', e); process.exit(1) })
  .finally(() => db.$disconnect())
