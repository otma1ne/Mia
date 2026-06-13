import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { EVALUATION_FIELDS, type EvaluationData } from '@/lib/evaluation-config'

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    color: '#1e2128',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1e2128',
  },
  headerLogo: {
    width: 32,
    height: 32,
    backgroundColor: '#1e2128',
    borderRadius: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e2128',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    color: '#1e2128',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  infoCell: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    padding: 10,
  },
  infoCellLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  infoCellValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldAnswer: {
    fontSize: 11,
    color: '#1e2128',
    lineHeight: 1.5,
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 4,
  },
  fieldSection: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
  },
})

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface EvaluationPDFProps {
  firstName: string
  lastName: string
  email: string
  phone: string
  formationTitle: string
  evaluationData: EvaluationData
  submittedAt: Date
}

// ─────────────────────────────────────────
// Helper: format answer value for display
// ─────────────────────────────────────────

function formatAnswer(value: string | string[] | undefined): string {
  if (!value) return '—'
  if (Array.isArray(value)) return value.join(', ')
  return value
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function EvaluationPDF({
  firstName,
  lastName,
  email,
  phone,
  formationTitle,
  evaluationData,
  submittedAt,
}: EvaluationPDFProps) {
  const dateStr = submittedAt.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLogo} />
          <View>
            <Text style={styles.headerTitle}>EduDrive</Text>
            <Text style={styles.headerSubtitle}>Évaluation de Besoins</Text>
          </View>
        </View>

        {/* Student info */}
        <Text style={styles.sectionTitle}>Informations du candidat</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Prénom</Text>
            <Text style={styles.infoCellValue}>{firstName}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Nom</Text>
            <Text style={styles.infoCellValue}>{lastName}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Email</Text>
            <Text style={styles.infoCellValue}>{email}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Téléphone</Text>
            <Text style={styles.infoCellValue}>{phone}</Text>
          </View>
          <View style={{ ...styles.infoCell, width: '100%' }}>
            <Text style={styles.infoCellLabel}>Formation souhaitée</Text>
            <Text style={styles.infoCellValue}>{formationTitle}</Text>
          </View>
        </View>

        {/* Evaluation answers — driven by EVALUATION_FIELDS config */}
        <Text style={styles.sectionTitle}>Réponses à l&apos;évaluation</Text>
        {EVALUATION_FIELDS.map((field) => {
          if (field.type === 'section') {
            return (
              <Text key={field.key} style={styles.fieldSection}>
                {field.label}
              </Text>
            )
          }
          return (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldAnswer}>
                {formatAnswer(evaluationData[field.key])}
              </Text>
            </View>
          )
        })}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>EduDrive — Document confidentiel</Text>
          <Text style={styles.footerText}>Soumis le {dateStr}</Text>
        </View>

      </Page>
    </Document>
  )
}
