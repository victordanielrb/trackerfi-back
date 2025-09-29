export enum CampaignParticipantStatus {
  REGISTERED = 'REGISTERED',
  SUBMITTED = 'SUBMITTED',
  DISQUALIFIED = 'DISQUALIFIED',
}

export interface CampaignParticipant {
  user_id: string;
  joined_at: string;
 
}
