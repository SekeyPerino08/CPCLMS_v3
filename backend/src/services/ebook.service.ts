// ============================================================
// E-Book Service — Full CRUD with search, filter, pagination
// ============================================================

import { prisma } from '../config';
import { NotFoundError, ConflictError } from '../utils/errors';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';

export class EBookService {
  /**
   * List e-books with search, filter, and pagination
   */
  async listEBooks(query: Record<string, unknown>) {
    const { page, limit, skip, take } = getPaginationParams(query);

    const where: Record<string, unknown> = {};

    // Search by title, author, ISBN
    if (query.search) {
      const search = query.search as string;
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search } },
      ];
    }

    // Filter by category
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    // Filter by format
    if (query.format) {
      where.format = query.format;
    }

    // Filter by language
    if (query.language) {
      where.language = query.language;
    }

    const [ebooks, total] = await Promise.all([
      prisma.eBook.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.eBook.count({ where }),
    ]);

    return {
      ebooks,
      meta: buildPaginationMeta(total, { page, limit, skip, take }),
    };
  }

  /**
   * Get a single e-book by ID
   */
  async getEBookById(id: string) {
    const ebook = await prisma.eBook.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!ebook) throw new NotFoundError('E-Book');
    return ebook;
  }

  /**
   * Create a new e-book
   */
  async createEBook(input: {
    isbn: string;
    title: string;
    author: string;
    publisher?: string;
    publishYear?: number;
    edition?: string;
    categoryId?: string;
    description?: string;
    coverImage?: string;
    language?: string;
    fileUrl: string;
    fileSize?: number;
    format?: string;
  }) {
    // Check for duplicate ISBN
    const existing = await prisma.eBook.findFirst({
      where: { isbn: input.isbn },
    });
    if (existing) {
      throw new ConflictError('An e-book with this ISBN already exists');
    }

    const ebook = await prisma.eBook.create({
      data: {
        isbn: input.isbn,
        title: input.title,
        author: input.author,
        publisher: input.publisher,
        publishYear: input.publishYear,
        edition: input.edition,
        categoryId: input.categoryId,
        description: input.description,
        coverImage: input.coverImage,
        language: input.language || 'English',
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        format: (input.format as any) || 'PDF',
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return ebook;
  }

  /**
   * Update an e-book
   */
  async updateEBook(
    id: string,
    input: Partial<{
      isbn: string;
      title: string;
      author: string;
      publisher: string;
      publishYear: number;
      edition: string;
      categoryId: string;
      description: string;
      coverImage: string;
      language: string;
      fileUrl: string;
      fileSize: number;
      format: string;
    }>
  ) {
    const ebook = await prisma.eBook.findUnique({ where: { id } });
    if (!ebook) throw new NotFoundError('E-Book');

    // If ISBN is being changed, check uniqueness
    if (input.isbn && input.isbn !== ebook.isbn) {
      const duplicate = await prisma.eBook.findFirst({
        where: { isbn: input.isbn, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictError('Another e-book with this ISBN already exists');
      }
    }

    const updated = await prisma.eBook.update({
      where: { id },
      data: input as any,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return updated;
  }

  /**
   * Delete an e-book
   */
  async deleteEBook(id: string) {
    const ebook = await prisma.eBook.findUnique({ where: { id } });
    if (!ebook) throw new NotFoundError('E-Book');

    await prisma.eBook.delete({ where: { id } });
  }
}

export const ebookService = new EBookService();

