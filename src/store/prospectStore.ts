import { create } from 'zustand';

export interface Prospect {
  id: string;
  company: string;
  industry: string;
  employeeRange: string;
  signal: string;
  source: string;
  addedAt: string;
  status: 'active' | 'researched' | 'dismissed';
}

interface ProspectState {
  active: Prospect[];
  researched: Prospect[];
  pool: Prospect[];
  markResearched: (id: string) => void;
  dismissProspect: (id: string) => void;
  initProspects: () => void;
}

const STORAGE_KEY = 'dcc_prospects';

function makeProspect(
  company: string,
  industry: string,
  employeeRange: string,
  signal: string,
  source: string,
): Prospect {
  return {
    id: crypto.randomUUID(),
    company,
    industry,
    employeeRange,
    signal,
    source,
    addedAt: new Date().toISOString(),
    status: 'active',
  };
}

const BUILT_IN_POOL: Prospect[] = [
  makeProspect('Vanta', 'Cybersecurity', '200-500', 'Growing 65% YoY, posted Benefits Manager role', 'Apollo.io'),
  makeProspect('Lattice', 'HR Tech', '200-500', 'Series F, expanding people ops team', 'LinkedIn Sales Nav'),
  makeProspect('Ramp', 'Fintech', '200-500', 'Hired 120 in Q4, no dedicated benefits lead', 'Apollo.io'),
  makeProspect('Brex', 'Fintech', '300-500', 'Restructured HR dept, benefits admin role open', 'LinkedIn Sales Nav'),
  makeProspect('Mercury', 'Banking / Fintech', '150-300', 'Growing 80% YoY, recently posted HR Ops role', 'Apollo.io'),
  makeProspect('Notion', 'Productivity SaaS', '300-500', 'Expanding US headcount rapidly, benefits review cycle', 'Crunchbase'),
  makeProspect('Airtable', 'Productivity SaaS', '200-400', 'Posted Total Rewards Analyst opening', 'LinkedIn Sales Nav'),
  makeProspect('Linear', 'Developer Tools', '50-100', 'Series B, scaling from 60 to 100+ employees', 'Crunchbase'),
  makeProspect('Retool', 'Developer Tools', '200-400', 'Growing engineering team, no benefits specialist listed', 'Apollo.io'),
  makeProspect('Vercel', 'Cloud Infrastructure', '200-400', 'Series D, rapid headcount growth across US/EU', 'Crunchbase'),
  makeProspect('Supabase', 'Developer Tools', '100-200', 'Series C, distributed team needing multi-state benefits', 'Apollo.io'),
  makeProspect('Neon', 'Database / Cloud', '50-150', 'Series B, hiring across 3 US offices', 'Crunchbase'),
  makeProspect('Railway', 'Cloud Infrastructure', '50-100', 'Series A, scaling fast from seed stage', 'Apollo.io'),
  makeProspect('Fly.io', 'Cloud Infrastructure', '80-150', 'Growing dev team, recently posted People Ops role', 'LinkedIn Sales Nav'),
  makeProspect('Render', 'Cloud Infrastructure', '100-200', 'Series C, 90% YoY growth, no benefits team', 'Apollo.io'),
  makeProspect('Drata', 'Compliance / Security', '200-400', 'Tripled headcount in 18 months', 'Crunchbase'),
  makeProspect('Samsara', 'IoT / Fleet Mgmt', '300-500', 'IPO growth phase, consolidating benefits vendors', 'Apollo.io'),
  makeProspect('Rippling', 'HR Tech / Fintech', '300-500', 'Competitor intel opportunity, evaluating benefits stack', 'LinkedIn Sales Nav'),
  makeProspect('Deel', 'Global HR / Payroll', '200-500', 'Expanding US presence, need domestic benefits admin', 'Apollo.io'),
  makeProspect('Remote', 'Global HR', '200-400', 'Building out US benefits for own employees', 'Crunchbase'),
  makeProspect('Oyster', 'Global HR', '150-300', 'Series C, scaling US operations', 'Apollo.io'),
  makeProspect('Justworks', 'HR / PEO', '200-400', 'Posting benefits analyst roles, may be switching vendors', 'LinkedIn Sales Nav'),
  makeProspect('Gusto', 'Payroll / HR', '300-500', 'Reviewing benefits platform, open RFP noted', 'Apollo.io'),
  makeProspect('Calendly', 'Scheduling SaaS', '200-400', 'Rapid growth post-IPO prep, benefits overhaul', 'Crunchbase'),
  makeProspect('Webflow', 'Web Development', '200-400', 'Series C, 70% headcount growth, HR team expanding', 'Apollo.io'),
  makeProspect('Ironclad', 'Legal Tech', '150-300', 'Series E, posted VP People role', 'LinkedIn Sales Nav'),
  makeProspect('Anduril', 'Defense Tech', '300-500', 'Massive hiring, complex multi-state benefits needs', 'Apollo.io'),
  makeProspect('Applied Systems', 'InsurTech', '200-500', 'Omaha-based, growing Midwest HQ, benefits review', 'Local Network'),
  makeProspect('Spreetail', 'E-Commerce / Logistics', '200-400', 'Lincoln NE HQ, expanding fulfillment staff', 'Local Network'),
  makeProspect('Hudl', 'Sports Tech', '300-500', 'Lincoln NE, steady growth, benefits vendor contract expiring', 'Local Network'),
  makeProspect('Buildertrend', 'Construction Tech', '200-400', 'Omaha-based, 300+ employees, rapid scaling', 'Local Network'),
  makeProspect('Flywheel', 'Digital Agency / WordPress', '100-200', 'Omaha HQ, acquired by WP Engine, benefits transition', 'Local Network'),
  makeProspect('Bulu', 'Subscription Commerce', '50-100', 'Lincoln NE, Series A, needs scalable benefits', 'Local Network'),
  makeProspect('Opendorse', 'Sports Tech / NIL', '50-100', 'Lincoln NE, fast growth in NIL space, posted HR role', 'Local Network'),
  makeProspect('Firespring', 'Marketing / SaaS', '100-200', 'Lincoln NE, steady mid-market, reviewing benefits', 'Local Network'),
  makeProspect('TestRail (IDERA)', 'QA / DevOps', '100-200', 'Omaha office, parent company reviewing benefits consolidation', 'Local Network'),
  makeProspect('Quantum Workplace', 'HR Tech', '100-200', 'Omaha-based, growing engagement platform, HR ops hiring', 'Local Network'),
  makeProspect('Bloomerang', 'Nonprofit SaaS', '150-300', 'Indianapolis, Midwest focus, posted People Ops Manager', 'Apollo.io'),
  makeProspect('Alley Corp Portfolio', 'Multi-vertical', '50-200', '10+ portfolio companies needing consolidated benefits', 'Crunchbase'),
];

function saveToStorage(state: { active: Prospect[]; researched: Prospect[]; pool: Prospect[] }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ active: state.active, researched: state.researched, pool: state.pool }),
    );
  } catch {
    // localStorage may be full or unavailable
  }
}

function loadFromStorage(): { active: Prospect[]; researched: Prospect[]; pool: Prospect[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.active) && Array.isArray(parsed.pool)) {
      return parsed;
    }
  } catch {
    // corrupted data
  }
  return null;
}

export const useProspectStore = create<ProspectState>((set, get) => ({
  active: [],
  researched: [],
  pool: [],

  initProspects: () => {
    const saved = loadFromStorage();
    if (saved) {
      set({ active: saved.active, researched: saved.researched ?? [], pool: saved.pool });
      return;
    }
    // First time: take 5 from the built-in pool
    const allProspects = [...BUILT_IN_POOL];
    const active = allProspects.slice(0, 5).map((p) => ({ ...p, status: 'active' as const }));
    const pool = allProspects.slice(5);
    set({ active, researched: [], pool });
    saveToStorage({ active, researched: [], pool });
  },

  markResearched: (id: string) => {
    const { active, researched, pool } = get();
    const prospect = active.find((p) => p.id === id);
    if (!prospect) return;

    const newResearched = [...researched, { ...prospect, status: 'researched' as const }];
    const newActive = active.filter((p) => p.id !== id);

    // Pull next from pool
    if (pool.length > 0) {
      const next = { ...pool[0], status: 'active' as const };
      newActive.push(next);
      const newPool = pool.slice(1);
      set({ active: newActive, researched: newResearched, pool: newPool });
      saveToStorage({ active: newActive, researched: newResearched, pool: newPool });
    } else {
      set({ active: newActive, researched: newResearched });
      saveToStorage({ active: newActive, researched: newResearched, pool: [] });
    }
  },

  dismissProspect: (id: string) => {
    const { active, researched, pool } = get();
    const newActive = active.filter((p) => p.id !== id);

    // Pull next from pool
    if (pool.length > 0) {
      const next = { ...pool[0], status: 'active' as const };
      newActive.push(next);
      const newPool = pool.slice(1);
      set({ active: newActive, pool: newPool });
      saveToStorage({ active: newActive, researched, pool: newPool });
    } else {
      set({ active: newActive });
      saveToStorage({ active: newActive, researched, pool: [] });
    }
  },
}));
