// ============================================================
// Report Generation Service
// - PDF reports (pdf-lib)
// - Excel reports (exceljs)
// ============================================================

import { prisma } from '../config';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ExcelJS from 'exceljs';

export type ReportType = 'books' | 'transactions' | 'users' | 'overdue' | 'reservations';
export type ExportFormat = 'pdf' | 'xlsx';

export class ReportService {
  /**
   * Generate a report based on type and format
   */
  async generateReport(type: ReportType, format: ExportFormat): Promise<Buffer> {
    switch (type) {
      case 'books':
        return format === 'pdf' ? this.generateBooksPDF() : this.generateBooksExcel();
      case 'transactions':
        return format === 'pdf' ? this.generateTransactionsPDF() : this.generateTransactionsExcel();
      case 'users':
        return format === 'pdf' ? this.generateUsersPDF() : this.generateUsersExcel();
      case 'overdue':
        return format === 'pdf' ? this.generateOverduePDF() : this.generateOverdueExcel();
      case 'reservations':
        return format === 'pdf' ? this.generateReservationsPDF() : this.generateReservationsExcel();
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  // ============================================================
  // PDF GENERATORS
  // ============================================================

  private async createPDF(title: string, headers: string[], rows: string[][]): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    let page = doc.addPage([612, 792]); // US Letter
    const { width, height } = page.getSize();
    const margin = 50;
    const lineHeight = 18;

    // Title
    page.drawText(title, {
      x: margin,
      y: height - margin,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.3),
    });

    // Date
    const dateStr = new Date().toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    page.drawText(`Generated: ${dateStr}`, {
      x: margin,
      y: height - margin - 25,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    let y = height - margin - 55;

    // Draw header row
    const colWidth = (width - 2 * margin) / headers.length;
    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], {
        x: margin + i * colWidth + 2,
        y,
        size: 9,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.3),
      });
    }

    // Header underline
    page.drawLine({
      start: { x: margin, y: y - 3 },
      end: { x: width - margin, y: y - 3 },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= lineHeight;

    // Draw data rows
    for (const row of rows) {
      // Check if we need a new page
      if (y < margin + 40) {
        page = doc.addPage([612, 792]);
        y = height - margin;
      }

      for (let i = 0; i < row.length; i++) {
        page.drawText(String(row[i] || ''), {
          x: margin + i * colWidth + 2,
          y,
          size: 8,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
      y -= lineHeight;
    }

    // Footer with page number
    page.drawText(`Page ${doc.getPageCount()}`, {
      x: width - margin - 40,
      y: margin - 20,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await doc.save();
    return Buffer.from(pdfBytes);
  }

  private async generateBooksPDF(): Promise<Buffer> {
    const books = await prisma.book.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { title: 'asc' },
      take: 500,
    });

    const headers = ['Accession No', 'ISBN', 'Title', 'Author', 'Category', 'Copies', 'Available', 'Status'];
    const rows = books.map((b) => [
      b.accessionNo,
      b.isbn,
      b.title.substring(0, 35),
      b.author.substring(0, 25),
      b.category?.name || '-',
      String(b.copies),
      String(b.availableCopies),
      b.status,
    ]);

    return this.createPDF(`Library Book Catalog (${books.length} books)`, headers, rows);
  }

  private async generateTransactionsPDF(): Promise<Buffer> {
    const txns = await prisma.borrowTransaction.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, libraryId: true } },
        book: { select: { title: true, accessionNo: true } },
      },
      orderBy: { borrowDate: 'desc' },
      take: 500,
    });

    const headers = ['User', 'Library ID', 'Book', 'Accession', 'Borrowed', 'Due', 'Status', 'Fine'];
    const rows = txns.map((t) => [
      `${t.user.firstName} ${t.user.lastName}`,
      t.user.libraryId,
      t.book.title.substring(0, 30),
      t.book.accessionNo,
      t.borrowDate.toLocaleDateString(),
      t.dueDate.toLocaleDateString(),
      t.status,
      t.fineAmount ? `₱${t.fineAmount.toFixed(2)}` : '-',
    ]);

    return this.createPDF(`Transaction History (${txns.length} records)`, headers, rows);
  }

  private async generateUsersPDF(): Promise<Buffer> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const headers = ['Library ID', 'Name', 'Email', 'Role', 'Department', 'Status', 'Joined'];
    const rows = users.map((u) => [
      u.libraryId,
      `${u.firstName} ${u.lastName}`,
      u.email,
      u.role,
      u.department || '-',
      u.isActive ? 'Active' : 'Inactive',
      u.createdAt.toLocaleDateString(),
    ]);

    return this.createPDF(`Library Users (${users.length} users)`, headers, rows);
  }

  private async generateOverduePDF(): Promise<Buffer> {
    const txns = await prisma.borrowTransaction.findMany({
      where: { status: 'OVERDUE' },
      include: {
        user: { select: { firstName: true, lastName: true, libraryId: true } },
        book: { select: { title: true, accessionNo: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const headers = ['User', 'Library ID', 'Book', 'Due Date', 'Days Overdue', 'Fine'];
    const now = new Date();
    const rows = txns.map((t) => {
      const daysOverdue = Math.ceil((now.getTime() - t.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return [
        `${t.user.firstName} ${t.user.lastName}`,
        t.user.libraryId,
        t.book.title.substring(0, 30),
        t.dueDate.toLocaleDateString(),
        String(daysOverdue),
        t.fineAmount ? `₱${t.fineAmount.toFixed(2)}` : '₱0.00',
      ];
    });

    return this.createPDF(`Overdue Books Report (${txns.length} items)`, headers, rows);
  }

  private async generateReservationsPDF(): Promise<Buffer> {
    const reservations = await prisma.reservation.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { firstName: true, lastName: true, libraryId: true } },
        book: { select: { title: true, accessionNo: true } },
      },
      orderBy: [{ queuePosition: 'asc' }, { reservationDate: 'desc' }],
    });

    const headers = ['Queue', 'User', 'Library ID', 'Book', 'Accession', 'Expires'];
    const rows = reservations.map((r) => [
      String(r.queuePosition),
      `${r.user.firstName} ${r.user.lastName}`,
      r.user.libraryId,
      r.book.title.substring(0, 30),
      r.book.accessionNo,
      r.expiryDate.toLocaleDateString(),
    ]);

    return this.createPDF(`Active Reservations (${reservations.length})`, headers, rows);
  }

  // ============================================================
  // EXCEL GENERATORS
  // ============================================================

  private async createExcel(
    sheetName: string,
    headers: string[],
    rows: (string | number | boolean | Date)[][],
    columnWidths?: number[]
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CPC Library System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName);

    // Style the header
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Add data rows
    rows.forEach((row) => {
      const dataRow = sheet.addRow(row);
      dataRow.eachCell((cell) => {
        cell.style = {
          alignment: { vertical: 'middle' },
          border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          },
        };
      });
    });

    // Set column widths
    if (columnWidths) {
      columnWidths.forEach((width, i) => {
        sheet.getColumn(i + 1).width = width;
      });
    } else {
      headers.forEach((_, i) => {
        sheet.getColumn(i + 1).width = 20;
      });
    }

    // Auto filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rows.length + 1, column: headers.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generateBooksExcel(): Promise<Buffer> {
    const books = await prisma.book.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { title: 'asc' },
    });

    const headers = ['Accession No', 'ISBN', 'Title', 'Author', 'Publisher', 'Category', 'Copies', 'Available', 'Status', 'Shelf', 'Row'];
    const rows = books.map((b) => [
      b.accessionNo,
      b.isbn,
      b.title,
      b.author,
      b.publisher || '',
      b.category?.name || '',
      b.copies,
      b.availableCopies,
      b.status,
      b.shelf || '',
      b.row || '',
    ]);

    return this.createExcel('Books Catalog', headers, rows, [15, 18, 40, 30, 20, 18, 10, 12, 14, 10, 10]);
  }

  private async generateTransactionsExcel(): Promise<Buffer> {
    const txns = await prisma.borrowTransaction.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, libraryId: true } },
        book: { select: { title: true, accessionNo: true } },
      },
      orderBy: { borrowDate: 'desc' },
    });

    const headers = ['Transaction ID', 'User', 'Library ID', 'Book Title', 'Accession No', 'Borrow Date', 'Due Date', 'Return Date', 'Status', 'Fine', 'Fine Paid'];
    const rows = txns.map((t) => [
      t.id,
      `${t.user.firstName} ${t.user.lastName}`,
      t.user.libraryId,
      t.book.title,
      t.book.accessionNo,
      t.borrowDate,
      t.dueDate,
      t.returnDate || '',
      t.status,
      t.fineAmount || 0,
      t.finePaid ? 'Yes' : 'No',
    ]);

    return this.createExcel('Transactions', headers, rows, [28, 25, 15, 40, 15, 14, 14, 14, 12, 10, 10]);
  }

  private async generateUsersExcel(): Promise<Buffer> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Library ID', 'First Name', 'Last Name', 'Email', 'Role', 'Department', 'Year/Section', 'Phone', 'Active', 'Registered'];
    const rows = users.map((u) => [
      u.libraryId,
      u.firstName,
      u.lastName,
      u.email,
      u.role,
      u.department || '',
      u.yearSection || '',
      u.phone || '',
      u.isActive ? 'Yes' : 'No',
      u.createdAt,
    ]);

    return this.createExcel('Users', headers, rows, [15, 15, 15, 30, 12, 20, 12, 15, 8, 14]);
  }

  private async generateOverdueExcel(): Promise<Buffer> {
    const txns = await prisma.borrowTransaction.findMany({
      where: { status: 'OVERDUE' },
      include: {
        user: { select: { firstName: true, lastName: true, libraryId: true, email: true, department: true } },
        book: { select: { title: true, accessionNo: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const headers = ['User', 'Library ID', 'Email', 'Department', 'Book', 'Accession', 'Due Date', 'Days Overdue', 'Fine'];
    const rows = txns.map((t) => {
      const daysOverdue = Math.ceil((now.getTime() - t.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return [
        `${t.user.firstName} ${t.user.lastName}`,
        t.user.libraryId,
        t.user.email,
        t.user.department || '',
        t.book.title,
        t.book.accessionNo,
        t.dueDate,
        daysOverdue,
        t.fineAmount || 0,
      ];
    });

    return this.createExcel('Overdue Books', headers, rows, [25, 15, 30, 20, 40, 15, 14, 14, 10]);
  }

  private async generateReservationsExcel(): Promise<Buffer> {
    const reservations = await prisma.reservation.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { firstName: true, lastName: true, libraryId: true, email: true } },
        book: { select: { title: true, accessionNo: true } },
      },
      orderBy: [{ queuePosition: 'asc' }, { reservationDate: 'desc' }],
    });

    const headers = ['Queue #', 'User', 'Library ID', 'Email', 'Book', 'Accession', 'Reserved', 'Expires'];
    const rows = reservations.map((r) => [
      r.queuePosition,
      `${r.user.firstName} ${r.user.lastName}`,
      r.user.libraryId,
      r.user.email,
      r.book.title,
      r.book.accessionNo,
      r.reservationDate,
      r.expiryDate,
    ]);

    return this.createExcel('Active Reservations', headers, rows, [10, 25, 15, 30, 40, 15, 14, 14]);
  }
}

export const reportService = new ReportService();

