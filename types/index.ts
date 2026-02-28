export type Role = 'ADMIN' | 'REVIEWER';
export type QueryStatus = 'PENDING_AI' | 'PENDING_REVIEW' | 'APPROVED' | 'EDITED' | 'REJECTED' | 'ANSWERED';
export type ReviewAction = 'APPROVED' | 'EDITED' | 'REJECTED';

export interface ServiceMemberWithService {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  serviceId: string;
  createdAt: Date;
  service: {
    id: string;
    serviceCode: string;
    name: string;
    description: string | null;
    logoEmoji: string;
    ownerId: string;
    createdAt: Date;
    _count?: { members: number; queries: number };
  };
}

export interface QueryWithReview {
  id: string;
  content: string;
  submitterId: string;
  serviceId: string;
  status: QueryStatus;
  aiDraft: string | null;
  finalAnswer: string | null;
  createdAt: Date;
  updatedAt: Date;
  submitter: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  review: {
    id: string;
    action: ReviewAction;
    editedContent: string | null;
    note: string | null;
    createdAt: Date;
    reviewer: {
      id: string;
      name: string | null;
      email: string;
    };
  } | null;
}

export interface DashboardStats {
  totalQueries: number;
  pendingReview: number;
  answered: number;
  rejected: number;
  members: number;
}
