import {Component, Inject, OnInit} from '@angular/core';
import {UserService} from "../../services/user.service";
import * as FileSaver from "file-saver";

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {

  ngOnInit(): void {
  }

  constructor(private userService: UserService) {
  }

  downloadReport() {
    this.userService.getReportByDateAndType(2024, 7, 'monthly').subscribe({
      next: (report) => {
        console.log(report);
        const blob = new Blob([new Uint8Array(report.data.data).buffer], { type: 'application/pdf' });

        console.log(report.data.data);

        FileSaver.saveAs(blob, '2024_07_monthly.pdf');
      },
      error: (err) => console.error(err)
    })
  }

}
