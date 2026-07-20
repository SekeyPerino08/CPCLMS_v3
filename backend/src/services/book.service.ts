// ============================================================
// Book & Category Service
// ============================================================

import { Prisma, BookStatus } from '@prisma/client';
import { prisma } from '../config';
import { NotFoundError, ConflictError } from '../utils/errors';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';
import { CreateBookInput, UpdateBookInput, CreateCategoryInput } from '../validators';

export class BookService {
  // ============================================================
  // Physical Books
  // ============================================================

  /**
   * List all books with pagination, search, and filtering
   */
  async listBooks(query: Record<string, unknown>) {
    const { page, limit, skip, take } = getPaginationParams(query);

    const where: Prisma.BookWhereInput = {};

    // Search by title, author, ISBN
    if (query.search) {
      const search = query.search as string;
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search } },
        { accessionNo: { contains: search } },
      ];
    }

    // Filter by status
    if (query.status) {
      where.status = query.status as BookStatus;
    }

    // Filter by category
    if (query.categoryId) {
      where.categoryId = query.categoryId as string;
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.book.count({ where }),
    ]);

    return {
      books,
      meta: buildPaginationMeta(total, { page, limit, skip, take }),
    };
  }

  /**
   * Get book by ID
   */
  async getBookById(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        borrowTransactions: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, libraryId: true } },
          },
        },
        reservations: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, libraryId: true } },
          },
          orderBy: { queuePosition: 'asc' },
        },
      },
    });

    if (!book) throw new NotFoundError('Book');
    return book;
  }

  /**
   * Create a new book
   */
  async createBook(input: CreateBookInput) {
    const existing = await prisma.book.findUnique({
      where: { accessionNo: input.accessionNo },
    });
    if (existing) throw new ConflictError('Book with this accession number already exists');

    const book = await prisma.book.create({
      data: {
        ...input,
        availableCopies: input.copies,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return book;
  }

  /**
   * Update a book
   */
  async updateBook(id: string, input: UpdateBookInput) {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundError('Book');

    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...input,
        ...(input.copies !== undefined && {
          availableCopies: input.copies - (book.copies - book.availableCopies),
        }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return updated;
  }

  /**
   * Delete a book
   */
  async deleteBook(id: string) {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundError('Book');

    // Check for active transactions
    const activeTx = await prisma.borrowTransaction.count({
      where: { bookId: id, status: 'ACTIVE' },
    });
    if (activeTx > 0) {
      throw new ConflictError('Cannot delete book with active borrow transactions');
    }

    await prisma.book.delete({ where: { id } });
  }

  // ============================================================
  // Categories
  // ============================================================

  /**
   * List all categories (tree structure)
   */
  async listCategories() {
    const categories = await prisma.category.findMany({
      include: {
        children: { include: { _count: { select: { books: true, eBooks: true } } } },
        _count: { select: { books: true, eBooks: true } },
      },
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  /**
   * Create a category
   */
  async createCategory(input: CreateCategoryInput) {
    const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, '-');

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictError('Category with this slug already exists');

    const category = await prisma.category.create({
      data: { ...input, slug },
      include: { parent: { select: { id: true, name: true } } },
    });

    return category;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true } },
        _count: { select: { books: true, eBooks: true } },
      },
    });

    if (!category) throw new NotFoundError('Category');
    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, input: Partial<CreateCategoryInput>) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category');

    const data: any = { ...input };
    if (input.name && !input.slug) {
      data.slug = input.name.toLowerCase().replace(/\s+/g, '-');
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { books: true, eBooks: true } },
      },
    });

    return updated;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category');

    const bookCount = await prisma.book.count({ where: { categoryId: id } });
    if (bookCount > 0) {
      throw new ConflictError('Cannot delete category with associated books');
    }

    await prisma.category.delete({ where: { id } });
  }
}

export const bookService = new BookService();

