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
    marginBottom: 28,
  },
  content: {
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

export interface ReglementPDFProps {
  content: string
  centerName: string
  generatedAt: Date
  signature?: { dataUrl: string; signedAt: Date }
}

function fmt(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
}

export default function ReglementPDF({ content, centerName, generatedAt, signature }: ReglementPDFProps) {
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
        <Text style={styles.docTitle}>Règlement Intérieur</Text>
        <Text style={styles.docDate}>En vigueur à compter du {fmt(generatedAt)}</Text>

        {/* Content */}
        <Text style={styles.content}>{content}</Text>

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
          <Text style={styles.footerText}>{centerName} — Règlement intérieur</Text>
          <Text style={styles.footerText}>Généré le {fmt(generatedAt)}</Text>
        </View>

      </Page>
    </Document>
  )
}
