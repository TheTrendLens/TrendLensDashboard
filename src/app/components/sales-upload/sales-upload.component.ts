import {Component, OnDestroy, OnInit} from '@angular/core';
import {SalesService} from '../../services/sales.service';
import {ImportService} from '../../services/import.service';
import {UserService} from '../../services/user.service';
import {DatePipe, NgClass, NgForOf, NgIf, SlicePipe, TitleCasePipe} from '@angular/common';
import {interval, Subscription} from 'rxjs';
import {NotificationService} from '../../services/notification.service';
import {NewSaleDto} from '../../models/new-sale-dto';
import {NewListingDto} from '../../models/new-listing-dto';
import {NewProductDto} from '../../models/new-product-dto';
import * as papaparse from 'papaparse';
import {FormsModule} from "@angular/forms";

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
    SlicePipe
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
  step: 'upload' | 'review' = 'upload';
  currentReviewIndex: number = 0;
  expandedDescriptions: { [key: string]: boolean } = {};
  isUploading: boolean = false;

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
        this.processedSales = this.transformDataToSales(results.data);
        if (this.processedSales.length > 0) {
          this.currentReviewIndex = 0;
          this.step = 'review';
        } else {
          this.notificationService.error('No valid sales data found in the selected file.');
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

  uploadProcessedSales(): void {
    if (this.processedSales.length === 0) {
      this.notificationService.error('No sales data to upload.');
      return;
    }

    this.isUploading = true;
    this.notificationService.info('Uploading sales data, please wait...');

    this.salesService.uploadSales(this.processedSales).subscribe({
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

  transformDataToSales(data: any[]): any[] {
    const salesMap = new Map<string, NewSaleDto>();

    try {
      data.forEach(row => {
        // Validate date format
        const dateParts = row['Date of sale']?.split('/');
        if (!dateParts || dateParts.length !== 3 || parseInt(dateParts[0]) > 31 || parseInt(dateParts[1]) > 12) {
          this.notificationService.error('Dates must be in DD/MM/YYYY format');
          throw new Error('Invalid date format');
        }
        const saleId = row['Date of sale'] + ' | ' + row['Time of sale'] + ' | ' + row['Buyer'];

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
            buyer: row['Buyer'],
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
    const parts = dateStr.split('/').map((num) => parseInt(num, 10));

    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error('Date must be in DD/MM/YYYY format');
    }

    const [day, month, year] = parts;

    if (month > 12 || day > 31) {
      throw new Error('Invalid date: Day must be 1-31 and month must be 1-12');
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    // Ensure the date components haven't been modified by timezone offsets
    if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1 || date.getUTCFullYear() !== year) {
      throw new Error('Date was modified by timezone conversion');
    }

    return date;
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
