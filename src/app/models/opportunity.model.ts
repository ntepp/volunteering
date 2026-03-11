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
}

// Interface pour la création d'opportunité (sans les champs optionnels)
export interface CreateOpportunityRequest {
    title: string;
    description: string;
    location: string;
    town: string;
    startDate: string;
    endDate: string;
    requirements: string;
    orgId: number;
    skillsRequired: Skill[];
    categories: Category[];
}
