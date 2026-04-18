export interface SearchHistoryRequest {
  searchQuery: string;
  categoryId?: string;
}

export interface SearchHistoryResponse {
  id: number;
  searchQuery: string;
  categoryId?: string;
  createdAt: string;
}

export interface SearchHistoryPageResponse {
  content: SearchHistoryResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
