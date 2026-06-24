import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 48,
    paddingBottom: 64,
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
  docTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  docDate: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
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
  programmeContent: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },
  signatureSection: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 12,
    minHeight: 80,
    maxWidth: 220,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  signaturePlaceholder: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
  signatureImage: {
    width: 140,
    height: 50,
    objectFit: 'contain',
    marginTop: 4,
  },
  signatureDate: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 4,
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

export interface ProgrammePDFProps {
  formationTitle: string
  formationType: string
  formationDuration?: number | null
  startDate: Date | null
  endDate: Date | null
  programme: string
  centerName: string
  generatedAt: Date
  signature?: { dataUrl: string; signedAt: Date }
}

function fmt(d: Date | null) {
  if (!d) return 'À définir'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
}

export default function ProgrammePDF({
  formationTitle, formationType, formationDuration,
  startDate, endDate, programme,
  centerName, generatedAt, signature,
}: ProgrammePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLogo} />
          <View>
            <Text style={styles.headerTitle}>{centerName}</Text>
            <Text style={styles.headerSubtitle}>Organisme de formation professionnelle</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.docTitle}>Programme de Formation</Text>
        <Text style={styles.docDate}>{formationTitle}</Text>

        {/* Formation info */}
        <Text style={styles.sectionTitle}>Informations générales</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Modalité</Text>
            <Text style={styles.infoCellValue}>{formationType}</Text>
          </View>
          {formationDuration != null && (
            <View style={styles.infoCell}>
              <Text style={styles.infoCellLabel}>Durée</Text>
              <Text style={styles.infoCellValue}>{formationDuration} heures</Text>
            </View>
          )}
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Début</Text>
            <Text style={styles.infoCellValue}>{fmt(startDate)}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Fin</Text>
            <Text style={styles.infoCellValue}>{fmt(endDate)}</Text>
          </View>
        </View>

        {/* Programme content */}
        <Text style={styles.sectionTitle}>Contenu du programme</Text>
        <Text style={styles.programmeContent}>{programme}</Text>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Le / La stagiaire</Text>
          {signature ? (
            <>
              <Image src={signature.dataUrl} style={styles.signatureImage} />
              <Text style={styles.signatureDate}>Lu et approuvé — signé le {fmt(signature.signedAt)}</Text>
            </>
          ) : (
            <Text style={styles.signaturePlaceholder}>Signature précédée de la mention « Lu et approuvé »</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{centerName} — Programme de formation</Text>
          <Text style={styles.footerText}>Généré le {fmt(generatedAt)}</Text>
        </View>

      </Page>
    </Document>
  )
}
