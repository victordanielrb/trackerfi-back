
export enum SubmissionStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
}

export interface Submission {
    id: string;
    campaign_id: string;
    user_id: string;
    username: string;
    user_twitter_handle?: string;
    submission_data: {
        link?: string;
        text?: string;
        media?: string[];
        [key: string]: any;
    };
    status: SubmissionStatus;
    score?: number;
    feedback?: string;
    submitted_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
}
