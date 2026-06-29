import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const REGLEMENT = `RÈGLEMENT INTÉRIEUR — MIA Académie

Article 1 — Objet
Le présent règlement intérieur s'applique à toute personne inscrite à une formation dispensée par MIA Académie. Il a pour objet de préciser les règles de conduite et de fonctionnement au sein de nos formations, qu'elles soient en présentiel, en ligne ou en format hybride.

Article 2 — Accès aux formations
L'accès à la formation est réservé aux personnes ayant complété leur dossier d'inscription et signé les documents contractuels. Tout stagiaire doit se présenter aux sessions à l'heure convenue. En cas de retard répété ou d'absence injustifiée, MIA Académie se réserve le droit d'exclure le stagiaire du programme.

Article 3 — Assiduité et ponctualité
La participation active à l'ensemble des modules est obligatoire. Un taux d'assiduité minimum de 80 % est requis pour l'obtention de l'attestation de formation. Toute absence doit être signalée au plus tard 24 heures à l'avance, sauf cas de force majeure.

Article 4 — Comportement et respect
Chaque stagiaire s'engage à adopter un comportement respectueux envers les formateurs, les autres stagiaires et le personnel administratif. Tout comportement discriminatoire, harcelant ou perturbateur entraînera une exclusion immédiate sans remboursement.

Article 5 — Utilisation du matériel et des ressources numériques
Les ressources pédagogiques (supports de cours, vidéos, exercices) sont mises à disposition à titre strictement personnel. Leur reproduction, diffusion ou commercialisation sans autorisation écrite de MIA Académie est interdite.

Article 6 — Confidentialité
Les stagiaires s'engagent à ne pas divulguer les contenus pédagogiques propriétaires de MIA Académie ni les informations confidentielles échangées en session à des tiers.

Article 7 — Évaluation et certification
Les évaluations sont réalisées en cours et en fin de formation. Toute tentative de fraude ou de triche entraîne l'annulation des résultats et l'exclusion du programme.

Article 8 — Réclamations
Toute réclamation doit être adressée par écrit à contact@mia-academie.com dans un délai de 15 jours suivant le fait générateur. MIA Académie s'engage à y répondre dans un délai de 10 jours ouvrés.

Article 9 — Respect du règlement
Le non-respect du présent règlement peut entraîner, selon la gravité des faits, un avertissement, une suspension temporaire ou une exclusion définitive de la formation, sans droit au remboursement des frais engagés.

MIA Académie — Organisme de formation professionnelle`

const CGV = `CONDITIONS GÉNÉRALES DE VENTE (CGV) — MIA Académie

Article 1 — Identification de l'organisme
MIA Académie est un organisme de formation professionnelle continue. Toute inscription à nos formations implique l'acceptation pleine et entière des présentes conditions générales de vente.

Article 2 — Inscription et confirmation
L'inscription est effective après réception du dossier complet (formulaire d'inscription, pièce d'identité, CV le cas échéant) et signature du contrat de formation. Une confirmation d'inscription est envoyée par email dans les 48 heures ouvrées suivant la validation du dossier.

Article 3 — Tarifs et modalités de paiement
Les tarifs des formations sont indiqués en euros (€) toutes taxes comprises (TTC). Le règlement peut s'effectuer par :
- Virement bancaire
- Chèque à l'ordre de MIA Académie
- Prise en charge OPCO (sous réserve d'accord de l'organisme financeur)
- Compte Personnel de Formation (CPF) via Mon Compte Formation

En cas de financement partiel, la part restant à charge du stagiaire est due avant le début de la formation.

Article 4 — Conditions d'annulation et de remboursement
• Annulation plus de 10 jours avant le début de la formation : remboursement intégral.
• Annulation entre 5 et 10 jours avant le début : remboursement de 50 % des frais.
• Annulation moins de 5 jours avant le début ou non-présentation : aucun remboursement.

Toute annulation doit être notifiée par écrit à contact@mia-academie.com. En cas de force majeure dûment justifiée, MIA Académie étudiera le report ou le remboursement au cas par cas.

Article 5 — Conditions de report
MIA Académie se réserve le droit de reporter ou d'annuler une session si le nombre minimum de participants n'est pas atteint, ou en cas de force majeure. Le stagiaire sera informé au moins 5 jours ouvrés avant le début prévu. Un report sur une prochaine session sera proposé sans frais supplémentaires.

Article 6 — Propriété intellectuelle
L'ensemble des supports pédagogiques remis ou accessibles pendant la formation (présentations, fiches, vidéos, exercices) sont la propriété exclusive de MIA Académie et sont protégés par le droit d'auteur. Toute reproduction ou diffusion est interdite sans autorisation écrite préalable.

Article 7 — Protection des données personnelles (RGPD)
MIA Académie collecte et traite les données personnelles des stagiaires dans le strict respect du Règlement Général sur la Protection des Données (RGPD). Les données sont utilisées uniquement à des fins de gestion de la formation et ne sont jamais cédées à des tiers sans consentement. Conformément à la loi, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en contactant : contact@mia-academie.com.

Article 8 — Responsabilité
MIA Académie s'engage à déployer tous les moyens nécessaires pour assurer la qualité de la formation. Sa responsabilité ne pourra être engagée en cas de dommages indirects liés à l'utilisation des connaissances acquises lors de la formation.

Article 9 — Litiges et juridiction compétente
En cas de litige, une solution amiable sera recherchée en priorité. À défaut d'accord, les tribunaux compétents seront ceux du ressort du siège social de MIA Académie.

Article 10 — Entrée en vigueur
Les présentes CGV sont applicables à compter de leur date de publication et s'appliquent à toutes les formations dispensées par MIA Académie.

MIA Académie — contact@mia-academie.com`

async function main() {
  const centers = await db.center.findMany({ select: { id: true, name: true } })

  if (centers.length === 0) {
    console.log('No center found in database.')
    return
  }

  for (const center of centers) {
    await db.center.update({
      where: { id: center.id },
      data: { reglement: REGLEMENT, cgv: CGV },
    })
    console.log(`✓ Updated center: ${center.name} (${center.id})`)
  }

  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
