import { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { ExternalLink, Search, X } from 'lucide-react';

// ── Resource data ─────────────────────────────────────────────────────────────

type Category = 'Deploy' | 'AI & Data' | 'Dev Tools' | 'Algorithms' | 'API Testing';

interface Resource {
  name: string;
  description: string;
  url: string;
  domain: string;
  category: Category;
  tags: string[];
}

const RESOURCES: Resource[] = [

  // ── Deploy & Hosting ──────────────────────────────────────────────────────
  { name: 'Vercel',       description: 'Deploy frontend apps instantly with git push. The gold standard for Next.js and React.',        url: 'https://vercel.com',       domain: 'vercel.com',       category: 'Deploy', tags: ['Frontend', 'Serverless', 'CI/CD'] },
  { name: 'Netlify',      description: 'Deploy static sites and serverless functions with a powerful edge network and form handling.',   url: 'https://netlify.com',      domain: 'netlify.com',      category: 'Deploy', tags: ['Frontend', 'JAMstack', 'Serverless'] },
  { name: 'Railway',      description: 'Instant deployments for any language or framework — from code to production in minutes.',       url: 'https://railway.app',      domain: 'railway.app',      category: 'Deploy', tags: ['Full-Stack', 'Docker', 'Databases'] },
  { name: 'Render',       description: 'Deploy web services, APIs, databases, and cron jobs with zero DevOps.',                        url: 'https://render.com',       domain: 'render.com',       category: 'Deploy', tags: ['Backend', 'Docker', 'PostgreSQL'] },
  { name: 'DigitalOcean', description: 'Droplets, managed Kubernetes, App Platform, and managed databases — developer-friendly cloud.',url: 'https://digitalocean.com', domain: 'digitalocean.com', category: 'Deploy', tags: ['VPS', 'Kubernetes', 'Managed DB'] },
  { name: 'Cloudflare',   description: 'CDN, DNS, edge workers, Pages, R2 storage, and DDoS protection for production apps.',          url: 'https://cloudflare.com',   domain: 'cloudflare.com',   category: 'Deploy', tags: ['CDN', 'Edge', 'Security'] },
  { name: 'Supabase',     description: 'Open-source Firebase alternative: Postgres database, auth, storage, and realtime subscriptions.', url: 'https://supabase.com',  domain: 'supabase.com',     category: 'Deploy', tags: ['BaaS', 'PostgreSQL', 'Auth'] },

  // ── AI & Data ─────────────────────────────────────────────────────────────
  { name: 'Google Colab',    description: 'Free Jupyter notebooks in the cloud with GPU/TPU access — the go-to for ML experiments.',               url: 'https://colab.research.google.com', domain: 'colab.research.google.com', category: 'AI & Data', tags: ['Jupyter', 'GPU', 'Python'] },
  { name: 'Hugging Face',    description: 'The GitHub of machine learning — models, datasets, spaces, and the transformers library.',              url: 'https://huggingface.co',     domain: 'huggingface.co',     category: 'AI & Data',   tags: ['ML Models', 'NLP', 'Open Source'] },
  { name: 'Kaggle',          description: 'Data science competitions, free GPUs, 50k+ public datasets, and structured learning courses.',         url: 'https://kaggle.com',         domain: 'kaggle.com',         category: 'AI & Data',   tags: ['Competitions', 'Datasets', 'GPU'] },
  { name: 'Claude',          description: "Anthropic's AI for coding, writing, analysis, and complex reasoning tasks.",                           url: 'https://claude.ai',          domain: 'claude.ai',          category: 'AI & Data',   tags: ['LLM', 'Coding', 'Analysis'] },
  { name: 'ChatGPT',         description: "OpenAI's conversational AI for code generation, debugging, and explanations.",                         url: 'https://chat.openai.com',    domain: 'chat.openai.com',    category: 'AI & Data',   tags: ['LLM', 'Coding', 'GPT-4'] },
  { name: 'GitHub Copilot',  description: 'AI pair programmer that completes code inline inside your editor.',                                    url: 'https://github.com/features/copilot', domain: 'github.com', category: 'AI & Data', tags: ['Autocomplete', 'IDE', 'LLM'] },
  { name: 'Weights & Biases',description: 'Track ML experiments, visualize metrics, and compare model runs at scale.',                            url: 'https://wandb.ai',           domain: 'wandb.ai',           category: 'AI & Data',   tags: ['MLOps', 'Experiment Tracking', 'Viz'] },
  { name: 'Jupyter',         description: 'The classic interactive notebook for data science, ML, and scientific computing.',                     url: 'https://jupyter.org/try',    domain: 'jupyter.org',        category: 'AI & Data',   tags: ['Notebooks', 'Python', 'Data Science'] },

  // ── Dev Tools ─────────────────────────────────────────────────────────────
  { name: 'GitHub',       description: 'Version control, code review, CI/CD Actions, and open-source collaboration hub.',                          url: 'https://github.com',         domain: 'github.com',         category: 'Dev Tools',   tags: ['Git', 'CI/CD', 'Open Source'] },
  { name: 'VS Code (Web)',description: 'Full-featured VS Code running in the browser — no install needed.',                                        url: 'https://vscode.dev',         domain: 'vscode.dev',         category: 'Dev Tools',   tags: ['Editor', 'Browser', 'Extensions'] },

  // ── Algorithms & Interview Prep ───────────────────────────────────────────
  { name: 'LeetCode',   description: '3500+ algorithm problems with company-tagged questions. The #1 platform for FAANG interview prep.', url: 'https://leetcode.com',   domain: 'leetcode.com',   category: 'Algorithms', tags: ['DSA', 'FAANG', 'Interview'] },
  { name: 'HackerRank', description: 'Coding challenges across algorithms, SQL, regex, and more. Used by companies for technical screening.',  url: 'https://hackerrank.com', domain: 'hackerrank.com', category: 'Algorithms', tags: ['Interview', 'SQL', 'Multi-lang'] },
  { name: 'Codeforces', description: 'Competitive programming contests and problem archive — trusted by CP champions worldwide.',               url: 'https://codeforces.com', domain: 'codeforces.com', category: 'Algorithms', tags: ['Competitive', 'Contests', 'CP'] },
  { name: 'NeetCode',   description: 'Curated LeetCode roadmap with video walkthroughs — the fastest path to interview-ready.',                url: 'https://neetcode.io',    domain: 'neetcode.io',    category: 'Algorithms', tags: ['Roadmap', 'Video', 'DSA'] },

  // ── API Testing & Design ──────────────────────────────────────────────────
  { name: 'Postman',           description: 'The industry standard for API development — build, test, mock, and document REST, GraphQL, and gRPC.', url: 'https://postman.com', domain: 'postman.com', category: 'API Testing', tags: ['REST', 'GraphQL', 'Mocking'] },
  { name: 'Swagger / OpenAPI', description: 'Design-first API specification with interactive docs, code generation, and team collaboration.',      url: 'https://swagger.io',  domain: 'swagger.io',  category: 'API Testing', tags: ['OpenAPI', 'Docs', 'Design-First'] },
];

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ['Dev Tools', 'Algorithms', 'AI & Data', 'Deploy', 'API Testing'];

const CATEGORY_META: Record<Category, { color: string; bg: string; border: string; emoji: string }> = {
  'Deploy':      { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', emoji: '🚀' },
  'AI & Data':   { color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200',   emoji: '🤖' },
  'Dev Tools':   { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   emoji: '🛠️' },
  'Algorithms':  { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', emoji: '⚡' },
  'API Testing': { color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200',   emoji: '🔌' },
};

// ── Resource card ─────────────────────────────────────────────────────────────

function ResourceCard({ resource }: { resource: Resource }) {
  const meta = CATEGORY_META[resource.category];

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3 hover:border-[#009999]/50 hover:shadow-lg hover:shadow-[#009999]/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Top: favicon + name + category badge */}
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl border border-gray-100 bg-white flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
          <img
            src={`https://www.google.com/s2/favicons?domain=${resource.domain}&sz=64`}
            alt={resource.name}
            className="size-6 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <span className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#009999] transition">
              {resource.name}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 uppercase tracking-wide ${meta.bg} ${meta.color} ${meta.border}`}>
              {resource.category}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 flex-1">
        {resource.description}
      </p>

      {/* Tags + open arrow */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {resource.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <ExternalLink className="size-3.5 text-gray-300 group-hover:text-[#009999] flex-shrink-0 transition" />
      </div>
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Challenges() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');

  const filtered = useMemo(() => {
    return RESOURCES.filter(r => {
      const matchesCat  = category === 'All' || r.category === category;
      const q           = search.toLowerCase();
      const matchesText = !q
        || r.name.toLowerCase().includes(q)
        || r.description.toLowerCase().includes(q)
        || r.tags.some(t => t.toLowerCase().includes(q));
      return matchesCat && matchesText;
    });
  }, [search, category]);

  const showGrouped = category === 'All' && !search;

  return (
    <div className="app-shell">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">Dev Hub</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {RESOURCES.length} tools — deploy, build, algorithms, and APIs
          </p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex items-center gap-2 sm:max-w-sm w-full border border-gray-200 bg-white rounded-full px-3 py-2.5 focus-within:border-[#009999] focus-within:ring-2 focus-within:ring-[#009999]/20 transition">
            <Search className="size-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tools, tags…"
              className="flex-1 text-sm text-gray-800 outline-none bg-transparent placeholder:text-gray-400 min-w-0"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${
                category === 'All'
                  ? 'bg-[#009999] text-white border-[#009999]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#009999] hover:text-[#009999]'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => {
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold transition border flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#009999] text-white border-[#009999]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#009999] hover:text-[#009999]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Search className="size-10 opacity-25 mx-auto mb-3" />
            <p className="font-medium text-gray-500">No tools match "{search}"</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }} className="text-sm text-[#009999] hover:underline mt-2">
              Clear filters
            </button>
          </div>
        )}

        {/* Grouped sections (All view) */}
        {showGrouped && CATEGORIES.map(cat => {
          const items = filtered.filter(r => r.category === cat);
          if (!items.length) return null;
          const meta = CATEGORY_META[cat];
          return (
            <section key={cat} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <h2 className={`text-xs font-bold uppercase tracking-widest ${meta.color}`}>{cat}</h2>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {items.map(r => <ResourceCard key={r.url} resource={r} />)}
              </div>
            </section>
          );
        })}

        {/* Flat list (search / single-category view) */}
        {!showGrouped && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(r => <ResourceCard key={r.url} resource={r} />)}
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <p className="text-center text-xs text-gray-300 mt-10">
            {filtered.length} / {RESOURCES.length} tools shown
          </p>
        )}
      </main>
    </div>
  );
}
