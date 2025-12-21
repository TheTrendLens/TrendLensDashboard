import {Component, OnDestroy, OnInit} from '@angular/core';
import {SalesService} from '../../services/sales.service';
import {ImportService} from '../../services/import.service';
import {UserService} from '../../services/user.service';
import {DatePipe, NgClass, NgForOf, NgIf, SlicePipe, TitleCasePipe} from '@angular/common';
import {Subscription} from 'rxjs';
import {NotificationService} from '../../services/notification.service';
import {NewSaleDto} from '../../models/new-sale-dto';
import {NewListingDto} from '../../models/new-listing-dto';
import {NewProductDto} from '../../models/new-product-dto';
import * as papaparse from 'papaparse';
import {FormsModule} from "@angular/forms";
import {ColumnMappingModalComponent, ColumnMapping} from '../column-mapping-modal/column-mapping-modal.component';
import { createSaleLabel } from '../../utils/sale-label.util';

@Component({
  selector: 'app-sales-upload',
  templateUrl: './sales-upload.component.html',
  imports: [
    NgForOf,
    NgIf,
    NgClass,
    TitleCasePipe,
    FormsModule,
    DatePipe,
    SlicePipe,
    ColumnMappingModalComponent
  ],
  styleUrl: './sales-upload.component.css'
})
export class SalesUploadComponent implements OnInit, OnDestroy {

  imports: any[] = [];
  deletingImport: any = null;

  private deletionStatusSubscription: Subscription | null = null;
  private notificationSubscription: Subscription | null = null;

  selectedFile: File | null = null;
  processedSales: any[] = [];
  step: 'upload' | 'mapping' | 'review' = 'upload';
  currentReviewIndex: number = 0;
  expandedDescriptions: { [key: string]: boolean } = {};
  isUploading: boolean = false;

  // Column mapping properties
  csvColumns: string[] = [];
  columnMappings: ColumnMapping[] = [];
  showMappingModal: boolean = false;
  rawCsvData: any[] = [];

  // Date format selection for parsing dates from CSV
  dateFormat: 'DMY' | 'MDY' = 'DMY';

  // Validation results for pre-flight check
  validationErrors: { row?: number; field: string; message: string }[] = [];
  validationWarnings: { row?: number; field: string; message: string }[] = [];

  constructor(private salesService: SalesService,
              private importService: ImportService,
              private userService: UserService,
              private notificationService: NotificationService) {
    this.notificationSubscription = this.notificationService.onImportStatusChange().subscribe(() => {
      this.loadImports();
    });
  }

  ngOnInit() {
    this.loadImports();
  }

  ngOnDestroy(): void {
    if (this.deletionStatusSubscription) {
      this.deletionStatusSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  getSaleLabel(sale: any): string {
    try {
      return createSaleLabel(sale?.products, sale?.date_sold);
    } catch {
      return 'Sale';
    }
  }

  loadImports(): void {
    this.importService.getImports().subscribe({
      next: (imports) => {
        this.imports = imports;
      },
      error: (error) => {
        console.error('Error loading imports:', error);
        this.notificationService.error('Error loading imports: ' + (error.message || 'Unknown error'));
      }
    });
  }

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.parseSelectedFiles();
    }
  }

  parseSelectedFiles(): void {
    if (!this.selectedFile) {
      this.notificationService.error('No file selected');
      return;
    }

    if (!this.selectedFile.type.includes('csv') && !this.selectedFile.name.endsWith('.csv')) {
      this.notificationService.error('Please select a CSV file only');
      return;
    }

    papaparse.parse(this.selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          // Extract column headers
          this.csvColumns = Object.keys(results.data[0] as object);
          this.rawCsvData = results.data;

          // Show mapping modal
          this.showMappingModal = true;
          this.step = 'mapping';
        } else {
          this.notificationService.error('No data found in the selected file.');
          this.resetUpload();
        }
      },
      error: (error) => {
        console.error(`Error parsing file ${this.selectedFile?.name}:`, error);
        this.notificationService.error(`Error parsing file ${this.selectedFile?.name}: ` + error.message);
        this.resetUpload();
      }
    });
  }

  onMappingConfirmed(mappings: ColumnMapping[]): void {
    this.columnMappings = mappings;
    this.showMappingModal = false;

    // Process CSV data with mappings
    this.processedSales = this.transformDataToSalesWithMappings(this.rawCsvData, mappings);

    // Build pre-flight validation report
    this.runPreflightValidation();

    if (this.processedSales.length > 0) {
      this.currentReviewIndex = 0;
      this.step = 'review';
    } else {
      this.notificationService.error('No valid sales data found after processing mappings.');
      this.resetUpload();
    }
  }

  onMappingCancelled(): void {
    this.showMappingModal = false;
    this.resetUpload();
  }

  uploadProcessedSales(): void {
    if (this.processedSales.length === 0) {
      this.notificationService.error('No sales data to upload.');
      return;
    }

    if (this.validationErrors.length > 0) {
      this.notificationService.error('Please fix validation errors before uploading.');
      return;
    }

    this.isUploading = true;
    this.notificationService.info('Uploading sales data, please wait...');

    // Strip client-side review meta before upload
    const payload = this.processedSales.map((s: any) => {
      const { __groupingKey, __groupingMethod, __mergedCount, ...rest } = s;
      return rest;
    });

    this.salesService.uploadSales(payload).subscribe({
      next: () => {
        this.notificationService.success('Sales data uploaded successfully!');
        this.loadImports();
        this.resetUpload();
        this.isUploading = false;
      },
      error: (error: { message: any; }) => {
        console.error('Error uploading sales data:', error);
        this.notificationService.error('Error uploading sales data: ' + (error.message || 'Unknown error'));
        this.isUploading = false;
        this.resetUpload();
      }
    });
  }

  toggleDescription(prodIndex: number): void {
    const key = `${this.currentReviewIndex}-${prodIndex}`;
    this.expandedDescriptions[key] = !this.expandedDescriptions[key];
  }

  isDescriptionExpanded(prodIndex: number): boolean {
    const key = `${this.currentReviewIndex}-${prodIndex}`;
    return this.expandedDescriptions[key] || false;
  }

  cancelReview(): void {
    this.resetUpload();
  }

  private resetUpload(): void {
    this.processedSales = [];
    this.selectedFile = null;
    this.step = 'upload';
    this.currentReviewIndex = 0;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.expandedDescriptions = {};
    this.isUploading = false;

    // Clear mapping-related properties
    this.csvColumns = [];
    this.columnMappings = [];
    this.showMappingModal = false;
    this.rawCsvData = [];
  }

  nextSale(): void {
    if (this.currentReviewIndex < this.processedSales.length - 1) {
      this.currentReviewIndex++;
    }
  }

  previousSale(): void {
    if (this.currentReviewIndex > 0) {
      this.currentReviewIndex--;
    }
  }

  private sanitizeFloatValue(value: string): number {
    if (!value) return 0;
    // Remove all non-numeric characters except decimal point and negative sign
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    // Convert to float and round to 2 decimal places
    return parseFloat(parseFloat(cleanValue).toFixed(2)) || 0;
  }

  transformDataToSalesWithMappings(data: any[], mappings: ColumnMapping[]): any[] {
    if (!data || data.length === 0 || !mappings || mappings.length === 0) {
      return [];
    }

    // Create mapping lookup from CSV column to database field
    const mappingLookup = new Map<string, string>();
    mappings.forEach(mapping => {
      mappingLookup.set(mapping.dbField, mapping.csvColumn);
    });

    // Helper function to get mapped value
    const getMappedValue = (dbField: string, row: any): any => {
      const csvColumn = mappingLookup.get(dbField);
      return csvColumn ? row[csvColumn] : null;
    };

    // Extend NewSaleDto with client-side meta for review UI
    type ReviewSale = NewSaleDto & {
      __groupingKey?: string;
      __groupingMethod?: 'external_id' | 'date_time_buyer' | 'unique';
      __mergedCount?: number;
    };

    const salesMap = new Map<string, ReviewSale>();
    let rowCounter = 0;

    try {
      data.forEach(row => {
        rowCounter++;
        // Get required sale fields using mappings
        const dateSoldValue = getMappedValue('date_sold', row);
        const timeSoldValue = getMappedValue('time_sold', row);
        const buyerValue = getMappedValue('buyer', row);
        const externalSalesIdRaw = getMappedValue('external_sales_id', row);
        const externalSalesIdValue = typeof externalSalesIdRaw === 'string' ? externalSalesIdRaw.trim() : externalSalesIdRaw;

        if (!dateSoldValue) {
          console.warn('Skipping row due to missing required date_sold:', row);
          return;
        }

        // Validate and parse date
        let parsedDate: Date;
        try {
          parsedDate = this.parseDate(dateSoldValue);
        } catch (error) {
          console.warn('Skipping row due to invalid date format:', dateSoldValue);
          return;
        }

        // Grouping strategy:
        // 1) If Sales ID provided, use that to group multi-line orders
        // 2) Else, fallback to (date + time + buyer) if both provided
        // 3) Else, treat each row as unique
        const hasExternalId = !!externalSalesIdValue;
        const canMerge = !!timeSoldValue && !!buyerValue;
        const saleId = hasExternalId
          ? `ext:${externalSalesIdValue}`
          : (canMerge ? `${dateSoldValue} | ${timeSoldValue} | ${buyerValue}` : `unique-${rowCounter}`);

        if (!salesMap.has(saleId)) {
          // Check for refunds
          const refundedToBuyer = this.sanitizeFloatValue(getMappedValue('refunded_to_buyer', row) || '0');
          const refundedToSeller = this.sanitizeFloatValue(getMappedValue('refunded_to_seller', row) || '0');

          if (refundedToBuyer !== 0 || refundedToSeller !== 0) {
            return;
          }

          // Get financial values with defaults
          const platformFee = this.sanitizeFloatValue(getMappedValue('platform_fee', row) || '0');
          const paymentFee = this.sanitizeFloatValue(getMappedValue('payment_fee', row) || '0');
          const boostingFee = this.sanitizeFloatValue(getMappedValue('boosting_fee', row) || '0');
          const total = this.sanitizeFloatValue(getMappedValue('total', row) || '0');
          const salesTax = this.sanitizeFloatValue(getMappedValue('sales_tax', row) || '0');
          const soldPrice = this.sanitizeFloatValue(getMappedValue('sold_price', row) || '0');
          const sellerPostageCost = this.sanitizeFloatValue(getMappedValue('seller_postage_cost', row) || '0');

          const sale: ReviewSale = {
            date_sold: parsedDate,
            time_sold: timeSoldValue || '00:00:00',
            buyer: buyerValue || '',
            external_sales_id: hasExternalId ? String(externalSalesIdValue) : null,
            platform_fee: platformFee,
            seller_postage_cost: sellerPostageCost,
            total: total - salesTax,
            payment_fee: paymentFee,
            boosting_fee: boostingFee,
            total_fee: paymentFee + platformFee + boostingFee,
            payment_type: getMappedValue('payment_type', row) || 'Unknown',
            sales_tax: salesTax,
            refunded_to_buyer: refundedToBuyer,
            refunded_to_seller: refundedToSeller,
            sold_price: soldPrice,
            offer: getMappedValue('offer', row) === 'true' || false,
            products: [],
            __groupingKey: hasExternalId ? String(externalSalesIdValue) : (canMerge ? `${this.formatDateForKey(parsedDate)}|${timeSoldValue}|${buyerValue}` : `row:${rowCounter}`),
            __groupingMethod: hasExternalId ? 'external_id' : (canMerge ? 'date_time_buyer' : 'unique'),
            __mergedCount: 0,
          };
          salesMap.set(saleId, sale);
        }

        const sale = salesMap.get(saleId);
        if (!sale) return;

        // Increment merged lines counter
        sale.__mergedCount = (sale.__mergedCount ?? 0) + 1;

        // Get listing fields using mappings
        const description = getMappedValue('description', row);
        const dateListedValue = getMappedValue('date_listed', row);

        if (!description || !dateListedValue) {
          console.warn('Skipping product due to missing required listing fields:', row);
          return;
        }

        let parsedListingDate: Date;
        try {
          parsedListingDate = this.parseDate(dateListedValue);
        } catch (error) {
          console.warn('Skipping product due to invalid listing date format:', dateListedValue);
          return;
        }

        const listedPrice = this.sanitizeFloatValue(getMappedValue('listed_price', row) || '0');
        const category = getMappedValue('category', row) || 'Uncategorized';
        const brand = getMappedValue('brand', row) || 'Other';
        const itemCost = getMappedValue('item_cost', row) ? this.sanitizeFloatValue(getMappedValue('item_cost', row)) : null;

        const listing: NewListingDto = {
          brand: brand === 'N/A' ? 'Other' : brand,
          category: category,
          date_listed: parsedListingDate,
          description: description,
          item_cost: itemCost,
          listed_price: listedPrice,
          quantity: this.sanitizeFloatValue(getMappedValue('quantity', row) || '0'),
          source: 'CSV Import',
          season: getMappedValue('season', row) || undefined,
        };

        const size = getMappedValue('size', row) || 'One size';
        const productItemCost = getMappedValue('product_item_cost', row) ? this.sanitizeFloatValue(getMappedValue('product_item_cost', row)) : null;

        const product: NewProductDto = {
          listing: listing,
          item_cost: productItemCost,
          size: size
        };

        sale.products.push(product);
      });
    } catch (error: any) {
      console.error('Error transforming data to sales:', error);
      this.notificationService.error('Error processing CSV data: ' + (error.message || 'Unknown error'));
      return [];
    }

    return Array.from(salesMap.values());
  }

  transformDataToSales(data: any[]): any[] {
    const salesMap = new Map<string, NewSaleDto>();
    let rowCounter = 0;

    try {
      data.forEach(row => {
        rowCounter++;
        // Validate date format
        const dateParts = row['Date of sale']?.split('/');
        if (!dateParts || dateParts.length !== 3 || parseInt(dateParts[0]) > 31 || parseInt(dateParts[1]) > 12) {
          this.notificationService.error('Dates must be in DD/MM/YYYY format');
          throw new Error('Invalid date format');
        }
        const hasTime = !!row['Time of sale'];
        const hasBuyer = !!row['Buyer'];
        const saleId = (hasTime && hasBuyer)
          ? (row['Date of sale'] + ' | ' + row['Time of sale'] + ' | ' + row['Buyer'])
          : `unique-${rowCounter}`;

        if (!salesMap.has(saleId)) {
          const refundedToBuyer = this.sanitizeFloatValue(row['Refunded to buyer amount']);
          const refundedToSeller = this.sanitizeFloatValue(row['Fees refunded to seller']);

          if (refundedToBuyer !== 0 || refundedToSeller !== 0) {
            return;
          }

          const platformFee = this.sanitizeFloatValue(row['Platform fee']);
          const paymentFee = this.sanitizeFloatValue(row['Depop Payments fee']);
          const boostingFee = this.sanitizeFloatValue(row['Boosting fee']);
          const total = this.sanitizeFloatValue(row['Total']);
          const totalFeeVAT = this.sanitizeFloatValue(row['Total fee VAT']);
          const soldPrice = this.sanitizeFloatValue(row['Item price']);
          const totalFeeExVAT = this.sanitizeFloatValue(row['Total fee excl. VAT']);
          const usSalesTax = this.sanitizeFloatValue(row['US Sales tax']);
          const postageCost = this.sanitizeFloatValue(row['USPS Cost']);

          const sale: NewSaleDto = {
            date_sold: this.parseDate(row['Date of sale']),
            time_sold: row['Time of sale'] || '00:00:00',
            buyer: row['Buyer'] || '',
            platform_fee: platformFee,
            seller_postage_cost: postageCost,
            total: parseFloat((total - usSalesTax).toFixed(2)) || 0.00,
            payment_fee: paymentFee,
            boosting_fee: boostingFee,
            total_fee: parseFloat((totalFeeVAT + totalFeeExVAT).toFixed(2)) || 0.00,
            payment_type: row['Payment type'],
            refunded_to_buyer: refundedToBuyer,
            refunded_to_seller: refundedToSeller,
            sold_price: soldPrice,
            offer: false,
            products: [],
          };
          salesMap.set(saleId, sale);
        }

        const sale = salesMap.get(saleId);

        if (!sale) return; // Safety check

        const listing: NewListingDto = {
          brand: row['Brand'] === 'N/A' ? 'Other' : row['Brand'],
          category: row['Category'] || 'Uncategorized',
          date_listed: this.parseDate(row['Date of listing']),
          description: row['Description'],
          item_cost: row['Item cost'] ? this.sanitizeFloatValue(row['Item cost']) : null,
          listed_price: this.sanitizeFloatValue(row['Item price']),
          quantity: 0,
          source: 'CSV Import',
        }

        const product: NewProductDto = {
          listing: listing,
          item_cost: row['Item cost'] ? this.sanitizeFloatValue(row['Item cost']) : null,
          size: row['Size'] || 'One size'
        }

        sale.products.push(product);
      });
    } catch (error: any) {
      console.error('Error transforming data to sales:', error);
      this.notificationService.error('Error processing CSV data: ' + (error.message || 'Unknown error'));
      return [];
    }

    return Array.from(salesMap.values());
  }

  parseDate(dateStr: string): Date {
    const parts = dateStr.split(/[\/\-.]/).map((num) => parseInt(String(num).trim(), 10));

    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error('Date must be in a valid format');
    }

    let day: number, month: number, year: number;
    if (this.dateFormat === 'DMY') {
      [day, month, year] = parts;
    } else {
      // MDY
      [month, day, year] = parts;
    }

    if (month > 12 || day > 31 || day < 1 || month < 1) {
      throw new Error('Invalid date: Day must be 1-31 and month must be 1-12');
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    // Ensure the date components haven't been modified by timezone offsets
    if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1 || date.getUTCFullYear() !== year) {
      throw new Error('Date was modified by timezone conversion');
    }

    return date;
  }

  private formatDateForKey(d: Date): string {
    // ISO date (YYYY-MM-DD)
    return new Date(d).toISOString().split('T')[0];
  }

  private runPreflightValidation(): void {
    this.validationErrors = [];
    this.validationWarnings = [];

    // Check totals and fees coherence and missing costs
    this.processedSales.forEach((s: any, idx: number) => {
      const i = idx + 1;
      if (!s.date_sold) {
        this.validationErrors.push({ row: i, field: 'date_sold', message: 'Missing sale date' });
      }
      if (typeof s.total === 'number' && typeof s.total_fee === 'number' && typeof s.sold_price === 'number') {
        const calc = (s.payment_fee || 0) + (s.platform_fee || 0) + (s.boosting_fee || 0);
        if (Math.abs(calc - s.total_fee) > 0.01) {
          this.validationWarnings.push({ row: i, field: 'total_fee', message: 'Sum of fees does not equal total_fee' });
        }
      }
      if ((s.refunded_to_buyer || 0) !== 0 || (s.refunded_to_seller || 0) !== 0) {
        this.validationWarnings.push({ row: i, field: 'refunds', message: 'Refund detected; currently excluded' });
      }
      if (!s.products || s.products.length === 0) {
        this.validationErrors.push({ row: i, field: 'products', message: 'No products attached' });
      }
    });
  }

  downloadValidationCsv(): void {
    const headers = ['type', 'row', 'field', 'message'];
    const rows: string[] = [];
    const encode = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    this.validationErrors.forEach(e => rows.push(['error', e.row ?? '', e.field, e.message].map(encode).join(',')));
    this.validationWarnings.forEach(w => rows.push(['warning', w.row ?? '', w.field, w.message].map(encode).join(',')));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-upload-validation.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  deleteImport(id: string): void {
    // Check if there are new imports in progress
    if (this.hasNewImportsInProgress) {
      this.notificationService.warning('Cannot delete imports while new imports are in progress. Please wait for current imports to complete.');
      return;
    }

    // Check if a deletion is already in progress
    this.importService.getDeletionStatus().subscribe({
      next: (status) => {

        // If no deletion is in progress, confirm and proceed
        if (confirm('Are you sure you want to delete this import?')) {
// Find and update the import status locally
          const importToDelete = this.imports.find(imp => imp.id === id);
          if (importToDelete) {
            importToDelete.status = 'deleting';
          }

          this.importService.deleteImport(id).subscribe({
            next: () => {
              this.notificationService.success('Deletion queued');
            },
            error: (error) => {
              console.error('Error initiating deletion:', error);
              this.notificationService.error('Error initiating deletion: ' + (error.message || 'Unknown error'));
            }
          });
        }
      },
      error: (error) => {
        console.error('Error checking deletion status:', error);
        this.notificationService.error('Error checking deletion status: ' + (error.message || 'Unknown error'));
      }
    });
  }

  getStatusColorClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      case 'pending':
        return 'text-yellow-600';
      case 'deleting':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  // Get current imports (pending, processing, deleting - excludes completed and failed)
  get currentImports(): any[] {
    return this.imports.filter(imp => imp.status !== 'completed' && imp.status !== 'failed');
  }

  // Get previous imports (completed and failed imports)
  get completedImports(): any[] {
    return this.imports.filter(imp => imp.status === 'completed' || imp.status === 'failed');
  }

  // Check if there's a delete in progress
  get hasDeleteInProgress(): boolean {
    return this.imports.some(imp => imp.status === 'deleting');
  }

  // Check if there are new imports in progress (pending/processing, excluding deleting)
  get hasNewImportsInProgress(): boolean {
    return this.imports.some(imp => imp.status === 'pending' || imp.status === 'processing');
  }

  // Check if uploads should be disabled
  get isUploadDisabled(): boolean {
    return this.isUploading || this.hasDeleteInProgress;
  }

  // Check if deletions should be disabled
  get isDeleteDisabled(): boolean {
    return this.hasNewImportsInProgress;
  }

  // Get progress percentage for an import
  getImportProgress(importRecord: any): number {
    return parseFloat(((importRecord.processed_records / importRecord.total_records) * 100 || 0).toFixed(2));
  }

  // Get progress bar color class
  getProgressColorClass(status: string): string {
    switch (status) {
      case 'processing':
        return 'bg-blue-600';
      case 'deleting':
        return 'bg-red-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'completed':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  }

}
