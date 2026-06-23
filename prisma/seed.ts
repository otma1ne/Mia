import {
  PrismaClient,
  UserRole,
  FormationStatus,
  FormationType,
  ModuleStatus,
  ModuleType,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Initialisation minimale de la base de données...')

  // ─────────────────────────────────────────
  // Nettoyage complet
  // ─────────────────────────────────────────
  await prisma.attendance.deleteMany()
  await prisma.moduleEnrollment.deleteMany()
  await prisma.formationEnrollment.deleteMany()
  await prisma.session.deleteMany()
  await prisma.materialProgress.deleteMany()
  await prisma.moduleMaterial.deleteMany()
  await prisma.module.deleteMany()
  await prisma.inscription.deleteMany()
  await prisma.formation.deleteMany()
await prisma.trainerAvailability.deleteMany()
  await prisma.trainer.deleteMany()
  await prisma.category.deleteMany()
  await prisma.operatingHours.deleteMany()
  await prisma.room.deleteMany()
  await prisma.center.deleteMany()
  await prisma.user.deleteMany()

  // ─────────────────────────────────────────
  // Centre
  // ─────────────────────────────────────────
  const center = await prisma.center.create({
    data: {
      name: 'Auto-École MIA Formation',
      address: '45 Avenue de la Liberté, Casablanca 20250, Maroc',
      phone: '+212 522 456 789',
      email: 'contact@miaformation.ma',
      description: 'Auto-école agréée proposant des formations au permis de conduire.',
      operatingHours: {
        create: [
          { dayOfWeek: 1, open: '09:00', close: '18:00' },
          { dayOfWeek: 2, open: '09:00', close: '18:00' },
          { dayOfWeek: 3, open: '09:00', close: '18:00' },
          { dayOfWeek: 4, open: '09:00', close: '18:00' },
          { dayOfWeek: 5, open: '09:00', close: '18:00' },
        ],
      },
      rooms: {
        create: [
          { name: 'Salle A', capacity: 20 },
        ],
      },
    },
    include: { rooms: true },
  })
  console.log(`✅ Centre créé : ${center.name}`)

  // ─────────────────────────────────────────
  // Catégorie
  // ─────────────────────────────────────────
  const permisB = await prisma.category.create({
    data: { name: 'Permis B', description: 'Formation au permis de conduire voiture' },
  })
  console.log('✅ Catégorie créée')

  // ─────────────────────────────────────────
  // Utilisateurs (minimal: 1 admin, 1 trainer)
  // ─────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('TestPassword123!', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      phone: '+212 661 000 001',
    },
  })

  const trainerUser = await prisma.user.create({
    data: {
      email: 'trainer@example.com',
      password: hashedPassword,
      name: 'Trainer User',
      role: UserRole.TRAINER,
      phone: '+212 661 100 001',
    },
  })

  console.log('✅ Utilisateurs créés')

  // ─────────────────────────────────────────
  // Trainer Profile
  // ─────────────────────────────────────────
  const trainer = await prisma.trainer.create({
    data: {
      userId: trainerUser.id,
      bio: 'Moniteur agréé avec expérience.',
      specializations: ['Permis B'],
      credentials: ['BEPECASER'],
      rating: 5,
      expertiseLevels: ['EXPERT'],
      cvUrl: 'https://example.com/seed-cv.pdf',
      diplomeUrl: 'https://example.com/seed-diplome.pdf',
      availability: {
        create: [
          { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' },
          { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
          { dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
          { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
          { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
        ],
      },
    },
  })
  console.log('✅ Trainer profil créé')

  // ─────────────────────────────────────────
  // Formation avec 3 Modules
  // ─────────────────────────────────────────
  const formation = await prisma.formation.create({
    data: {
      title: 'Formation Permis B — Voiture',
      description: 'Formation complète au permis B : code de la route et conduite pratique.',
      categoryId: permisB.id,
      type: FormationType.PRESENTIAL,
      status: FormationStatus.PUBLISHED,
      maxStudents: 20,
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-09-30'),
    },
  })
  console.log('✅ Formation créée')

  // Module 1 — Théorie (no materials - added via materials section)
  const module1 = await prisma.module.create({
    data: {
      formationId: formation.id,
      title: 'Code de la route — Théorie',
      description: 'Maîtrisez les règles de circulation et la signalisation.',
      orderIndex: 0,
      type: ModuleType.THEORY,
      status: ModuleStatus.PUBLISHED,
      duration: 20,
    },
  })

  // Module 2 — Évaluation
  const module2 = await prisma.module.create({
    data: {
      formationId: formation.id,
      title: 'Examen blanc — Code',
      description: 'Simulez les conditions réelles de l\'examen.',
      orderIndex: 1,
      type: ModuleType.ASSESSMENT,
      status: ModuleStatus.PUBLISHED,
      duration: 40,
    },
  })

  // Module 3 — Conduite Pratique
  const module3 = await prisma.module.create({
    data: {
      formationId: formation.id,
      title: 'Conduite pratique — Voiture',
      description: 'Séances de conduite avec votre moniteur.',
      orderIndex: 2,
      type: ModuleType.PRACTICAL,
      status: ModuleStatus.PUBLISHED,
      duration: 0,
      trainerId: trainer.id,
    },
  })

  console.log('✅ 3 Modules créés')

  // ─────────────────────────────────────────
  // Test Data: Ended Formation for Bilan Testing
  // ─────────────────────────────────────────
  const student = await prisma.user.create({
    data: {
      email: 'othmanou01@gmail.com',
      name: 'Othman Test Student',
      password: await bcrypt.hash('TestPassword123!', 12),
      role: UserRole.STUDENT,
      phone: '+212 612 345 678',
    },
  })

  // Create an ended formation for testing bilans
  const endedFormation = await prisma.formation.create({
    data: {
      title: 'Formation Test - Bilan Ended',
      description: 'Test formation to verify bilan workflow - This formation has ended.',
      categoryId: permisB.id,
      type: FormationType.PRESENTIAL,
      status: FormationStatus.PUBLISHED,
      maxStudents: 20,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (ENDED)
    },
  })

  // Create modules for ended formation
  const endedModule1 = await prisma.module.create({
    data: {
      formationId: endedFormation.id,
      title: 'Test Module 1',
      description: 'First test module',
      orderIndex: 0,
      type: ModuleType.THEORY,
      status: ModuleStatus.PUBLISHED,
      duration: 20,
    },
  })

  const endedModule2 = await prisma.module.create({
    data: {
      formationId: endedFormation.id,
      title: 'Test Module 2',
      description: 'Second test module',
      orderIndex: 1,
      type: ModuleType.THEORY,
      status: ModuleStatus.PUBLISHED,
      duration: 20,
    },
  })

  // Enroll student in ended formation
  const endedFormationEnrollment = await prisma.formationEnrollment.create({
    data: {
      userId: student.id,
      formationId: endedFormation.id,
      status: 'ACTIVE',
      progress: 100,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  })

  // Create module enrollments for student
  await prisma.moduleEnrollment.createMany({
    data: [
      {
        userId: student.id,
        moduleId: endedModule1.id,
        formationEnrollmentId: endedFormationEnrollment.id,
        status: 'ACTIVE',
        progress: 100,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: student.id,
        moduleId: endedModule2.id,
        formationEnrollmentId: endedFormationEnrollment.id,
        status: 'ACTIVE',
        progress: 100,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  })

  console.log('✅ Test Data Created:')
  console.log(`   📧 Student: ${student.email}`)
  console.log(`   📚 Ended Formation: ${endedFormation.title}`)
  console.log(`   ✓ Enrollment Status: ACTIVE`)
  console.log(`   ✓ Progress: 100% (Completed 2 days ago)`)

  // ─────────────────────────────────────────
  // Résumé
  // ─────────────────────────────────────────
  console.log('\n🎉 Base de données initialisée !\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 Comptes de test  |  Mot de passe : TestPassword123!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  🔑 Admin     :  ${admin.email}`)
  console.log(`  🚗 Trainer   :  ${trainerUser.email}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n✨ Prêt à commencer les tests !\n')
}

main()
  .catch(e => {
    console.error('❌ Échec du seed :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
