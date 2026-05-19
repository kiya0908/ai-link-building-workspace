export interface LearnedSelectors {
  comment: string;
  name: string;
  email: string;
  website: string;
  submit: string;
}

export interface SiteLearningRecord {
  domain: string;
  selectors: LearnedSelectors;
  updatedAt: number;
}
