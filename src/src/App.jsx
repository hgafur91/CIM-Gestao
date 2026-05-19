import { useState, useEffect, useRef } from "react";

// ── Storage ───────────────────────────────────────────────────────────────────
const db = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const avg = (...vals) => {
  const nums = vals.filter(v => v !== null && v !== undefined && v !== "");
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + Number(b), 0) / nums.length) * 10) / 10;
};
const trimAvg = (g, t) => avg(g[`t${t}_1as`], g[`t${t}_2as`], g[`t${t}_at`]);
const finalAvg = (g) => avg(trimAvg(g,1), trimAvg(g,2), trimAvg(g,3));

const nextCIM = (students) => {
  const nums = students.map(s => parseInt(s.code?.replace("CIM","") || "0")).filter(n => !isNaN(n));
  return `CIM${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0")}`;
};

// ── Design ────────────────────────────────────────────────────────────────────
const C = {
  navy:"#0A1628", blue:"#1251A3", blueMid:"#1A6FD4", blueLight:"#3B8FE8",
  bluePale:"#EAF2FC", blueFaint:"#F4F8FE", white:"#FFFFFF",
  slate:"#5A6A7E", slateLight:"#8898AA", line:"#DDE4EE", sand:"#F7F9FC",
  green:"#1A7A4A", greenPale:"#EAF7F0", red:"#B91C1C", redPale:"#FEF2F2",
  amber:"#B45309", amberPale:"#FFFBEB", purple:"#6B21A8", purplePale:"#F5F3FF",
};

const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  student:   <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
  report:    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  upload:    <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  check:     <><polyline points="20 6 9 17 4 12"/></>,
  clock:     <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  back:      <><polyline points="15 18 9 12 15 6"/></>,
  eye:       <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
  alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  mosque:    <><path d="M12 2C8 2 6 5 6 8c0 2 1 3 2 4H4v10h16V12h-4c1-1 2-2 2-4 0-3-2-6-6-6z"/><path d="M9 22v-4a3 3 0 0 1 6 0v4"/><path d="M2 12h2M20 12h2"/></>,
  search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  key:       <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
  edit:      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  transfer:  <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
  classes:   <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></>,
  grades:    <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  card:      <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
  book:      <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
};

const Icon = ({ name, size=20, color="currentColor", sw=1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name]}
  </svg>
);

const T = {
  h1:    { fontSize:"1.75rem", fontWeight:700, color:C.navy, letterSpacing:"-0.02em", margin:0 },
  h2:    { fontSize:"1.25rem", fontWeight:700, color:C.navy, letterSpacing:"-0.01em", margin:0 },
  h3:    { fontSize:"1rem",    fontWeight:600, color:C.navy, margin:0 },
  body:  { fontSize:"0.9rem",  color:C.slate,  lineHeight:1.6 },
  small: { fontSize:"0.78rem", color:C.slateLight },
  label: { fontSize:"0.72rem", fontWeight:700, color:C.slateLight, letterSpacing:"0.08em", textTransform:"uppercase" },
  mono:  { fontFamily:"'Courier New',monospace", fontSize:"0.82rem", color:C.blue, background:C.bluePale, padding:"2px 6px", borderRadius:4 },
};

const inp = {
  width:"100%", border:`1.5px solid ${C.line}`, borderRadius:8,
  padding:"0.6rem 0.9rem", fontSize:"0.9rem", color:C.navy,
  background:C.white, outline:"none", boxSizing:"border-box", fontFamily:"inherit",
};

const Btn = ({ children, onClick, variant="primary", size="md", icon, disabled, full }) => {
  const V = {
    primary:   { background:C.blue,      color:C.white,  border:"none" },
    secondary: { background:C.bluePale,  color:C.blue,   border:"none" },
    ghost:     { background:"transparent", color:C.slate, border:`1.5px solid ${C.line}` },
    danger:    { background:C.redPale,   color:C.red,    border:"none" },
    success:   { background:C.greenPale, color:C.green,  border:"none" },
    purple:    { background:C.purplePale,color:C.purple, border:"none" },
  };
  const S = {
    sm: { padding:"0.35rem 0.85rem", fontSize:"0.8rem",   borderRadius:7 },
    md: { padding:"0.55rem 1.2rem",  fontSize:"0.875rem", borderRadius:8 },
    lg: { padding:"0.75rem 1.6rem",  fontSize:"0.95rem",  borderRadius:10 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...V[variant], ...S[size], display:"inline-flex", alignItems:"center", gap:7,
      fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1,
      fontFamily:"inherit", width:full?"100%":"auto", justifyContent:"center",
    }}>
      {icon && <Icon name={icon} size={size==="sm"?14:16} color="currentColor"/>}
      {children}
    </button>
  );
};

const Badge = ({ children, color="blue" }) => {
  const M = {
    blue:[C.bluePale,C.blue], green:[C.greenPale,C.green],
    amber:[C.amberPale,C.amber], red:[C.redPale,C.red],
    slate:[C.sand,C.slate], purple:[C.purplePale,C.purple],
  };
  const [bg,fg] = M[color]||M.blue;
  return <span style={{background:bg, color:fg, borderRadius:20, padding:"0.2rem 0.7rem",
    fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.04em"}}>{children}</span>;
};

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background:C.white, borderRadius:14, border:`1px solid ${C.line}`,
    boxShadow:"0 1px 4px rgba(10,22,40,0.06)", padding:"1.5rem",
    cursor:onClick?"pointer":"default", ...style,
  }}>{children}</div>
);

const Divider = () => <div style={{height:1, background:C.line, margin:"1rem 0"}}/>;

const Msg = ({ text, type }) => text ? (
  <div style={{fontSize:"0.83rem", color:type==="error"?C.red:C.green, marginTop:"0.6rem"}}>{text}</div>
) : null;

// ── Grade components ──────────────────────────────────────────────────────────
const GradeInput = ({ value, onChange }) => (
  <input type="number" min="0" max="20" step="0.5"
    style={{...inp, width:52, padding:"0.3rem 0.4rem", textAlign:"center", fontSize:"0.85rem"}}
    value={value??""} onChange={e => onChange(e.target.value===""?null:Number(e.target.value))}/>
);

const GradeCell = ({ val }) => {
  if (val===null||val===undefined||val==="") return <span style={{color:C.slateLight}}>—</span>;
  const color = val>=16?C.green : val>=12?C.blue : val>=10?C.amber : C.red;
  return <span style={{fontWeight:700, color}}>{val}</span>;
};

const thS = {
  padding:"0.45rem 0.4rem", fontSize:"0.7rem", fontWeight:700, color:C.slateLight,
  textTransform:"uppercase", letterSpacing:"0.05em", textAlign:"center",
  background:C.blueFaint, borderBottom:`2px solid ${C.line}`, whiteSpace:"nowrap",
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,     setUser]     = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [students, setStudents] = useState([]);
  const [reports,  setReports]  = useState([]);
  const [levels,   setLevels]   = useState([]);
  const [apiKey,   setApiKey]   = useState("");

  useEffect(() => {
    setTeachers(db.get("cim:teachers") || []);
    setClasses( db.get("cim:classes")  || []);
    setStudents(db.get("cim:students") || []);
    setReports( db.get("cim:reports")  || []);
    setLevels(  db.get("cim:levels")   || []);
    setApiKey(  db.get("cim:apikey")   || "");
  }, []);

  const save = {
    teachers: v => { setTeachers(v); db.set("cim:teachers", v); },
    classes:  v => { setClasses(v);  db.set("cim:classes",  v); },
    students: v => { setStudents(v); db.set("cim:students", v); },
    reports:  v => { setReports(v);  db.set("cim:reports",  v); },
    levels:   v => { setLevels(v);   db.set("cim:levels",   v); },
    apiKey:   v => { setApiKey(v);   db.set("cim:apikey",   v); },
  };

  function login(id, pw) {
    // Coordinator
    if (id==="coord" && pw===(db.get("cim:coordpass")||"admin123")) {
      setUser({id:"coord", name:"Coordenador", role:"coord"}); return true;
    }
    // Teacher
    const t = teachers.find(t => t.id===id && t.password===pw);
    if (t) { setUser({...t, role:"teacher"}); return true; }
    // Student — login: CIM code / first name
    const s = students.find(s =>
      s.code===id && s.name.split(" ")[0].toLowerCase()===pw.toLowerCase()
    );
    if (s) {
      const cls = classes.find(c=>c.id===s.classId);
      const tch = teachers.find(t=>t.id===cls?.teacherId);
      setUser({...s, role:"student", className:cls?.name, teacherName:tch?.name}); return true;
    }
    return false;
  }

  function logout() { setUser(null); }

  const data = { teachers, classes, students, reports, levels, apiKey };

  if (!user)               return <LoginScreen onLogin={login}/>;
  if (user.role==="coord") return <CoordShell   user={user} data={data} save={save} onLogout={logout}/>;
  if (user.role==="teacher") return <TeacherShell user={user} data={data} save={save} onLogout={logout}/>;
  if (user.role==="student") return <StudentShell user={user} data={data} onLogout={logout}/>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [id,setId]   = useState("");
  const [pw,setPw]   = useState("");
  const [err,setErr] = useState("");

  function submit() { if (!onLogin(id.trim(), pw)) setErr("Credenciais inválidas."); }

  return (
    <div style={{minHeight:"100vh", background:`linear-gradient(160deg,${C.navy} 0%,#112244 100%)`,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
      fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <svg style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",opacity:0.05,pointerEvents:"none"}}
        viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <line x1="0" y1="150" x2="800" y2="450" stroke="white" strokeWidth="1"/>
        <circle cx="600" cy="100" r="200" stroke="white" strokeWidth="1" fill="none"/>
      </svg>
      <div style={{width:"100%", maxWidth:400, position:"relative"}}>
        <div style={{textAlign:"center", marginBottom:"2.5rem"}}>
          <div style={{width:72, height:72, background:"rgba(255,255,255,0.1)", borderRadius:20,
            display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem",
            border:"1px solid rgba(255,255,255,0.15)"}}>
            <Icon name="mosque" size={36} color={C.white} sw={1.4}/>
          </div>
          <h1 style={{...T.h1, color:C.white, fontSize:"2rem", marginBottom:"0.4rem"}}>C.I.M</h1>
          <p style={{color:"rgba(255,255,255,0.5)", fontSize:"0.88rem"}}>Sistema de Gestão Escolar</p>
        </div>
        <div style={{background:C.white, borderRadius:18, padding:"2rem", boxShadow:"0 24px 64px rgba(0,0,0,0.3)"}}>
          <p style={{...T.body, marginBottom:"1.5rem", fontWeight:500}}>Iniciar sessão</p>
          <div style={{marginBottom:"1rem"}}>
            <div style={{...T.label, marginBottom:5}}>Identificador</div>
            <input style={inp} value={id} placeholder="coord · prof01 · CIM0001"
              onChange={e=>setId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <div style={{marginBottom:"1.5rem"}}>
            <div style={{...T.label, marginBottom:5}}>Palavra-passe</div>
            <input style={inp} type="password" value={pw} placeholder="••••••••"
              onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          {err && (
            <div style={{color:C.red, fontSize:"0.84rem", marginBottom:"1rem", background:C.redPale,
              borderRadius:8, padding:"0.6rem 0.9rem", display:"flex", alignItems:"center", gap:8}}>
              <Icon name="alert" size={16} color={C.red}/>{err}
            </div>
          )}
          <Btn full size="lg" onClick={submit}>Entrar</Btn>
          <div style={{marginTop:"1.2rem", padding:"0.8rem", background:C.sand, borderRadius:8, border:`1px solid ${C.line}`}}>
            <div style={{...T.small, lineHeight:1.8}}>
              <b>Coordenador:</b> coord / admin123<br/>
              <b>Professor:</b> ID atribuído / senha definida<br/>
              <b>Aluno:</b> nº CIM / primeiro nome
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHELL (shared layout)
// ═══════════════════════════════════════════════════════════════════════════════
function Shell({ user, nav, children, onLogout }) {
  const [tab, setTab]     = useState(nav[0].id);
  const [detail, setDetail] = useState(null);

  const roleColor = user.role==="coord" ? C.blue : user.role==="teacher" ? C.green : C.purple;
  const roleLabel = user.role==="coord" ? "Coordenador" : user.role==="teacher" ? "Professor" : "Aluno";

  return (
    <div style={{minHeight:"100vh", background:C.sand, fontFamily:"'Segoe UI',system-ui,sans-serif", display:"flex", flexDirection:"column"}}>
      <header style={{background:C.navy, padding:"0 1.5rem", display:"flex", alignItems:"center",
        justifyContent:"space-between", height:60, flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <Icon name="mosque" size={22} color={C.blueLight}/>
          <span style={{color:C.white, fontWeight:700, fontSize:"1rem"}}>C.I.M</span>
          <span style={{color:"rgba(255,255,255,0.25)", margin:"0 4px"}}>|</span>
          <span style={{background:roleColor+"33", color:roleColor, borderRadius:6, padding:"2px 10px", fontSize:"0.78rem", fontWeight:700}}>
            {roleLabel}
          </span>
          <span style={{color:"rgba(255,255,255,0.55)", fontSize:"0.82rem"}}>{user.name}</span>
        </div>
        <button onClick={onLogout} style={{background:"none", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", gap:6, color:"rgba(255,255,255,0.5)", fontSize:"0.82rem"}}>
          <Icon name="logout" size={16} color="rgba(255,255,255,0.5)"/> Sair
        </button>
      </header>
      <div style={{display:"flex", flex:1, overflow:"hidden"}}>
        <aside style={{width:220, background:C.white, borderRight:`1px solid ${C.line}`,
          padding:"1.5rem 0.75rem", flexShrink:0}}>
          {nav.map(n => {
            const active = tab===n.id;
            return (
              <button key={n.id} onClick={()=>{setTab(n.id);setDetail(null);}} style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"0.65rem 0.9rem", borderRadius:9, border:"none", cursor:"pointer",
                background:active?C.bluePale:"transparent",
                color:active?C.blue:C.slate, fontWeight:active?600:400,
                fontSize:"0.875rem", marginBottom:2, fontFamily:"inherit",
              }}>
                <Icon name={n.icon} size={18} color={active?C.blue:C.slateLight}/>
                {n.label}
                {n.badge>0 && (
                  <span style={{marginLeft:"auto", background:C.amber, color:C.white,
                    borderRadius:20, padding:"1px 7px", fontSize:"0.7rem", fontWeight:700}}>
                    {n.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>
        <main style={{flex:1, padding:"2rem", overflowY:"auto"}}>
          {children({tab, detail, setDetail, setTab})}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════════
function CoordShell({ user, data, save, onLogout }) {
  const pending = data.reports.filter(r=>!r.approved).length;
  const nav = [
    { id:"overview",  label:"Visão Geral",   icon:"dashboard" },
    { id:"teachers",  label:"Professores",   icon:"users" },
    { id:"levels",    label:"Níveis",        icon:"grades" },
    { id:"classes",   label:"Turmas",        icon:"classes" },
    { id:"students",  label:"Alunos",        icon:"student" },
    { id:"grades",    label:"Notas",         icon:"book" },
    { id:"reports",   label:"Relatórios",    icon:"report", badge:pending },
    { id:"settings",  label:"Definições",    icon:"key" },
  ];
  return (
    <Shell user={user} nav={nav} onLogout={onLogout}>
      {({tab, detail, setDetail}) => <>
        {detail?.type==="teacher" && <TeacherCard teacher={detail.data} data={data} onSave={save.teachers} onBack={()=>setDetail(null)}/>}
        {detail?.type==="student" && <StudentCard student={detail.data} data={data} onSave={save.students} onBack={()=>setDetail(null)}/>}
        {detail?.type==="report"  && <ReportDetail report={detail.data} data={data} onSave={save.reports}  onBack={()=>setDetail(null)}/>}
        {!detail && tab==="overview" && <CoordOverview data={data} onSelectReport={r=>setDetail({type:"report",data:r})}/>}
        {!detail && tab==="teachers" && <TeacherManager data={data} onSave={save.teachers} onSelect={t=>setDetail({type:"teacher",data:t})}/>}
        {!detail && tab==="levels"   && <LevelManager data={data} onSave={save.levels}/>}
        {!detail && tab==="classes"  && <ClassManager  data={data} onSaveClasses={save.classes}/>}
        {!detail && tab==="students" && <CoordStudents data={data} onSave={save.students} onSelect={s=>setDetail({type:"student",data:s})}/>}
        {!detail && tab==="grades"   && <GradeManager  data={data} onSave={save.students}/>}
        {!detail && tab==="reports"  && <ReportList    data={data} onSave={save.reports}  onSelect={r=>setDetail({type:"report",data:r})}/>}
        {!detail && tab==="settings" && <Settings apiKey={data.apiKey} onSave={save.apiKey}/>}
      </>}
    </Shell>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function CoordOverview({ data, onSelectReport }) {
  const {teachers, classes, students, reports} = data;
  const pending = reports.filter(r=>!r.approved);
  const stats = [
    {label:"Professores", value:teachers.length, icon:"users",   color:C.blue},
    {label:"Turmas",      value:classes.length,  icon:"classes", color:C.blueMid},
    {label:"Alunos",      value:students.length, icon:"student", color:C.green},
    {label:"Pendentes",   value:pending.length,  icon:"clock",   color:C.amber},
  ];
  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <h1 style={T.h1}>Visão Geral</h1>
        <p style={{...T.body, marginTop:4}}>Painel de gestão do C.I.M</p>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"1rem", marginBottom:"2rem"}}>
        {stats.map(s => (
          <Card key={s.label} style={{padding:"1.2rem"}}>
            <div style={{width:40, height:40, borderRadius:10, background:s.color+"18",
              display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"0.8rem"}}>
              <Icon name={s.icon} size={20} color={s.color}/>
            </div>
            <div style={{fontSize:"2rem", fontWeight:800, color:C.navy, lineHeight:1}}>{s.value}</div>
            <div style={{...T.small, marginTop:4}}>{s.label}</div>
          </Card>
        ))}
      </div>
      {pending.length>0 && <>
        <h2 style={{...T.h2, marginBottom:"1rem"}}>A aguardar aprovação</h2>
        <div style={{display:"grid", gap:"0.75rem"}}>
          {pending.map(r => {
            const t = teachers.find(t=>t.id===r.teacherId);
            return (
              <Card key={r.id} style={{padding:"1rem 1.2rem", display:"flex", alignItems:"center", justifyContent:"space-between"}}
                onClick={()=>onSelectReport(r)}>
                <div style={{display:"flex", alignItems:"center", gap:12}}>
                  <div style={{width:40, height:40, background:C.amberPale, borderRadius:10,
                    display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Icon name="report" size={18} color={C.amber}/>
                  </div>
                  <div>
                    <div style={T.h3}>{t?.name||r.teacherId}</div>
                    <div style={T.small}>{r.data?.semanas} · {r.data?.periodo}</div>
                  </div>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <Badge color="amber">Pendente</Badge>
                  <Icon name="eye" size={16} color={C.slateLight}/>
                </div>
              </Card>
            );
          })}
        </div>
      </>}
    </div>
  );
}

// ── Level Manager ─────────────────────────────────────────────────────────────
function LevelManager({ data, onSave }) {
  const { levels } = data;
  const [form, setForm] = useState({ name:"", color:"#1251A3", patente:"" });
  const [msg, setMsg]   = useState({ text:"", type:"" });

  function add() {
    if (!form.name.trim()||!form.patente.trim()) { setMsg({text:"Preenche nome e patente.", type:"error"}); return; }
    onSave([...levels, { id:`lvl_${Date.now()}`, ...form }]);
    setForm({ name:"", color:"#1251A3", patente:"" });
    setMsg({ text:"Nível criado.", type:"success" });
  }

  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Níveis de Professor</h1></div>
      <Card style={{marginBottom:"1.5rem"}}>
        <h2 style={{...T.h2, fontSize:"1rem", marginBottom:"1.2rem"}}>Novo Nível</h2>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 80px", gap:"1rem", marginBottom:"1rem"}}>
          <div>
            <div style={{...T.label, marginBottom:5}}>Nome do Nível</div>
            <input style={inp} value={form.name} placeholder="Ex: Sénior, Mestre..."
              onChange={e=>setForm({...form,name:e.target.value})}/>
          </div>
          <div>
            <div style={{...T.label, marginBottom:5}}>Patente / Título</div>
            <input style={inp} value={form.patente} placeholder="Ex: Professor Certificado"
              onChange={e=>setForm({...form,patente:e.target.value})}/>
          </div>
          <div>
            <div style={{...T.label, marginBottom:5}}>Cor</div>
            <input type="color" style={{...inp, padding:"0.2rem", height:42, cursor:"pointer"}}
              value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/>
          </div>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
          <Btn icon="plus" onClick={add}>Criar Nível</Btn>
          <Msg {...msg}/>
        </div>
      </Card>
      <div style={{display:"grid", gap:"0.6rem"}}>
        {levels.map(l => (
          <Card key={l.id} style={{padding:"0.9rem 1.2rem", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div style={{display:"flex", alignItems:"center", gap:12}}>
              <div style={{width:36, height:36, borderRadius:9, background:l.color+"22",
                border:`2px solid ${l.color}`, display:"flex", alignItems:"center", justifyContent:"center"}}>
                <div style={{width:14, height:14, borderRadius:"50%", background:l.color}}/>
              </div>
              <div>
                <div style={{fontWeight:700, color:C.navy}}>{l.name}</div>
                <div style={T.small}>{l.patente}</div>
              </div>
            </div>
            <button onClick={()=>onSave(levels.filter(x=>x.id!==l.id))}
              style={{background:"none", border:"none", cursor:"pointer", padding:6}}>
              <Icon name="trash" size={15} color={C.slateLight}/>
            </button>
          </Card>
        ))}
        {levels.length===0 && <p style={T.body}>Nenhum nível criado ainda.</p>}
      </div>
    </div>
  );
}

// ── Teacher Manager ───────────────────────────────────────────────────────────
function TeacherManager({ data, onSave, onSelect }) {
  const {teachers, classes, students, levels} = data;
  const [form, setForm]     = useState({name:"", password:"", email:"", telefone:"", morada:"", grauAcademico:"", levelId:"", anoAdesao: new Date().getFullYear()+""});
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg]       = useState({text:"", type:""});

  function add() {
    if (!form.name||!form.password) { setMsg({text:"Preenche nome e senha.", type:"error"}); return; }
    const id = "prof"+String(teachers.length+1).padStart(2,"0");
    onSave([...teachers, {id, ...form, role:"teacher", createdAt:new Date().toISOString()}]);
    setForm({name:"", password:"", email:"", telefone:"", morada:"", grauAcademico:"", levelId:"", anoAdesao: new Date().getFullYear()+""});
    setShowForm(false);
    setMsg({text:`Criado! Acesso: ${id} / ${form.password}`, type:"success"});
  }

  function saveEdit() {
    onSave(teachers.map(t => t.id===editing.id ? {...t, ...editing} : t));
    setEditing(null); setMsg({text:"Atualizado.", type:"success"});
  }

  const FIELDS = [
    ["Nome Completo","name","Ahmed Mansur"],
    ["Palavra-passe","password","Senha de acesso"],
    ["Email","email","email@exemplo.com"],
    ["Telefone","telefone","+351 9xx xxx xxx"],
    ["Morada","morada","Rua, nº, cidade"],
    ["Grau Académico","grauAcademico","Ex: Licenciatura em Estudos Islâmicos"],
    ["Ano de Adesão","anoAdesao","Ex: 2022"],
  ];

  const FormFields = ({ vals, onChange }) => (
    <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"1rem", marginBottom:"1rem"}}>
      {FIELDS.map(([label,field,ph]) => (
        <div key={field}>
          <div style={{...T.label, marginBottom:5}}>{label}</div>
          <input style={inp} value={vals[field]||""} placeholder={ph}
            onChange={e=>onChange({...vals,[field]:e.target.value})}/>
        </div>
      ))}
      <div>
        <div style={{...T.label, marginBottom:5}}>Nível</div>
        <select style={{...inp}} value={vals.levelId||""} onChange={e=>onChange({...vals,levelId:e.target.value})}>
          <option value="">Sem nível</option>
          {levels.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"2rem"}}>
        <h1 style={T.h1}>Professores</h1>
        <Btn icon="plus" onClick={()=>setShowForm(!showForm)}>
          {showForm?"Cancelar":"Novo Professor"}
        </Btn>
      </div>

      {showForm && (
        <Card style={{marginBottom:"1.5rem"}}>
          <h2 style={{...T.h2, fontSize:"1rem", marginBottom:"1.2rem"}}>Novo Professor</h2>
          <FormFields vals={form} onChange={setForm}/>
          <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
            <Btn icon="plus" onClick={add}>Criar Professor</Btn>
            <Msg {...msg}/>
          </div>
        </Card>
      )}
      {!showForm && msg.text && <Msg {...msg}/>}

      <div style={{display:"grid", gap:"0.75rem"}}>
        {teachers.map(t => {
          const myClasses = classes.filter(c=>c.teacherId===t.id);
          const n = students.filter(s=>myClasses.some(c=>c.id===s.classId)).length;
          const level = levels.find(l=>l.id===t.levelId);
          const isEd = editing?.id===t.id;
          return (
            <Card key={t.id} style={{padding:"1rem 1.2rem"}}>
              {isEd ? (
                <div>
                  <FormFields vals={editing} onChange={setEditing}/>
                  <div style={{display:"flex", gap:8}}>
                    <Btn icon="check" variant="success" size="sm" onClick={saveEdit}>Guardar</Btn>
                    <Btn variant="ghost" size="sm" onClick={()=>setEditing(null)}>Cancelar</Btn>
                  </div>
                </div>
              ) : (
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8}}>
                  <div style={{display:"flex", alignItems:"center", gap:14, cursor:"pointer", flex:1}}
                    onClick={()=>onSelect(t)}>
                    <div style={{width:44, height:44, borderRadius:12,
                      background:level?level.color+"22":C.bluePale,
                      border:level?`2px solid ${level.color}`:undefined,
                      display:"flex", alignItems:"center", justifyContent:"center"}}>
                      <Icon name="users" size={20} color={level?level.color:C.blue}/>
                    </div>
                    <div>
                      <div style={{display:"flex", gap:8, alignItems:"center"}}>
                        <span style={T.h3}>{t.name}</span>
                        {level && <span style={{background:level.color+"22", color:level.color,
                          borderRadius:20, padding:"1px 8px", fontSize:"0.7rem", fontWeight:700}}>
                          {level.name}
                        </span>}
                      </div>
                      <div style={{display:"flex", gap:8, marginTop:4, alignItems:"center", flexWrap:"wrap"}}>
                        <span style={T.mono}>{t.id}</span>
                        <span style={T.small}>· {myClasses.length} turma{myClasses.length!==1?"s":""} · {n} aluno{n!==1?"s":""}</span>
                        {t.anoAdesao && <span style={T.small}>· Desde {t.anoAdesao}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex", gap:8}}>
                    <Btn variant="secondary" size="sm" icon="edit" onClick={()=>setEditing({...t})}>Editar</Btn>
                    <Btn variant="danger" size="sm" icon="trash"
                      onClick={()=>{if(window.confirm("Remover professor?"))onSave(teachers.filter(x=>x.id!==t.id));}}>
                      Remover
                    </Btn>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {teachers.length===0 && (
          <div style={{textAlign:"center", padding:"3rem", color:C.slateLight}}>
            <Icon name="users" size={40} color={C.line}/>
            <p style={{marginTop:"1rem"}}>Nenhum professor ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Teacher Card ──────────────────────────────────────────────────────────────
function TeacherCard({ teacher, data, onSave, onBack }) {
  const { classes, students, levels } = data;
  const level = levels.find(l=>l.id===teacher.levelId);
  const myClasses = classes.filter(c=>c.teacherId===teacher.id);
  const scheduleRef = useRef();

  function downloadSchedulePDF() {
    const el = scheduleRef.current;
    if (!el) return;
    const w = el.scrollWidth, h = el.scrollHeight;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
      <foreignObject width='${w}' height='${h}'>
        <div xmlns='http://www.w3.org/1999/xhtml'>${el.outerHTML}</div>
      </foreignObject></svg>`;
    const blob = new Blob([svg], {type:"image/svg+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `horario_${teacher.name.replace(/\s+/g,"_")}.svg`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Btn variant="secondary" icon="back" size="sm" onClick={onBack}>Voltar</Btn>

      {/* Profile Card */}
      <div style={{background:`linear-gradient(135deg,${C.navy} 0%,${level?.color||C.blue} 100%)`,
        borderRadius:20, padding:"2rem", margin:"1.5rem 0",
        boxShadow:"0 16px 48px rgba(10,22,40,0.2)", position:"relative", overflow:"hidden"}}>
        <svg style={{position:"absolute",top:0,right:0,opacity:0.08}} width="200" height="200" viewBox="0 0 200 200">
          <circle cx="160" cy="40" r="100" stroke="white" strokeWidth="1" fill="none"/>
          <circle cx="160" cy="40" r="60"  stroke="white" strokeWidth="1" fill="none"/>
        </svg>
        <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:"1rem"}}>
          <div>
            <div style={{color:"rgba(255,255,255,0.5)", fontSize:"0.7rem", fontWeight:700,
              letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4}}>Professor</div>
            <div style={{color:C.white, fontSize:"1.6rem", fontWeight:800}}>{teacher.name}</div>
          </div>
          {level && (
            <div style={{background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"0.6rem 1rem",
              backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)"}}>
              <div style={{color:"rgba(255,255,255,0.6)", fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase"}}>Nível</div>
              <div style={{color:C.white, fontWeight:700, fontSize:"0.95rem"}}>{level.name}</div>
              <div style={{color:"rgba(255,255,255,0.6)", fontSize:"0.75rem"}}>{level.patente}</div>
            </div>
          )}
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"1rem"}}>
          {[
            ["ID", teacher.id],
            ["Email", teacher.email||"—"],
            ["Telefone", teacher.telefone||"—"],
            ["Morada", teacher.morada||"—"],
            ["Grau Académico", teacher.grauAcademico||"—"],
            ["Ano de Adesão", teacher.anoAdesao||"—"],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{color:"rgba(255,255,255,0.45)", fontSize:"0.65rem", fontWeight:700,
                letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3}}>{label}</div>
              <div style={{color:C.white, fontSize:"0.88rem", fontWeight:500}}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Classes & Subjects */}
      <h2 style={{...T.h2, marginBottom:"1rem"}}>Turmas & Disciplinas</h2>
      <div style={{display:"grid", gap:"0.75rem", marginBottom:"2rem"}}>
        {myClasses.map(cls => {
          const n = students.filter(s=>s.classId===cls.id).length;
          const isCIM = cls.type!=="madrassa";
          const color = isCIM?C.blue:C.green;
          return (
            <Card key={cls.id} style={{padding:"1rem 1.2rem"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:(cls.subjects||[]).length?8:0}}>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <div style={{width:36, height:36, background:color+"18", borderRadius:9,
                    display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Icon name="classes" size={18} color={color}/>
                  </div>
                  <div>
                    <div style={{fontWeight:600, color:C.navy}}>{cls.name}
                      <span style={{marginLeft:8, background:color+"22", color, borderRadius:20,
                        padding:"1px 7px", fontSize:"0.68rem", fontWeight:700}}>
                        {isCIM?"CIM":"Madrassa"}
                      </span>
                    </div>
                    <div style={T.small}>{n} aluno{n!==1?"s":""} · {cls.year}</div>
                  </div>
                </div>
              </div>
              {(cls.subjects||[]).length>0 && (
                <div style={{display:"flex", gap:6, flexWrap:"wrap", paddingLeft:46}}>
                  {(cls.subjects||[]).map(s=>(
                    <span key={s.id} style={{background:C.bluePale, color:C.blue, borderRadius:20,
                      padding:"2px 10px", fontSize:"0.78rem", fontWeight:600}}>{s.name}</span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
        {myClasses.length===0 && <p style={T.body}>Nenhuma turma atribuída.</p>}
      </div>

      {/* Schedule */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
        <h2 style={T.h2}>Horário Semanal</h2>
        <Btn variant="secondary" icon="report" size="sm" onClick={downloadSchedulePDF}>
          Download PDF
        </Btn>
      </div>
      <div ref={scheduleRef}>
        <TeacherScheduleView teacher={teacher} data={data}/>
      </div>
    </div>
  );
}

function TeacherScheduleView({ teacher, data }) {
  const { classes } = data;
  const myClasses = classes.filter(c=>c.teacherId===teacher.id);

  return (
    <Card style={{padding:0, overflow:"hidden"}}>
      <table style={{width:"100%", borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:C.navy}}>
            <th style={{...thS, color:C.white, background:C.navy, width:100, textAlign:"left", paddingLeft:12}}>Hora</th>
            {DAYS.map(d=><th key={d} style={{...thS, color:C.white, background:C.navy}}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {(() => {
            // Collect all unique time slots across all classes
            const allSlots = myClasses.flatMap(cls =>
              (cls.schedule||[])
                .filter(s=>!s.slotTeacherId||s.slotTeacherId===teacher.id)
                .map(s=>({
                  ...s,
                  className:cls.name,
                  classType:cls.type||"cim",
                  subjectName:(cls.subjects||[]).find(x=>x.id===s.subjectId)?.name||"",
                }))
            );
            const times = [...new Set(allSlots.map(s=>`${s.start}-${s.end}`))].sort();
            if (times.length===0) return (
              <tr><td colSpan={6} style={{textAlign:"center", padding:"2rem", color:C.slateLight}}>
                Sem horário definido
              </td></tr>
            );
            return times.map((time,i) => {
              const [start,end] = time.split("-");
              return (
                <tr key={time} style={{background:i%2===0?C.white:C.blueFaint}}>
                  <td style={{padding:"0.6rem 0.75rem", fontFamily:"'Courier New',monospace",
                    fontSize:"0.8rem", fontWeight:700, color:C.navy, whiteSpace:"nowrap"}}>
                    {start}–{end}
                  </td>
                  {DAYS.map(day=>{
                    const slot = allSlots.find(s=>s.day===day&&s.start===start&&s.end===end);
                    const color = slot?.classType==="madrassa"?C.green:C.blue;
                    return (
                      <td key={day} style={{padding:"0.5rem", textAlign:"center", borderLeft:`1px solid ${C.line}`}}>
                        {slot ? (
                          <div style={{background:color+"18", borderRadius:6, padding:"4px 6px"}}>
                            <div style={{fontWeight:600, fontSize:"0.78rem", color}}>{slot.className}</div>
                            {slot.subjectName && <div style={{fontSize:"0.7rem", color:C.slate}}>{slot.subjectName}</div>}
                          </div>
                        ) : <span style={{color:C.line}}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            });
          })()}
        </tbody>
      </table>
    </Card>
  );
}

// ── Student Card (full info) ──────────────────────────────────────────────────
function StudentCard({ student, data, onSave, onBack }) {
  const { classes, teachers, levels } = data;
  const cls     = classes.find(c=>c.id===student.classId);
  const teacher = teachers.find(t=>t.id===cls?.teacherId);
  const subjects = cls?.subjects||[];
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({...student});

  function saveEdit() {
    onSave(data.students.map(s=>s.id===student.id?{...s,...form}:s));
    setEditing(false);
  }

  const INFO_FIELDS = [
    ["Data de Nascimento","dataNascimento","DD/MM/AAAA"],
    ["Morada","morada","Rua, nº, cidade"],
    ["Contacto dos Pais","contactoPais","+351 9xx xxx xxx"],
    ["Nome do Pai/Encarregado","nomePai","Nome completo"],
    ["Ano de Adesão","anoAdesao","Ex: 2023"],
  ];

  return (
    <div>
      <Btn variant="secondary" icon="back" size="sm" onClick={onBack}>Voltar</Btn>

      {/* Profile Card */}
      <div style={{background:`linear-gradient(135deg,${C.navy} 0%,${C.blue} 100%)`,
        borderRadius:20, padding:"2rem", margin:"1.5rem 0",
        boxShadow:"0 16px 48px rgba(10,22,40,0.2)", position:"relative", overflow:"hidden"}}>
        <svg style={{position:"absolute",top:0,right:0,opacity:0.08}} width="200" height="200" viewBox="0 0 200 200">
          <circle cx="160" cy="40" r="100" stroke="white" strokeWidth="1" fill="none"/>
        </svg>
        <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:"1rem"}}>
          <div>
            <div style={{color:"rgba(255,255,255,0.5)", fontSize:"0.7rem", fontWeight:700,
              letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4}}>Aluno</div>
            <div style={{color:C.white, fontSize:"1.6rem", fontWeight:800}}>{student.name}</div>
          </div>
          <div style={{background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"0.6rem 1rem"}}>
            <div style={{color:"rgba(255,255,255,0.6)", fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase"}}>Nº CIM</div>
            <div style={{color:C.white, fontWeight:800, fontSize:"1.1rem", fontFamily:"'Courier New',monospace"}}>
              {student.code}
            </div>
          </div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"1rem"}}>
          {[
            ["Turma", cls?.name||"—"],
            ["Professor", teacher?.name||"—"],
            ["Data de Nascimento", student.dataNascimento||"—"],
            ["Morada", student.morada||"—"],
            ["Contacto dos Pais", student.contactoPais||"—"],
            ["Encarregado", student.nomePai||"—"],
            ["Ano de Adesão", student.anoAdesao||"—"],
          ].map(([label,value])=>(
            <div key={label}>
              <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.65rem",fontWeight:700,
                letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{label}</div>
              <div style={{color:C.white,fontSize:"0.88rem",fontWeight:500}}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:"1rem"}}>
          <button onClick={()=>setEditing(!editing)} style={{background:"rgba(255,255,255,0.15)",
            border:"1px solid rgba(255,255,255,0.3)", color:C.white, borderRadius:8,
            padding:"0.4rem 0.9rem", cursor:"pointer", fontSize:"0.82rem", fontWeight:600}}>
            {editing?"Cancelar":"Editar Informação"}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <Card style={{marginBottom:"1.5rem"}}>
          <h2 style={{...T.h2, fontSize:"1rem", marginBottom:"1rem"}}>Editar Informação</h2>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"1rem", marginBottom:"1rem"}}>
            {INFO_FIELDS.map(([label,field,ph])=>(
              <div key={field}>
                <div style={{...T.label, marginBottom:5}}>{label}</div>
                <input style={inp} value={form[field]||""} placeholder={ph}
                  onChange={e=>setForm({...form,[field]:e.target.value})}/>
              </div>
            ))}
          </div>
          <Btn icon="check" variant="success" onClick={saveEdit}>Guardar</Btn>
        </Card>
      )}

      {/* Grades */}
      {subjects.length>0 && <>
        <h2 style={{...T.h2, marginBottom:"1rem"}}>Notas</h2>
        {subjects.map(subj=>{
          const g=student.grades?.[subj.id]||{};
          const t1=trimAvg(g,1),t2=trimAvg(g,2),t3=trimAvg(g,3);
          const mF=avg(t1,t2,t3);
          return (
            <Card key={subj.id} style={{marginBottom:"1rem",padding:0,overflow:"hidden"}}>
              <div style={{background:C.blue,padding:"0.6rem 1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:C.white,fontWeight:700}}>{subj.name}</span>
                <span style={{color:C.bluePale,fontSize:"0.82rem"}}>Faltas: {g.faltas??0}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr"}}>
                {[1,2,3].map(t=>(
                  <div key={t} style={{padding:"0.75rem",borderRight:`1px solid ${C.line}`,textAlign:"center"}}>
                    <div style={{...T.label,marginBottom:6}}>T{t}</div>
                    <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:4}}>
                      {["1as","2as","at"].map(f=>(
                        <div key={f} style={{textAlign:"center"}}>
                          <div style={{...T.small,fontSize:"0.62rem"}}>{f.toUpperCase()}</div>
                          <div style={{fontWeight:700}}><GradeCell val={g[`t${t}_${f}`]}/></div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontWeight:700,color:C.blue}}><GradeCell val={[t1,t2,t3][t-1]}/></div>
                  </div>
                ))}
                <div style={{padding:"0.75rem",textAlign:"center",
                  background:mF!==null&&mF>=12?C.greenPale:mF!==null?C.redPale:C.sand}}>
                  <div style={{...T.label,marginBottom:4}}>Média Final</div>
                  <div style={{fontSize:"1.4rem",fontWeight:800}}><GradeCell val={mF}/></div>
                  {mF!==null&&mF>=12&&<>
                    <div style={{...T.label,marginTop:6,marginBottom:2,color:C.purple}}>Exame Final</div>
                    <div style={{fontWeight:700}}><GradeCell val={g.exame_final}/></div>
                  </>}
                </div>
              </div>
            </Card>
          );
        })}
      </>}

      {/* Schedule */}
      {cls && <>
        <h2 style={{...T.h2, margin:"1.5rem 0 1rem"}}>Horário da Turma</h2>
        <Card style={{padding:0, overflow:"hidden"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:C.navy}}>
                <th style={{...thS,color:C.white,background:C.navy,textAlign:"left",paddingLeft:12,width:100}}>Hora</th>
                {DAYS.map(d=><th key={d} style={{...thS,color:C.white,background:C.navy}}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const allSlots = (cls.schedule||[]).map(s=>({
                  ...s,
                  subjectName:(cls.subjects||[]).find(x=>x.id===s.subjectId)?.name||"",
                }));
                const times=[...new Set(allSlots.map(s=>`${s.start}-${s.end}`))].sort();
                if (!times.length) return (
                  <tr><td colSpan={6} style={{textAlign:"center",padding:"2rem",color:C.slateLight}}>
                    Sem horário definido
                  </td></tr>
                );
                const color = cls.type==="madrassa"?C.green:C.blue;
                return times.map((time,i)=>{
                  const [start,end]=time.split("-");
                  return (
                    <tr key={time} style={{background:i%2===0?C.white:C.blueFaint}}>
                      <td style={{padding:"0.6rem 0.75rem",fontFamily:"'Courier New',monospace",
                        fontSize:"0.8rem",fontWeight:700,color:C.navy,whiteSpace:"nowrap"}}>
                        {start}–{end}
                      </td>
                      {DAYS.map(day=>{
                        const slot=allSlots.find(s=>s.day===day&&s.start===start&&s.end===end);
                        return (
                          <td key={day} style={{padding:"0.5rem",textAlign:"center",borderLeft:`1px solid ${C.line}`}}>
                            {slot?(
                              <div style={{background:color+"18",borderRadius:6,padding:"4px 6px"}}>
                                <div style={{fontWeight:600,fontSize:"0.78rem",color}}>
                                  {slot.subjectName||cls.name}
                                </div>
                              </div>
                            ):<span style={{color:C.line}}>—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </Card>
      </>}
    </div>
  );
}

// ── Class Manager ─────────────────────────────────────────────────────────────
const DAYS  = ["Segunda","Terça","Quarta","Quinta","Sexta"];
const MADRASSA_LEVELS = ["1ª Parte","2ª Parte","Amma","Qur'an"];

function ClassManager({ data, onSaveClasses }) {
  const {classes, teachers, students} = data;
  const [name, setName]           = useState("");
  const [year, setYear]           = useState("2025/2026");
  const [type, setType]           = useState("cim"); // "cim" | "madrassa"
  const [teacherId, setTeacherId] = useState("");
  const [msg, setMsg]             = useState({text:"", type:""});
  const [openId, setOpenId]       = useState(null);
  const [openTab, setOpenTab]     = useState("subjects"); // "subjects" | "schedule"
  const [subjInput, setSubjInput] = useState("");
  const [editing, setEditing]     = useState(null);

  // schedule entry form
  const emptySlot = {day:"Segunda", start:"", end:"", subjectId:"", slotTeacherId:""};
  const [slot, setSlot] = useState(emptySlot);

  function addClass() {
    if (!name.trim()) { setMsg({text:"Escreve o nome da turma.", type:"error"}); return; }
    const id = `cls_${Date.now()}`;
    onSaveClasses([...classes, {
      id, name:name.trim(), year, type, teacherId,
      subjects:[], schedule:[], createdAt:new Date().toISOString()
    }]);
    setName(""); setMsg({text:`Turma "${name}" criada.`, type:"success"});
  }

  function addSubject(classId) {
    if (!subjInput.trim()) return;
    onSaveClasses(classes.map(c => c.id===classId
      ? {...c, subjects:[...(c.subjects||[]), {id:`subj_${Date.now()}`, name:subjInput.trim()}]}
      : c));
    setSubjInput("");
  }

  function removeSubject(classId, subjId) {
    onSaveClasses(classes.map(c => c.id===classId
      ? {...c, subjects:(c.subjects||[]).filter(s=>s.id!==subjId)}
      : c));
  }

  function addSlot(classId, classType) {
    if (!slot.start||!slot.end) return;
    const maxSlots = classType==="cim" ? 5 : 3;
    const cls = classes.find(c=>c.id===classId);
    const daySlots = (cls.schedule||[]).filter(s=>s.day===slot.day);
    if (daySlots.length>=maxSlots) {
      setMsg({text:`Máximo de ${maxSlots} tempos por dia para turma ${classType.toUpperCase()}.`, type:"error"});
      return;
    }
    onSaveClasses(classes.map(c => c.id===classId
      ? {...c, schedule:[...(c.schedule||[]), {id:`sl_${Date.now()}`, ...slot}]}
      : c));
    setSlot(emptySlot);
  }

  function removeSlot(classId, slotId) {
    onSaveClasses(classes.map(c => c.id===classId
      ? {...c, schedule:(c.schedule||[]).filter(s=>s.id!==slotId)}
      : c));
  }

  function saveEdit() {
    onSaveClasses(classes.map(c => c.id===editing.id
      ? {...c, name:editing.name, year:editing.year, teacherId:editing.teacherId, type:editing.type}
      : c));
    setEditing(null); setMsg({text:"Turma atualizada.", type:"success"});
  }

  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Turmas</h1></div>

      {/* Create */}
      <Card style={{marginBottom:"1.5rem"}}>
        <h2 style={{...T.h2, fontSize:"1rem", marginBottom:"1.2rem"}}>Nova Turma</h2>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"1rem", marginBottom:"1rem"}}>
          <div>
            <div style={{...T.label, marginBottom:5}}>Tipo</div>
            <select style={{...inp}} value={type} onChange={e=>setType(e.target.value)}>
              <option value="cim">CIM</option>
              <option value="madrassa">Madrassa</option>
            </select>
          </div>
          <div>
            <div style={{...T.label, marginBottom:5}}>Nome da Turma</div>
            <input style={inp} value={name} placeholder="Ex: Turma A" onChange={e=>setName(e.target.value)}/>
          </div>
          <div>
            <div style={{...T.label, marginBottom:5}}>Ano Letivo</div>
            <input style={inp} value={year} onChange={e=>setYear(e.target.value)}/>
          </div>
          <div>
            <div style={{...T.label, marginBottom:5}}>Professor</div>
            <select style={{...inp}} value={teacherId} onChange={e=>setTeacherId(e.target.value)}>
              <option value="">Selecionar (opcional)</option>
              {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
          <Btn icon="plus" onClick={addClass}>Criar Turma</Btn>
          <Msg {...msg}/>
        </div>
      </Card>

      {/* List */}
      <div style={{display:"grid", gap:"0.75rem"}}>
        {classes.map(cls => {
          const teacher   = teachers.find(t=>t.id===cls.teacherId);
          const nStudents = students.filter(s=>s.classId===cls.id).length;
          const subjects  = cls.subjects||[];
          const schedule  = cls.schedule||[];
          const isOpen    = openId===cls.id;
          const isEd      = editing?.id===cls.id;
          const isCIM     = cls.type!=="madrassa";
          const typeColor = isCIM ? C.blue : C.green;
          const typeLabel = isCIM ? "CIM" : "Madrassa";

          return (
            <Card key={cls.id} style={{padding:"1rem 1.2rem"}}>
              {isEd ? (
                <div>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"0.75rem", marginBottom:"0.75rem"}}>
                    {[["Nome","name","text"],["Ano Letivo","year","text"]].map(([label,field])=>(
                      <div key={field}>
                        <div style={{...T.label, marginBottom:4}}>{label}</div>
                        <input style={inp} value={editing[field]||""} onChange={e=>setEditing({...editing,[field]:e.target.value})}/>
                      </div>
                    ))}
                    <div>
                      <div style={{...T.label, marginBottom:4}}>Tipo</div>
                      <select style={{...inp}} value={editing.type||"cim"} onChange={e=>setEditing({...editing,type:e.target.value})}>
                        <option value="cim">CIM</option>
                        <option value="madrassa">Madrassa</option>
                      </select>
                    </div>
                    <div>
                      <div style={{...T.label, marginBottom:4}}>Professor</div>
                      <select style={{...inp}} value={editing.teacherId||""} onChange={e=>setEditing({...editing,teacherId:e.target.value})}>
                        <option value="">Sem professor</option>
                        {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{display:"flex", gap:8}}>
                    <Btn icon="check" variant="success" size="sm" onClick={saveEdit}>Guardar</Btn>
                    <Btn variant="ghost" size="sm" onClick={()=>setEditing(null)}>Cancelar</Btn>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8}}>
                    <div style={{display:"flex", alignItems:"center", gap:12}}>
                      <div style={{width:42, height:42, background:typeColor+"18", borderRadius:10,
                        display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <Icon name="classes" size={20} color={typeColor}/>
                      </div>
                      <div>
                        <div style={{display:"flex", alignItems:"center", gap:8}}>
                          <span style={T.h3}>{cls.name}</span>
                          <span style={{background:typeColor+"22", color:typeColor, borderRadius:20,
                            padding:"1px 8px", fontSize:"0.7rem", fontWeight:700}}>{typeLabel}</span>
                          <span style={{...T.small, fontWeight:400}}>{cls.year}</span>
                        </div>
                        <div style={{display:"flex", gap:8, marginTop:3, flexWrap:"wrap", alignItems:"center"}}>
                          {teacher
                            ? <span style={T.small}>{teacher.name}</span>
                            : <span style={{...T.small, color:C.amber}}>Sem professor</span>}
                          <span style={T.small}>· {nStudents} aluno{nStudents!==1?"s":""}</span>
                          {isCIM && <span style={T.small}>· {subjects.length} disciplina{subjects.length!==1?"s":""}</span>}
                          <span style={T.small}>· {schedule.length} tempo{schedule.length!==1?"s":""} no horário</span>
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex", gap:6}}>
                      <Btn variant="secondary" size="sm" icon="clock"
                        onClick={()=>{setOpenId(isOpen&&openTab==="schedule"?null:cls.id);setOpenTab("schedule");}}>
                        Horário
                      </Btn>
                      {isCIM && (
                        <Btn variant="secondary" size="sm" icon="book"
                          onClick={()=>{setOpenId(isOpen&&openTab==="subjects"?null:cls.id);setOpenTab("subjects");}}>
                          Disciplinas
                        </Btn>
                      )}
                      <Btn variant="secondary" size="sm" icon="edit" onClick={()=>setEditing({...cls})}>Editar</Btn>
                      <Btn variant="danger" size="sm" icon="trash"
                        onClick={()=>{if(window.confirm("Remover turma?"))onSaveClasses(classes.filter(c=>c.id!==cls.id));}}>
                        Remover
                      </Btn>
                    </div>
                  </div>

                  {/* Expanded panels */}
                  {isOpen && openTab==="subjects" && isCIM && (
                    <div style={{marginTop:"1rem", paddingTop:"1rem", borderTop:`1px solid ${C.line}`}}>
                      <div style={{...T.label, marginBottom:8}}>Disciplinas</div>
                      <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:"0.75rem"}}>
                        {subjects.map(s=>(
                          <div key={s.id} style={{display:"flex", alignItems:"center", gap:5,
                            background:C.bluePale, borderRadius:20, padding:"0.25rem 0.75rem"}}>
                            <span style={{fontSize:"0.82rem", color:C.blue, fontWeight:600}}>{s.name}</span>
                            <button style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}
                              onClick={()=>removeSubject(cls.id,s.id)}>
                              <Icon name="trash" size={13} color={C.slateLight}/>
                            </button>
                          </div>
                        ))}
                        {subjects.length===0&&<span style={T.small}>Nenhuma disciplina ainda.</span>}
                      </div>
                      <div style={{display:"flex", gap:8}}>
                        <input style={{...inp,flex:1}} value={subjInput}
                          placeholder="Nome da disciplina (ex: Quran, Árabe, Fiqh...)"
                          onChange={e=>setSubjInput(e.target.value)}
                          onKeyDown={e=>e.key==="Enter"&&addSubject(cls.id)}/>
                        <Btn icon="plus" size="sm" onClick={()=>addSubject(cls.id)}>Adicionar</Btn>
                      </div>
                    </div>
                  )}

                  {isOpen && openTab==="schedule" && (
                    <div style={{marginTop:"1rem", paddingTop:"1rem", borderTop:`1px solid ${C.line}`}}>
                      <div style={{...T.label, marginBottom:10}}>
                        Horário — {isCIM?"máx. 5 tempos/dia":"máx. 3 tempos/dia"}
                      </div>

                      {/* Schedule grid by day */}
                      <div style={{display:"grid", gap:"0.5rem", marginBottom:"1rem"}}>
                        {DAYS.map(day => {
                          const daySlots = schedule.filter(s=>s.day===day).sort((a,b)=>a.start.localeCompare(b.start));
                          return (
                            <div key={day} style={{display:"flex", gap:8, alignItems:"flex-start", flexWrap:"wrap"}}>
                              <div style={{width:72, paddingTop:6, ...T.label, fontSize:"0.68rem"}}>{day}</div>
                              <div style={{display:"flex", gap:6, flexWrap:"wrap", flex:1}}>
                                {daySlots.map(s=>{
                                    const subj = (cls.subjects||[]).find(x=>x.id===s.subjectId);
                                    const slotTeacher = teachers.find(t=>t.id===s.slotTeacherId);
                                    return (
                                      <div key={s.id} style={{display:"flex", alignItems:"center", gap:5,
                                        background:typeColor+"18", borderRadius:8, padding:"4px 10px",
                                        border:`1px solid ${typeColor}33`}}>
                                        <span style={{fontSize:"0.8rem", fontWeight:700, color:typeColor}}>
                                          {s.start}–{s.end}
                                        </span>
                                        {subj && <span style={{fontSize:"0.78rem", fontWeight:600, color:C.navy}}>· {subj.name}</span>}
                                        {slotTeacher && <span style={{fontSize:"0.75rem", color:C.slate}}>· {slotTeacher.name}</span>}
                                        <button style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}
                                          onClick={()=>removeSlot(cls.id,s.id)}>
                                          <Icon name="trash" size={12} color={C.slateLight}/>
                                        </button>
                                      </div>
                                    );
                                  })}
                                {daySlots.length===0 && <span style={{...T.small, paddingTop:6}}>Sem aulas</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add slot form */}
                      <div style={{background:C.sand, borderRadius:10, padding:"0.75rem", border:`1px solid ${C.line}`}}>
                        <div style={{...T.label, marginBottom:8}}>Adicionar Tempo</div>
                        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:8, alignItems:"flex-end", marginBottom:8}}>
                          <div>
                            <div style={{...T.label, marginBottom:4, fontSize:"0.65rem"}}>Dia</div>
                            <select style={{...inp, padding:"0.45rem 0.6rem"}} value={slot.day}
                              onChange={e=>setSlot({...slot,day:e.target.value})}>
                              {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={{...T.label, marginBottom:4, fontSize:"0.65rem"}}>Início</div>
                            <input style={{...inp, padding:"0.45rem 0.6rem"}} type="time" value={slot.start}
                              onChange={e=>setSlot({...slot,start:e.target.value})}/>
                          </div>
                          <div>
                            <div style={{...T.label, marginBottom:4, fontSize:"0.65rem"}}>Fim</div>
                            <input style={{...inp, padding:"0.45rem 0.6rem"}} type="time" value={slot.end}
                              onChange={e=>setSlot({...slot,end:e.target.value})}/>
                          </div>
                          <div>
                            <div style={{...T.label, marginBottom:4, fontSize:"0.65rem"}}>Disciplina</div>
                            <select style={{...inp, padding:"0.45rem 0.6rem"}} value={slot.subjectId}
                              onChange={e=>setSlot({...slot,subjectId:e.target.value})}>
                              <option value="">Selecionar...</option>
                              {(cls.subjects||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={{...T.label, marginBottom:4, fontSize:"0.65rem"}}>Professor</div>
                            <select style={{...inp, padding:"0.45rem 0.6rem"}} value={slot.slotTeacherId}
                              onChange={e=>setSlot({...slot,slotTeacherId:e.target.value})}>
                              <option value="">Selecionar...</option>
                              {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <Btn icon="plus" size="sm" onClick={()=>addSlot(cls.id, cls.type||"cim")}>
                          Adicionar Tempo
                        </Btn>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}
        {classes.length===0 && (
          <div style={{textAlign:"center", padding:"3rem", color:C.slateLight}}>
            <Icon name="classes" size={40} color={C.line}/>
            <p style={{marginTop:"1rem"}}>Nenhuma turma ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Coord Students (transfer only) ────────────────────────────────────────────
function CoordStudents({ data, onSave, onSelect }) {
  const {students, teachers, classes} = data;
  const [search, setSearch]       = useState("");
  const [transferId, setTransferId] = useState(null);
  const [newClassId, setNewClassId] = useState("");
  const [msg, setMsg]             = useState("");

  function transfer(sid) {
    if (!newClassId) return;
    const cls = classes.find(c=>c.id===newClassId);
    onSave(students.map(s => s.id===sid ? {...s, classId:newClassId, teacherId:cls?.teacherId} : s));
    setTransferId(null); setNewClassId(""); setMsg("Aluno transferido."); setTimeout(()=>setMsg(""),3000);
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <h1 style={T.h1}>Alunos</h1>
        <p style={{...T.body, marginTop:4}}>{students.length} aluno{students.length!==1?"s":""} registado{students.length!==1?"s":""}</p>
        {msg && <span style={{fontSize:"0.83rem", color:C.green}}>{msg}</span>}
      </div>
      <div style={{position:"relative", marginBottom:"1rem"}}>
        <div style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)"}}>
          <Icon name="search" size={16} color={C.slateLight}/>
        </div>
        <input style={{...inp, paddingLeft:"2.4rem"}} placeholder="Pesquisar por nome ou código CIM..."
          value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      <div style={{display:"grid", gap:"0.6rem"}}>
        {filtered.map(s => {
          const cls     = classes.find(c=>c.id===s.classId);
          const teacher = teachers.find(t=>t.id===cls?.teacherId);
          const isTr    = transferId===s.id;
          return (
            <Card key={s.id} style={{padding:"0.9rem 1.2rem"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8}}>
                <div style={{display:"flex", alignItems:"center", gap:12, cursor:"pointer"}} onClick={()=>onSelect(s)}>
                  <div style={{width:38, height:38, background:C.bluePale, borderRadius:10,
                    display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Icon name="student" size={18} color={C.blue}/>
                  </div>
                  <div>
                    <div style={{...T.h3, fontSize:"0.9rem"}}>{s.name}</div>
                    <div style={{display:"flex", gap:8, marginTop:3, alignItems:"center"}}>
                      <span style={T.mono}>{s.code}</span>
                      {cls && <span style={T.small}>· {cls.name}</span>}
                      {teacher && <span style={T.small}>· {teacher.name}</span>}
                    </div>
                  </div>
                </div>
                <Btn variant="secondary" size="sm" icon="transfer"
                  onClick={()=>{setTransferId(isTr?null:s.id);setNewClassId("");}}>
                  Transferir
                </Btn>
              </div>
              {isTr && (
                <div style={{marginTop:"0.75rem", paddingTop:"0.75rem", borderTop:`1px solid ${C.line}`,
                  display:"flex", gap:8, alignItems:"flex-end"}}>
                  <div style={{flex:1}}>
                    <div style={{...T.label, marginBottom:4}}>Transferir para</div>
                    <select style={{...inp}} value={newClassId} onChange={e=>setNewClassId(e.target.value)}>
                      <option value="">Selecionar turma...</option>
                      {classes.filter(c=>c.id!==s.classId).map(c => {
                        const t = teachers.find(t=>t.id===c.teacherId);
                        return <option key={c.id} value={c.id}>{c.name} {t?`— ${t.name}`:""}</option>;
                      })}
                    </select>
                  </div>
                  <Btn variant="success" size="sm" icon="check" onClick={()=>transfer(s.id)} disabled={!newClassId}>
                    Confirmar
                  </Btn>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length===0 && (
          <div style={{textAlign:"center", padding:"3rem", color:C.slateLight}}>
            <Icon name="student" size={40} color={C.line}/>
            <p style={{marginTop:"1rem"}}>Nenhum aluno encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Grade Manager ─────────────────────────────────────────────────────────────
function GradeManager({ data, onSave, filterTeacherId }) {
  const {classes, students, teachers} = data;
  const [selClass, setSelClass] = useState(null);
  const [selSubj,  setSelSubj]  = useState(null);
  const [editing,  setEditing]  = useState({});

  const myClasses = filterTeacherId
    ? classes.filter(c=>c.teacherId===filterTeacherId)
    : classes;

  const clsStudents = selClass ? students.filter(s=>s.classId===selClass.id) : [];
  const clsSubjects = selClass ? (selClass.subjects||[]) : [];

  function getG(student, subjId) { return student.grades?.[subjId]||{}; }

  function updGrade(studentId, subjId, field, val) {
    setEditing(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjId]: {
          ...getG(students.find(s=>s.id===studentId), subjId),
          ...(prev[studentId]?.[subjId]||{}),
          [field]: val,
        }
      }
    }));
  }

  function saveGrades() {
    const updated = students.map(s => {
      if (!editing[s.id]) return s;
      const newGrades = {...s.grades};
      Object.entries(editing[s.id]).forEach(([subjId, g]) => {
        newGrades[subjId] = {...newGrades[subjId], ...g};
      });
      return {...s, grades:newGrades};
    });
    onSave(updated);
    setEditing({});
  }

  const TRIMS  = [{t:1,label:"1º Trimestre"},{t:2,label:"2º Trimestre"},{t:3,label:"3º Trimestre"}];
  const FIELDS = [{key:"1as",label:"1ª AS"},{key:"2as",label:"2ª AS"},{key:"at",label:"AT"}];

  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Notas</h1></div>

      {/* Class selector */}
      <div style={{display:"flex", gap:"0.6rem", flexWrap:"wrap", marginBottom:"1.2rem"}}>
        {myClasses.map(cls => (
          <button key={cls.id} onClick={()=>{setSelClass(cls);setSelSubj(null);setEditing({});}} style={{
            padding:"0.5rem 1rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontSize:"0.875rem",
            border:`1.5px solid ${selClass?.id===cls.id?C.blue:C.line}`,
            background:selClass?.id===cls.id?C.bluePale:C.white,
            color:selClass?.id===cls.id?C.blue:C.slate,
            fontWeight:selClass?.id===cls.id?700:400,
          }}>{cls.name}</button>
        ))}
        {myClasses.length===0 && <p style={T.body}>Nenhuma turma disponível.</p>}
      </div>

      {selClass && (
        <>
          {/* Subject selector */}
          <div style={{display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"1.2rem"}}>
            {clsSubjects.map(s => (
              <button key={s.id} onClick={()=>{setSelSubj(s);setEditing({});}} style={{
                padding:"0.4rem 0.9rem", borderRadius:20, cursor:"pointer", fontFamily:"inherit",
                fontSize:"0.82rem", fontWeight:600,
                border:`1.5px solid ${selSubj?.id===s.id?C.blue:C.line}`,
                background:selSubj?.id===s.id?C.blue:C.white,
                color:selSubj?.id===s.id?C.white:C.slate,
              }}>{s.name}</button>
            ))}
            {clsSubjects.length===0 && <p style={T.small}>Sem disciplinas. Adiciona-as na aba Turmas.</p>}
          </div>

          {selSubj && clsStudents.length>0 && (
            <div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
                <h2 style={{...T.h2, fontSize:"1.1rem"}}>{selSubj.name} — {selClass.name}</h2>
                {Object.keys(editing).length>0 && (
                  <Btn icon="check" variant="success" onClick={saveGrades}>Guardar Notas</Btn>
                )}
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%", borderCollapse:"collapse", minWidth:800}}>
                  <thead>
                    <tr>
                      <th style={{...thS, textAlign:"left", paddingLeft:12, width:160}}>Aluno</th>
                      <th style={{...thS, width:56}}>Faltas</th>
                      {TRIMS.map(({t,label}) => (
                        <th key={t} colSpan={4} style={{...thS,
                          background:t===1?C.blue:t===2?C.blueMid:C.blueLight, color:C.white}}>
                          {label}
                        </th>
                      ))}
                      <th style={{...thS, background:C.navy, color:C.white}}>Média Final</th>
                      <th style={{...thS, background:C.purple, color:C.white}}>Exame Final</th>
                    </tr>
                    <tr style={{background:C.blueFaint}}>
                      <th style={thS}></th><th style={thS}></th>
                      {TRIMS.map(({t}) => <>
                        {FIELDS.map(f=><th key={f.key} style={{...thS,fontSize:"0.66rem"}}>{f.label}</th>)}
                        <th key={`m${t}`} style={{...thS,fontSize:"0.66rem",color:C.blue}}>Méd.</th>
                      </>)}
                      <th style={thS}></th><th style={thS}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clsStudents.map((s,i) => {
                      const saved = getG(s, selSubj.id);
                      const ed    = editing[s.id]?.[selSubj.id]||{};
                      const g     = {...saved, ...ed};
                      const t1=trimAvg(g,1), t2=trimAvg(g,2), t3=trimAvg(g,3);
                      const mF=avg(t1,t2,t3);
                      const canExam = mF!==null && mF>=12;

                      return (
                        <tr key={s.id} style={{background:i%2===0?C.white:C.blueFaint, borderBottom:`1px solid ${C.line}`}}>
                          <td style={{padding:"0.4rem 0.75rem"}}>
                            <div style={{fontWeight:600, fontSize:"0.85rem", color:C.navy}}>{s.name}</div>
                            <span style={{...T.mono, fontSize:"0.7rem"}}>{s.code}</span>
                          </td>
                          <td style={{textAlign:"center"}}>
                            <GradeInput value={g.faltas} onChange={v=>updGrade(s.id,selSubj.id,"faltas",v)}/>
                          </td>
                          {TRIMS.map(({t}) => <>
                            {FIELDS.map(f=>(
                              <td key={f.key} style={{textAlign:"center",padding:"0.3rem"}}>
                                <GradeInput value={g[`t${t}_${f.key}`]}
                                  onChange={v=>updGrade(s.id,selSubj.id,`t${t}_${f.key}`,v)}/>
                              </td>
                            ))}
                            <td key={`m${t}`} style={{textAlign:"center",padding:"0.3rem",fontWeight:700}}>
                              <GradeCell val={[t1,t2,t3][t-1]}/>
                            </td>
                          </>)}
                          <td style={{textAlign:"center",fontWeight:800,fontSize:"1rem"}}>
                            <GradeCell val={mF}/>
                          </td>
                          <td style={{textAlign:"center",padding:"0.3rem"}}>
                            {canExam
                              ? <GradeInput value={g.exame_final}
                                  onChange={v=>updGrade(s.id,selSubj.id,"exame_final",v)}/>
                              : <span style={{...T.small, fontSize:"0.68rem"}}>Méd. &lt; 12</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {Object.keys(editing).length>0 && (
                <div style={{marginTop:"1rem", display:"flex", justifyContent:"flex-end"}}>
                  <Btn icon="check" variant="success" onClick={saveGrades}>Guardar Notas</Btn>
                </div>
              )}
            </div>
          )}
          {selSubj && clsStudents.length===0 && (
            <p style={T.body}>Nenhum aluno nesta turma ainda.</p>
          )}
        </>
      )}
    </div>
  );
}

// ── Report List & Detail ──────────────────────────────────────────────────────
function ReportList({ data, onSave, onSelect }) {
  const {reports, teachers} = data;
  const sorted = [...reports].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Relatórios Quinzenais</h1></div>
      <div style={{display:"grid", gap:"0.75rem"}}>
        {sorted.map(r => {
          const teacher = teachers.find(t=>t.id===r.teacherId);
          return (
            <Card key={r.id} style={{padding:"1rem 1.2rem", display:"flex", alignItems:"center",
              justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem"}}>
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <div style={{width:40, height:40, borderRadius:10,
                  background:r.approved?C.greenPale:C.amberPale,
                  display:"flex", alignItems:"center", justifyContent:"center"}}>
                  <Icon name="report" size={18} color={r.approved?C.green:C.amber}/>
                </div>
                <div>
                  <div style={T.h3}>{teacher?.name||r.teacherId}</div>
                  <div style={T.small}>{r.data?.semanas} · {r.data?.periodo} · {new Date(r.createdAt).toLocaleDateString("pt-PT")}</div>
                </div>
              </div>
              <div style={{display:"flex", gap:8, alignItems:"center"}}>
                <Badge color={r.approved?"green":"amber"}>{r.approved?"Aprovado":"Pendente"}</Badge>
                <Btn variant="secondary" size="sm" icon="eye" onClick={()=>onSelect(r)}>Ver</Btn>
                {!r.approved && (
                  <Btn variant="success" size="sm" icon="check"
                    onClick={()=>onSave(reports.map(x=>x.id===r.id?{...x,approved:true,approvedAt:new Date().toISOString()}:x))}>
                    Aprovar
                  </Btn>
                )}
              </div>
            </Card>
          );
        })}
        {reports.length===0 && (
          <div style={{textAlign:"center", padding:"3rem", color:C.slateLight}}>
            <Icon name="report" size={40} color={C.line}/>
            <p style={{marginTop:"1rem"}}>Nenhum relatório ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportDetail({ report, data, onSave, onBack }) {
  const {teachers, reports} = data;
  const teacher = teachers.find(t=>t.id===report.teacherId);
  const d = report.data||{};
  const SR = ({label,v1,v2,total}) => (
    <tr style={{borderBottom:`1px solid ${C.line}`}}>
      <td style={{padding:"0.6rem 1rem", color:C.slate, fontSize:"0.875rem"}}>{label}</td>
      <td style={{padding:"0.6rem 1rem", textAlign:"center", fontWeight:600}}>{v1??"—"}</td>
      <td style={{padding:"0.6rem 1rem", textAlign:"center", fontWeight:600}}>{v2??"—"}</td>
      <td style={{padding:"0.6rem 1rem", textAlign:"center", fontWeight:700, color:C.blue}}>{total??"—"}</td>
    </tr>
  );
  return (
    <div>
      <Btn variant="secondary" icon="back" size="sm" onClick={onBack}>Voltar</Btn>
      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        margin:"1.5rem 0", flexWrap:"wrap", gap:"1rem"}}>
        <div>
          <h1 style={T.h1}>{teacher?.name||report.teacherId}</h1>
          <p style={{...T.body, marginTop:4}}>{d.semanas} · {d.periodo}</p>
        </div>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <Badge color={report.approved?"green":"amber"}>{report.approved?"Aprovado":"Pendente"}</Badge>
          {!report.approved && (
            <Btn variant="success" icon="check"
              onClick={()=>onSave(reports.map(r=>r.id===report.id?{...r,approved:true,approvedAt:new Date().toISOString()}:r))}>
              Aprovar Relatório
            </Btn>
          )}
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"1.5rem"}}>
        {[
          {title:"CIM — Estudos Islâmicos", bg:C.blue, rows:[
            ["Aulas Dadas",d.cim?.aulas_sem1,d.cim?.aulas_sem2,d.cim?.total_aulas],
            ["Faltas Alunos",d.cim?.faltas_sem1,d.cim?.faltas_sem2,d.cim?.total_faltas],
          ], extra:d.cim?.materias?`Matérias: ${d.cim.materias}`:null},
          {title:"Madrassa — Quran & Duaas", bg:C.navy, rows:[
            ["Sessões Dadas",d.madrassa?.sessoes_sem1,d.madrassa?.sessoes_sem2,d.madrassa?.total_sessoes],
            ["Presenças",d.madrassa?.presencas_sem1,d.madrassa?.presencas_sem2,d.madrassa?.total_presencas],
            ["Faltas (A+FJ)",d.madrassa?.faltas_sem1,d.madrassa?.faltas_sem2,d.madrassa?.total_faltas],
          ]},
        ].map(sec => (
          <Card key={sec.title} style={{padding:0, overflow:"hidden"}}>
            <div style={{background:sec.bg, padding:"0.75rem 1rem"}}>
              <span style={{color:C.white, fontWeight:700, fontSize:"0.875rem"}}>{sec.title}</span>
            </div>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead><tr style={{background:C.blueFaint}}>
                {["","Sem. 1","Sem. 2","Total"].map(h=>(
                  <th key={h} style={{padding:"0.5rem 1rem", textAlign:h?"center":"left",
                    fontSize:"0.72rem", fontWeight:700, color:C.slateLight, textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{sec.rows.map(([l,v1,v2,t])=><SR key={l} label={l} v1={v1} v2={v2} total={t}/>)}</tbody>
            </table>
            {sec.extra && <div style={{padding:"0.75rem 1rem", background:C.blueFaint, fontSize:"0.82rem", color:C.slate, borderTop:`1px solid ${C.line}`}}>{sec.extra}</div>}
          </Card>
        ))}
      </div>
      {report.imageBase64 && (
        <Card style={{marginTop:"1.5rem"}}>
          <div style={{...T.label, marginBottom:10}}>Scan Original</div>
          <img src={`data:${report.imageMime};base64,${report.imageBase64}`}
            style={{width:"100%", borderRadius:8, border:`1px solid ${C.line}`}} alt="Scan"/>
        </Card>
      )}
    </div>
  );
}

function Settings({ apiKey, onSave }) {
  const [key,setKey]   = useState(apiKey);
  const [saved,setSaved] = useState(false);
  function save(){onSave(key.trim());setSaved(true);setTimeout(()=>setSaved(false),2000);}
  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Definições</h1></div>
      <Card style={{maxWidth:520}}>
        <h2 style={{...T.h2, fontSize:"1rem", marginBottom:"0.5rem"}}>Chave API Anthropic</h2>
        <p style={{...T.body, marginBottom:"1rem"}}>
          Necessária para análise automática dos scans. Obtém em{" "}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:C.blue}}>console.anthropic.com</a>
        </p>
        <div style={{marginBottom:"1rem"}}>
          <div style={{...T.label, marginBottom:5}}>Chave API</div>
          <input style={inp} type="password" value={key} placeholder="sk-ant-..." onChange={e=>setKey(e.target.value)}/>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
          <Btn icon="check" onClick={save}>Guardar</Btn>
          {saved && <span style={{color:C.green, fontSize:"0.85rem"}}>Guardado!</span>}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER SHELL
// ═══════════════════════════════════════════════════════════════════════════════
function TeacherShell({ user, data, save, onLogout }) {
  const myClasses  = data.classes.filter(c=>c.teacherId===user.id);
  const myStudents = data.students.filter(s=>myClasses.some(c=>c.id===s.classId));
  const myReports  = data.reports.filter(r=>r.teacherId===user.id)
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const nav = [
    {id:"schedule", label:"Horário",             icon:"clock"},
    {id:"students", label:"A Minha Turma",       icon:"student"},
    {id:"grades",   label:"Notas",               icon:"grades"},
    {id:"submit",   label:"Submeter Relatório",  icon:"upload"},
    {id:"history",  label:"Histórico",           icon:"report"},
  ];

  return (
    <Shell user={user} nav={nav} onLogout={onLogout}>
      {({tab}) => <>
        {tab==="schedule" && <TeacherSchedule user={user} data={data}/>}
        {tab==="students" && <TeacherStudents user={user} data={data} onSave={save.students} myClasses={myClasses}/>}
        {tab==="grades"   && <GradeManager data={data} onSave={save.students} filterTeacherId={user.id}/>}
        {tab==="submit"   && <SubmitReport user={user} myStudents={myStudents} data={data} save={save}/>}
        {tab==="history"  && <TeacherHistory myReports={myReports}/>}
      </>}
    </Shell>
  );
}

// ── Teacher Schedule ──────────────────────────────────────────────────────────
function TeacherSchedule({ user, data }) {
  const {classes} = data;
  const myClasses = classes.filter(c=>c.teacherId===user.id);

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <h1 style={T.h1}>O Meu Horário</h1>
        <p style={{...T.body, marginTop:4}}>Horário semanal das tuas turmas</p>
      </div>

      {myClasses.length===0 && (
        <Card><p style={T.body}>Nenhuma turma atribuída ainda.</p></Card>
      )}

      {DAYS.map(day => {
        const daySlots = myClasses.flatMap(cls =>
          (cls.schedule||[])
            .filter(s=>s.day===day)
            .map(s=>({
              ...s,
              className: cls.name,
              classType: cls.type||"cim",
              subjectName: (cls.subjects||[]).find(x=>x.id===s.subjectId)?.name || "",
            }))
        ).sort((a,b)=>a.start.localeCompare(b.start));

        return (
          <div key={day} style={{marginBottom:"1rem"}}>
            <div style={{...T.label, marginBottom:6, color:C.navy}}>{day}</div>
            {daySlots.length===0 ? (
              <div style={{padding:"0.6rem 1rem", background:C.sand, borderRadius:8,
                border:`1px solid ${C.line}`, ...T.small}}>Sem aulas</div>
            ) : (
              <div style={{display:"grid", gap:"0.4rem"}}>
                {daySlots.map(s => {
                  const isCIM     = s.classType!=="madrassa";
                  const color     = isCIM ? C.blue : C.green;
                  const typeLabel = isCIM ? "CIM" : "Madrassa";
                  // only show slot if teacher matches (or no teacher set on slot)
                  const isMySlot  = !s.slotTeacherId || s.slotTeacherId===user.id;
                  if (!isMySlot) return null;
                  return (
                    <div key={s.id} style={{display:"flex", alignItems:"center", gap:12,
                      padding:"0.65rem 1rem", background:color+"10", borderRadius:10,
                      border:`1px solid ${color}30`}}>
                      <div style={{fontWeight:800, fontSize:"0.95rem", color, minWidth:110,
                        fontFamily:"'Courier New',monospace"}}>
                        {s.start} – {s.end}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600, color:C.navy}}>{s.className}</div>
                        {s.subjectName && <div style={T.small}>{s.subjectName}</div>}
                      </div>
                      <span style={{background:color+"22", color, borderRadius:20,
                        padding:"2px 8px", fontSize:"0.7rem", fontWeight:700}}>{typeLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TeacherStudents({ user, data, onSave, myClasses }) {
  const {students} = data;
  const [selClass, setSelClass]   = useState(myClasses[0]||null);
  const [name, setName]           = useState("");
  const [msg, setMsg]             = useState({text:"", type:""});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});

  const clsStudents = selClass ? students.filter(s=>s.classId===selClass.id) : [];
  const isMadrassa  = selClass?.type==="madrassa";

  function add() {
    if (!name.trim()||!selClass) { setMsg({text:"Escreve o nome.", type:"error"}); return; }
    const code = nextCIM(students);
    onSave([...students, {
      id:`s_${Date.now()}`, name:name.trim(), code,
      classId:selClass.id, teacherId:user.id,
      createdAt:new Date().toISOString(), grades:{},
      level: isMadrassa ? "1ª Parte" : null,
      licaoApresentada: isMadrassa ? "" : null,
      licaoPorApresentar: isMadrassa ? "" : null,
      stats:{cim_faltas:0, madrassa_presencas:0, madrassa_faltas:0, madrassa_fj:0},
    }]);
    setName("");
    setMsg({text:`${name} adicionado — ${code}`, type:"success"});
    setTimeout(()=>setMsg({text:"",type:""}),3000);
  }

  function saveStudentEdit(sid) {
    onSave(students.map(s => s.id===sid ? {...s, ...editForm} : s));
    setEditingId(null); setEditForm({});
  }

  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>A Minha Turma</h1></div>

      {myClasses.length>1 && (
        <div style={{display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap"}}>
          {myClasses.map(cls => {
            const clsColor = cls.type==="madrassa" ? C.green : C.blue;
            return (
              <button key={cls.id} onClick={()=>setSelClass(cls)} style={{
                padding:"0.45rem 1rem", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontSize:"0.875rem",
                border:`1.5px solid ${selClass?.id===cls.id?clsColor:C.line}`,
                background:selClass?.id===cls.id?clsColor+"18":C.white,
                color:selClass?.id===cls.id?clsColor:C.slate,
                fontWeight:selClass?.id===cls.id?700:400,
              }}>
                {cls.name}
                <span style={{marginLeft:6,fontSize:"0.7rem",opacity:0.7}}>
                  ({cls.type==="madrassa"?"Madrassa":"CIM"})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selClass ? (
        <>
          <Card style={{marginBottom:"1.5rem"}}>
            <h2 style={{...T.h2, fontSize:"1rem", marginBottom:"1rem"}}>
              Adicionar Aluno — {selClass.name}
            </h2>
            <div style={{display:"flex", gap:"0.75rem", alignItems:"flex-end"}}>
              <div style={{flex:1}}>
                <div style={{...T.label, marginBottom:5}}>Nome Completo</div>
                <input style={inp} value={name} placeholder="Nome do aluno"
                  onChange={e=>setName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&add()}/>
              </div>
              <Btn icon="plus" onClick={add}>Adicionar</Btn>
            </div>
            <Msg {...msg}/>
            <p style={{...T.small, marginTop:"0.5rem"}}>
              Número CIM atribuído automaticamente — CIM0001, CIM0002...
              {isMadrassa && " · Define o nível e lições após adicionar."}
            </p>
          </Card>

          <div style={{display:"grid", gap:"0.6rem"}}>
            {clsStudents.map((s,i) => {
              const isEd = editingId===s.id;
              return (
                <Card key={s.id} style={{padding:"0.9rem 1.2rem"}}>
                  {isEd ? (
                    <div>
                      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.75rem", marginBottom:"0.75rem"}}>
                        <div>
                          <div style={{...T.label, marginBottom:4}}>Nível</div>
                          <select style={{...inp}} value={editForm.level||"1ª Parte"}
                            onChange={e=>setEditForm({...editForm,level:e.target.value})}>
                            {["1ª Parte","2ª Parte","Amma","Qur'an"].map(l=><option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{...T.label, marginBottom:4}}>Lição Apresentada</div>
                          <input style={inp} value={editForm.licaoApresentada||""}
                            placeholder="Ex: Surah Al-Fatiha"
                            onChange={e=>setEditForm({...editForm,licaoApresentada:e.target.value})}/>
                        </div>
                        <div>
                          <div style={{...T.label, marginBottom:4}}>Lição por Apresentar</div>
                          <input style={inp} value={editForm.licaoPorApresentar||""}
                            placeholder="Ex: Surah Al-Baqarah"
                            onChange={e=>setEditForm({...editForm,licaoPorApresentar:e.target.value})}/>
                        </div>
                      </div>
                      <div style={{display:"flex", gap:8}}>
                        <Btn icon="check" variant="success" size="sm" onClick={()=>saveStudentEdit(s.id)}>Guardar</Btn>
                        <Btn variant="ghost" size="sm" onClick={()=>setEditingId(null)}>Cancelar</Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8}}>
                      <div style={{display:"flex", alignItems:"center", gap:12}}>
                        <div style={{width:34, height:34,
                          background:isMadrassa?C.greenPale:C.bluePale, borderRadius:9,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:"0.78rem", fontWeight:700, color:isMadrassa?C.green:C.blue}}>
                          {i+1}
                        </div>
                        <div>
                          <div style={{...T.h3, fontSize:"0.9rem"}}>{s.name}</div>
                          <div style={{display:"flex", gap:8, marginTop:3, flexWrap:"wrap", alignItems:"center"}}>
                            <span style={T.mono}>{s.code}</span>
                            {isMadrassa && s.level && <Badge color="green">{s.level}</Badge>}
                            {isMadrassa && s.licaoApresentada && <span style={T.small}>✓ {s.licaoApresentada}</span>}
                            {isMadrassa && s.licaoPorApresentar && <span style={{...T.small, color:C.amber}}>→ {s.licaoPorApresentar}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex", gap:6}}>
                        {isMadrassa && (
                          <Btn variant="secondary" size="sm" icon="edit"
                            onClick={()=>{setEditingId(s.id);setEditForm({
                              level:s.level||"1ª Parte",
                              licaoApresentada:s.licaoApresentada||"",
                              licaoPorApresentar:s.licaoPorApresentar||"",
                            });}}>Editar</Btn>
                        )}
                        <button onClick={()=>{if(window.confirm("Remover?"))onSave(students.filter(x=>x.id!==s.id));}}
                          style={{background:"none", border:"none", cursor:"pointer", padding:6}}>
                          <Icon name="trash" size={15} color={C.slateLight}/>
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
            {clsStudents.length===0 && (
              <div style={{textAlign:"center", padding:"3rem", color:C.slateLight}}>
                <Icon name="student" size={40} color={C.line}/>
                <p style={{marginTop:"1rem"}}>Nenhum aluno ainda — adiciona o primeiro acima</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <Card>
          <p style={T.body}>Nenhuma turma atribuída. O coordenador deve criar uma turma e alocá-la a ti.</p>
        </Card>
      )}
    </div>
  );
}

function TeacherHistory({ myReports }) {
  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Histórico de Relatórios</h1></div>
      <div style={{display:"grid", gap:"0.75rem"}}>
        {myReports.map(r => (
          <Card key={r.id} style={{padding:"1rem 1.2rem", display:"flex",
            alignItems:"center", justifyContent:"space-between"}}>
            <div style={{display:"flex", alignItems:"center", gap:12}}>
              <div style={{width:40, height:40, borderRadius:10,
                background:r.approved?C.greenPale:C.amberPale,
                display:"flex", alignItems:"center", justifyContent:"center"}}>
                <Icon name={r.approved?"check":"clock"} size={18} color={r.approved?C.green:C.amber}/>
              </div>
              <div>
                <div style={T.h3}>{r.data?.semanas}</div>
                <div style={T.small}>{r.data?.periodo} · {new Date(r.createdAt).toLocaleDateString("pt-PT")}</div>
              </div>
            </div>
            <Badge color={r.approved?"green":"amber"}>{r.approved?"Aprovado":"A aguardar"}</Badge>
          </Card>
        ))}
        {myReports.length===0 && (
          <div style={{textAlign:"center", padding:"3rem", color:C.slateLight}}>
            <Icon name="report" size={40} color={C.line}/>
            <p style={{marginTop:"1rem"}}>Nenhum relatório ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmitReport({ user, myStudents, data, save }) {
  const [file,setFile]       = useState(null);
  const [preview,setPreview] = useState(null);
  const [loading,setLoading] = useState(false);
  const [result,setResult]   = useState(null);
  const [error,setError]     = useState("");
  const [done,setDone]       = useState(false);
  const fileRef = useRef();

  async function analyzeReport(base64, mimeType) {
    const list = myStudents.map(s=>`${s.code}: ${s.name}`).join("\n");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":data.apiKey,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:2000,
        messages:[{role:"user", content:[
          {type:"image", source:{type:"base64", media_type:mimeType, data:base64}},
          {type:"text", text:`Analisa esta folha de relatório quinzenal.\nAlunos:\n${list}\n\nJSON puro sem markdown:\n{"semanas":"","periodo":"","cim":{"aulas_sem1":0,"aulas_sem2":0,"total_aulas":0,"faltas_sem1":0,"faltas_sem2":0,"total_faltas":0,"materias":""},"madrassa":{"sessoes_sem1":0,"sessoes_sem2":0,"total_sessoes":0,"presencas_sem1":0,"presencas_sem2":0,"total_presencas":0,"faltas_sem1":0,"faltas_sem2":0,"total_faltas":0},"alunos":[{"codigo":"","nome":"","cim_faltas":0,"madrassa_presencas":0,"madrassa_faltas":0,"madrassa_faltas_justificadas":0,"observacoes":null}],"observacoes_gerais":null}`}
        ]}]
      })
    });
    const d = await res.json();
    const text = d.content?.map(b=>b.text||"").join("")||"";
    try { return JSON.parse(text.replace(/```json|```/g,"").trim()); } catch { return null; }
  }

  function handleFile(e) {
    const f=e.target.files[0]; if(!f) return;
    setFile(f);setResult(null);setError("");setDone(false);
    const r=new FileReader(); r.onload=ev=>setPreview(ev.target.result); r.readAsDataURL(f);
  }

  async function analyse() {
    if(!file) return;
    if(!data.apiKey){setError("Chave API não configurada nas Definições.");return;}
    setLoading(true);setError("");setResult(null);
    try {
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      const d=await analyzeReport(b64,file.type);
      if(!d) throw new Error("Não foi possível extrair dados. Verifica a qualidade da imagem.");
      setResult({data:d,b64,mime:file.type});
    } catch(e){setError(e.message);}
    setLoading(false);
  }

  function submit() {
    if(!result) return;
    const studentUpdates=result.data.alunos||[];
    const report={id:`r_${user.id}_${Date.now()}`,teacherId:user.id,data:result.data,
      studentUpdates,imageBase64:result.b64,imageMime:result.mime,
      approved:false,createdAt:new Date().toISOString()};
    const updatedStudents=data.students.map(s=>{
      const u=studentUpdates.find(x=>x.codigo===s.code); if(!u) return s;
      return {...s,stats:{
        cim_faltas:(s.stats?.cim_faltas||0)+(u.cim_faltas||0),
        madrassa_presencas:(s.stats?.madrassa_presencas||0)+(u.madrassa_presencas||0),
        madrassa_faltas:(s.stats?.madrassa_faltas||0)+(u.madrassa_faltas||0),
        madrassa_fj:(s.stats?.madrassa_fj||0)+(u.madrassa_faltas_justificadas||0),
      }};
    });
    save.reports([...data.reports,report]);
    save.students(updatedStudents);
    setFile(null);setPreview(null);setResult(null);setDone(true);
  }

  if(done) return (
    <div style={{textAlign:"center", padding:"4rem 2rem"}}>
      <div style={{width:72,height:72,background:C.greenPale,borderRadius:"50%",
        display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:"1.5rem"}}>
        <Icon name="check" size={32} color={C.green} sw={2}/>
      </div>
      <h2 style={{...T.h2, marginBottom:"0.5rem"}}>Relatório submetido</h2>
      <p style={T.body}>O coordenador irá rever e aprovar em breve.</p>
      <div style={{marginTop:"1.5rem"}}><Btn variant="secondary" onClick={()=>setDone(false)}>Submeter outro</Btn></div>
    </div>
  );

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <h1 style={T.h1}>Submeter Relatório Quinzenal</h1>
        <p style={{...T.body, marginTop:4}}>Fotografa a folha de entrega e faz upload abaixo.</p>
      </div>
      <div style={{display:"grid", gridTemplateColumns:result?"1fr 1fr":"1fr", gap:"1.5rem"}}>
        <Card>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={handleFile}/>
          <div onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${C.blueMid}`,borderRadius:12,
            padding:"2.5rem 1rem",textAlign:"center",cursor:"pointer",background:C.blueFaint,marginBottom:"1rem"}}>
            {preview
              ? <img src={preview} style={{maxWidth:"100%",maxHeight:260,borderRadius:8}} alt="preview"/>
              : <>
                  <div style={{width:56,height:56,background:C.bluePale,borderRadius:14,
                    display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"}}>
                    <Icon name="upload" size={26} color={C.blue}/>
                  </div>
                  <div style={{fontWeight:600,color:C.blue,marginBottom:4}}>Clica para selecionar ficheiro</div>
                  <div style={T.small}>JPG, PNG ou PDF</div>
                </>
            }
          </div>
          {file&&!result && <Btn full size="lg" icon="search" onClick={analyse} disabled={loading}>
            {loading?"A analisar...":"Analisar com IA"}
          </Btn>}
          {error && <div style={{display:"flex",alignItems:"center",gap:8,color:C.red,fontSize:"0.84rem",
            marginTop:"0.8rem",background:C.redPale,borderRadius:8,padding:"0.6rem 0.9rem"}}>
            <Icon name="alert" size={16} color={C.red}/>{error}
          </div>}
        </Card>
        {result && (
          <Card>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1.2rem"}}>
              <div style={{width:36,height:36,background:C.greenPale,borderRadius:9,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon name="check" size={18} color={C.green}/>
              </div>
              <div>
                <div style={{fontWeight:700,color:C.green,fontSize:"0.9rem"}}>Dados extraídos</div>
                <div style={T.small}>{result.data.semanas} · {result.data.periodo}</div>
              </div>
            </div>
            <Divider/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem",marginBottom:"1.2rem"}}>
              {[
                {label:"Aulas CIM",     value:result.data.cim?.total_aulas,         color:C.blue},
                {label:"Faltas CIM",    value:result.data.cim?.total_faltas,        color:C.red},
                {label:"Sessões Mad.",  value:result.data.madrassa?.total_sessoes,  color:C.blue},
                {label:"Presenças Mad.",value:result.data.madrassa?.total_presencas,color:C.green},
              ].map(s=>(
                <div key={s.label} style={{background:C.sand,borderRadius:8,padding:"0.7rem 0.9rem"}}>
                  <div style={T.small}>{s.label}</div>
                  <div style={{fontSize:"1.4rem",fontWeight:800,color:s.color}}>{s.value??"—"}</div>
                </div>
              ))}
            </div>
            <Btn full variant="success" icon="upload" size="lg" onClick={submit}>
              Submeter ao Coordenador
            </Btn>
          </Card>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT SHELL
// ═══════════════════════════════════════════════════════════════════════════════
function StudentShell({ user, data, onLogout }) {
  const nav = [
    {id:"card",   label:"O Meu Cartão",    icon:"card"},
    {id:"grades", label:"As Minhas Notas", icon:"grades"},
  ];
  return (
    <Shell user={user} nav={nav} onLogout={onLogout}>
      {({tab}) => <>
        {tab==="card"   && <StudentCard   user={user} data={data}/>}
        {tab==="grades" && <StudentGrades user={user} data={data}/>}
      </>}
    </Shell>
  );
}

function StudentCard({ user, data }) {
  const {classes, teachers} = data;
  const cls     = classes.find(c=>c.id===user.classId);
  const teacher = teachers.find(t=>t.id===cls?.teacherId);

  return (
    <div style={{maxWidth:480, margin:"0 auto"}}>
      <div style={{marginBottom:"1.5rem"}}><h1 style={T.h1}>O Meu Cartão</h1></div>

      <div style={{background:`linear-gradient(135deg,${C.navy} 0%,${C.blue} 100%)`,
        borderRadius:20, padding:"2rem", boxShadow:"0 16px 48px rgba(10,22,40,0.25)",
        position:"relative", overflow:"hidden", marginBottom:"1.5rem"}}>
        <svg style={{position:"absolute",top:0,right:0,opacity:0.08}} width="200" height="200" viewBox="0 0 200 200">
          <circle cx="160" cy="40" r="100" stroke="white" strokeWidth="1" fill="none"/>
          <circle cx="160" cy="40" r="60"  stroke="white" strokeWidth="1" fill="none"/>
        </svg>

        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:"1.8rem"}}>
          <Icon name="mosque" size={28} color="rgba(255,255,255,0.8)" sw={1.4}/>
          <div>
            <div style={{color:C.white, fontWeight:800, fontSize:"1.1rem"}}>C.I.M</div>
            <div style={{color:"rgba(255,255,255,0.5)", fontSize:"0.72rem"}}>Centro Islâmico</div>
          </div>
          <div style={{marginLeft:"auto", background:"rgba(255,255,255,0.1)", borderRadius:8, padding:"4px 10px"}}>
            <span style={{color:"rgba(255,255,255,0.7)", fontSize:"0.72rem", fontWeight:700}}>{cls?.year||"2025/2026"}</span>
          </div>
        </div>

        <div style={{marginBottom:"1.5rem"}}>
          <div style={{color:"rgba(255,255,255,0.45)", fontSize:"0.68rem", fontWeight:700,
            letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4}}>Nome</div>
          <div style={{color:C.white, fontSize:"1.5rem", fontWeight:700}}>{user.name}</div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.2rem"}}>
          {[
            {label:"Nº de Aluno",  value:<span style={{fontFamily:"'Courier New',monospace",fontWeight:800,fontSize:"1.1rem"}}>{user.code}</span>},
            {label:"Turma",        value:cls?.name||"—"},
            {label:"Professor",    value:teacher?.name||"—"},
            {label:"Acesso",       value:`${user.code} / ${user.name.split(" ")[0]}`},
          ].map(({label,value})=>(
            <div key={label}>
              <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.68rem",fontWeight:700,
                letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
              <div style={{color:C.white,fontWeight:600,fontSize:"0.9rem"}}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <p style={{...T.small, textAlign:"center"}}>
        O teu acesso é o número CIM e o teu primeiro nome.
      </p>
    </div>
  );
}

function StudentGrades({ user, data }) {
  const {classes} = data;
  const cls      = classes.find(c=>c.id===user.classId);
  const subjects = cls?.subjects||[];

  const gradeColor = v => v>=16?C.green : v>=12?C.blue : v>=10?C.amber : C.red;

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <h1 style={T.h1}>As Minhas Notas</h1>
        {cls && <p style={{...T.body, marginTop:4}}>{cls.name}</p>}
      </div>

      {subjects.map(subj => {
        const g  = user.grades?.[subj.id]||{};
        const t1=trimAvg(g,1), t2=trimAvg(g,2), t3=trimAvg(g,3);
        const mF = avg(t1,t2,t3);
        const canExam = mF!==null && mF>=12;

        return (
          <Card key={subj.id} style={{marginBottom:"1rem", overflow:"hidden", padding:0}}>
            <div style={{background:C.navy, padding:"0.75rem 1.2rem",
              display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{color:C.white, fontWeight:700}}>{subj.name}</span>
              <span style={{color:"rgba(255,255,255,0.5)", fontSize:"0.82rem"}}>Faltas: {g.faltas??0}</span>
            </div>

            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", borderBottom:`1px solid ${C.line}`}}>
              {[1,2,3].map(t => {
                const tAvg = [t1,t2,t3][t-1];
                return (
                  <div key={t} style={{padding:"1rem", borderRight:t<3?`1px solid ${C.line}`:undefined, textAlign:"center"}}>
                    <div style={{...T.label, marginBottom:8}}>T{t}</div>
                    <div style={{display:"flex", justifyContent:"center", gap:10, marginBottom:8}}>
                      {["1as","2as","at"].map(f=>(
                        <div key={f} style={{textAlign:"center"}}>
                          <div style={{...T.small, fontSize:"0.62rem", marginBottom:2}}>{f.toUpperCase()}</div>
                          <div style={{fontWeight:700, fontSize:"0.95rem",
                            color:g[`t${t}_${f}`]!=null?gradeColor(g[`t${t}_${f}`]):C.slateLight}}>
                            {g[`t${t}_${f}`]??<span style={{color:C.slateLight}}>—</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontWeight:700, fontSize:"1rem",
                      color:tAvg!=null?gradeColor(tAvg):C.slateLight}}>
                      {tAvg!=null?tAvg:"—"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{display:"grid", gridTemplateColumns:canExam?"1fr 1fr":"1fr"}}>
              <div style={{padding:"1rem", textAlign:"center",
                background:mF!==null&&mF>=12?C.greenPale:mF!==null?C.redPale:C.sand}}>
                <div style={{...T.label, marginBottom:4}}>Média Final</div>
                <div style={{fontSize:"2rem", fontWeight:800,
                  color:mF!=null?gradeColor(mF):C.slateLight}}>{mF!=null?mF:"—"}</div>
              </div>
              {canExam && (
                <div style={{padding:"1rem", textAlign:"center", background:C.purplePale}}>
                  <div style={{...T.label, marginBottom:4, color:C.purple}}>Exame Final</div>
                  <div style={{fontSize:"2rem", fontWeight:800,
                    color:g.exame_final!=null?gradeColor(g.exame_final):C.slateLight}}>
                    {g.exame_final!=null?g.exame_final:"—"}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
      {subjects.length===0 && <p style={T.body}>Nenhuma disciplina atribuída ainda.</p>}
    </div>
  );
}
