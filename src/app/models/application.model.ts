export interface Application {
  id: string;
  volunteeringId: string;
  opportunityId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedAt: string;
  updatedAt: string;
}

export interface ApplicationRequest {
  volunteeringId: string;
  opportunityId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface ApplicationResponse {
  id: string;
  volunteeringId: string;
  opportunityId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedAt: string;
  updatedAt: string;
}



