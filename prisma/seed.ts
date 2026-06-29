import {
  PrismaClient,
  UserRole,
  FormationStatus,
  FormationType,
  ModuleStatus,
  ModuleType,
  EnrollmentStatus,
  AttendanceStatus,
  InscriptionStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding MIA Académie database...')

  // ── 1. Clear everything (dependency order) ──────────────────────────────
  await prisma.answerSubmission.deleteMany()
  await prisma.examAttempt.deleteMany()
  await prisma.choice.deleteMany()
  await prisma.question.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.moduleEnrollment.deleteMany()
  await prisma.formationBilan.deleteMany()
  await prisma.formationEnrollment.deleteMany()
  await prisma.session.deleteMany()
  await prisma.materialProgress.deleteMany()
  await prisma.moduleMaterial.deleteMany()
  await prisma.module.deleteMany()
  await prisma.evaluationToken.deleteMany()
  await prisma.signatureToken.deleteMany()
  await prisma.inscription.deleteMany()
  await prisma.formation.deleteMany()
  await prisma.trainerAvailability.deleteMany()
  await prisma.trainer.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.commercial.deleteMany()
  await prisma.category.deleteMany()
  await prisma.operatingHours.deleteMany()
  await prisma.room.deleteMany()
  await prisma.center.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Database cleared')

  // ── 2. Center ────────────────────────────────────────────────────────────
  const center = await prisma.center.create({
    data: {
      name: 'MIA Académie',
      address: '45 Avenue de la Formation, Casablanca 20250, Maroc',
      phone: '+212 522 456 789',
      email: 'contact@mia-academie.com',
      description:
        "Centre de formation professionnelle certifié Qualiopi, spécialisé dans les métiers du numérique, du management et du design. Nos formateurs sont des experts actifs en entreprise.",
      operatingHours: {
        create: [
          { dayOfWeek: 1, open: '08:30', close: '19:00' },
          { dayOfWeek: 2, open: '08:30', close: '19:00' },
          { dayOfWeek: 3, open: '08:30', close: '19:00' },
          { dayOfWeek: 4, open: '08:30', close: '19:00' },
          { dayOfWeek: 5, open: '08:30', close: '19:00' },
          { dayOfWeek: 6, open: '09:00', close: '13:00' },
        ],
      },
      rooms: {
        create: [
          { name: 'Salle Informatique A', capacity: 16 },
          { name: 'Salle Informatique B', capacity: 16 },
          { name: 'Salle de Conférence', capacity: 30 },
          { name: 'Atelier Design',       capacity: 12 },
        ],
      },
    },
    include: { rooms: true },
  })
  const [roomIA, roomIB, roomConf, roomDesign] = center.rooms
  console.log(`✅ Centre créé : ${center.name}`)

  // ── 3. Categories ────────────────────────────────────────────────────────
  const [catWeb, catData, catBusiness, catDesign, catCyber] = await Promise.all([
    prisma.category.create({ data: { name: 'Développement Web',      description: 'Front-end, back-end, full-stack, frameworks modernes' } }),
    prisma.category.create({ data: { name: 'Data Science & IA',      description: 'Machine learning, Python, analyse de données, LLMs' } }),
    prisma.category.create({ data: { name: 'Business & Management',  description: 'Gestion de projet, leadership, stratégie digitale' } }),
    prisma.category.create({ data: { name: 'Design UX/UI',           description: 'Figma, recherche utilisateur, prototypage, design systems' } }),
    prisma.category.create({ data: { name: 'Cybersécurité',          description: 'Sécurité réseau, pentest, conformité RGPD, audit' } }),
  ])
  console.log('✅ 5 catégories créées')

  // ── 4. Users ─────────────────────────────────────────────────────────────
  const pwd = await bcrypt.hash('TestPassword123!', 12)

  const admin = await prisma.user.create({
    data: { email: 'admin@mia-academie.com', password: pwd, name: 'Karim Bennani', role: UserRole.ADMIN, phone: '+212 661 000 001' },
  })

  const [tuWeb, tuData, tuDesign] = await Promise.all([
    prisma.user.create({ data: { email: 'youssef.trainer@mia-academie.com', password: pwd, name: 'Youssef Alami',   role: UserRole.TRAINER, phone: '+212 661 100 001' } }),
    prisma.user.create({ data: { email: 'nadia.trainer@mia-academie.com',   password: pwd, name: 'Nadia Chraibi',   role: UserRole.TRAINER, phone: '+212 661 100 002' } }),
    prisma.user.create({ data: { email: 'mehdi.trainer@mia-academie.com',   password: pwd, name: 'Mehdi Fassi',     role: UserRole.TRAINER, phone: '+212 661 100 003' } }),
  ])

  const students = await Promise.all([
    prisma.user.create({ data: { email: 'yasmine.b@gmail.com',    password: pwd, name: 'Yasmine Benali',    role: UserRole.STUDENT, phone: '+212 612 200 001' } }),
    prisma.user.create({ data: { email: 'omar.h@gmail.com',       password: pwd, name: 'Omar Hajji',        role: UserRole.STUDENT, phone: '+212 612 200 002' } }),
    prisma.user.create({ data: { email: 'salma.k@gmail.com',      password: pwd, name: 'Salma Karray',      role: UserRole.STUDENT, phone: '+212 612 200 003' } }),
    prisma.user.create({ data: { email: 'amine.z@gmail.com',      password: pwd, name: 'Amine Zouaoui',     role: UserRole.STUDENT, phone: '+212 612 200 004' } }),
    prisma.user.create({ data: { email: 'fatima.m@gmail.com',     password: pwd, name: 'Fatima Moussaoui',  role: UserRole.STUDENT, phone: '+212 612 200 005' } }),
    prisma.user.create({ data: { email: 'othmanou01@gmail.com',   password: pwd, name: 'Otmane Dev',        role: UserRole.STUDENT, phone: '+212 612 200 006' } }),
  ])
  console.log(`✅ ${3 + students.length + 1} utilisateurs créés`)

  // ── 5. Trainer profiles ──────────────────────────────────────────────────
  const [trainerWeb, trainerData, trainerDesign] = await Promise.all([
    prisma.trainer.create({
      data: {
        userId: tuWeb.id,
        bio: "Développeur full-stack avec 10 ans d'expérience. Expert React, Node.js et architecture cloud. Formateur certifié depuis 2018.",
        specializations: ['React', 'Node.js', 'TypeScript', 'AWS'],
        credentials: ['AWS Certified Developer', 'Meta React Certification'],
        rating: 4.8,
        expertiseLevels: ['EXPERT'],
        categoryIds: [catWeb.id, catCyber.id],
        availability: {
          create: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
          ],
        },
      },
    }),
    prisma.trainer.create({
      data: {
        userId: tuData.id,
        bio: "Data scientist senior chez OCP Group. Spécialiste Python, machine learning et visualisation de données. PhD en mathématiques appliquées.",
        specializations: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
        credentials: ['Google Professional Data Engineer', 'Coursera ML Specialization'],
        rating: 4.9,
        expertiseLevels: ['EXPERT'],
        categoryIds: [catData.id],
        availability: {
          create: [
            { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
          ],
        },
      },
    }),
    prisma.trainer.create({
      data: {
        userId: tuDesign.id,
        bio: "Designer UX/UI avec 8 ans d'expérience en agences et startups. Passionné par le design system et l'accessibilité web.",
        specializations: ['Figma', 'Design System', 'User Research', 'Prototypage'],
        credentials: ['Nielsen Norman UX Certification', 'Google UX Design Certificate'],
        rating: 4.7,
        expertiseLevels: ['AVANCE'],
        categoryIds: [catDesign.id],
        availability: {
          create: [
            { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
            { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
            { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
          ],
        },
      },
    }),
  ])

  // Link categories ↔ trainers
  await Promise.all([
    prisma.category.update({ where: { id: catWeb.id  }, data: { trainerIds: [trainerWeb.id] } }),
    prisma.category.update({ where: { id: catData.id }, data: { trainerIds: [trainerData.id] } }),
    prisma.category.update({ where: { id: catDesign.id }, data: { trainerIds: [trainerDesign.id] } }),
  ])
  console.log('✅ 3 profils formateur créés')

  // ── 6. Formations ────────────────────────────────────────────────────────

  // Formation 1 — Full-Stack Web (PUBLISHED)
  const fWeb = await prisma.formation.create({
    data: {
      title: 'Développement Web Full-Stack',
      description:
        "Maîtrisez les technologies modernes du web de A à Z. Ce programme intensif vous forme au développement front-end avec React et TypeScript, au back-end avec Node.js et Express, et au déploiement cloud sur AWS.\n\nVous travaillerez sur des projets réels en équipe, avec une approche pédagogique basée sur la pratique. À l'issue de la formation, vous serez capable de concevoir, développer et déployer des applications web complètes.",
      categoryId: catWeb.id,
      type: FormationType.PRESENTIAL,
      status: FormationStatus.PUBLISHED,
      maxStudents: 16,
      price: 12000,
      duration: 180,
      programme: "Semaine 1-2 : HTML/CSS/JS fondamentaux\nSemaine 3-4 : React & TypeScript\nSemaine 5-6 : Node.js & REST APIs\nSemaine 7-8 : Bases de données & ORM\nSemaine 9-10 : Déploiement AWS & CI/CD\nSemaine 11-12 : Projet final en équipe",
    },
  })

  const [mWeb1, mWeb2, mWeb3, mWeb4] = await Promise.all([
    prisma.module.create({ data: { formationId: fWeb.id, title: 'HTML, CSS & JavaScript Modernes', description: "Les fondations du web : sémantique HTML5, CSS Grid & Flexbox, JavaScript ES2024, DOM et événements.", orderIndex: 0, type: ModuleType.THEORY,     status: ModuleStatus.PUBLISHED, duration: 1200 } }),
    prisma.module.create({ data: { formationId: fWeb.id, title: 'React & TypeScript',              description: "Composants, hooks, state management avec Zustand, TypeScript strict, tests unitaires avec Vitest.",          orderIndex: 1, type: ModuleType.THEORY,     status: ModuleStatus.PUBLISHED, duration: 1800 } }),
    prisma.module.create({ data: { formationId: fWeb.id, title: 'Node.js, Express & Bases de données', description: "REST APIs, authentification JWT, PostgreSQL avec Prisma, gestion des erreurs et sécurité.",           orderIndex: 2, type: ModuleType.PRACTICAL,  status: ModuleStatus.PUBLISHED, duration: 1800 } }),
    prisma.module.create({ data: { formationId: fWeb.id, title: 'Évaluation finale — Projet Full-Stack', description: "Développez et présentez une application web complète devant un jury de professionnels.",              orderIndex: 3, type: ModuleType.ASSESSMENT, status: ModuleStatus.PUBLISHED, duration: 480 } }),
  ])

  // Add materials to Web module 1
  await prisma.moduleMaterial.createMany({
    data: [
      { moduleId: mWeb1.id, title: 'Guide HTML5 sémantique',        url: 'https://mia-academie.com/resources/html5-guide.pdf',   type: 'pdf'   },
      { moduleId: mWeb1.id, title: 'CSS Grid & Flexbox — Cheatsheet', url: 'https://mia-academie.com/resources/css-cheatsheet.pdf', type: 'pdf'   },
      { moduleId: mWeb1.id, title: 'Exercices JavaScript interactifs', url: 'https://mia-academie.com/resources/js-exercises',       type: 'link'  },
    ],
  })

  // Formation 2 — Python Data Science (PUBLISHED)
  const fData = await prisma.formation.create({
    data: {
      title: 'Python pour la Data Science',
      description:
        "Devenez opérationnel en Data Science avec Python. Cette formation couvre l'analyse de données avec Pandas, la visualisation avec Matplotlib et Seaborn, le machine learning avec Scikit-learn, et une introduction aux réseaux de neurones avec TensorFlow.\n\nChaque module est construit autour de datasets réels issus de l'industrie marocaine et internationale.",
      categoryId: catData.id,
      type: FormationType.REMOTE_LIVE,
      status: FormationStatus.PUBLISHED,
      maxStudents: 20,
      price: 9500,
      duration: 120,
      programme: "Module 1 : Python & environnement scientifique\nModule 2 : Pandas & analyse de données\nModule 3 : Visualisation avancée\nModule 4 : Machine Learning supervisé\nModule 5 : Projet final & présentation",
    },
  })

  const [mData1, mData2, mData3, mData4, mData5] = await Promise.all([
    prisma.module.create({ data: { formationId: fData.id, title: 'Python & environnement scientifique', description: "Python 3.12, Jupyter, NumPy, gestion des environnements virtuels.",                   orderIndex: 0, type: ModuleType.THEORY,     status: ModuleStatus.PUBLISHED, duration: 600  } }),
    prisma.module.create({ data: { formationId: fData.id, title: 'Analyse de données avec Pandas',       description: "Nettoyage, transformation, agrégation et jointure de DataFrames.",                    orderIndex: 1, type: ModuleType.THEORY,     status: ModuleStatus.PUBLISHED, duration: 900  } }),
    prisma.module.create({ data: { formationId: fData.id, title: 'Visualisation — Matplotlib & Seaborn', description: "Graphiques statiques et interactifs, dashboards Plotly.",                             orderIndex: 2, type: ModuleType.PRACTICAL,  status: ModuleStatus.PUBLISHED, duration: 600  } }),
    prisma.module.create({ data: { formationId: fData.id, title: 'Machine Learning avec Scikit-learn',   description: "Régression, classification, clustering, validation croisée, optimisation.",          orderIndex: 3, type: ModuleType.PRACTICAL,  status: ModuleStatus.PUBLISHED, duration: 1200 } }),
    prisma.module.create({ data: { formationId: fData.id, title: 'Évaluation — Projet Data Science',     description: "Analyse complète d'un dataset réel : exploration, modélisation, présentation des insights.", orderIndex: 4, type: ModuleType.ASSESSMENT, status: ModuleStatus.PUBLISHED, duration: 360  } }),
  ])

  // Formation 3 — UX/UI Design (PUBLISHED)
  const fDesign = await prisma.formation.create({
    data: {
      title: 'Design UX/UI avec Figma',
      description:
        "Apprenez à concevoir des interfaces numériques centrées sur l'utilisateur. De la recherche utilisateur à la livraison des specs aux développeurs, en passant par le wireframing, le prototypage et la création d'un design system complet sous Figma.\n\nFormation 100% pratique sur des projets clients réels.",
      categoryId: catDesign.id,
      type: FormationType.PRESENTIAL,
      status: FormationStatus.PUBLISHED,
      maxStudents: 12,
      price: 8500,
      duration: 96,
      programme: "Module 1 : Fondamentaux UX & recherche utilisateur\nModule 2 : Wireframing & architecture d'information\nModule 3 : UI Design & design system sur Figma\nModule 4 : Prototypage & tests utilisateur",
    },
  })

  const [mDesign1, mDesign2, mDesign3, mDesign4] = await Promise.all([
    prisma.module.create({ data: { formationId: fDesign.id, title: 'Fondamentaux UX & recherche utilisateur', description: "Personas, parcours utilisateur, interviews, analyse concurrentielle.",  orderIndex: 0, type: ModuleType.THEORY,     status: ModuleStatus.PUBLISHED, duration: 720 } }),
    prisma.module.create({ data: { formationId: fDesign.id, title: 'Wireframing & architecture d\'information', description: "Zoning, wireframes basse fidélité, arborescences, flows.",           orderIndex: 1, type: ModuleType.PRACTICAL,  status: ModuleStatus.PUBLISHED, duration: 720 } }),
    prisma.module.create({ data: { formationId: fDesign.id, title: 'UI Design & Design System sur Figma',      description: "Grilles, typographie, couleurs, composants, tokens.",                 orderIndex: 2, type: ModuleType.PRACTICAL,  status: ModuleStatus.PUBLISHED, duration: 960 } }),
    prisma.module.create({ data: { formationId: fDesign.id, title: 'Évaluation — Audit UX d\'un produit réel', description: "Audit complet d'une application existante avec recommandations.",      orderIndex: 3, type: ModuleType.ASSESSMENT, status: ModuleStatus.PUBLISHED, duration: 360 } }),
  ])

  // Formation 4 — Marketing Digital (DRAFT)
  const fMarketing = await prisma.formation.create({
    data: {
      title: 'Marketing Digital & Growth Hacking',
      description: "Maîtrisez les leviers du marketing digital : SEO, SEA, social media, email marketing, analytics et growth hacking. Formation orientée résultats avec des cas pratiques d'entreprises marocaines.",
      categoryId: catBusiness.id,
      type: FormationType.REMOTE_LIVE,
      status: FormationStatus.DRAFT,
      maxStudents: 25,
      price: 7500,
      duration: 80,
    },
  })

  await Promise.all([
    prisma.module.create({ data: { formationId: fMarketing.id, title: 'SEO & Content Marketing',   description: "Audit SEO, stratégie de contenu, optimisation on-page et off-page.",        orderIndex: 0, type: ModuleType.THEORY,    status: ModuleStatus.DRAFT, duration: 600 } }),
    prisma.module.create({ data: { formationId: fMarketing.id, title: 'Google Ads & Meta Ads',      description: "Création et optimisation de campagnes payantes, retargeting, analytics.",    orderIndex: 1, type: ModuleType.PRACTICAL, status: ModuleStatus.DRAFT, duration: 600 } }),
    prisma.module.create({ data: { formationId: fMarketing.id, title: 'Growth Hacking & Analytics', description: "A/B testing, funnel d'acquisition, Google Analytics 4, dashboards Looker.", orderIndex: 2, type: ModuleType.PRACTICAL, status: ModuleStatus.DRAFT, duration: 600 } }),
  ])

  // Formation 5 — Cybersécurité (PUBLISHED)
  const fCyber = await prisma.formation.create({
    data: {
      title: 'Cybersécurité — Fondamentaux',
      description: "Introduction complète à la cybersécurité : comprendre les menaces actuelles, les méthodes d'attaque et les contre-mesures. Orienté pratique avec des labs sur des environnements isolés.",
      categoryId: catCyber.id,
      type: FormationType.PRESENTIAL,
      status: FormationStatus.PUBLISHED,
      maxStudents: 14,
      price: 11000,
      duration: 100,
    },
  })

  await Promise.all([
    prisma.module.create({ data: { formationId: fCyber.id, title: 'Fondamentaux des réseaux & protocoles', description: "TCP/IP, DNS, HTTP/S, VPN, firewalls, modèle OSI.",              orderIndex: 0, type: ModuleType.THEORY,     status: ModuleStatus.PUBLISHED, duration: 600 } }),
    prisma.module.create({ data: { formationId: fCyber.id, title: 'Threats & Attack Surfaces',             description: "OWASP Top 10, phishing, injections SQL, XSS, social engineering.", orderIndex: 1, type: ModuleType.THEORY,     status: ModuleStatus.PUBLISHED, duration: 720 } }),
    prisma.module.create({ data: { formationId: fCyber.id, title: 'Pentest & audit — Labs pratiques',      description: "Kali Linux, Nmap, Metasploit, rapports d'audit.",                  orderIndex: 2, type: ModuleType.PRACTICAL,  status: ModuleStatus.PUBLISHED, duration: 900 } }),
    prisma.module.create({ data: { formationId: fCyber.id, title: 'Certification — Examen blanc',          description: "Simulation d'examen CEH Foundation avec correction détaillée.",     orderIndex: 3, type: ModuleType.ASSESSMENT, status: ModuleStatus.PUBLISHED, duration: 240 } }),
  ])

  console.log('✅ 5 formations créées avec modules')

  // ── 7. Sessions (for PRACTICAL modules) ─────────────────────────────────
  const today = new Date()
  const d = (offset: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)

  await prisma.session.createMany({
    data: [
      // Web — Node.js module sessions
      { moduleId: mWeb3.id, formationId: fWeb.id, trainerId: trainerWeb.id, roomId: roomIA.id, date: d(3),  startTime: '09:00', endTime: '13:00' },
      { moduleId: mWeb3.id, formationId: fWeb.id, trainerId: trainerWeb.id, roomId: roomIA.id, date: d(10), startTime: '09:00', endTime: '13:00' },
      { moduleId: mWeb3.id, formationId: fWeb.id, trainerId: trainerWeb.id, roomId: roomIA.id, date: d(17), startTime: '09:00', endTime: '13:00' },
      // Data — Visualisation module sessions
      { moduleId: mData3.id, formationId: fData.id, trainerId: trainerData.id, roomId: roomIB.id, date: d(5),  startTime: '14:00', endTime: '17:00' },
      { moduleId: mData3.id, formationId: fData.id, trainerId: trainerData.id, roomId: roomIB.id, date: d(12), startTime: '14:00', endTime: '17:00' },
      // Design — Wireframing module sessions
      { moduleId: mDesign2.id, formationId: fDesign.id, trainerId: trainerDesign.id, roomId: roomDesign.id, date: d(2),  startTime: '10:00', endTime: '13:00' },
      { moduleId: mDesign2.id, formationId: fDesign.id, trainerId: trainerDesign.id, roomId: roomDesign.id, date: d(9),  startTime: '10:00', endTime: '13:00' },
    ],
  })
  console.log('✅ Sessions créées')

  // ── 8. Enrollments ───────────────────────────────────────────────────────
  const [sYasmine, sOmar, sSalma, sAmine, sFatima, sOtmane] = students

  // Helper — enroll a student in a formation + create module enrollments
  async function enroll(
    userId: string,
    formation: { id: string },
    modules: { id: string }[],
    opts: { progress?: number; status?: EnrollmentStatus; completedModules?: number } = {},
  ) {
    const fe = await prisma.formationEnrollment.create({
      data: {
        userId,
        formationId: formation.id,
        status: opts.status ?? EnrollmentStatus.ACTIVE,
        progress: opts.progress ?? 0,
        completedAt: opts.progress === 100 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined,
      },
    })
    await prisma.moduleEnrollment.createMany({
      data: modules.map((m, i) => ({
        userId,
        moduleId: m.id,
        formationEnrollmentId: fe.id,
        status: EnrollmentStatus.ACTIVE,
        progress: i < (opts.completedModules ?? 0) ? 100 : 0,
        completedAt: i < (opts.completedModules ?? 0) ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
      })),
    })
    return fe
  }

  await enroll(sYasmine.id, fWeb,  [mWeb1, mWeb2, mWeb3, mWeb4],       { progress: 75, completedModules: 3 })
  await enroll(sYasmine.id, fData, [mData1, mData2, mData3, mData4, mData5], { progress: 20, completedModules: 1 })
  await enroll(sOmar.id,    fWeb,  [mWeb1, mWeb2, mWeb3, mWeb4],       { progress: 50, completedModules: 2 })
  await enroll(sSalma.id,   fData, [mData1, mData2, mData3, mData4, mData5], { progress: 100, completedModules: 5, status: EnrollmentStatus.COMPLETED })
  await enroll(sSalma.id,   fDesign, [mDesign1, mDesign2, mDesign3, mDesign4], { progress: 25, completedModules: 1 })
  await enroll(sAmine.id,   fDesign, [mDesign1, mDesign2, mDesign3, mDesign4], { progress: 50, completedModules: 2 })
  await enroll(sFatima.id,  fCyber, [mWeb1, mWeb2, mWeb3, mWeb4],      { progress: 30, completedModules: 1 })
  await enroll(sOtmane.id,  fWeb,   [mWeb1, mWeb2, mWeb3, mWeb4],      { progress: 100, completedModules: 4, status: EnrollmentStatus.COMPLETED })

  console.log('✅ Inscriptions étudiants créées')

  // ── 9. Inscriptions (pending applications) ───────────────────────────────
  await prisma.inscription.createMany({
    data: [
      {
        firstName: 'Hamza',   lastName: 'Tazi',       email: 'hamza.tazi@gmail.com',    phone: '+212 612 300 001',
        formationId: fWeb.id,    status: InscriptionStatus.PENDING,    nationality: 'Marocaine', postalAddress: 'Casablanca',
      },
      {
        firstName: 'Imane',   lastName: 'Bouzidi',    email: 'imane.b@outlook.com',     phone: '+212 612 300 002',
        formationId: fData.id,   status: InscriptionStatus.EVALUATED,  nationality: 'Marocaine', postalAddress: 'Rabat',
      },
      {
        firstName: 'Rachid',  lastName: 'El Amrani',  email: 'rachid.elamrani@gmail.com', phone: '+212 612 300 003',
        formationId: fDesign.id, status: InscriptionStatus.PENDING_SIGNATURE, nationality: 'Marocaine', postalAddress: 'Marrakech',
      },
      {
        firstName: 'Sofia',   lastName: 'Berrada',    email: 'sofia.berrada@gmail.com', phone: '+212 612 300 004',
        formationId: fCyber.id,  status: InscriptionStatus.ACCEPTED,   nationality: 'Marocaine', postalAddress: 'Casablanca',
      },
      {
        firstName: 'Khalid',  lastName: 'Mansouri',   email: 'khalid.m@gmail.com',      phone: '+212 612 300 005',
        formationId: fWeb.id,    status: InscriptionStatus.PENDING,    nationality: 'Franco-Marocaine', postalAddress: 'Agadir',
      },
    ],
  })
  console.log('✅ 5 inscriptions créées')

  // ── 10. Summary ──────────────────────────────────────────────────────────
  console.log('\n🎉 Base de données MIA Académie initialisée !\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 Comptes de test  |  Mot de passe : TestPassword123!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  🔑 Admin    :  ${admin.email}`)
  console.log(`  👨‍🏫 Trainer 1:  ${tuWeb.email}   (Web)`)
  console.log(`  👩‍🏫 Trainer 2:  ${tuData.email}  (Data)`)
  console.log(`  👨‍🏫 Trainer 3:  ${tuDesign.email} (Design)`)
  console.log('  👩‍🎓 Students  :  yasmine.b / omar.h / salma.k / amine.z / fatima.m / othmanou01')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n  Formations publiées :')
  console.log(`    • ${fWeb.title}           — 4 modules`)
  console.log(`    • ${fData.title}          — 5 modules`)
  console.log(`    • ${fDesign.title}        — 4 modules`)
  console.log(`    • ${fCyber.title}         — 4 modules`)
  console.log(`    • ${fMarketing.title}     — 3 modules (DRAFT)`)
  console.log('\n✨ Prêt à tester !\n')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
