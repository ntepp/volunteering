export interface OrgProfileDto {
  id?: number;
  orgName?: string;
  missionStatement?: string;
  about?: string;
  verifiedBadge?: boolean;
  completenessScore?: number;
  city?: string;
  country?: string;
  profileImage?: string;
}

export interface UpdateOrgProfileRequest {
  orgName?: string;
  missionStatement?: string;
  about?: string;
  city?: string;
  country?: string;
  profileImage?: string;
}
