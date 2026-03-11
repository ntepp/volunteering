import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { OpportunityPagination } from '../../models/opportunity-pagination.model';
import { OpportunityService } from '../services/opportunity.service';
import { Opportunity } from '../../models/opportunity.model';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ViewOpportunityDialogComponent } from './view-opportunity-dialog/view-opportunity-dialog.component';


@Component({
  selector: 'app-opportunity-my',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, MatTableModule, MatIcon],
  templateUrl: './opportunity-my.component.html',
  styleUrl: './opportunity-my.component.css'
})
export class OpportunityMyComponent implements OnInit {
  displayedColumns: string[] = ['title', 'location', 'startDate', 'endDate', 'actions'];
  pageSizeOptions: number[] = [5, 10, 20];
  opportunityPagination: OpportunityPagination = {
    currentPage: 0,
    itemsPerPage: 5,
    totalItems: 20,
    totalPages: 0
  }
  
  dataSource: Opportunity[] = [
  ];
  


  constructor(private opportunityService: OpportunityService, private dialog: MatDialog){
    
  }

  ngOnInit(): void {
    this.fetchOpportunities(this.opportunityPagination.currentPage, this.opportunityPagination.itemsPerPage);
  }

  handlePageEvent(event: PageEvent) {
    this.fetchOpportunities(event.pageIndex, event.pageSize)
  }

 

  private fetchOpportunities(currentPage: number, itemsPerPage: number) {
    this.opportunityService.getOpportunity(currentPage, itemsPerPage)
    .subscribe(opportunityPaginated => {
      this.opportunityPagination.opportunities = opportunityPaginated.opportunities;
      this.opportunityPagination.currentPage = opportunityPaginated.currentPage;
      this.opportunityPagination.itemsPerPage = opportunityPaginated.itemsPerPage;
      this.opportunityPagination.totalItems = opportunityPaginated.totalItems;
      this.opportunityPagination.totalPages = opportunityPaginated.totalPages;
      this.dataSource = this.opportunityPagination.opportunities ?? []
      
    });
    
  }

  
  onView(element: Opportunity): void {
    this.dialog.open(ViewOpportunityDialogComponent, {
      data: element, // Pass the opportunity details to the dialog
    });
  }
}
