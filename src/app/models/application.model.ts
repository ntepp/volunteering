export type ApplicationStatus = 'PENDING' | 'VIEW' | 'ACCEPTED' | 'REJECTED' | 'CLOSED';

export interface Application {
  id: string;
  volunteeringId: string;
  opportunityId: string;
  status: ApplicationStatus;
  motivationText?: string;
  appliedAt: string;
  updatedAt?: string;
}

export interface ApplicationRequest {
  volunteeringId: string;
  opportunityId: string;
  motivationText?: string;
  status: ApplicationStatus;
}

export interface ApplicationResponse {
  id: string;
  volunteeringId: string;
  opportunityId: string;
  status: ApplicationStatus;
  motivationText?: string;
  appliedAt: string;
  updatedAt?: string;
}



