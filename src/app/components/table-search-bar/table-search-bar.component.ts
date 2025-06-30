import {Component, EventEmitter, Output} from '@angular/core';
import {MatInput} from '@angular/material/input';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-table-search-bar',
  imports: [
    MatInput,
    FormsModule
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
