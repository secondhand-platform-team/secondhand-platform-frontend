export type ReportCode = 'FRAUD' | 'COUNTERFEIT' | 'FORBIDDEN' | 'WRONG_CAT' | 'SOLD_OUT';
export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';

export interface ReportImage {
  id: string;
  imageUrl: string;
}

export interface ReportResponse {
  id: string;
  reporterId: string;
  code: ReportCode;
  reason: string;
  description: string;
  status: ReportStatus;
  itemId: string;
  reportImages: ReportImage[];
  createdAt: string;
  resolvedAt: string | null;
  assignedStaffId: string | null;
  adminNote: string | null;
}

export interface ReportListResponse {
  content: ReportResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}
