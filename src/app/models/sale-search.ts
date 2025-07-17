export enum SortField {
  DATE = 'date',
  TOTAL = 'total',
  BUYER = 'buyer',
  PROFIT = 'profit',
  BRAND = 'brand',
  CATEGORY = 'category'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export enum DateFilterOption {
  ALL = 'all',
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export interface SaleSearch {
  q?: string;
  missingData?: boolean;
  missingCosts?: boolean;
  minProducts?: number;
  dateFilter?: DateFilterOption;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortField?: SortField;
  sortDirection?: SortDirection;
  brands?: string[];
  categories?: string[];
  paymentTypes?: string[];
  hasRefunds?: boolean;
  isOffer?: boolean;
}
