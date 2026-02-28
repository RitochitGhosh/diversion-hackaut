export type Role = 'ADMIN' | 'REVIEWER' | 'USER';
export type QueryStatus = 'PENDING_AI' | 'PENDING_REVIEW' | 'APPROVED' | 'EDITED' | 'REJECTED' | 'ANSWERED';
export type ReviewAction = 'APPROVED' | 'EDITED' | 'REJECTED';

export interface Source {
  type: 'web' | 'rag';
  title: string;
  url?: string;
  excerpt: string;
}

export interface AgentLog {
  usedSearch: boolean;
  usedRAG: boolean;
  searchQuery?: string;
  ragCount: number;
  routingReason: string;
}

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
  sources: Source[] | null;
  agentLog: AgentLog | null;
  createdAt: Date;
  updatedAt: Date;
  submitter: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    role: Role;
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

export interface KnowledgeDocumentWithCount {
  id: string;
  title: string;
  fileName: string | null;
  chunkCount: number;
  serviceId: string;
  createdAt: Date;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface DashboardStats {
  totalQueries: number;
  pendingReview: number;
  answered: number;
  rejected: number;
  members: number;
}
