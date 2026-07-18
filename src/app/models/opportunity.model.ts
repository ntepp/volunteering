import { Category } from "./category.model";
import { Skill } from "./skill.model";

export interface Opportunity {
    id?: string;
    title: string;
    description: string;
    location: string;
    town: string;
    image_path?: string;
    startDate: string; // Format YYYY-MM-DD
    endDate: string; // Format YYYY-MM-DD
    requirements: string;
    orgId: number;
    skillsRequired: Skill[];
    categories: Category[];
    created_at?: Date;
    updated_at?: Date;
    tags?: string[];
    workType?: string;
    status?: string;
}

export interface OpportunityResponseDto {
    id?: string;
    title: string;
    description: string;
    location?: string;
    town?: string;
    startDate: string;
    endDate: string;
    requirements?: string;
    orgId?: number;
    workType?: string;
    status?: string;
    tags?: string[];
    categories?: Category[];
    skillsRequired?: Skill[];
    categoryNames?: string[];
    skillNames?: string[];
    volunteersNeeded?: number;
    imageUrls?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface FeedResponse {
    preferred: OpportunityResponseDto[];
    recent: OpportunityResponseDto[];
}

// Interface pour la création d'opportunité — aligne sur OpportunityRequest (backend)
export interface CreateOpportunityRequest {
    title: string;
    description: string;
    location?: string;
    town?: string;
    startDate: string;   // YYYY-MM-DD
    endDate: string;     // YYYY-MM-DD
    requirements?: string;
    orgId: number;
    categoryNames: string[];
    skillNames: string[];
    workType?: string;
    volunteersNeeded?: number;
    imageUrls?: string[];
}
