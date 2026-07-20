// ============================================================
// Report Generation Controller
// ============================================================

import { Request, Response } from 'express';
import { reportService, ReportType, ExportFormat } from '../services/report.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendError } from '../utils/helpers';

export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const type = req.params.type as ReportType;
  const format = (req.query.format as ExportFormat) || 'pdf';

  const validTypes: ReportType[] = ['books', 'transactions', 'users', 'overdue', 'reservations'];
  const validFormats: ExportFormat[] = ['pdf', 'xlsx'];

  if (!validTypes.includes(type)) {
    sendError(res, `Invalid report type. Valid: ${validTypes.join(', ')}`);
    return;
  }
  if (!validFormats.includes(format)) {
    sendError(res, `Invalid format. Valid: ${validFormats.join(', ')}`);
    return;
  }

  const buffer = await reportService.generateReport(type, format);

  const filename = `cpc-library-${type}-${new Date().toISOString().split('T')[0]}`;
  const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
  res.send(buffer);
});

