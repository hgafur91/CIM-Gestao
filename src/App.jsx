import { useState, useEffect, useRef } from "react";

// ── Storage ───────────────────────────────────────────────────────────────────
const db = {
  async get(key) {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async set(key, val) {
    try { await window.storage.set(key, JSON.stringify(val)); return true; }
    catch { return false; }
  }
};

// ── AI Analysis ───────────────────────────────────────────────────────────────
async function analyzeReport(base64, mimeType, students) {
  const studentList = students.map(s => `${s.code}: ${s.name}`).join("\n");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
          { type: "text", text: `Analisa esta folha de relatório quinzenal de uma madrassa/CIM.

Lista de alunos desta turma:
${studentList}

Extrai os dados em JSON puro (sem markdown):
{
  "semanas": "ex: Semana 3 & 4",
  "periodo": "ex: 16/Fev - 27/Fev",
  "cim": {
    "aulas_dadas": número,
    "materias": "texto"
  },
  "madrassa": {
    "sessoes_dadas": número
  },
  "alunos": [
    {
      "codigo": "código do aluno",
      "nome": "nome",
      "cim_faltas": número,
      "madrassa_presencas": número,
      "madrassa_faltas": número,
      "madrassa_faltas_justificadas": número,
      "observacoes": "texto ou null"
    }
  ],
  "observacoes_gerais": "texto ou null"
}` }
        ]
      }]
    })
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return null; }
}

// ── Design System ─────────────────────────────────────────────────────────────
const C = {
  navy:      "#0A1628",
  blue:      "#1251A3",
  blueMid:   "#1A6FD4",
  blueLight: "#3B8FE8",
  bluePale:  "#EAF2FC",
  blueFaint: "#F4F8FE",
  white:     "#FFFFFF",
  slate:     "#5A6A7E",
  slateLight:"#8898AA",
  line:      "#DDE4EE",
  sand:      "#F7F9FC",
  green:     "#1A7A4A",
  greenPale: "#EAF7F0",
  red:       "#B91C1C",
  redPale:   "#FEF2F2",
  amber:     "#B45309",
  amberPale: "#FFFBEB",
};

// ── SVG Icon Library ──────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor", strokeWidth = 1.6 }) => {
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    student: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
    report: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    upload: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    back: <><polyline points="15 18 9 12 15 6"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    mosque: <><path d="M12 2C8 2 6 5 6 8c0 2 1 3 2 4H4v10h16V12h-4c1-1 2-2 2-4 0-3-2-6-6-6z"/><path d="M9 22v-4a3 3 0 0 1 6 0v4"/><path d="M2 12h2M20 12h2"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    stats: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ── Typography & Layout ───────────────────────────────────────────────────────
const T = {
  h1: { fontSize: "1.75rem", fontWeight: 700, color: C.navy, letterSpacing: "-0.02em", margin: 0 },
  h2: { fontSize: "1.25rem", fontWeight: 700, color: C.navy, letterSpacing: "-0.01em", margin: 0 },
  h3: { fontSize: "1rem",    fontWeight: 600, color: C.navy, margin: 0 },
  body: { fontSize: "0.9rem", color: C.slate, lineHeight: 1.6 },
  small: { fontSize: "0.78rem", color: C.slateLight },
  label: { fontSize: "0.72rem", fontWeight: 700, color: C.slateLight, letterSpacing: "0.08em", textTransform: "uppercase" },
  mono: { fontFamily: "'Courier New', monospace", fontSize: "0.82rem", color: C.blue, background: C.bluePale, padding: "2px 6px", borderRadius: 4 },
};

const inp = {
  width: "100%", border: `1.5px solid ${C.line}`, borderRadius: 8,
  padding: "0.6rem 0.9rem", fontSize: "0.9rem", color: C.navy,
  background: C.white, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color 0.15s",
};

const Btn = ({ children, onClick, variant = "primary", size = "md", icon, disabled, full }) => {
  const variants = {
    primary:   { background: C.blue,      color: C.white,    border: "none" },
    secondary: { background: C.bluePale,  color: C.blue,     border: "none" },
    ghost:     { background: "transparent", color: C.slate,  border: `1.5px solid ${C.line}` },
    danger:    { background: C.redPale,   color: C.red,      border: "none" },
    success:   { background: C.greenPale, color: C.green,    border: "none" },
  };
  const sizes = {
    sm: { padding: "0.35rem 0.85rem", fontSize: "0.8rem", borderRadius: 7 },
    md: { padding: "0.55rem 1.2rem",  fontSize: "0.875rem", borderRadius: 8 },
    lg: { padding: "0.75rem 1.6rem",  fontSize: "0.95rem", borderRadius: 10 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size],
      display: "inline-flex", alignItems: "center", gap: 7,
      fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, fontFamily: "inherit",
      width: full ? "100%" : "auto", justifyContent: "center",
      transition: "opacity 0.15s, transform 0.1s",
    }}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} color="currentColor" />}
      {children}
    </button>
  );
};

const Badge = ({ children, color = "blue" }) => {
  const map = { blue: [C.bluePale, C.blue], green: [C.greenPale, C.green],
                amber: [C.amberPale, C.amber], red: [C.redPale, C.red], slate: [C.sand, C.slate] };
  const [bg, fg] = map[color] || map.blue;
  return <span style={{ background: bg, color: fg, borderRadius: 20, padding: "0.2rem 0.7rem",
    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em" }}>{children}</span>;
};

const Card = ({ children, style }) => (
  <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.line}`,
    boxShadow: "0 1px 4px rgba(10,22,40,0.06)", padding: "1.5rem", ...style }}>{children}</div>
);

const Divider = () => <div style={{ height: 1, background: C.line, margin: "1rem 0" }} />;

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]         = useState(null);
  const [screen, setScreen]     = useState("login");
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [reports, setReports]   = useState([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [t, s, r] = await Promise.all([
      db.get("cim:teachers"), db.get("cim:students"), db.get("cim:reports")
    ]);
    setTeachers(t || []);
    setStudents(s || []);
    setReports(r || []);
  }

  const save = {
    teachers: async (v) => { setTeachers(v); await db.set("cim:teachers", v); },
    students: async (v) => { setStudents(v); await db.set("cim:students", v); },
    reports:  async (v) => { setReports(v);  await db.set("cim:reports",  v); },
  };

  function login(id, pass) {
    if (id === "coord" && pass === "admin123") {
      setUser({ id: "coord", name: "Coordenador", role: "coord" });
      setScreen("coord"); return true;
    }
    const t = teachers.find(t => t.id === id && t.password === pass);
    if (t) { setUser(t); setScreen("teacher"); return true; }
    return false;
  }

  function logout() { setUser(null); setScreen("login"); }

  if (screen === "login")   return <LoginScreen onLogin={login} />;
  if (screen === "coord")   return <CoordShell user={user} teachers={teachers} students={students}
    reports={reports} save={save} onLogout={logout} />;
  if (screen === "teacher") return <TeacherShell user={user} students={students}
    reports={reports} save={save} onLogout={logout} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [id, setId]     = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr]   = useState("");

  function submit() {
    if (!onLogin(id.trim(), pass)) setErr("Credenciais inválidas. Tente novamente.");
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.navy} 0%, #112244 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Background geometric lines */}
      <svg style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }}
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <line x1="0" y1="150" x2="800" y2="450" stroke="white" strokeWidth="1"/>
        <line x1="0" y1="300" x2="800" y2="600" stroke="white" strokeWidth="1"/>
        <line x1="200" y1="0" x2="600" y2="600" stroke="white" strokeWidth="1"/>
        <circle cx="600" cy="100" r="200" stroke="white" strokeWidth="1" fill="none"/>
      </svg>

      <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 72, height: 72, background: "rgba(255,255,255,0.1)",
            borderRadius: 20, display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1rem", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <Icon name="mosque" size={36} color={C.white} strokeWidth={1.4} />
          </div>
          <h1 style={{ ...T.h1, color: C.white, fontSize: "1.9rem", marginBottom: "0.4rem" }}>C.I.M</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", margin: 0 }}>
            Sistema de Gestão de Professores
          </p>
        </div>

        {/* Card */}
        <div style={{ background: C.white, borderRadius: 18, padding: "2rem",
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
          <h2 style={{ ...T.h3, marginBottom: "1.5rem", color: C.slate, fontWeight: 500 }}>
            Iniciar sessão
          </h2>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ ...T.label, marginBottom: 6 }}>Identificador</div>
            <input style={inp} value={id} placeholder="coord  ou  prof01"
              onChange={e => setId(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ ...T.label, marginBottom: 6 }}>Palavra-passe</div>
            <input style={inp} type="password" value={pass} placeholder="••••••••"
              onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {err && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red,
              fontSize: "0.84rem", marginBottom: "1rem", background: C.redPale,
              borderRadius: 8, padding: "0.6rem 0.9rem" }}>
              <Icon name="alert" size={16} color={C.red} />
              {err}
            </div>
          )}
          <Btn full size="lg" onClick={submit}>Entrar</Btn>

          <div style={{ marginTop: "1.5rem", padding: "1rem", background: C.sand,
            borderRadius: 10, border: `1px solid ${C.line}` }}>
            <div style={{ ...T.label, marginBottom: 6 }}>Acesso de demonstração</div>
            <div style={{ ...T.small }}>Coordenador: <span style={T.mono}>coord</span> / <span style={T.mono}>admin123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COORDINATOR SHELL
// ═══════════════════════════════════════════════════════════════════════════════
function CoordShell({ user, teachers, students, reports, save, onLogout }) {
  const [tab, setTab]     = useState("overview");
  const [detail, setDetail] = useState(null); // { type: 'report'|'teacher'|'student', data }

  const nav = [
    { id: "overview",  label: "Visão Geral",  icon: "dashboard" },
    { id: "teachers",  label: "Professores",  icon: "users" },
    { id: "students",  label: "Alunos",       icon: "student" },
    { id: "reports",   label: "Relatórios",   icon: "report" },
  ];

  const pendingCount = reports.filter(r => !r.approved).length;

  return (
    <div style={{ minHeight: "100vh", background: C.sand, fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Top nav */}
      <header style={{ background: C.navy, padding: "0 1.5rem", display: "flex",
        alignItems: "center", justifyContent: "space-between", height: 60,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="mosque" size={24} color={C.blueLight} />
          <span style={{ color: C.white, fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>C.I.M</span>
          <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 4px" }}>|</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>Coordenador</span>
        </div>
        <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)",
          fontSize: "0.82rem", padding: "0.4rem 0.6rem", borderRadius: 8 }}>
          <Icon name="logout" size={16} color="rgba(255,255,255,0.5)" />
          Sair
        </button>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: C.white, borderRight: `1px solid ${C.line}`,
          padding: "1.5rem 0.75rem", flexShrink: 0 }}>
          {nav.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => { setTab(n.id); setDetail(null); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "0.65rem 0.9rem", borderRadius: 9, border: "none", cursor: "pointer",
                background: active ? C.bluePale : "transparent",
                color: active ? C.blue : C.slate, fontWeight: active ? 600 : 400,
                fontSize: "0.875rem", marginBottom: 2, fontFamily: "inherit",
                transition: "all 0.15s", position: "relative",
              }}>
                <Icon name={n.icon} size={18} color={active ? C.blue : C.slateLight} />
                {n.label}
                {n.id === "reports" && pendingCount > 0 && (
                  <span style={{ marginLeft: "auto", background: C.amber, color: C.white,
                    borderRadius: 20, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          {detail?.type === "report"  && <ReportDetail report={detail.data} teachers={teachers}
            reports={reports} onSave={save.reports} onBack={() => setDetail(null)} />}
          {detail?.type === "student" && <StudentDetail student={detail.data} reports={reports}
            teachers={teachers} onBack={() => setDetail(null)} />}
          {!detail && tab === "overview" && <CoordOverview teachers={teachers} students={students}
            reports={reports} onSelectReport={r => setDetail({ type: "report", data: r })} />}
          {!detail && tab === "teachers" && <TeacherManager teachers={teachers} students={students}
            onSave={save.teachers} />}
          {!detail && tab === "students" && <StudentManager students={students} teachers={teachers}
            onSave={save.students} onSelect={s => setDetail({ type: "student", data: s })} />}
          {!detail && tab === "reports" && <ReportList reports={reports} teachers={teachers}
            onSave={save.reports} onSelect={r => setDetail({ type: "report", data: r })} />}
        </main>
      </div>
    </div>
  );
}

// ── Coordinator Overview ──────────────────────────────────────────────────────
function CoordOverview({ teachers, students, reports, onSelectReport }) {
  const pending  = reports.filter(r => !r.approved);
  const approved = reports.filter(r =>  r.approved);

  const stats = [
    { label: "Professores", value: teachers.length, icon: "users",   color: C.blue },
    { label: "Alunos",      value: students.length, icon: "student", color: C.blueMid },
    { label: "Pendentes",   value: pending.length,  icon: "clock",   color: C.amber },
    { label: "Aprovados",   value: approved.length, icon: "check",   color: C.green },
  ];

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={T.h1}>Visão Geral</h1>
        <p style={{ ...T.body, marginTop: 4 }}>Painel de gestão da equipa de professores</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map(s => (
          <Card key={s.label} style={{ padding: "1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "18",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={20} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: C.navy, lineHeight: 1 }}>{s.value}</div>
            <div style={{ ...T.small, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {pending.length > 0 && (
        <div>
          <h2 style={{ ...T.h2, marginBottom: "1rem" }}>Relatórios a Aprovar</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {pending.slice(0, 5).map(r => {
              const teacher = teachers.find(t => t.id === r.teacherId);
              return (
                <Card key={r.id} style={{ padding: "1rem 1.2rem", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  onClick={() => onSelectReport(r)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: C.amberPale, borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="report" size={18} color={C.amber} />
                    </div>
                    <div>
                      <div style={{ ...T.h3, fontSize: "0.9rem" }}>{teacher?.name || r.teacherId}</div>
                      <div style={{ ...T.small }}>{r.data?.semanas} · {r.data?.periodo}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Badge color="amber">Pendente</Badge>
                    <Icon name="eye" size={16} color={C.slateLight} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Teacher Manager ───────────────────────────────────────────────────────────
function TeacherManager({ teachers, students, onSave }) {
  const [name, setName]   = useState("");
  const [pass, setPass]   = useState("");
  const [turma, setTurma] = useState("");
  const [msg, setMsg]     = useState({ text: "", type: "success" });

  function add() {
    if (!name.trim() || !pass.trim() || !turma.trim()) {
      setMsg({ text: "Preenche todos os campos.", type: "error" }); return;
    }
    const id = "prof" + String(teachers.length + 1).padStart(2, "0");
    onSave([...teachers, { id, name: name.trim(), password: pass.trim(), turma: turma.trim(), role: "teacher", createdAt: new Date().toISOString() }]);
    setName(""); setPass(""); setTurma("");
    setMsg({ text: `Professor criado. Acesso: ${id} / ${pass}`, type: "success" });
  }

  function remove(id) {
    if (confirm("Remover este professor?")) onSave(teachers.filter(t => t.id !== id));
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={T.h1}>Professores</h1>
        <p style={{ ...T.body, marginTop: 4 }}>{teachers.length} professor{teachers.length !== 1 ? "es" : ""} registado{teachers.length !== 1 ? "s" : ""}</p>
      </div>

      <Card style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ ...T.h2, marginBottom: "1.2rem", fontSize: "1rem" }}>Novo Professor</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          {[["Nome Completo", name, setName, "Ex: Ahmed Mansur"],
            ["Turma", turma, setTurma, "Ex: Turma A"],
            ["Palavra-passe", pass, setPass, "Senha de acesso"]
          ].map(([label, val, set, ph]) => (
            <div key={label}>
              <div style={{ ...T.label, marginBottom: 5 }}>{label}</div>
              <input style={inp} value={val} placeholder={ph} onChange={e => set(e.target.value)} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Btn icon="plus" onClick={add}>Criar Professor</Btn>
          {msg.text && <span style={{ fontSize: "0.83rem", color: msg.type === "error" ? C.red : C.green }}>{msg.text}</span>}
        </div>
      </Card>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {teachers.map(t => {
          const tStudents = students.filter(s => s.teacherId === t.id);
          return (
            <Card key={t.id} style={{ padding: "1rem 1.2rem", display: "flex",
              alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, background: C.bluePale, borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="users" size={20} color={C.blue} />
                </div>
                <div>
                  <div style={T.h3}>{t.name}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <span style={T.mono}>{t.id}</span>
                    <span style={{ ...T.small }}>· {t.turma} · {tStudents.length} aluno{tStudents.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
              <Btn variant="danger" size="sm" icon="trash" onClick={() => remove(t.id)}>Remover</Btn>
            </Card>
          );
        })}
        {teachers.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: C.slateLight }}>
            <Icon name="users" size={40} color={C.line} />
            <p style={{ marginTop: "1rem" }}>Nenhum professor ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Student Manager ───────────────────────────────────────────────────────────
function StudentManager({ students, teachers, onSave, onSelect }) {
  const [name, setName]       = useState("");
  const [code, setCode]       = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [search, setSearch]   = useState("");
  const [msg, setMsg]         = useState("");

  function add() {
    if (!name.trim() || !code.trim() || !teacherId) { setMsg("Preenche todos os campos."); return; }
    if (students.find(s => s.code === code.trim())) { setMsg("Código já existe."); return; }
    const teacher = teachers.find(t => t.id === teacherId);
    onSave([...students, {
      id: `s_${Date.now()}`, name: name.trim(), code: code.trim(),
      teacherId, turma: teacher?.turma || "", createdAt: new Date().toISOString(),
      stats: { cim_faltas: 0, madrassa_presencas: 0, madrassa_faltas: 0, madrassa_fj: 0 }
    }]);
    setName(""); setCode(""); setMsg(`Aluno ${name} adicionado.`);
  }

  function remove(id) {
    if (confirm("Remover este aluno?")) onSave(students.filter(s => s.id !== id));
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={T.h1}>Alunos</h1>
        <p style={{ ...T.body, marginTop: 4 }}>{students.length} aluno{students.length !== 1 ? "s" : ""} registado{students.length !== 1 ? "s" : ""}</p>
      </div>

      <Card style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ ...T.h2, marginBottom: "1.2rem", fontSize: "1rem" }}>Novo Aluno</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div style={{ ...T.label, marginBottom: 5 }}>Nome Completo</div>
            <input style={inp} value={name} placeholder="Nome do aluno" onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <div style={{ ...T.label, marginBottom: 5 }}>Código do Aluno</div>
            <input style={inp} value={code} placeholder="Ex: ALU001" onChange={e => setCode(e.target.value)} />
          </div>
          <div>
            <div style={{ ...T.label, marginBottom: 5 }}>Alocar a Professor</div>
            <select style={{ ...inp }} value={teacherId} onChange={e => setTeacherId(e.target.value)}>
              <option value="">Selecionar professor...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.turma}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Btn icon="plus" onClick={add}>Adicionar Aluno</Btn>
          {msg && <span style={{ fontSize: "0.83rem", color: C.green }}>{msg}</span>}
        </div>
      </Card>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
          <Icon name="search" size={16} color={C.slateLight} />
        </div>
        <input style={{ ...inp, paddingLeft: "2.4rem" }} placeholder="Pesquisar aluno ou código..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: "grid", gap: "0.6rem" }}>
        {filtered.map(s => {
          const teacher = teachers.find(t => t.id === s.teacherId);
          return (
            <Card key={s.id} style={{ padding: "0.9rem 1.2rem", display: "flex",
              alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => onSelect(s)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, background: C.bluePale, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="student" size={18} color={C.blue} />
                </div>
                <div>
                  <div style={{ ...T.h3, fontSize: "0.9rem" }}>{s.name}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                    <span style={T.mono}>{s.code}</span>
                    {teacher && <span style={T.small}>· {teacher.name} · {s.turma}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.78rem", color: C.red }}>{s.stats?.cim_faltas || 0} faltas CIM</div>
                  <div style={{ fontSize: "0.78rem", color: C.green }}>{s.stats?.madrassa_presencas || 0} presenças</div>
                </div>
                <button onClick={e => { e.stopPropagation(); remove(s.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
                  <Icon name="trash" size={15} color={C.slateLight} />
                </button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: C.slateLight }}>
            <Icon name="student" size={40} color={C.line} />
            <p style={{ marginTop: "1rem" }}>Nenhum aluno encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Student Detail ────────────────────────────────────────────────────────────
function StudentDetail({ student, reports, teachers, onBack }) {
  const teacher = teachers.find(t => t.id === student.teacherId);
  const sReports = reports.filter(r => r.approved && r.studentUpdates?.some(u => u.codigo === student.code));
  const st = student.stats || {};

  return (
    <div>
      <Btn variant="secondary" icon="back" size="sm" onClick={onBack}>Voltar</Btn>
      <div style={{ margin: "1.5rem 0" }}>
        <h1 style={T.h1}>{student.name}</h1>
        <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          <span style={T.mono}>{student.code}</span>
          {teacher && <Badge color="blue">{teacher.turma}</Badge>}
          {teacher && <span style={T.small}>Professor: {teacher.name}</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Faltas CIM",      value: st.cim_faltas || 0,          color: C.red,   icon: "alert" },
          { label: "Presenças Madrassa", value: st.madrassa_presencas || 0, color: C.green, icon: "check" },
          { label: "Faltas Madrassa", value: st.madrassa_faltas || 0,     color: C.amber, icon: "clock" },
          { label: "Faltas Justif.",  value: st.madrassa_fj || 0,         color: C.slate, icon: "report" },
        ].map(s => (
          <Card key={s.label} style={{ padding: "1rem", textAlign: "center" }}>
            <Icon name={s.icon} size={22} color={s.color} />
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color, margin: "0.4rem 0 0" }}>{s.value}</div>
            <div style={{ ...T.small }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <h2 style={{ ...T.h2, marginBottom: "1rem" }}>Histórico de Relatórios</h2>
      {sReports.length === 0 ? (
        <p style={T.body}>Sem registos ainda.</p>
      ) : sReports.map(r => {
        const upd = r.studentUpdates?.find(u => u.codigo === student.code);
        return (
          <Card key={r.id} style={{ marginBottom: "0.75rem", padding: "1rem 1.2rem" }}>
            <div style={{ ...T.h3, fontSize: "0.9rem", marginBottom: 4 }}>{r.data?.semanas} · {r.data?.periodo}</div>
            {upd && <div style={{ ...T.small }}>
              Faltas CIM: {upd.cim_faltas ?? "—"} · Presenças: {upd.madrassa_presencas ?? "—"} · Faltas: {upd.madrassa_faltas ?? "—"}
              {upd.observacoes && <> · <i>{upd.observacoes}</i></>}
            </div>}
          </Card>
        );
      })}
    </div>
  );
}

// ── Report List ───────────────────────────────────────────────────────────────
function ReportList({ reports, teachers, onSave, onSelect }) {
  const sorted = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function approve(r) {
    onSave(reports.map(x => x.id === r.id ? { ...x, approved: true, approvedAt: new Date().toISOString() } : x));
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={T.h1}>Relatórios</h1>
        <p style={{ ...T.body, marginTop: 4 }}>{reports.length} relatório{reports.length !== 1 ? "s" : ""} no total</p>
      </div>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {sorted.map(r => {
          const teacher = teachers.find(t => t.id === r.teacherId);
          return (
            <Card key={r.id} style={{ padding: "1rem 1.2rem", display: "flex",
              alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10,
                  background: r.approved ? C.greenPale : C.amberPale,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="report" size={18} color={r.approved ? C.green : C.amber} />
                </div>
                <div>
                  <div style={T.h3}>{teacher?.name || r.teacherId}</div>
                  <div style={T.small}>{r.data?.semanas} · {r.data?.periodo} · {new Date(r.createdAt).toLocaleDateString("pt-PT")}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge color={r.approved ? "green" : "amber"}>{r.approved ? "Aprovado" : "Pendente"}</Badge>
                <Btn variant="secondary" size="sm" icon="eye" onClick={() => onSelect(r)}>Ver</Btn>
                {!r.approved && <Btn variant="success" size="sm" icon="check" onClick={() => approve(r)}>Aprovar</Btn>}
              </div>
            </Card>
          );
        })}
        {reports.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: C.slateLight }}>
            <Icon name="report" size={40} color={C.line} />
            <p style={{ marginTop: "1rem" }}>Nenhum relatório ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Report Detail ─────────────────────────────────────────────────────────────
function ReportDetail({ report, teachers, reports, onSave, onBack }) {
  const teacher = teachers.find(t => t.id === report.teacherId);
  const d = report.data || {};

  function approve() {
    onSave(reports.map(r => r.id === report.id ? { ...r, approved: true, approvedAt: new Date().toISOString() } : r));
  }

  const StatRow = ({ label, v1, v2, total }) => (
    <tr style={{ borderBottom: `1px solid ${C.line}` }}>
      <td style={{ padding: "0.6rem 1rem", color: C.slate, fontSize: "0.875rem" }}>{label}</td>
      <td style={{ padding: "0.6rem 1rem", textAlign: "center", fontWeight: 600, color: C.navy }}>{v1 ?? "—"}</td>
      <td style={{ padding: "0.6rem 1rem", textAlign: "center", fontWeight: 600, color: C.navy }}>{v2 ?? "—"}</td>
      <td style={{ padding: "0.6rem 1rem", textAlign: "center", fontWeight: 700, color: C.blue }}>{total ?? "—"}</td>
    </tr>
  );

  return (
    <div>
      <Btn variant="secondary" icon="back" size="sm" onClick={onBack}>Voltar</Btn>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        margin: "1.5rem 0", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={T.h1}>{teacher?.name || report.teacherId}</h1>
          <p style={{ ...T.body, marginTop: 4 }}>{d.semanas} · {d.periodo}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge color={report.approved ? "green" : "amber"}>{report.approved ? "Aprovado" : "Pendente"}</Badge>
          {!report.approved && <Btn variant="success" icon="check" onClick={approve}>Aprovar Relatório</Btn>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* CIM */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ background: C.blue, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="report" size={16} color={C.white} />
            <span style={{ color: C.white, fontWeight: 700, fontSize: "0.875rem" }}>CIM — Estudos Islâmicos</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.blueFaint }}>
                {["", "Sem. 1", "Sem. 2", "Total"].map(h => (
                  <th key={h} style={{ padding: "0.5rem 1rem", textAlign: h ? "center" : "left",
                    fontSize: "0.72rem", fontWeight: 700, color: C.slateLight, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <StatRow label="Aulas Dadas"   v1={d.cim?.aulas_sem1}  v2={d.cim?.aulas_sem2}  total={d.cim?.total_aulas} />
              <StatRow label="Faltas Alunos" v1={d.cim?.faltas_sem1} v2={d.cim?.faltas_sem2} total={d.cim?.total_faltas} />
            </tbody>
          </table>
          {d.cim?.materias && <div style={{ padding: "0.75rem 1rem", background: C.blueFaint,
            fontSize: "0.82rem", color: C.slate, borderTop: `1px solid ${C.line}` }}>
            <b>Matérias:</b> {d.cim.materias}
          </div>}
        </Card>

        {/* Madrassa */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ background: C.navy, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="mosque" size={16} color={C.white} />
            <span style={{ color: C.white, fontWeight: 700, fontSize: "0.875rem" }}>Madrassa — Quran & Duaas</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.blueFaint }}>
                {["", "Sem. 1", "Sem. 2", "Total"].map(h => (
                  <th key={h} style={{ padding: "0.5rem 1rem", textAlign: h ? "center" : "left",
                    fontSize: "0.72rem", fontWeight: 700, color: C.slateLight, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <StatRow label="Sessões Dadas"  v1={d.madrassa?.sessoes_sem1}   v2={d.madrassa?.sessoes_sem2}   total={d.madrassa?.total_sessoes} />
              <StatRow label="Presenças"       v1={d.madrassa?.presencas_sem1} v2={d.madrassa?.presencas_sem2} total={d.madrassa?.total_presencas} />
              <StatRow label="Faltas (A + FJ)" v1={d.madrassa?.faltas_sem1}   v2={d.madrassa?.faltas_sem2}   total={d.madrassa?.total_faltas} />
            </tbody>
          </table>
        </Card>
      </div>

      {/* Per-student updates */}
      {report.studentUpdates?.length > 0 && (
        <Card style={{ marginBottom: "1.5rem", padding: 0, overflow: "hidden" }}>
          <div style={{ background: C.sand, padding: "0.75rem 1rem", borderBottom: `1px solid ${C.line}`,
            display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="student" size={16} color={C.slate} />
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: C.navy }}>Registos por Aluno</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.blueFaint }}>
                {["Código", "Nome", "Faltas CIM", "Presenças Mad.", "Faltas Mad.", "Observações"].map(h => (
                  <th key={h} style={{ padding: "0.5rem 1rem", textAlign: "left",
                    fontSize: "0.72rem", fontWeight: 700, color: C.slateLight, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.studentUpdates.map((u, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.line}`, background: i % 2 === 0 ? C.white : C.blueFaint }}>
                  <td style={{ padding: "0.55rem 1rem" }}><span style={T.mono}>{u.codigo}</span></td>
                  <td style={{ padding: "0.55rem 1rem", fontSize: "0.875rem", color: C.navy, fontWeight: 500 }}>{u.nome}</td>
                  <td style={{ padding: "0.55rem 1rem", textAlign: "center", color: u.cim_faltas > 0 ? C.red : C.green, fontWeight: 600 }}>{u.cim_faltas ?? "—"}</td>
                  <td style={{ padding: "0.55rem 1rem", textAlign: "center", color: C.green, fontWeight: 600 }}>{u.madrassa_presencas ?? "—"}</td>
                  <td style={{ padding: "0.55rem 1rem", textAlign: "center", color: u.madrassa_faltas > 0 ? C.amber : C.green, fontWeight: 600 }}>{u.madrassa_faltas ?? "—"}</td>
                  <td style={{ padding: "0.55rem 1rem", fontSize: "0.8rem", color: C.slate }}>{u.observacoes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {d.observacoes_gerais && (
        <Card>
          <div style={{ ...T.label, marginBottom: 8 }}>Observações Gerais</div>
          <p style={{ ...T.body, margin: 0 }}>{d.observacoes_gerais}</p>
        </Card>
      )}

      {report.imageBase64 && (
        <Card style={{ marginTop: "1.5rem" }}>
          <div style={{ ...T.label, marginBottom: 10 }}>Folha Original Digitalizada</div>
          <img src={`data:${report.imageMime};base64,${report.imageBase64}`}
            style={{ width: "100%", borderRadius: 8, border: `1px solid ${C.line}` }} alt="Scan" />
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER SHELL
// ═══════════════════════════════════════════════════════════════════════════════
function TeacherShell({ user, students, reports, save, onLogout }) {
  const [tab, setTab] = useState("submit");
  const myStudents = students.filter(s => s.teacherId === user.id);
  const myReports  = reports.filter(r => r.teacherId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const nav = [
    { id: "submit",  label: "Submeter Relatório", icon: "upload" },
    { id: "history", label: "Histórico",           icon: "report" },
    { id: "students",label: "A Minha Turma",       icon: "student" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.sand, fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <header style={{ background: C.navy, padding: "0 1.5rem", display: "flex",
        alignItems: "center", justifyContent: "space-between", height: 60,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="mosque" size={24} color={C.blueLight} />
          <span style={{ color: C.white, fontWeight: 700, fontSize: "1rem" }}>C.I.M</span>
          <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 4px" }}>|</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>{user.name}</span>
        </div>
        <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)",
          fontSize: "0.82rem", padding: "0.4rem 0.6rem", borderRadius: 8 }}>
          <Icon name="logout" size={16} color="rgba(255,255,255,0.5)" />
          Sair
        </button>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <aside style={{ width: 220, background: C.white, borderRight: `1px solid ${C.line}`,
          padding: "1.5rem 0.75rem", flexShrink: 0 }}>
          {nav.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "0.65rem 0.9rem", borderRadius: 9, border: "none", cursor: "pointer",
                background: active ? C.bluePale : "transparent",
                color: active ? C.blue : C.slate, fontWeight: active ? 600 : 400,
                fontSize: "0.875rem", marginBottom: 2, fontFamily: "inherit",
              }}>
                <Icon name={n.icon} size={18} color={active ? C.blue : C.slateLight} />
                {n.label}
              </button>
            );
          })}
        </aside>

        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          {tab === "submit"   && <SubmitReport user={user} myStudents={myStudents}
            reports={reports} onSave={save.reports} onUpdateStudents={save.students} students={students} />}
          {tab === "history"  && <TeacherHistory myReports={myReports} />}
          {tab === "students" && <MyStudents myStudents={myStudents} user={user} />}
        </main>
      </div>
    </div>
  );
}

function SubmitReport({ user, myStudents, reports, onSave, onUpdateStudents, students }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);
  const fileRef = useRef();

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setResult(null); setError(""); setDone(false);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  async function analyse() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Erro ao ler ficheiro"));
        r.readAsDataURL(file);
      });
      const data = await analyzeReport(b64, file.type, myStudents);
      if (!data) throw new Error("Não foi possível extrair dados. Verifica a qualidade da imagem.");
      setResult({ data, b64, mime: file.type });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function submit() {
    if (!result) return;
    const studentUpdates = result.data.alunos || [];
    const report = {
      id: `r_${user.id}_${Date.now()}`,
      teacherId: user.id,
      data: result.data,
      studentUpdates,
      imageBase64: result.b64,
      imageMime: result.mime,
      approved: false,
      createdAt: new Date().toISOString(),
    };
    // Update student stats
    const updatedStudents = students.map(s => {
      const upd = studentUpdates.find(u => u.codigo === s.code);
      if (!upd) return s;
      return {
        ...s,
        stats: {
          cim_faltas:          (s.stats?.cim_faltas || 0)          + (upd.cim_faltas || 0),
          madrassa_presencas:  (s.stats?.madrassa_presencas || 0)  + (upd.madrassa_presencas || 0),
          madrassa_faltas:     (s.stats?.madrassa_faltas || 0)     + (upd.madrassa_faltas || 0),
          madrassa_fj:         (s.stats?.madrassa_fj || 0)         + (upd.madrassa_faltas_justificadas || 0),
        }
      };
    });
    await onSave([...reports, report]);
    await onUpdateStudents(updatedStudents);
    setFile(null); setPreview(null); setResult(null); setDone(true);
  }

  if (done) return (
    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <div style={{ width: 72, height: 72, background: C.greenPale, borderRadius: "50%",
        display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
        <Icon name="check" size={32} color={C.green} strokeWidth={2} />
      </div>
      <h2 style={{ ...T.h2, marginBottom: "0.5rem" }}>Relatório submetido</h2>
      <p style={T.body}>O coordenador irá rever e aprovar em breve.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <Btn variant="secondary" onClick={() => setDone(false)}>Submeter outro</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={T.h1}>Submeter Relatório Quinzenal</h1>
        <p style={{ ...T.body, marginTop: 4 }}>Fotografa ou digitaliza a folha de entrega e faz o upload abaixo.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: preview ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
        {/* Upload */}
        <Card>
          <input ref={fileRef} type="file" accept="image/*,application/pdf"
            style={{ display: "none" }} onChange={handleFile} />

          <div onClick={() => fileRef.current.click()} style={{
            border: `2px dashed ${C.blueMid}`, borderRadius: 12, padding: "2.5rem 1rem",
            textAlign: "center", cursor: "pointer", background: C.blueFaint, marginBottom: "1rem",
          }}>
            {preview ? (
              <img src={preview} style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8 }} alt="preview" />
            ) : (
              <>
                <div style={{ width: 56, height: 56, background: C.bluePale, borderRadius: 14,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <Icon name="upload" size={26} color={C.blue} />
                </div>
                <div style={{ fontWeight: 600, color: C.blue, marginBottom: 4 }}>Clica para selecionar ficheiro</div>
                <div style={{ ...T.small }}>JPG, PNG ou PDF · Máx. 10MB</div>
              </>
            )}
          </div>

          {file && !result && (
            <Btn full size="lg" icon="search" onClick={analyse} disabled={loading}>
              {loading ? "A analisar..." : "Analisar com IA"}
            </Btn>
          )}
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red,
              fontSize: "0.84rem", marginTop: "0.8rem", background: C.redPale,
              borderRadius: 8, padding: "0.6rem 0.9rem" }}>
              <Icon name="alert" size={16} color={C.red} /> {error}
            </div>
          )}
        </Card>

        {/* Result preview */}
        {result && (
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.2rem" }}>
              <div style={{ width: 36, height: 36, background: C.greenPale, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={18} color={C.green} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: C.green, fontSize: "0.9rem" }}>Dados extraídos</div>
                <div style={{ ...T.small }}>{result.data.semanas} · {result.data.periodo}</div>
              </div>
            </div>
            <Divider />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.2rem" }}>
              {[
                { label: "Aulas CIM",       value: result.data.cim?.total_aulas,         color: C.blue },
                { label: "Faltas CIM",      value: result.data.cim?.total_faltas,        color: C.red },
                { label: "Sessões Mad.",    value: result.data.madrassa?.total_sessoes,  color: C.blue },
                { label: "Presenças Mad.", value: result.data.madrassa?.total_presencas, color: C.green },
              ].map(s => (
                <div key={s.label} style={{ background: C.sand, borderRadius: 8, padding: "0.7rem 0.9rem" }}>
                  <div style={{ ...T.small }}>{s.label}</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.value ?? "—"}</div>
                </div>
              ))}
            </div>
            {result.data.alunos?.length > 0 && (
              <div style={{ ...T.small, marginBottom: "1rem" }}>
                {result.data.alunos.length} aluno{result.data.alunos.length !== 1 ? "s" : ""} identificado{result.data.alunos.length !== 1 ? "s" : ""}
              </div>
            )}
            <Btn full variant="success" icon="upload" size="lg" onClick={submit}>
              Submeter ao Coordenador
            </Btn>
          </Card>
        )}
      </div>
    </div>
  );
}

function TeacherHistory({ myReports }) {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={T.h1}>Histórico de Relatórios</h1>
        <p style={{ ...T.body, marginTop: 4 }}>{myReports.length} relatório{myReports.length !== 1 ? "s" : ""} submetido{myReports.length !== 1 ? "s" : ""}</p>
      </div>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {myReports.map(r => (
          <Card key={r.id} style={{ padding: "1rem 1.2rem", display: "flex",
            alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10,
                background: r.approved ? C.greenPale : C.amberPale,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={r.approved ? "check" : "clock"} size={18} color={r.approved ? C.green : C.amber} />
              </div>
              <div>
                <div style={T.h3}>{r.data?.semanas}</div>
                <div style={T.small}>{r.data?.periodo} · {new Date(r.createdAt).toLocaleDateString("pt-PT")}</div>
              </div>
            </div>
            <Badge color={r.approved ? "green" : "amber"}>{r.approved ? "Aprovado" : "A aguardar"}</Badge>
          </Card>
        ))}
        {myReports.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: C.slateLight }}>
            <Icon name="report" size={40} color={C.line} />
            <p style={{ marginTop: "1rem" }}>Nenhum relatório submetido ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MyStudents({ myStudents, user }) {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={T.h1}>A Minha Turma</h1>
        <p style={{ ...T.body, marginTop: 4 }}>{user.turma} · {myStudents.length} aluno{myStudents.length !== 1 ? "s" : ""}</p>
      </div>
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {myStudents.map((s, i) => (
          <Card key={s.id} style={{ padding: "0.9rem 1.2rem", display: "flex",
            alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, background: C.bluePale, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.78rem", fontWeight: 700, color: C.blue }}>{i + 1}</div>
              <div>
                <div style={{ ...T.h3, fontSize: "0.9rem" }}>{s.name}</div>
                <span style={T.mono}>{s.code}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.78rem", color: C.red, fontWeight: 600 }}>{s.stats?.cim_faltas || 0} faltas CIM</div>
              <div style={{ fontSize: "0.78rem", color: C.green }}>{s.stats?.madrassa_presencas || 0} presenças</div>
            </div>
          </Card>
        ))}
        {myStudents.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: C.slateLight }}>
            <Icon name="student" size={40} color={C.line} />
            <p style={{ marginTop: "1rem" }}>Nenhum aluno alocado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
