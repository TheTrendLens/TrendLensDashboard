import {Component, EventEmitter, Output} from '@angular/core';
import {MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-table-search-bar',
  imports: [
    MatFormField,
    MatInput,
    FormsModule,
    MatIcon
  ],
  templateUrl: './table-search-bar.component.html',
  styleUrl: './table-search-bar.component.css'
})
export class TableSearchBarComponent {
  searchQuery: string = '';
  @Output() search = new EventEmitter<string>();

  onSearch() {
    this.search.emit(this.searchQuery);
  }
}
