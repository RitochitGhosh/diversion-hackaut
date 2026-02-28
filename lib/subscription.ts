export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface PlanLimits {
  queriesPerMonth: number | null; // null = unlimited
  maxKnowledgeDocs: number | null;
  webSearch: boolean;
  label: string;
  color: string;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  FREE: {
    queriesPerMonth: 100,
    maxKnowledgeDocs: 3,
    webSearch: false,
    label: 'Free',
    color: 'neo-cream',
  },
  PRO: {
    queriesPerMonth: 2000,
    maxKnowledgeDocs: 50,
    webSearch: true,
    label: 'Pro',
    color: 'neo-blue',
  },
  ENTERPRISE: {
    queriesPerMonth: null,
    maxKnowledgeDocs: null,
    webSearch: true,
    label: 'Enterprise',
    color: 'neo-purple',
  },
};

export const PLAN_PRICES_ALGO: Record<'PRO' | 'ENTERPRISE', number> = {
  PRO: 10,
  ENTERPRISE: 25,
};

export const PLAN_DURATION_DAYS = 30;

export function getTierBadgeColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    FREE: 'bg-neo-cream border-neo-black',
    PRO: 'bg-neo-blue border-neo-black',
    ENTERPRISE: 'bg-neo-purple border-neo-black',
  };
  return colors[tier];
}
