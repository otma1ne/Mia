import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const UPDATES = [
  {
    id: '6a3e8e4ee56559e4681eb4e3',
    programme: `Module 1 : Fondamentaux du marketing digital
Réseaux sociaux, SEO, SEA, emailing — panorama des leviers digitaux et définition d'une stratégie omnicanale.

Module 2 : Growth Hacking & acquisition
Techniques d'acquisition rapide : A/B testing, funnel AARRR, viral loops, product-led growth.

Module 3 : Contenus & storytelling
Copywriting persuasif, création de contenus viraux, calendrier éditorial et outils de planification.

Module 4 : Data & analytics
Google Analytics 4, tableaux de bord, lecture des KPIs et prise de décision data-driven.

Module 5 : Publicité payante (Google Ads & Meta Ads)
Paramétrage des campagnes, ciblage avancé, optimisation du ROAS, remarketing.

Module 6 : Projet final
Élaboration et présentation d'un plan marketing digital complet pour une marque réelle.`,
  },
  {
    id: '6a3e8e4ee56559e4681eb4e7',
    programme: `Module 1 : Introduction à la cybersécurité
Panorama des menaces actuelles, principes CIA (Confidentialité, Intégrité, Disponibilité), cadres réglementaires (RGPD, ISO 27001).

Module 2 : Sécurité des réseaux
Modèle OSI, protocoles sécurisés, firewalls, VPN, détection d'intrusions (IDS/IPS).

Module 3 : Cryptographie appliquée
Chiffrement symétrique & asymétrique, PKI, certificats SSL/TLS, hachage et signatures numériques.

Module 4 : Sécurité des systèmes & applications
Hardening OS, gestion des vulnérabilités, OWASP Top 10, tests d'intrusion Web (SQL injection, XSS).

Module 5 : Gestion des incidents & réponse
Plan de réponse aux incidents, forensique numérique, journaux et SIEM, continuité d'activité.

Module 6 : Projet pratique (CTF)
Mise en situation réelle via un Capture The Flag : identification et exploitation de vulnérabilités en environnement isolé.`,
  },
]

async function main() {
  for (const { id, programme } of UPDATES) {
    const f = await db.formation.update({ where: { id }, data: { programme } })
    console.log(`✓ Updated: ${f.title}`)
  }
  console.log('Done.')
}

main().catch(console.error).finally(() => db.$disconnect())
