// Single source of truth for the "Évaluation de besoins" form.
// Both the form component and the PDF template read from this config —
// add, remove, or reorder fields here without touching any component.

export type FieldType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'section'

export interface EvaluationField {
  key: string          // JSON key stored in Inscription.evaluationData
  label: string        // French label shown to student and in PDF
  type: FieldType
  options?: string[]   // required for radio / checkbox
  required: boolean
  placeholder?: string // optional hint text
}

export const EVALUATION_FIELDS: EvaluationField[] = [
  {
    key: 'entreprise',
    label: 'Dénomination de votre entreprise (si vous êtes en poste)',
    type: 'text',
    required: false,
    placeholder: 'Nom de votre entreprise',
  },
  {
    key: 'considerations',
    label: 'Éléments à prendre en considération pendant la formation (Handicap, problème de santé, besoin particulier)',
    type: 'textarea',
    required: false,
  },
  {
    // Section heading — renders as a divider, stores no data
    key: '_section_adaptations',
    label: 'Nos adaptations possibles',
    type: 'section',
    required: false,
  },
  {
    key: 'adapt_handicap',
    label: 'Handicap / Maladie',
    type: 'textarea',
    required: false,
  },
  {
    key: 'adapt_contenus',
    label: 'Contenus (outils et méthodes)',
    type: 'textarea',
    required: false,
  },
  {
    key: 'adapt_accompagnement',
    label: 'Accompagnement, suivi (durée, emploi du temps, adaptation des rythmes)',
    type: 'textarea',
    required: false,
  },
  {
    key: 'objectifs',
    label: 'Quel est votre objectif professionnel ou personnel à travers cette formation ?',
    type: 'textarea',
    required: true,
  },
  {
    key: 'domaines_specifiques',
    label: 'Y a-t-il des domaines spécifiques (techniques, soft skills) sur lesquels vous souhaitez concentrer la formation ?',
    type: 'textarea',
    required: true,
  },
  {
    key: 'format_prefere',
    label: 'Quel est le format de formation que vous préférez ? (en ligne, présentiel, hybride)',
    type: 'textarea',
    required: true,
  },
  {
    key: 'horaires_preference',
    label: 'Avez-vous des préférences concernant les horaires de formation (en journée, en soirée, week-ends) ?',
    type: 'textarea',
    required: false,
  },
  {
    key: 'financement',
    label: 'Quels sont les moyens de financement envisagés pour votre formation ? (CPF, autofinancement, financement par un tiers)',
    type: 'textarea',
    required: false,
  },
]

// Derive the TypeScript shape from the config keys
export type EvaluationData = Record<string, string | string[]>
