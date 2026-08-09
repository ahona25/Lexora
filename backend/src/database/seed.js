const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const config = require('../config');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LegalConnect Database Seeding...');

  // 1. Clean existing data (Optional for dev reset)
  console.log('🧹 Cleaning old records...');
  await prisma.auditLog.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.review.deleteMany();
  await prisma.document.deleteMany();
  await prisma.lawyerDocument.deleteMany();
  await prisma.verificationDocument.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.blockedSchedule.deleteMany();
  await prisma.availabilitySchedule.deleteMany();
  await prisma.lawyerSpecialization.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.lawyerProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Specializations
  console.log('📌 Creating Specializations...');
  const specializationsData = [
    { name: 'Criminal Law', description: 'Defense against criminal charges, bail, court proceedings, and appeal cases.', icon: 'ShieldAlert', displayOrder: 1 },
    { name: 'Civil Law', description: 'Property disputes, contract enforcement, injunctions, and recovery suits.', icon: 'Scale', displayOrder: 2 },
    { name: 'Family Law', description: 'Marriage, custody, alimony, guardianship, and inheritance disputes.', icon: 'Users', displayOrder: 3 },
    { name: 'Divorce Law', description: 'Legal separation, dower, maintenance, and marital property settlement.', icon: 'FileText', displayOrder: 4 },
    { name: 'Property Law', description: 'Deed registration, land title verification, eviction, and boundary disputes.', icon: 'Building', displayOrder: 5 },
    { name: 'Corporate Law', description: 'Company formation, partnership agreements, compliance, and mergers.', icon: 'Briefcase', displayOrder: 6 },
    { name: 'Employment Law', description: 'Wrongful termination, labor rights, workplace discrimination, and contracts.', icon: 'UserCheck', displayOrder: 7 },
    { name: 'Cyber Law', description: 'Online fraud, IT Act violations, defamation, data privacy, and IP theft.', icon: 'Lock', displayOrder: 8 },
    { name: 'Tax Law', description: 'Income tax filing, VAT audits, tax evasion appeals, and corporate tax.', icon: 'Receipt', displayOrder: 9 },
    { name: 'Intellectual Property', description: 'Trademarks, patents, copyright protection, and licensing.', icon: 'Award', displayOrder: 10 },
  ];

  const createdSpecs = [];
  for (const spec of specializationsData) {
    const created = await prisma.specialization.create({ data: spec });
    createdSpecs.push(created);
  }

  // 3. Create Admin Account
  console.log('👑 Creating Admin User...');
  const adminPasswordHash = await bcrypt.hash(config.admin.password, 10);
  const adminUser = await prisma.user.create({
    data: {
      email: config.admin.email,
      password: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      adminProfile: {
        create: {
          firstName: 'Platform',
          lastName: 'Administrator',
          permissions: ['ALL'],
        },
      },
    },
  });

  // 4. Create Lawyers
  console.log('⚖️ Creating Verified & Featured Lawyers...');
  const defaultPassword = await bcrypt.hash('Lawyer123!', 10);

  const lawyersData = [
    {
      email: 'adv.rahul@legalconnect.com',
      firstName: 'Advocate Rahul',
      lastName: 'Amin',
      title: 'Senior Advocate, Supreme Court of Bangladesh',
      barNumber: 'BD-BAR-88421',
      years: 14,
      fee: 2500,
      rating: 4.9,
      reviewsCount: 48,
      consultationsCount: 120,
      city: 'Dhaka',
      office: 'Suite 402, Supreme Court Bar Association Building, Segunbagicha, Dhaka',
      bio: 'Advocate Rahul Amin is a veteran Supreme Court advocate specializing in High Court writ petitions, corporate compliance, property title litigation, and complex civil disputes with over 14 years of practice.',
      specIndex: [1, 4, 5], // Civil, Property, Corporate
      verified: true,
    },
    {
      email: 'adv.nusrat@legalconnect.com',
      firstName: 'Adv. Nusrat',
      lastName: 'Jahan',
      title: 'Family & Divorce Law Specialist',
      barNumber: 'BD-BAR-94210',
      years: 9,
      fee: 1800,
      rating: 4.8,
      reviewsCount: 35,
      consultationsCount: 89,
      city: 'Dhaka',
      office: 'House 12, Road 7, Dhanmondi, Dhaka',
      bio: 'Adv. Nusrat Jahan is a compassionate and sharp legal advocate focusing on Muslim Family Law, divorce settlement, child custody battles, and domestic violence protection cases.',
      specIndex: [2, 3], // Family, Divorce
      verified: true,
    },
    {
      email: 'adv.kazi@legalconnect.com',
      firstName: 'Kazi Tanvir',
      lastName: 'Hossain',
      title: 'Criminal Defense & Bail Specialist',
      barNumber: 'BD-BAR-77192',
      years: 16,
      fee: 3000,
      rating: 4.95,
      reviewsCount: 64,
      consultationsCount: 210,
      city: 'Chittagong',
      office: 'Court Hill Chamber 5, Agrabad, Chittagong',
      bio: 'Specialist criminal defense attorney with proven track record in sessions court trials, ACC corruption defense, anticipatory bail, and penal code litigation.',
      specIndex: [0, 7], // Criminal, Cyber
      verified: true,
    },
    {
      email: 'adv.sumaiya@legalconnect.com',
      firstName: 'Barrister Sumaiya',
      lastName: 'Khan',
      title: 'Corporate & Cyber Law Attorney (Lincoln’s Inn)',
      barNumber: 'BD-BAR-66291',
      years: 7,
      fee: 3500,
      rating: 4.7,
      reviewsCount: 22,
      consultationsCount: 54,
      city: 'Dhaka',
      office: 'Level 14, Gulshan Centre Point, Gulshan 2, Dhaka',
      bio: 'Barrister Sumaiya Khan trained at Lincoln’s Inn, London. She advises tech startups, multinational corporations, data privacy compliance, and IT Act cyber defense.',
      specIndex: [5, 7, 9], // Corporate, Cyber, IP
      verified: true,
    },
    {
      email: 'adv.mahbub@legalconnect.com',
      firstName: 'Adv. Mahbubur',
      lastName: 'Rahman',
      title: 'Tax & Employment Legal Advisor',
      barNumber: 'BD-BAR-55102',
      years: 11,
      fee: 2000,
      rating: 4.6,
      reviewsCount: 19,
      consultationsCount: 43,
      city: 'Sylhet',
      office: 'Zindabazar Commercial Complex, Sylhet',
      bio: 'Experienced tax consultant and labor lawyer assisting clients with NBR tax tribunals, employment contracts, trade union negotiations, and termination disputes.',
      specIndex: [6, 8], // Employment, Tax
      verified: true,
    },
  ];

  const createdLawyers = [];

  for (const lawyer of lawyersData) {
    const user = await prisma.user.create({
      data: {
        email: lawyer.email,
        password: defaultPassword,
        role: 'LAWYER',
        status: 'ACTIVE',
        emailVerified: true,
        lawyerProfile: {
          create: {
            firstName: lawyer.firstName,
            lastName: lawyer.lastName,
            professionalTitle: lawyer.title,
            barNumber: lawyer.barNumber,
            yearsOfExperience: lawyer.years,
            consultationFee: lawyer.fee,
            averageRating: lawyer.rating,
            totalReviews: lawyer.reviewsCount,
            totalConsultations: lawyer.consultationsCount,
            city: lawyer.city,
            officeAddress: lawyer.office,
            biography: lawyer.bio,
            verificationStatus: 'APPROVED',
            isPubliclyVisible: true,
            isAvailableForOnline: true,
            isAvailableForInPerson: true,
            verifiedAt: new Date(),
            verifiedByAdminId: adminUser.id,
            education: [
              { degree: 'LL.B (Honours)', institution: 'University of Dhaka', year: '2010' },
              { degree: 'LL.M', institution: 'University of London', year: '2012' }
            ],
            languages: ['English', 'Bangla'],
          },
        },
      },
      include: { lawyerProfile: true },
    });

    createdLawyers.push(user.lawyerProfile);

    // Attach specializations
    for (let idx of lawyer.specIndex) {
      await prisma.lawyerSpecialization.create({
        data: {
          lawyerProfileId: user.lawyerProfile.id,
          specializationId: createdSpecs[idx].id,
          isPrimary: idx === lawyer.specIndex[0],
        },
      });
    }

    // Set Availability Schedules (Mon-Fri 09:00 - 17:00)
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    for (const day of days) {
      await prisma.availabilitySchedule.create({
        data: {
          lawyerProfileId: user.lawyerProfile.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 60,
          breakStart: '13:00',
          breakEnd: '14:00',
          isActive: true,
        },
      });
    }
  }

  // 5. Create Sample Client Users
  console.log('👤 Creating Client Users...');
  const clientPasswordHash = await bcrypt.hash('Client123!', 10);
  
  const clientsData = [
    { email: 'client.tariq@gmail.com', firstName: 'Tariqul', lastName: 'Islam', phone: '+8801711223344', city: 'Dhaka' },
    { email: 'client.sadia@gmail.com', firstName: 'Sadia', lastName: 'Parveen', phone: '+8801811223355', city: 'Chittagong' },
  ];

  const createdClients = [];
  for (const client of clientsData) {
    const user = await prisma.user.create({
      data: {
        email: client.email,
        phone: client.phone,
        password: clientPasswordHash,
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: true,
        clientProfile: {
          create: {
            firstName: client.firstName,
            lastName: client.lastName,
            city: client.city,
            country: 'Bangladesh',
          },
        },
      },
      include: { clientProfile: true },
    });
    createdClients.push(user.clientProfile);
  }

  // 6. Create Seed Appointment & Review
  console.log('📅 Creating Sample Appointments & Reviews...');
  const sampleApt = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-000001',
      clientProfileId: createdClients[0].id,
      lawyerProfileId: createdLawyers[0].id,
      consultationType: 'VIDEO',
      appointmentDate: new Date(),
      startTime: '10:00',
      endTime: '11:00',
      status: 'COMPLETED',
      caseTitle: 'Property Title Verification & Registration Dispute',
      caseCategory: 'Property Law',
      caseDescription: 'Need clarification on ancestral land title Deed No. 4410 and court injunction stay order.',
      consultationFee: 2500,
      platformFee: 250,
      totalAmount: 2750,
      completedAt: new Date(),
    },
  });

  await prisma.review.create({
    data: {
      appointmentId: sampleApt.id,
      clientProfileId: createdClients[0].id,
      lawyerProfileId: createdLawyers[0].id,
      rating: 5,
      reviewText: 'Advocate Rahul Amin was extremely thorough in explaining the land deed title history. Highly recommended!',
    },
  });

  console.log('✅ LegalConnect Database Seeding Complete!');
  console.log(`
  👑 Admin Login: ${config.admin.email} / ${config.admin.password}
  ⚖️ Lawyer Login: adv.rahul@legalconnect.com / Lawyer123!
  👤 Client Login: client.tariq@gmail.com / Client123!
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
