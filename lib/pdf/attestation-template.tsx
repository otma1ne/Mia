import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    color: '#1e2128',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
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
  // ── Certification block ──────────────────
  certificationBlock: {
    borderWidth: 2,
    borderColor: '#1e2128',
    borderRadius: 6,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  certLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  certTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  certSubtitle: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
  },
  // ── Body text ───────────────────────────
  bodyText: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.7,
    marginBottom: 8,
  },
  studentName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#1e2128',
  },
  formationTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginVertical: 8,
    color: '#1e2128',
  },
  // ── Info grid ───────────────────────────
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 16,
  },
  infoCell: {
    width: '31%',
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
  // ── Legal mention ────────────────────────
  legalText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // ── Signature area ───────────────────────
  signatureSection: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 14,
    minWidth: 200,
    minHeight: 80,
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
    marginTop: 24,
  },
  // ── Footer ──────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 56,
    right: 56,
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

export interface AttestationPDFProps {
  studentName: string
  formationTitle: string
  formationType: string
  formationDuration?: number | null
  startDate: Date | null
  endDate: Date | null
  centerName: string
  centerAddress?: string
  issuedAt: Date
}

function fmt(d: Date | null) {
  if (!d) return 'À définir'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(d))
}

export default function AttestationPDF({
  studentName, formationTitle, formationType,
  formationDuration, startDate, endDate,
  centerName, centerAddress, issuedAt,
}: AttestationPDFProps) {
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

        {/* Certification block */}
        <View style={styles.certificationBlock}>
          <Text style={styles.certLabel}>Document officiel</Text>
          <Text style={styles.certTitle}>Attestation de fin de formation</Text>
          <Text style={styles.certSubtitle}>Certificat de réalisation</Text>
        </View>

        {/* Body */}
        <Text style={styles.bodyText}>
          Nous soussignés, {centerName}, organisme de formation professionnelle, attestons que :
        </Text>

        <Text style={styles.studentName}>{studentName}</Text>

        <Text style={styles.bodyText}>a suivi et satisfait aux exigences de la formation :</Text>

        <Text style={styles.formationTitle}>{formationTitle}</Text>

        {/* Details */}
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

        <Text style={styles.bodyText}>
          Cette attestation est délivrée pour faire valoir ce que de droit.
        </Text>

        <Text style={styles.bodyText}>
          Fait à {centerAddress ?? centerName}, le {fmt(issuedAt)}.
        </Text>

        {/* Legal mention */}
        <Text style={styles.legalText}>
          Ce document constitue le certificat de réalisation prévu à l'article L6353-1 du Code du travail.
        </Text>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le responsable pédagogique</Text>
            <Text style={styles.signaturePlaceholder}>Cachet et signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{centerName} — Attestation de fin de formation</Text>
          <Text style={styles.footerText}>Délivrée le {fmt(issuedAt)}</Text>
        </View>

      </Page>
    </Document>
  )
}
