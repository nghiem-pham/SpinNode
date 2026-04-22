import { useEffect, useState } from 'react';
import { Plus, Trash2, Download, ArrowLeft, ChevronDown, ChevronUp, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Education {
  id: string;
  school: string;
  location: string;
  degree: string;
  date: string;
  gpa: string;
  coursework: string;
}

export interface Experience {
  id: string;
  company: string;
  location: string;
  title: string;
  dates: string;
  bullets: string[];
}

export interface Project {
  id: string;
  name: string;
  technologies: string;
  dates: string;
  bullets: string[];
}

export interface ResumeData {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: { languages: string; frameworks: string; tools: string; libraries: string };
}

export const EMPTY_RESUME: ResumeData = {
  name: '',
  phone: '',
  email: '',
  linkedin: '',
  github: '',
  education: [],
  experience: [],
  projects: [],
  skills: { languages: '', frameworks: '', tools: '', libraries: '' },
};

export const RESUME_STORAGE_KEY = 'spinnode_resume_v1';

export function uid() { return Math.random().toString(36).slice(2); }

// ── Preview (Jake's template) ─────────────────────────────────────────────────

function JakesPreview({ data }: { data: ResumeData }) {
  return (
    <div
      id="jake-resume-preview"
      style={{
        fontFamily: "'Times New Roman', Georgia, serif",
        fontSize: '10.5pt',
        lineHeight: '1.15',
        color: '#000',
        padding: '36pt 54pt',
        width: '100%',
        minHeight: '1054px',
        background: '#fff',
        boxSizing: 'border-box',
      }}
    >
      {/* Name */}
      <div style={{ textAlign: 'center', marginBottom: '4pt' }}>
        <span style={{ fontSize: '22pt', fontWeight: 'bold' }}>{data.name || 'Your Name'}</span>
      </div>

      {/* Contact row */}
      <div style={{ textAlign: 'center', fontSize: '9.5pt', marginBottom: '6pt' }}>
        {[data.phone, data.email, data.linkedin && `linkedin.com/in/${data.linkedin}`, data.github && `github.com/${data.github}`]
          .filter(Boolean)
          .join(' | ')}
      </div>

      {/* Education */}
      {data.education.length > 0 && (
        <Section title="Education">
          {data.education.map(edu => (
            <div key={edu.id} style={{ marginBottom: '6pt' }}>
              <TwoCol left={<b>{edu.school}</b>} right={edu.location} />
              <TwoCol
                left={<i>{edu.degree}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</i>}
                right={edu.date}
              />
              {edu.coursework && (
                <div style={{ fontSize: '9.5pt' }}>
                  <b>Relevant Coursework:</b> {edu.coursework}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <Section title="Experience">
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: '6pt' }}>
              <TwoCol left={<b>{exp.company}</b>} right={exp.location} />
              <TwoCol left={<i>{exp.title}</i>} right={exp.dates} />
              <BulletList items={exp.bullets} />
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <Section title="Projects">
          {data.projects.map(proj => (
            <div key={proj.id} style={{ marginBottom: '6pt' }}>
              <TwoCol
                left={<><b>{proj.name}</b>{proj.technologies ? <> | <i>{proj.technologies}</i></> : null}</>}
                right={proj.dates}
              />
              <BulletList items={proj.bullets} />
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {(data.skills.languages || data.skills.frameworks || data.skills.tools || data.skills.libraries) && (
        <Section title="Technical Skills">
          <div style={{ fontSize: '9.5pt' }}>
            {data.skills.languages && <div><b>Languages:</b> {data.skills.languages}</div>}
            {data.skills.frameworks && <div><b>Frameworks:</b> {data.skills.frameworks}</div>}
            {data.skills.tools && <div><b>Developer Tools:</b> {data.skills.tools}</div>}
            {data.skills.libraries && <div><b>Libraries:</b> {data.skills.libraries}</div>}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '8pt' }}>
      <div style={{
        fontSize: '11pt',
        fontWeight: 'bold',
        letterSpacing: '0.5pt',
        textTransform: 'uppercase',
        borderBottom: '1.2pt solid #000',
        paddingBottom: '1pt',
        marginBottom: '5pt',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '10pt' }}>
      <span>{left}</span>
      <span style={{ fontSize: '9.5pt', whiteSpace: 'nowrap', marginLeft: '8pt' }}>{right}</span>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  const filled = items.filter(Boolean);
  if (!filled.length) return null;
  return (
    <ul style={{ margin: '2pt 0 0 0', paddingLeft: '16pt', listStyleType: 'disc' }}>
      {filled.map((b, i) => (
        <li key={i} style={{ fontSize: '9.5pt', marginBottom: '1.5pt' }}>{b}</li>
      ))}
    </ul>
  );
}

// ── Print helper ──────────────────────────────────────────────────────────────

function printResume() {
  const el = document.getElementById('jake-resume-preview');
  if (!el) return;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Resume</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Times New Roman',Georgia,serif; font-size:10.5pt; color:#000; }
@page { size: letter; margin: 0; }
ul { padding-left:16pt; }
</style>
</head><body>${el.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

// ── Form helpers ──────────────────────────────────────────────────────────────

function FormSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-800"
      >
        {title}
        {open ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4 text-gray-400" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#009999]/40";
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {multiline
        ? <textarea rows={3} className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ResumeBuilder({ onBack, initialData }: { onBack: () => void; initialData?: ResumeData }) {
  const [data, setData] = useState<ResumeData>(initialData ?? EMPTY_RESUME);
  const [saved, setSaved] = useState(false);

  // Auto-populate from initialData when it changes (e.g. passed from upload)
  useEffect(() => {
    if (initialData) setData(initialData);
  }, []);

  const set = <K extends keyof ResumeData>(key: K, val: ResumeData[K]) =>
    setData(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
    toast.success('Resume saved');
    setTimeout(() => setSaved(false), 2500);
  };

  // Education
  const addEdu = () => set('education', [...data.education, { id: uid(), school: '', location: '', degree: '', date: '', gpa: '', coursework: '' }]);
  const updateEdu = (id: string, field: keyof Education, val: string) =>
    set('education', data.education.map(e => e.id === id ? { ...e, [field]: val } : e));
  const removeEdu = (id: string) => set('education', data.education.filter(e => e.id !== id));

  // Experience
  const addExp = () => set('experience', [...data.experience, { id: uid(), company: '', location: '', title: '', dates: '', bullets: ['', '', ''] }]);
  const updateExp = (id: string, field: keyof Omit<Experience, 'bullets'>, val: string) =>
    set('experience', data.experience.map(e => e.id === id ? { ...e, [field]: val } : e));
  const updateExpBullet = (id: string, i: number, val: string) =>
    set('experience', data.experience.map(e => e.id === id ? { ...e, bullets: e.bullets.map((b, j) => j === i ? val : b) } : e));
  const addExpBullet = (id: string) =>
    set('experience', data.experience.map(e => e.id === id ? { ...e, bullets: [...e.bullets, ''] } : e));
  const removeExp = (id: string) => set('experience', data.experience.filter(e => e.id !== id));

  // Projects
  const addProj = () => set('projects', [...data.projects, { id: uid(), name: '', technologies: '', dates: '', bullets: ['', ''] }]);
  const updateProj = (id: string, field: keyof Omit<Project, 'bullets'>, val: string) =>
    set('projects', data.projects.map(p => p.id === id ? { ...p, [field]: val } : p));
  const updateProjBullet = (id: string, i: number, val: string) =>
    set('projects', data.projects.map(p => p.id === id ? { ...p, bullets: p.bullets.map((b, j) => j === i ? val : b) } : p));
  const addProjBullet = (id: string) =>
    set('projects', data.projects.map(p => p.id === id ? { ...p, bullets: [...p.bullets, ''] } : p));
  const removeProj = (id: string) => set('projects', data.projects.filter(p => p.id !== id));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#009999] transition flex-shrink-0">
          <ArrowLeft className="size-4" /> Back
        </button>
        <h2 className="text-sm font-bold text-gray-800 truncate">Resume Builder — Jake's Template</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition border ${
              saved
                ? 'bg-green-50 border-green-200 text-green-600'
                : 'bg-white border-gray-200 text-gray-700 hover:border-[#009999] hover:text-[#009999]'
            }`}
          >
            {saved ? <><Check className="size-4" /> Saved</> : <><Save className="size-4" /> Save</>}
          </button>
          <button
            onClick={printResume}
            className="flex items-center gap-2 bg-[#009999] hover:bg-[#007777] text-white text-sm font-semibold px-4 py-2 rounded-full transition"
          >
            <Download className="size-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: form */}
        <div className="w-[420px] flex-shrink-0 overflow-y-auto border-r border-gray-100 p-4 space-y-3 bg-gray-50/50">

          <FormSection title="Contact Info">
            <Field label="Full Name" value={data.name} onChange={v => set('name', v)} placeholder="John Doe" />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Phone" value={data.phone} onChange={v => set('phone', v)} placeholder="123-456-7890" />
              <Field label="Email" value={data.email} onChange={v => set('email', v)} placeholder="john@email.com" />
              <Field label="LinkedIn username" value={data.linkedin} onChange={v => set('linkedin', v)} placeholder="johndoe" />
              <Field label="GitHub username" value={data.github} onChange={v => set('github', v)} placeholder="johndoe" />
            </div>
          </FormSection>

          <FormSection title="Education">
            {data.education.map((edu, idx) => (
              <div key={edu.id} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">Education {idx + 1}</span>
                  <button onClick={() => removeEdu(edu.id)} className="text-gray-300 hover:text-red-400 transition"><Trash2 className="size-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="School" value={edu.school} onChange={v => updateEdu(edu.id, 'school', v)} placeholder="University Name" />
                  <Field label="Location" value={edu.location} onChange={v => updateEdu(edu.id, 'location', v)} placeholder="City, ST" />
                </div>
                <Field label="Degree" value={edu.degree} onChange={v => updateEdu(edu.id, 'degree', v)} placeholder="B.S. in Computer Science" />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Graduation Date" value={edu.date} onChange={v => updateEdu(edu.id, 'date', v)} placeholder="May 2025" />
                  <Field label="GPA (optional)" value={edu.gpa} onChange={v => updateEdu(edu.id, 'gpa', v)} placeholder="3.8" />
                </div>
                <Field label="Relevant Coursework (optional)" value={edu.coursework} onChange={v => updateEdu(edu.id, 'coursework', v)} placeholder="Data Structures, Algorithms, ..." />
              </div>
            ))}
            <button onClick={addEdu} className="flex items-center gap-1.5 text-xs font-medium text-[#009999] hover:text-[#007777] transition">
              <Plus className="size-3.5" /> Add Education
            </button>
          </FormSection>

          <FormSection title="Experience">
            {data.experience.map((exp, idx) => (
              <div key={exp.id} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">Experience {idx + 1}</span>
                  <button onClick={() => removeExp(exp.id)} className="text-gray-300 hover:text-red-400 transition"><Trash2 className="size-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Company" value={exp.company} onChange={v => updateExp(exp.id, 'company', v)} placeholder="Google" />
                  <Field label="Location" value={exp.location} onChange={v => updateExp(exp.id, 'location', v)} placeholder="Mountain View, CA" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Job Title" value={exp.title} onChange={v => updateExp(exp.id, 'title', v)} placeholder="Software Engineer Intern" />
                  <Field label="Dates" value={exp.dates} onChange={v => updateExp(exp.id, 'dates', v)} placeholder="May 2024 – Aug 2024" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bullet Points</label>
                  <div className="space-y-1.5">
                    {exp.bullets.map((b, i) => (
                      <input key={i} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#009999]/40"
                        value={b} onChange={e => updateExpBullet(exp.id, i, e.target.value)}
                        placeholder={`Bullet ${i + 1}...`} />
                    ))}
                    <button onClick={() => addExpBullet(exp.id)} className="text-xs text-[#009999] hover:text-[#007777] transition flex items-center gap-1">
                      <Plus className="size-3" /> Add bullet
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addExp} className="flex items-center gap-1.5 text-xs font-medium text-[#009999] hover:text-[#007777] transition">
              <Plus className="size-3.5" /> Add Experience
            </button>
          </FormSection>

          <FormSection title="Projects">
            {data.projects.map((proj, idx) => (
              <div key={proj.id} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">Project {idx + 1}</span>
                  <button onClick={() => removeProj(proj.id)} className="text-gray-300 hover:text-red-400 transition"><Trash2 className="size-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Project Name" value={proj.name} onChange={v => updateProj(proj.id, 'name', v)} placeholder="My App" />
                  <Field label="Dates (optional)" value={proj.dates} onChange={v => updateProj(proj.id, 'dates', v)} placeholder="Jan 2024" />
                </div>
                <Field label="Technologies" value={proj.technologies} onChange={v => updateProj(proj.id, 'technologies', v)} placeholder="React, Node.js, PostgreSQL" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bullet Points</label>
                  <div className="space-y-1.5">
                    {proj.bullets.map((b, i) => (
                      <input key={i} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#009999]/40"
                        value={b} onChange={e => updateProjBullet(proj.id, i, e.target.value)}
                        placeholder={`Bullet ${i + 1}...`} />
                    ))}
                    <button onClick={() => addProjBullet(proj.id)} className="text-xs text-[#009999] hover:text-[#007777] transition flex items-center gap-1">
                      <Plus className="size-3" /> Add bullet
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addProj} className="flex items-center gap-1.5 text-xs font-medium text-[#009999] hover:text-[#007777] transition">
              <Plus className="size-3.5" /> Add Project
            </button>
          </FormSection>

          <FormSection title="Technical Skills">
            <Field label="Languages" value={data.skills.languages} onChange={v => set('skills', { ...data.skills, languages: v })} placeholder="Python, JavaScript, Java, C++" />
            <Field label="Frameworks" value={data.skills.frameworks} onChange={v => set('skills', { ...data.skills, frameworks: v })} placeholder="React, Node.js, Spring Boot" />
            <Field label="Developer Tools" value={data.skills.tools} onChange={v => set('skills', { ...data.skills, tools: v })} placeholder="Git, Docker, AWS, VS Code" />
            <Field label="Libraries" value={data.skills.libraries} onChange={v => set('skills', { ...data.skills, libraries: v })} placeholder="PyTorch, NumPy, Pandas" />
          </FormSection>
        </div>

        {/* Right: preview */}
        <div className="flex-1 overflow-y-auto bg-gray-200 p-6">
          <div className="shadow-xl mx-auto" style={{ maxWidth: '816px', background: '#fff' }}>
            <JakesPreview data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
