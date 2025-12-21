import { Component, input, output, computed, signal } from '@angular/core';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ColumnMapping {
  csvColumn: string;
  dbField: string;
  category: 'sale' | 'listing' | 'product';
}

export interface FieldOption {
  value: string;
  label: string;
  category: 'sale' | 'listing' | 'product';
  required: boolean;
}

@Component({
  selector: 'app-column-mapping-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './column-mapping-modal.component.html'
})
export class ColumnMappingModalComponent implements OnInit {
  csvColumns = input.required<string[]>();
  sampleRows = input<any[]>([]);
  mappingConfirmed = output<ColumnMapping[]>();
  mappingCancelled = output<void>();

  // Reactive state using signals
  columnMappings = signal<ColumnMapping[]>([
    { csvColumn: '', dbField: '', category: 'sale' }
  ]);
  activeCategory = signal<'sale' | 'listing' | 'product'>('sale');
  draggedColumn = signal<string | null>(null);
  dragOverField = signal<string | null>(null);
  selectedField = signal<FieldOption | null>(null);
  selectedCsvColumn = '';
  // Selection for the "Add optional field" control
  selectedOptionalField = '';

  // Help panel visibility
  showHelp = signal<boolean>(true);

  // Search for CSV columns (left pane filter)
  csvSearch: string = '';

  // Track user-added optional fields (by field value)
  addedOptionalFields = signal<Set<string>>(new Set());

  // Mapping profiles (saved/loaded from localStorage)
  private static readonly PROFILES_KEY = 'tl.mappingProfiles.v1';
  private static readonly LAST_USED_KEY = 'tl.mappingProfiles.lastUsed';
  profiles = signal<{ name: string; mappings: ColumnMapping[]; csvColumns: string[]; createdAt: string }[]>([]);
  selectedProfileName = signal<string>('');

  // Auto-matching runs once on init

  // Computed properties for progress tracking
  mappedFieldsCount = computed(() => {
    return this.columnMappings().filter(m => m.csvColumn && m.dbField).length;
  });

  totalRequiredFields = computed(() => {
    return this.getAllFields().filter(f => f.required).length;
  });

  mappedRequiredFieldsCount = computed(() => {
    const mappedFields = this.columnMappings()
      .filter(m => m.csvColumn && m.dbField)
      .map(m => m.dbField);
    return this.getAllFields()
      .filter(f => f.required && mappedFields.includes(f.value))
      .length;
  });

  missingRequiredCount = computed(() => {
    return this.totalRequiredFields() - this.mappedRequiredFieldsCount();
  });

  unmappedColumnsCount = computed(() => {
    const mappedColumns = this.columnMappings()
      .filter(m => m.csvColumn && m.dbField)
      .map(m => m.csvColumn);
    return this.csvColumns().filter(col => !mappedColumns.includes(col)).length;
  });

  progressPercentage = computed(() => {
    const total = this.totalRequiredFields();
    if (total === 0) return 100;
    return (this.mappedRequiredFieldsCount() / total) * 100;
  });

  fieldGroups: { category: string; label: string; fields: FieldOption[] }[] = [
    {
      category: 'sale',
      label: 'Sale Fields',
      fields: [
        { value: 'date_sold', label: 'Date Sold', category: 'sale', required: true },
        { value: 'time_sold', label: 'Time Sold', category: 'sale', required: false },
        { value: 'buyer', label: 'Buyer', category: 'sale', required: false },
        { value: 'sold_price', label: 'Sold Price', category: 'sale', required: true },
        { value: 'platform_fee', label: 'Platform Fee', category: 'sale', required: false },
        { value: 'payment_fee', label: 'Payment Fee', category: 'sale', required: false },
        { value: 'boosting_fee', label: 'Boosting Fee', category: 'sale', required: false },
        { value: 'total', label: 'Total', category: 'sale', required: true },
        { value: 'sales_tax', label: 'Sales Tax', category: 'sale', required: false },
        { value: 'payment_type', label: 'Payment Type', category: 'sale', required: false },
        { value: 'refunded_to_buyer', label: 'Refunded to Buyer', category: 'sale', required: false },
        { value: 'refunded_to_seller', label: 'Refunded to Seller', category: 'sale', required: false },
        { value: 'seller_postage_cost', label: 'Seller Postage Cost', category: 'sale', required: false },
        { value: 'offer', label: 'Offer', category: 'sale', required: false },
        // Keep Sales ID as the last optional field so it appears at the bottom of the list
        { value: 'external_sales_id', label: 'Sales ID', category: 'sale', required: false }
      ]
    },
    {
      category: 'listing',
      label: 'Listing Fields',
      fields: [
        { value: 'description', label: 'Description', category: 'listing', required: true },
        { value: 'date_listed', label: 'Date Listed', category: 'listing', required: true },
        { value: 'listed_price', label: 'Listed Price', category: 'listing', required: true },
        { value: 'category', label: 'Category', category: 'listing', required: true },
        { value: 'brand', label: 'Brand', category: 'listing', required: false },
        { value: 'item_cost', label: 'Item Cost', category: 'listing', required: false },
        { value: 'quantity', label: 'Quantity', category: 'listing', required: false },
        { value: 'source', label: 'Source', category: 'listing', required: false },
        { value: 'season', label: 'Season', category: 'listing', required: false }
      ]
    },
    {
      category: 'product',
      label: 'Product Fields',
      fields: [
        { value: 'size', label: 'Size', category: 'product', required: true },
        { value: 'product_item_cost', label: 'Product Item Cost', category: 'product', required: false }
      ]
    }
  ];

  // --- Auto-match helpers ---
  // Canonical map for Depop exports: normalized CSV header -> system field(s)
  // Supports mapping a single CSV column to multiple system fields when appropriate.
  private readonly depopMap: Record<string, string | string[] | null> = {
    // sale
    'date of sale': 'date_sold',
    'time of sale': 'time_sold',
    'buyer': 'buyer',
    'item price': ['sold_price', 'listed_price'],
    'buyer shipping': null,
    'total': 'total',
    'usps cost': 'seller_postage_cost',
    'depop payments fee': 'payment_fee',
    'depop fee': 'platform_fee',
    'boosting fee': 'boosting_fee',
    'payment type': 'payment_type',
    'us sales tax': 'sales_tax',
    'refunded to buyer amount': 'refunded_to_buyer',
    'fees refunded to seller': 'refunded_to_seller',
    // listing
    'brand': 'brand',
    'description': 'description',
    'category': 'category',
    'date of listing': 'date_listed',
    // product
    'size': 'size',
  };
  private normalizeName(value: string): string {
    // lower-case, remove punctuation, collapse whitespace/underscores/dashes
    return value
      .toLowerCase()
      .replace(/[\s_\-]+/g, ' ')
      .replace(/[^a-z0-9 ]+/g, '')
      .trim();
  }

  private levenshtein(a: string, b: string): number {
    // classic DP; small inputs (column/field names)
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp: number[] = Array(n + 1)
      .fill(0)
      .map((_, j) => j);
    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const temp = dp[j];
        if (a[i - 1] === b[j - 1]) {
          dp[j] = prev;
        } else {
          dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
        }
        prev = temp;
      }
    }
    return dp[n];
  }

  private getFieldAliases(field: FieldOption): string[] {
    const map: Record<string, string[]> = {
      // sale
      date_sold: ['date sold', 'sale date', 'sold date', 'transaction date', 'order date'],
      time_sold: ['time sold', 'sale time', 'sold time', 'transaction time'],
      buyer: ['buyer', 'customer', 'client', 'purchaser', 'buyer name'],
      external_sales_id: ['sales id', 'sale id', 'order id', 'order number', 'transaction id', 'order ref', 'order reference'],
      sold_price: ['sold price', 'sale price', 'amount', 'total paid', 'price paid', 'order total'],
      platform_fee: ['platform fee', 'marketplace fee', 'selling fee', 'site fee'],
      payment_fee: ['payment fee', 'processing fee', 'payment processing', 'stripe fee', 'paypal fee'],
      boosting_fee: ['boosting fee', 'promotion fee', 'ads fee', 'advertising fee'],
      total_fee: ['total fee', 'fees total', 'all fees'],
      total: ['total', 'grand total', 'order total'],
      payment_type: ['payment type', 'payment method', 'method'],
      refunded_to_buyer: ['refunded to buyer', 'buyer refund', 'refund buyer'],
      refunded_to_seller: ['refunded to seller', 'seller refund', 'refund seller'],
      seller_postage_cost: ['postage cost', 'shipping cost', 'seller shipping', 'postage paid'],
      offer: ['offer', 'offer price', 'accepted offer'],
      // listing
      description: ['description', 'title', 'item description', 'listing title', 'name'],
      date_listed: ['date listed', 'listing date', 'posted date'],
      listed_price: ['listed price', 'asking price', 'list price'],
      category: ['category', 'type', 'group'],
      brand: ['brand', 'maker', 'manufacturer'],
      item_cost: ['item cost', 'cost price', 'unit cost', 'buy cost', 'purchase cost'],
      quantity: ['quantity', 'qty', 'count', 'number of items'],
      source: ['source', 'supplier', 'where from', 'store', 'retailer'],
      // product
      size: ['size', 'dimension'],
      // Avoid overly-generic aliases like 'cost' which can collide with unrelated headers
      product_item_cost: ['product item cost', 'item cost', 'unit cost']
    };
    const fromKey = map[field.value] ?? [];
    // include the field label/value itself as alias seeds
    return Array.from(new Set([field.label, field.value.replace(/_/g, ' '), ...fromKey]));
  }

  private scoreMatch(field: FieldOption, columnName: string): number {
    const nCol = this.normalizeName(columnName);
    const aliases = this.getFieldAliases(field).map(a => this.normalizeName(a));

    // exact alias match
    if (aliases.includes(nCol)) return 1.0;
    // contains relationship boosts
    for (const al of aliases) {
      if (nCol.includes(al) || al.includes(nCol)) {
        // Weight by relative length; do NOT over-boost very short substrings
        const ratio = Math.min(nCol.length, al.length) / Math.max(nCol.length, al.length);
        // If the alias is very short (< 5 chars), treat as weak signal
        const minLen = Math.min(al.length, nCol.length);
        if (minLen < 5) {
          return 0.4 * ratio; // keep low so it won't pass the threshold by itself
        }
        // Otherwise scale proportionally; only near-length matches get high scores
        return 0.9 * ratio;
      }
    }

    // fuzzy: Levenshtein between best alias and column
    let best = 0;
    for (const al of aliases) {
      const d = this.levenshtein(al, nCol);
      const maxLen = Math.max(al.length, nCol.length) || 1;
      const sim = 1 - d / maxLen; // 0..1
      if (sim > best) best = sim;
    }
    return best; // may be < 0.75
  }

  private autoMatch(): void {
    const csvCols = this.csvColumns();
    if (!Array.isArray(csvCols) || csvCols.length === 0) return;

    const usedColumns = new Set(
      this.columnMappings()
        .filter(m => m.csvColumn && m.dbField)
        .map(m => m.csvColumn)
    );
    const usedFields = new Set(
      this.columnMappings()
        .filter(m => m.csvColumn && m.dbField)
        .map(m => m.dbField)
    );

    // Build a blacklist of headers explicitly marked as DO NOT MATCH (e.g., 'buyer shipping')
    const forbiddenHeaders = new Set(
      Object.entries(this.depopMap)
        .filter(([, target]) => target === null)
        .map(([key]) => key)
    );

    // 1) Depop priority pass (exact normalized header mapping)
    for (const col of csvCols) {
      const key = this.normalizeName(col);
      if (!(key in this.depopMap)) continue;
      const target = this.depopMap[key];
      if (target === null) continue; // explicit DO NOT MATCH

      // Allow mapping a single Depop column to multiple fields if configured
      const targets: string[] = Array.isArray(target) ? target : [target];

      // If the column is already used by user mapping, skip entirely
      if (usedColumns.has(col)) continue;

      let mappedAnyForThisCol = false;
      for (const t of targets) {
        if (usedFields.has(t)) continue; // do not override an existing field mapping
        const field = this.getAllFields().find(f => f.value === t);
        if (!field) continue;

        this.createOrUpdateMapping(col, t);
        usedFields.add(t);
        mappedAnyForThisCol = true;

        if (!field.required) {
          const next = new Set(this.addedOptionalFields());
          next.add(field.value);
          this.addedOptionalFields.set(next);
        }
      }

      // After processing (possibly multiple) targets for this column, mark column as used
      if (mappedAnyForThisCol) {
        usedColumns.add(col);
      }
    }

    // 2) Fuzzy/alias matching for remaining fields, prioritize required fields first
    const allFields = this.getAllFields();
    const required = allFields.filter(f => f.required);
    const optional = allFields.filter(f => !f.required);

    const tryMatch = (field: FieldOption) => {
      if (usedFields.has(field.value)) return; // already mapped by user
      let bestCol: string | null = null;
      let bestScore = 0;
      for (const col of csvCols) {
        if (usedColumns.has(col)) continue;
        // Skip columns that are explicitly blacklisted by Depop rules
        const normalized = this.normalizeName(col);
        if (forbiddenHeaders.has(normalized)) continue;
        const s = this.scoreMatch(field, col);
        if (s > bestScore) {
          bestScore = s;
          bestCol = col;
        }
      }
      // threshold: accept strong matches; exact/contains already returned high
      const THRESHOLD = 0.78;
      if (bestCol && bestScore >= THRESHOLD) {
        this.createOrUpdateMapping(bestCol, field.value);
        usedColumns.add(bestCol);
        usedFields.add(field.value);
        if (!field.required) {
          const next = new Set(this.addedOptionalFields());
          next.add(field.value);
          this.addedOptionalFields.set(next);
        }
      }
    };

    required.forEach(tryMatch);
    optional.forEach(tryMatch);
  }

  ngOnInit(): void {
    // Run auto-match once when component initializes
    this.autoMatch();

    // Load mapping profiles
    this.loadProfilesFromStorage();

    // Try to auto-apply last used profile if compatible
    const lastName = localStorage.getItem(ColumnMappingModalComponent.LAST_USED_KEY) || '';
    if (lastName) {
      const p = this.profiles().find(pr => pr.name === lastName);
      if (p && this.isProfileCompatible(p.csvColumns)) {
        this.applyProfile(p.mappings);
        this.selectedProfileName.set(p.name);
      }
    }
  }

  // --- Optional fields management ---
  /**
   * Return list of optional fields (label/value) for a category that can be chosen
   * in the right-side dropdown for an optional row. Includes the current field value
   * even if it is already visible, but excludes other already-visible optional fields
   * to prevent duplicates.
   */
  getOptionalChoicesByCategory(currentFieldValue: string, category: 'sale' | 'listing' | 'product'): { value: string; label: string }[] {
    const group = this.fieldGroups.find(g => g.category === category);
    if (!group) return [];
    const visible = this.addedOptionalFields();
    const optionalFields = group.fields.filter(f => !f.required);
    return optionalFields
      .filter(f => f.value === currentFieldValue || !visible.has(f.value))
      .map(f => ({ value: f.value, label: f.label }));
  }

  /**
   * Handle when the user changes which optional Trendlens field this row represents.
   * Transfers any existing CSV mapping from the old field to the new field and updates
   * the set of visible optional fields accordingly.
   */
  onOptionalFieldChanged(oldFieldValue: string, newFieldValue: string, category: 'sale' | 'listing' | 'product'): void {
    if (!newFieldValue || newFieldValue === oldFieldValue) return;

    // Update the visible optional fields set
    const next = new Set(this.addedOptionalFields());
    next.delete(oldFieldValue);
    next.add(newFieldValue);
    this.addedOptionalFields.set(next);

    // If there was a mapping for the old field, transfer it to the new field
    const currentMappings = this.columnMappings();
    const oldMapping = currentMappings.find(m => m.dbField === oldFieldValue);

    // Remove any existing mapping for the new field to avoid duplicates
    let updated = currentMappings.filter(m => m.dbField !== newFieldValue && m.dbField !== oldFieldValue);

    if (oldMapping) {
      updated = [...updated, { csvColumn: oldMapping.csvColumn, dbField: newFieldValue, category }];
    }

    this.columnMappings.set(updated);
  }

  // Drag and Drop Event Handlers
  onDragStart(event: DragEvent, column: string): void {
    this.draggedColumn.set(column);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', column);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(event: DragEvent): void {
    this.draggedColumn.set(null);
    this.dragOverField.set(null);
  }

  onDragOver(event: DragEvent, fieldValue: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverField.set(fieldValue);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragLeave(event: DragEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    // Only clear drag over state if mouse is actually outside the element
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.dragOverField.set(null);
    }
  }

  onDrop(event: DragEvent, fieldValue: string): void {
    event.preventDefault();
    event.stopPropagation();

    const csvColumn = event.dataTransfer?.getData('text/plain');
    if (csvColumn && fieldValue) {
      this.createOrUpdateMapping(csvColumn, fieldValue);
    }

    this.draggedColumn.set(null);
    this.dragOverField.set(null);
  }

  // ---- Mapping profiles (save/load/delete) ----
  saveCurrentAsProfile(name?: string): void {
    const profileName = (name ?? prompt('Save mapping as (profile name):') ?? '').trim();
    if (!profileName) return;

    const current = this.columnMappings().filter(m => m.csvColumn && m.dbField);
    const entry = {
      name: profileName,
      mappings: current,
      csvColumns: this.csvColumns(),
      createdAt: new Date().toISOString()
    };

    const list = this.profiles();
    const idx = list.findIndex(p => p.name === profileName);
    if (idx >= 0) {
      list[idx] = entry;
    } else {
      list.push(entry);
    }
    this.profiles.set([...list]);
    this.persistProfiles();
    this.selectedProfileName.set(profileName);
    localStorage.setItem(ColumnMappingModalComponent.LAST_USED_KEY, profileName);
  }

  loadProfileByName(name: string): void {
    const p = this.profiles().find(pr => pr.name === name);
    if (!p) return;
    if (!this.isProfileCompatible(p.csvColumns)) {
      const proceed = confirm('Profile columns do not fully match current CSV headers. Apply anyway?');
      if (!proceed) return;
    }
    this.applyProfile(p.mappings);
    this.selectedProfileName.set(name);
    localStorage.setItem(ColumnMappingModalComponent.LAST_USED_KEY, name);
  }

  deleteProfileByName(name: string): void {
    const proceed = confirm(`Delete profile "${name}"?`);
    if (!proceed) return;
    const next = this.profiles().filter(p => p.name !== name);
    this.profiles.set(next);
    this.persistProfiles();
    if (this.selectedProfileName() === name) {
      this.selectedProfileName.set('');
    }
  }

  private isProfileCompatible(columns: string[]): boolean {
    // basic check: every mapped csv column in profile exists in current CSV header set
    const set = new Set(this.csvColumns());
    return columns.every(c => set.has(c));
  }

  private applyProfile(mappings: ColumnMapping[]): void {
    // Replace mappings and mark corresponding optionals visible
    const clean = mappings.map(m => ({ csvColumn: m.csvColumn, dbField: m.dbField, category: m.category }));
    this.columnMappings.set(clean);
    // Ensure optional fields appear
    const next = new Set(this.addedOptionalFields());
    clean.forEach(m => {
      const field = this.getAllFields().find(f => f.value === m.dbField);
      if (field && !field.required) next.add(field.value);
    });
    this.addedOptionalFields.set(next);
  }

  private loadProfilesFromStorage(): void {
    try {
      const raw = localStorage.getItem(ColumnMappingModalComponent.PROFILES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.profiles.set(parsed);
      }
    } catch {}
  }

  private persistProfiles(): void {
    try {
      localStorage.setItem(ColumnMappingModalComponent.PROFILES_KEY, JSON.stringify(this.profiles()));
    } catch {}
  }

  // Mapping Management Methods
  createOrUpdateMapping(csvColumn: string, dbField: string): void {
    const field = this.getAllFields().find(f => f.value === dbField);
    if (!field) return;

    // Remove any existing mapping for this database field
    const currentMappings = this.columnMappings();
    const filteredMappings = currentMappings.filter(m => m.dbField !== dbField);

    // Add the new mapping
    const newMapping: ColumnMapping = {
      csvColumn,
      dbField,
      category: field.category
    };

    this.columnMappings.set([...filteredMappings, newMapping]);
  }

  clearMapping(fieldValue: string): void {
    const currentMappings = this.columnMappings();
    const filteredMappings = currentMappings.filter(m => m.dbField !== fieldValue);
    this.columnMappings.set(filteredMappings);
  }

  // Field Selector Modal Methods
  openFieldSelector(field: FieldOption): void {
    this.selectedField.set(field);
    this.selectedCsvColumn = this.getMappedColumn(field.value) || '';
  }

  closeFieldSelector(): void {
    this.selectedField.set(null);
    this.selectedCsvColumn = '';
  }

  confirmFieldSelection(): void {
    const field = this.selectedField();
    if (field && this.selectedCsvColumn) {
      this.createOrUpdateMapping(this.selectedCsvColumn, field.value);
    }
    this.closeFieldSelector();
  }

  // Utility Methods
  isColumnMapped(column: string): boolean {
    return this.columnMappings().some(m => m.csvColumn === column && m.dbField);
  }

  isMapped(fieldValue: string): boolean {
    return this.columnMappings().some(m => m.dbField === fieldValue && m.csvColumn);
  }

  getMappedColumn(fieldValue: string): string | null {
    const mapping = this.columnMappings().find(m => m.dbField === fieldValue && m.csvColumn);
    return mapping?.csvColumn || null;
  }

  getSampleValue(column: string): string {
    const samples = this.sampleRows();
    if (samples.length > 0 && samples[0][column]) {
      const value = String(samples[0][column]);
      return value.length > 15 ? value.substring(0, 15) + '...' : value;
    }
    return '';
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'sale': return 'Sale Fields';
      case 'listing': return 'Listing Fields';
      case 'product': return 'Product Fields';
      default: return category;
    }
  }

  setActiveCategory(category: string): void {
    if (category === 'sale' || category === 'listing' || category === 'product') {
      this.activeCategory.set(category);
    }
  }

  getRequiredFieldsCount(category: string): number {
    return this.fieldGroups
      .find(g => g.category === category)
      ?.fields.filter(f => f.required).length || 0;
  }

  getFieldsByCategory(category: string): FieldOption[] {
    return this.fieldGroups
      .find(g => g.category === category)
      ?.fields || [];
  }

  // Visible fields ordering rule:
  // 1) Always show required fields first (base order)
  // 2) Then show optional fields that are visible due to being mapped, but NOT explicitly added
  // 3) Finally, append optional fields explicitly added by the user, in the order they were added
  getVisibleFieldsByCategory(category: 'sale' | 'listing' | 'product'): FieldOption[] {
    const all = this.getFieldsByCategory(category);
    const added = this.addedOptionalFields(); // Set preserves insertion order

    const mappedFieldValues = new Set(
      this.columnMappings()
        .filter(m => m.csvColumn && m.dbField && m.category === category)
        .map(m => m.dbField)
    );

    const required = all.filter(f => f.required);

    // Optional visible because they are mapped, but not explicitly added
    const mappedOptionals = all.filter(
      f => !f.required && mappedFieldValues.has(f.value) && !added.has(f.value)
    );

    // Explicitly added optionals in insertion order
    const addedOptionals: FieldOption[] = [];
    for (const value of added) {
      const field = all.find(f => f.value === value);
      if (field && !field.required) {
        addedOptionals.push(field);
      }
    }

    return [...required, ...mappedOptionals, ...addedOptionals];
  }

  // Optional fields not currently visible (to populate the add control)
  getHiddenOptionalFieldsByCategory(category: 'sale' | 'listing' | 'product'): FieldOption[] {
    const all = this.getFieldsByCategory(category);
    const visible = new Set(this.getVisibleFieldsByCategory(category).map(f => f.value));
    return all.filter(f => !f.required && !visible.has(f.value));
  }

  addOptionalField(fieldValue: string): void {
    if (!fieldValue) return;
    const next = new Set(this.addedOptionalFields());
    next.add(fieldValue);
    this.addedOptionalFields.set(next);
  }

  hideOptionalField(fieldValue: string): void {
    // Only hide if optional and not mapped
    const field = this.getAllFields().find(f => f.value === fieldValue);
    if (!field || field.required) return;
    const isMapped = this.isMapped(fieldValue);
    if (isMapped) return;
    const next = new Set(this.addedOptionalFields());
    next.delete(fieldValue);
    this.addedOptionalFields.set(next);
  }

  // Inline select handler for vertical layout
  onColumnChanged(fieldValue: string, column: string): void {
    if (!fieldValue) return;
    if (!column) {
      this.clearMapping(fieldValue);
      return;
    }
    this.createOrUpdateMapping(column, fieldValue);
    // Ensure optional field becomes visible when user maps it once
    const field = this.getAllFields().find(f => f.value === fieldValue);
    if (field && !field.required) {
      const next = new Set(this.addedOptionalFields());
      next.add(fieldValue);
      this.addedOptionalFields.set(next);
    }
  }

  // Legacy Methods for Mobile Support
  addMapping(): void {
    const currentMappings = this.columnMappings();
    this.columnMappings.set([...currentMappings, { csvColumn: '', dbField: '', category: 'sale' }]);
  }

  removeMapping(index: number): void {
    if (index > 0) {
      const currentMappings = this.columnMappings();
      const filteredMappings = currentMappings.filter((_, i) => i !== index);
      this.columnMappings.set(filteredMappings);
    }
  }

  onFieldChange(mapping: ColumnMapping, fieldValue: string): void {
    const field = this.getAllFields().find(f => f.value === fieldValue);
    if (field) {
      mapping.category = field.category;
      // Update the signal state
      const currentMappings = this.columnMappings();
      const updatedMappings = currentMappings.map(m => m === mapping ? { ...m, dbField: fieldValue, category: field.category } : m);
      this.columnMappings.set(updatedMappings);
    }
  }

  private getAllFields(): FieldOption[] {
    return this.fieldGroups.flatMap(group => group.fields);
  }

  // --- Derived lists / helpers for UI ---
  filteredCsvColumns(): string[] {
    const query = this.csvSearch.trim().toLowerCase();
    const cols = this.csvColumns();
    if (!query) return cols;
    return cols.filter(col => col.toLowerCase().includes(query));
  }

  validationErrors = computed(() => {
    const errors: string[] = [];
    const requiredFields = this.getAllFields().filter(f => f.required);
    const mappedFields = this.columnMappings()
      .filter(m => m.csvColumn && m.dbField)
      .map(m => m.dbField);

    // Check for missing required fields
    for (const field of requiredFields) {
      if (!mappedFields.includes(field.value)) {
        errors.push(`Required field "${field.label}" must be mapped`);
      }
    }

    // Check for duplicate mappings
    const duplicates = mappedFields.filter((field, index) =>
      mappedFields.indexOf(field) !== index
    );
    for (const duplicate of [...new Set(duplicates)]) {
      const field = this.getAllFields().find(f => f.value === duplicate);
      errors.push(`Field "${field?.label}" is mapped multiple times`);
    }

    // Check for incomplete mappings from legacy mobile interface
    const incompleteMappings = this.columnMappings().filter(m =>
      (m.csvColumn && !m.dbField) || (!m.csvColumn && m.dbField)
    );
    if (incompleteMappings.length > 0) {
      errors.push('All mapping rows must have both CSV column and database field selected');
    }

    return errors;
  });

  // Toggle help visibility (accessible from template)
  toggleHelp(): void {
    this.showHelp.update(v => !v);
  }

  isValid = computed(() => {
    return this.validationErrors().length === 0;
  });

  // Tab-specific validation for current tab's required fields
  isCurrentTabValid = computed(() => {
    const currentCategory = this.activeCategory();
    const requiredFieldsForCategory = this.getFieldsByCategory(currentCategory).filter(f => f.required);
    const mappedFields = this.columnMappings()
      .filter(m => m.csvColumn && m.dbField)
      .map(m => m.dbField);

    // Check if all required fields for current category are mapped
    return requiredFieldsForCategory.every(field => mappedFields.includes(field.value));
  });

  // Get button text based on active tab
  getButtonText = computed(() => {
    const currentCategory = this.activeCategory();
    if (currentCategory === 'sale' || currentCategory === 'listing') {
      return 'Next';
    }
    return 'Confirm Mapping';
  });

  // Navigate to next tab or confirm mapping
  onButtonClick(): void {
    const currentCategory = this.activeCategory();

    if (currentCategory === 'sale') {
      this.setActiveCategory('listing');
    } else if (currentCategory === 'listing') {
      this.setActiveCategory('product');
    } else {
      // Final tab - confirm mapping
      this.onConfirm();
    }
  }

  onConfirm(): void {
    if (this.isValid()) {
      const validMappings = this.columnMappings().filter(m => m.csvColumn && m.dbField);
      this.mappingConfirmed.emit(validMappings);
    }
  }

  onCancel(): void {
    this.mappingCancelled.emit();
  }

  // Add first available optional field in the active category (used by the mock's "+ Add optional columns" control)
  addFirstHiddenOptional(): void {
    const current = this.activeCategory();
    const hidden = this.getHiddenOptionalFieldsByCategory(current);
    if (hidden.length > 0) {
      this.addOptionalField(hidden[0].value);
    }
  }
}
