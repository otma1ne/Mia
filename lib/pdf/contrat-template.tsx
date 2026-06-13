import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────

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
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  partyBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    padding: 10,
  },
  partyLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 11,
  },
  infoLabel: {
    color: '#6b7280',
  },
  infoValue: {
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  bodyText: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 12,
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
    marginTop: 8,
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

export interface ContratPDFProps {
  // Student
  firstName: string
  lastName: string
  email: string
  phone: string
  // Formation
  formationTitle: string
  formationType: string
  formationDuration?: number | null
  formationPrice?: number | null
  startDate: Date
  endDate: Date
  // Center
  centerName: string
  centerAddress: string
  centerPhone: string
  centerEmail: string
  // Meta
  generatedAt: Date
}

function fmt(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function ContratPDF({
  firstName, lastName, email, phone,
  formationTitle, formationType, formationDuration, formationPrice,
  startDate, endDate,
  centerName, centerAddress, centerPhone, centerEmail,
  generatedAt,
}: ContratPDFProps) {
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
        <Text style={styles.docTitle}>Contrat de Formation Professionnelle</Text>
        <Text style={styles.docDate}>Établi le {fmt(generatedAt)}</Text>

        {/* Parties */}
        <Text style={styles.sectionTitle}>1. Parties</Text>
        <View style={styles.twoCol}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>L&apos;organisme de formation</Text>
            <Text style={styles.partyName}>{centerName}</Text>
            <Text style={styles.partyDetail}>{centerAddress}</Text>
            <Text style={styles.partyDetail}>{centerPhone}</Text>
            <Text style={styles.partyDetail}>{centerEmail}</Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Le / La stagiaire</Text>
            <Text style={styles.partyName}>{firstName} {lastName}</Text>
            <Text style={styles.partyDetail}>{email}</Text>
            <Text style={styles.partyDetail}>{phone}</Text>
          </View>
        </View>

        {/* Objet */}
        <Text style={styles.sectionTitle}>2. Objet de la formation</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Intitulé</Text>
          <Text style={styles.infoValue}>{formationTitle}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Modalité</Text>
          <Text style={styles.infoValue}>{formationType}</Text>
        </View>
        {formationDuration != null && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Durée totale</Text>
            <Text style={styles.infoValue}>{formationDuration} heures</Text>
          </View>
        )}
        {formationPrice != null && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coût total</Text>
            <Text style={styles.infoValue}>{formationPrice.toLocaleString('fr-FR')} MAD</Text>
          </View>
        )}

        {/* Dates */}
        <Text style={styles.sectionTitle}>3. Dates de la formation</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date de début</Text>
          <Text style={styles.infoValue}>{fmt(startDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date de fin</Text>
          <Text style={styles.infoValue}>{fmt(endDate)}</Text>
        </View>

        {/* Modalités de paiement */}
        <Text style={styles.sectionTitle}>4. Modalités de paiement</Text>
        <Text style={styles.bodyText}>
          Le règlement s&apos;effectue selon les conditions convenues entre les parties. Toute modification des
          conditions de paiement doit faire l&apos;objet d&apos;un avenant écrit signé par les deux parties.
        </Text>

        {/* Signatures */}
        <Text style={styles.sectionTitle}>5. Signatures</Text>
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>L&apos;organisme de formation</Text>
            <Text style={styles.signaturePlaceholder}>Signature et cachet</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le / La stagiaire</Text>
            <Text style={styles.signaturePlaceholder}>Signature précédée de la mention « Lu et approuvé »</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{centerName} — Contrat de formation professionnelle</Text>
          <Text style={styles.footerText}>Généré le {fmt(generatedAt)}</Text>
        </View>

      </Page>
    </Document>
  )
}
