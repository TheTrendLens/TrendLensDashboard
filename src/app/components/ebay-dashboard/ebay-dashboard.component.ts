import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EbayService, EbayConnectionStatus, SyncJob } from '../../services/ebay.service';
import { UserService } from '../../services/user.service';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ebay-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    RouterModule
  ],
  templateUrl: './ebay-dashboard.component.html',
  styleUrls: ['./ebay-dashboard.component.css']
})
export class EbayDashboardComponent implements OnInit, OnDestroy {
  connectionStatus: EbayConnectionStatus | null = null;
  syncJobs: SyncJob[] = [];
  isSyncing = false;
  currentSyncJob: SyncJob | null = null;
  private statusSubscription: Subscription | undefined;
  private pollSubscription: Subscription | undefined;

  constructor(
    private ebayService: EbayService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe();
    this.pollSubscription?.unsubscribe();
  }

  loadData(): void {
    this.userService.get().subscribe(user => {
      if (user) {
        this.ebayService.getConnectionStatus(user.id).subscribe(status => {
          this.connectionStatus = status;
          if (status.connected) {
            this.loadSyncHistory(user.id);
          }
        });
      }
    });
  }

  loadSyncHistory(userId: string): void {
    this.ebayService.getSyncHistory(userId).subscribe(jobs => {
      this.syncJobs = jobs;
      const processingJob = jobs.find(j => j.status === 'pending' || j.status === 'processing');
      if (processingJob) {
        this.startPolling(processingJob.id);
      }
    });
  }

  syncSales(): void {
    this.userService.get().subscribe(user => {
      if (user) {
        this.isSyncing = true;
        this.ebayService.syncSales(user.id).subscribe({
          next: (job) => {
            this.currentSyncJob = job;
            this.startPolling(job.id);
          },
          error: (err) => {
            console.error('Error syncing sales:', err);
            this.isSyncing = false;
          }
        });
      }
    });
  }

  syncListings(): void {
    this.userService.get().subscribe(user => {
      if (user) {
        this.isSyncing = true;
        this.ebayService.syncListings(user.id).subscribe({
          next: (job) => {
            this.currentSyncJob = job;
            this.startPolling(job.id);
          },
          error: (err) => {
            console.error('Error syncing listings:', err);
            this.isSyncing = false;
          }
        });
      }
    });
  }

  private startPolling(jobId: string): void {
    this.isSyncing = true;
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = interval(3000)
      .pipe(
        switchMap(() => this.ebayService.getSyncJob(jobId)),
        takeWhile(job => job.status === 'pending' || job.status === 'processing', true)
      )
      .subscribe(job => {
        this.currentSyncJob = job;
        if (job.status === 'completed' || job.status === 'failed') {
          this.isSyncing = false;
          this.userService.get().subscribe(user => {
            if (user) this.loadSyncHistory(user.id);
          });
        }
      });
  }

  connect(): void {
    // this.userService.getUser().subscribe(user => {
    //   if (user) this.ebayService.connectToEbay(user.uid);
    // });
  }
}
