// Plan definitions shared by the pages and the Netlify functions.
// PAID_PLANS order matters: pricing renders in this order and the
// upgrade prompt points at the next plan up.

export type PlanKey = 'free' | 'pro' | 'team';

export type DocKind = 'readme' | 'architecture' | 'onboarding' | 'changelog';

export interface Plan {
  key: PlanKey;
  name: string;
  priceMonthly: number;
  docsPerMonth: number;
  privateRepos: boolean;
  openAsPr: boolean;
  shareLinks: boolean;
  // How much repository source the generator reads, in characters.
  // Bigger budgets cover bigger repos (and cost more to run).
  contextChars: number;
  stripePriceEnv?: string;
  blurb: string;
  features: string[];
}

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    key: 'free',
    name: 'Free',
    priceMonthly: 0,
    docsPerMonth: 3,
    privateRepos: false,
    openAsPr: false,
    shareLinks: false,
    contextChars: 120_000,
    blurb: 'Try it on an open source repo.',
    features: [
      '3 documents a month',
      'Public repositories',
      'README, architecture, onboarding and changelog docs',
      'Markdown download',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    priceMonthly: 19,
    docsPerMonth: 30,
    privateRepos: true,
    openAsPr: true,
    shareLinks: true,
    contextChars: 200_000,
    stripePriceEnv: 'STRIPE_PRO_PRICE_ID',
    blurb: 'For a developer documenting their own projects.',
    features: [
      '30 documents a month',
      'Private repositories',
      'Open docs as a pull request',
      'Share links for teammates and clients',
    ],
  },
  team: {
    key: 'team',
    name: 'Team',
    priceMonthly: 49,
    docsPerMonth: 100,
    privateRepos: true,
    openAsPr: true,
    shareLinks: true,
    contextChars: 400_000,
    stripePriceEnv: 'STRIPE_TEAM_PRICE_ID',
    blurb: 'For teams that onboard people and ship releases every week.',
    features: [
      '100 documents a month',
      'Reads twice as much code (large repos and monorepos)',
      'Private repositories and org repos',
      'Open docs as a pull request',
      'Share links for new hires',
    ],
  },
};

export const PAID_PLANS: PlanKey[] = ['pro', 'team'];

export function planFor(key: string | null | undefined, status?: string | null): Plan {
  if ((key === 'pro' || key === 'team') && (status === 'active' || status === 'trialing')) {
    return PLANS[key];
  }
  return PLANS.free;
}

export function nextPlanUp(key: PlanKey): Plan | null {
  if (key === 'free') return PLANS.pro;
  if (key === 'pro') return PLANS.team;
  return null;
}

export const DOC_KINDS: Record<DocKind, { label: string; description: string; file: string }> = {
  onboarding: {
    label: 'Onboarding guide',
    description: 'Setup, environment, how the code is laid out, and a first week plan for a new developer.',
    file: 'docs/ONBOARDING.md',
  },
  architecture: {
    label: 'Architecture overview',
    description: 'Components, data flow, key modules and the decisions behind them.',
    file: 'docs/ARCHITECTURE.md',
  },
  readme: {
    label: 'README',
    description: 'A clear project README: what it is, how to run it, how to contribute.',
    file: 'README.md',
  },
  changelog: {
    label: 'Changelog',
    description: 'Release notes grouped by Added, Changed and Fixed, from commits between two refs.',
    file: 'CHANGELOG.md',
  },
};

export function startOfMonthIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
