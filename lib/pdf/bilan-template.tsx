import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

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
  ratingDisplay: {
    fontSize: 11,
    color: '#f59e0b',
    fontFamily: 'Helvetica-Bold',
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

interface BilanPDFProps {
  type: 'CHAUD' | 'FROID'
  studentName: string
  formationTitle: string
  completedAt: Date
  answers: Record<string, unknown>
}

// ─────────────────────────────────────────
// Helper: render star rating as ★
// ─────────────────────────────────────────

function renderStars(rating: number | undefined): string {
  if (!rating || rating < 1 || rating > 5) return '—'
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function BilanPDF({
  type,
  studentName,
  formationTitle,
  completedAt,
  answers,
}: BilanPDFProps) {
  const isCHAUD = type === 'CHAUD'
  const bilanTitle = isCHAUD ? 'Bilan Chaud' : 'Bilan Froid'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLogo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>MIA Digital</Text>
            <Text style={styles.headerSubtitle}>{bilanTitle}</Text>
          </View>
        </View>

        {/* Student Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Apprenant(e)</Text>
            <Text style={styles.infoCellValue}>{studentName}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Formation</Text>
            <Text style={styles.infoCellValue}>{formationTitle}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Date de soumission</Text>
            <Text style={styles.infoCellValue}>
              {new Date(completedAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Type</Text>
            <Text style={styles.infoCellValue}>{bilanTitle}</Text>
          </View>
        </View>

        {/* Content based on type */}
        {isCHAUD ? (
          <BilanChaudContent answers={answers} />
        ) : (
          <BilanFroidContent answers={answers} />
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Document généré automatiquement — MIA Digital
          </Text>
          <Text style={styles.footerText}>
            {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// ─────────────────────────────────────────
// Bilan Chaud Content
// ─────────────────────────────────────────

function BilanChaudContent({ answers }: { answers: Record<string, unknown> }) {
  const ans = answers as Record<string, any>

  return (
    <>
      <Text style={styles.sectionTitle}>Évaluations</Text>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>1. Note globale de la formation</Text>
        <Text style={styles.ratingDisplay}>
          {renderStars(ans.overallRating)} ({ans.overallRating}/5)
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>2. Qualité du contenu pédagogique</Text>
        <Text style={styles.ratingDisplay}>
          {renderStars(ans.contentRating)} ({ans.contentRating}/5)
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>3. Qualité du / des formateur(s)</Text>
        <Text style={styles.ratingDisplay}>
          {renderStars(ans.trainerRating)} ({ans.trainerRating}/5)
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>4. Niveau de confiance acquis</Text>
        <Text style={styles.ratingDisplay}>
          {renderStars(ans.confidenceRating)} ({ans.confidenceRating}/5)
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>5. Recommanderiez-vous cette formation ?</Text>
        <Text style={styles.ratingDisplay}>
          {renderStars(ans.wouldRecommend)} ({ans.wouldRecommend}/5)
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Retours libres</Text>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Ce que vous avez retenu de plus important</Text>
        <Text style={styles.fieldAnswer}>{ans.bestLearning || '—'}</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Ce qui vous a semblé difficile</Text>
        <Text style={styles.fieldAnswer}>{ans.difficulties || '—'}</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Suggestions d'amélioration</Text>
        <Text style={styles.fieldAnswer}>{ans.suggestions || '—'}</Text>
      </View>
    </>
  )
}

// ─────────────────────────────────────────
// Bilan Froid Content
// ─────────────────────────────────────────

function BilanFroidContent({ answers }: { answers: Record<string, unknown> }) {
  const ans = answers as Record<string, any>

  const examStatusText = ans.examTaken === true
    ? ans.examPassed === true
      ? 'Oui, réussi'
      : 'Oui, non réussi'
    : 'Non'

  return (
    <>
      <Text style={styles.sectionTitle}>Suivi de formation</Text>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>1. Avez-vous passé votre examen ?</Text>
        <Text style={styles.fieldAnswer}>{examStatusText}</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>2. Application des acquis</Text>
        <Text style={styles.ratingDisplay}>
          {renderStars(ans.applyingRating)} ({ans.applyingRating}/5)
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>3. Votre progression depuis la formation</Text>
        <Text style={styles.ratingDisplay}>
          {renderStars(ans.progressRating)} ({ans.progressRating}/5)
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>4. Recommanderiez-vous encore cette formation ?</Text>
        <Text style={styles.ratingDisplay}>
          {renderStars(ans.wouldRecommend)} ({ans.wouldRecommend}/5)
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Retours détaillés</Text>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Domaines où vous avez progressé</Text>
        <Text style={styles.fieldAnswer}>{ans.appliedAreas || '—'}</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Difficultés persistantes</Text>
        <Text style={styles.fieldAnswer}>{ans.persistentDifficulties || '—'}</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Avez-vous besoin d'une formation complémentaire ?</Text>
        <Text style={styles.fieldAnswer}>
          {ans.needsSupport === true ? 'Oui' : 'Non'}
        </Text>
      </View>
    </>
  )
}
