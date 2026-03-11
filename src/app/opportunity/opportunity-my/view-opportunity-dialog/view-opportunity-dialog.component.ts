import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-view-opportunity-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './view-opportunity-dialog.component.html',
  styleUrl: './view-opportunity-dialog.component.css'
})
export class ViewOpportunityDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
