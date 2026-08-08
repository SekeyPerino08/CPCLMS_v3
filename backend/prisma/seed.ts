// ============================================================
// Smart Library Management System - Seed Data
// ============================================================

import { PrismaClient, Role, BookStatus, EBookFormat } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.borrowTransaction.deleteMany();
  await prisma.borrowRequest.deleteMany();
  await prisma.eBook.deleteMany();
  await prisma.book.deleteMany();
  await prisma.category.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.user.deleteMany();

// ============================================================
  // 1. USERS
  // ============================================================
  const hashedPassword = await bcrypt.hash('password123', 10);
  const librarian123 = await bcrypt.hash('librarian123', 10);
  const student123 = await bcrypt.hash('student123', 10);

  // ── Demo Librarian (ID: 2025-0001 / librarian123) ──────────
  const librarian1 = await prisma.user.create({
    data: {
      libraryId: '2025-0001',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria.santos@library.edu',
      password: librarian123,
      role: Role.LIBRARIAN,
      department: 'Library Services',
      phone: '+63-912-345-6789',
    },
  });

  const librarian2 = await prisma.user.create({
    data: {
      libraryId: 'LIB-2024-0002',
      firstName: 'Juan',
      lastName: 'Cruz',
      email: 'juan.cruz@library.edu',
      password: hashedPassword,
      role: Role.LIBRARIAN,
      department: 'Library Services',
      phone: '+63-923-456-7890',
    },
  });

  const faculty = await prisma.user.create({
    data: {
      libraryId: 'LIB-2024-0003',
      firstName: 'Ana',
      lastName: 'Reyes',
      email: 'ana.reyes@university.edu',
      password: hashedPassword,
      role: Role.FACULTY,
      department: 'Computer Science',
      phone: '+63-934-567-8901',
    },
  });

// ── Demo Student (ID: 2025-1001 / student123) ──────────────
  const student1 = await prisma.user.create({
    data: {
      libraryId: '2025-1001',
      firstName: 'Carlos',
      lastName: 'Garcia',
      email: 'carlos.garcia@student.edu',
      password: student123,
      role: Role.STUDENT,
      department: 'Computer Science',
      yearSection: '3-BSIT',
      phone: '+63-945-678-9012',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      libraryId: 'LIB-2024-0005',
      firstName: 'Bella',
      lastName: 'Mendoza',
      email: 'bella.mendoza@student.edu',
      password: hashedPassword,
      role: Role.STUDENT,
      department: 'Engineering',
      yearSection: '2-BSCE',
      phone: '+63-956-789-0123',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      libraryId: 'LIB-2024-0006',
      firstName: 'David',
      lastName: 'Tan',
      email: 'david.tan@student.edu',
      password: hashedPassword,
      role: Role.STUDENT,
      department: 'Mathematics',
      yearSection: '1-BSMATH',
      phone: '+63-967-890-1234',
    },
  });

  console.log('✅ Users seeded');

  // ============================================================
  // 2. CATEGORIES (with parent-child hierarchy)
  // ============================================================
  const science = await prisma.category.create({
    data: {
      name: 'Science',
      slug: 'science',
      description: 'Scientific books covering various disciplines',
    },
  });

  const computerScience = await prisma.category.create({
    data: {
      name: 'Computer Science',
      slug: 'computer-science',
      description: 'Computing, programming, and software development',
      parentId: science.id,
    },
  });

  const physics = await prisma.category.create({
    data: {
      name: 'Physics',
      slug: 'physics',
      description: 'Physics and natural sciences',
      parentId: science.id,
    },
  });

  const mathematics = await prisma.category.create({
    data: {
      name: 'Mathematics',
      slug: 'mathematics',
      description: 'Mathematics and statistics',
    },
  });

  const history = await prisma.category.create({
    data: {
      name: 'History',
      slug: 'history',
      description: 'Historical books and references',
    },
  });

  const technology = await prisma.category.create({
    data: {
      name: 'Technology',
      slug: 'technology',
      description: 'Technology and engineering',
    },
  });

  const fiction = await prisma.category.create({
    data: {
      name: 'Fiction',
      slug: 'fiction',
      description: 'Literary fiction and novels',
    },
  });

  console.log('✅ Categories seeded');

  // ============================================================
  // 3. PHYSICAL BOOKS
  // ============================================================
  const books = [
    {
      isbn: '978-0-13-110362-7',
      accessionNo: 'ACC-2024-001',
      title: 'The C Programming Language',
      author: 'Brian Kernighan, Dennis Ritchie',
      publisher: 'Prentice Hall',
      publishYear: 1988,
      edition: '2nd',
      pages: 272,
      categoryId: computerScience.id,
      description: 'The classic guide to C programming, still relevant today.',
      language: 'English',
      shelf: 'A1',
      row: '01',
      copies: 3,
      availableCopies: 3,
      status: BookStatus.AVAILABLE,
    },
    {
      isbn: '978-0-262-03384-8',
      accessionNo: 'ACC-2024-002',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen, Charles E. Leiserson',
      publisher: 'MIT Press',
      publishYear: 2009,
      edition: '3rd',
      pages: 1312,
      categoryId: computerScience.id,
      description: 'Comprehensive textbook on algorithms and data structures.',
      language: 'English',
      shelf: 'A1',
      row: '02',
      copies: 2,
      availableCopies: 2,
      status: BookStatus.AVAILABLE,
    },
    {
      isbn: '978-1-59327-599-0',
      accessionNo: 'ACC-2024-003',
      title: 'The Go Programming Language',
      author: 'Alan A. A. Donovan, Brian Kernighan',
      publisher: 'Addison-Wesley',
      publishYear: 2015,
      edition: '1st',
      pages: 400,
      categoryId: computerScience.id,
      description: 'Authoritative guide to the Go programming language.',
      language: 'English',
      shelf: 'A1',
      row: '03',
      copies: 3,
      availableCopies: 3,
      status: BookStatus.AVAILABLE,
    },
    {
      isbn: '978-0-201-63361-0',
      accessionNo: 'ACC-2024-004',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      publisher: 'Addison-Wesley',
      publishYear: 1994,
      edition: '1st',
      pages: 416,
      categoryId: computerScience.id,
      description: 'The seminal work on design patterns in software engineering.',
      language: 'English',
      shelf: 'A2',
      row: '01',
      copies: 2,
      availableCopies: 2,
      status: BookStatus.AVAILABLE,
    },
    {
      isbn: '978-0-387-95069-9',
      accessionNo: 'ACC-2024-005',
      title: 'Principles of Mathematical Analysis',
      author: 'Walter Rudin',
      publisher: 'McGraw-Hill',
      publishYear: 1976,
      edition: '3rd',
      pages: 342,
      categoryId: mathematics.id,
      description: 'Standard text for advanced calculus and analysis.',
      language: 'English',
      shelf: 'B1',
      row: '01',
      copies: 2,
      availableCopies: 2,
      status: BookStatus.AVAILABLE,
    },
    {
      isbn: '978-0-691-11380-9',
      accessionNo: 'ACC-2024-006',
      title: 'The Feynman Lectures on Physics',
      author: 'Richard P. Feynman',
      publisher: 'Basic Books',
      publishYear: 2011,
      edition: 'The New Millennium',
      pages: 1552,
      categoryId: physics.id,
      description: 'Classic physics lectures by the legendary Richard Feynman.',
      language: 'English',
      shelf: 'B2',
      row: '01',
      copies: 2,
      availableCopies: 2,
      status: BookStatus.AVAILABLE,
    },
    {
      isbn: '978-0-14-303943-3',
      accessionNo: 'ACC-2024-007',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      publisher: 'Bantam',
      publishYear: 1998,
      edition: '10th',
      pages: 212,
      categoryId: physics.id,
      description: 'Hawking explores the nature of time and the universe.',
      language: 'English',
      shelf: 'B2',
      row: '02',
      copies: 3,
      availableCopies: 3,
      status: BookStatus.AVAILABLE,
    },
    {
      isbn: '978-0-465-06710-5',
      accessionNo: 'ACC-2024-008',
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      publisher: 'Harper',
      publishYear: 2015,
      edition: '1st',
      pages: 464,
      categoryId: history.id,
      description: 'A sweeping history of humankind from the Stone Age to the modern age.',
      language: 'English',
      shelf: 'C1',
      row: '01',
      copies: 3,
      availableCopies: 3,
      status: BookStatus.AVAILABLE,
    },
    {
      isbn: '978-0-7432-7356-5',
      accessionNo: 'ACC-2024-009',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      publisher: 'J.B. Lippincott & Co.',
      publishYear: 1960,
      edition: '1st',
      pages: 281,
      categoryId: fiction.id,
      description: 'A novel about racial injustice in the Deep South.',
      language: 'English',
      shelf: 'D1',
      row: '01',
      copies: 4,
      availableCopies: 4,
      status: BookStatus.AVAILABLE,
    },
    {
      isbn: '978-0-321-99278-9',
      accessionNo: 'ACC-2024-010',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      publishYear: 2008,
      edition: '1st',
      pages: 464,
      categoryId: computerScience.id,
      description: 'Essential reading for every software developer.',
      language: 'English',
      shelf: 'A2',
      row: '02',
      copies: 3,
      availableCopies: 3,
      status: BookStatus.AVAILABLE,
    },
  ];

  for (const bookData of books) {
    await prisma.book.create({ data: bookData });
  }

  console.log('✅ Physical books seeded');

  // ============================================================
  // 4. E-BOOKS
  // ============================================================
  const eBooks = [
    {
      isbn: '978-1-098-12345-6',
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      publishYear: 2017,
      edition: '1st',
      categoryId: computerScience.id,
      description: 'A craftsman\'s guide to software structure and design.',
      language: 'English',
      fileUrl: 'https://ebooks.library.edu/clean-architecture.pdf',
      fileSize: 5_240_000,
      format: EBookFormat.PDF,
    },
    {
      isbn: '978-1-098-12345-7',
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt, David Thomas',
      publisher: 'Addison-Wesley',
      publishYear: 2019,
      edition: '20th Anniversary',
      categoryId: computerScience.id,
      description: 'Timeless tips for software engineers.',
      language: 'English',
      fileUrl: 'https://ebooks.library.edu/pragmatic-programmer.pdf',
      fileSize: 3_800_000,
      format: EBookFormat.PDF,
    },
    {
      isbn: '978-1-098-12345-8',
      title: 'The Art of War',
      author: 'Sun Tzu',
      publisher: 'Various',
      publishYear: -500,
      edition: 'Annotated',
      categoryId: history.id,
      description: 'Ancient Chinese military treatise.',
      language: 'English',
      fileUrl: 'https://ebooks.library.edu/art-of-war.epub',
      fileSize: 1_200_000,
      format: EBookFormat.EPUB,
    },
    {
      isbn: '978-1-098-12345-9',
      title: 'Calculus: Early Transcendentals',
      author: 'James Stewart',
      publisher: 'Cengage',
      publishYear: 2015,
      edition: '8th',
      categoryId: mathematics.id,
      description: 'Comprehensive calculus textbook.',
      language: 'English',
      fileUrl: 'https://ebooks.library.edu/calculus-stewart.pdf',
      fileSize: 25_600_000,
      format: EBookFormat.PDF,
    },
    {
      isbn: '978-1-098-12346-0',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      publisher: 'Charles Scribner\'s Sons',
      publishYear: 1925,
      edition: '1st',
      categoryId: fiction.id,
      description: 'A story of decadence, idealism, and excess.',
      language: 'English',
      fileUrl: 'https://ebooks.library.edu/great-gatsby.mobi',
      fileSize: 890_000,
      format: EBookFormat.MOBI,
    },
  ];

  for (const eBookData of eBooks) {
    await prisma.eBook.create({ data: eBookData });
  }

  console.log('✅ E-Books seeded');

  // ============================================================
  // 5. POLICIES
  // ============================================================
  const policies = [
    {
      key: 'MAX_BORROW_DAYS',
      value: '14',
      description: 'Maximum number of days a book can be borrowed',
    },
    {
      key: 'MAX_BOOKS_PER_USER',
      value: '5',
      description: 'Maximum number of books a user can borrow at once',
    },
    {
      key: 'FINE_PER_DAY',
      value: '10.00',
      description: 'Daily fine amount for overdue books (in PHP)',
    },
    {
      key: 'MAX_RESERVATION_DAYS',
      value: '3',
      description: 'Days a reserved book is held before being released',
    },
    {
      key: 'RESERVATION_QUEUE_LIMIT',
      value: '10',
      description: 'Maximum number of reservations per book',
    },
    {
      key: 'FACULTY_MAX_BORROW_DAYS',
      value: '30',
      description: 'Maximum borrow days for faculty members',
    },
    {
      key: 'FACULTY_MAX_BOOKS',
      value: '10',
      description: 'Maximum books faculty can borrow at once',
    },
    {
      key: 'LIBRARY_OPEN_TIME',
      value: '08:00',
      description: 'Library opening time',
    },
    {
      key: 'LIBRARY_CLOSE_TIME',
      value: '20:00',
      description: 'Library closing time',
    },
  ];

  for (const policy of policies) {
    await prisma.policy.create({ data: policy });
  }

  console.log('✅ Policies seeded');

  // ============================================================
  // 6. SAMPLE BORROW REQUESTS (for demo)
  // ============================================================
  const firstBook = await prisma.book.findFirst({ where: { accessionNo: 'ACC-2024-001' } });
  const thirdBook = await prisma.book.findFirst({ where: { accessionNo: 'ACC-2024-003' } });

  if (firstBook) {
    await prisma.borrowRequest.create({
      data: {
        userId: student1.id,
        bookId: firstBook.id,
        status: 'PENDING',
        notes: 'Need for CPROG 101 project reference',
      },
    });
  }

  if (thirdBook) {
    await prisma.borrowRequest.create({
      data: {
        userId: student2.id,
        bookId: thirdBook.id,
        status: 'APPROVED',
        processedById: librarian1.id,
        processedAt: new Date(),
        notes: 'Approved for research paper',
      },
    });
  }

  console.log('✅ Sample borrow requests seeded');

  // ============================================================
  // 7. SAMPLE ACTIVITY LOGS
  // ============================================================
  await prisma.activityLog.create({
    data: {
      userId: librarian1.id,
      action: 'SEED_INIT',
      entity: 'System',
      details: { message: 'Database seeded with sample data' },
    },
  });

  console.log('✅ Activity logs seeded');

  console.log('');
  console.log('🎉 Database seeding complete!');
  console.log('');
console.log('📋 Demo Accounts:');
  console.log('   Librarian: 2025-0001 / librarian123');
  console.log('   Student:   2025-1001 / student123');
  console.log('   Guest:     Use "Login as Guest" button');
  console.log('');
  console.log('📋 Other Seed Accounts (password: password123 for all):');
  console.log('   Librarian: maria.santos@library.edu');
  console.log('   Librarian: juan.cruz@library.edu');
  console.log('   Faculty:   ana.reyes@university.edu');
  console.log('   Student:   carlos.garcia@student.edu');
  console.log('   Student:   bella.mendoza@student.edu');
  console.log('   Student:   david.tan@student.edu');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

