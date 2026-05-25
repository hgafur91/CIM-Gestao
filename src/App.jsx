import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPA_URL = "https://bhclzbohhskhmnzcsqux.supabase.co";
const SUPA_KEY = "sb_publishable_kqyWUbGN9sNapWyZtYTYDA_aMZuH4t_";
const H = { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" };

const supa = {
  async getAll(table) {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/${table}?select=*`, { headers: H });
      if (!r.ok) return [];
      const rows = await r.json();
      return Array.isArray(rows) ? rows.map(x => x.data) : [];
    } catch { return []; }
  },
  async upsertAll(table, items) {
    try {
      await fetch(`${SUPA_URL}/rest/v1/${table}?id=neq.___`, { method: "DELETE", headers: H });
      if (!items.length) return;
      await fetch(`${SUPA_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...H, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(items.map(item => ({ id: item.id, data: item })))
      });
    } catch (e) { console.error(e); }
  },
  async getConfig(key) {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/cim_config?key=eq.${key}&select=value`, { headers: H });
      const rows = await r.json();
      return rows?.[0]?.value || null;
    } catch { return null; }
  },
  async setConfig(key, value) {
    try {
      await fetch(`${SUPA_URL}/rest/v1/cim_config`, {
        method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ key, value })
      });
    } catch {}
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const avg = (...vals) => {
  const nums = vals.filter(v => v !== null && v !== undefined && v !== "");
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + Number(b), 0) / nums.length) * 10) / 10;
};
const trimAvg = (g, t) => avg(g[`t${t}_1as`], g[`t${t}_2as`], g[`t${t}_at`]);
const madTrimAvg = (g, t) => avg(g[`t${t}_tajwid`], g[`t${t}_hifz`], g[`t${t}_recitacao`]);
const finalAvg = (g, isMad) => {
  const fn = isMad ? madTrimAvg : trimAvg;
  return avg(fn(g,1), fn(g,2), fn(g,3));
};
const nextCode = (items, prefix) => {
  const nums = items.map(x => parseInt(x.code?.replace(prefix,"") || "0")).filter(n => !isNaN(n));
  return `${prefix}${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4,"0")}`;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta"];
const MADRASSA_LEVELS = ["1ª Parte","2ª Parte","Juz Amma","Qur'an"];

// ── Design ────────────────────────────────────────────────────────────────────
const C = {
  navy:"#0A1628", blue:"#1251A3", blueMid:"#1A6FD4", blueLight:"#3B8FE8",
  bluePale:"#EAF2FC", blueFaint:"#F4F8FE", white:"#FFFFFF",
  slate:"#5A6A7E", slateLight:"#8898AA", line:"#DDE4EE", sand:"#F7F9FC",
  green:"#1A7A4A", greenPale:"#EAF7F0", red:"#B91C1C", redPale:"#FEF2F2",
  amber:"#B45309", amberPale:"#FFFBEB", purple:"#6B21A8", purplePale:"#F5F3FF",
  teal:"#0E7490", tealPale:"#ECFEFF",
};

const ICONS = {
  dashboard:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  users:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  student:<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
  report:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  upload:<><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  check:<><polyline points="20 6 9 17 4 12"/></>,
  clock:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  logout:<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  plus:<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  back:<><polyline points="15 18 9 12 15 6"/></>,
  eye:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  trash:<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
  alert:<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  mosque:<><path d="M12 2C8 2 6 5 6 8c0 2 1 3 2 4H4v10h16V12h-4c1-1 2-2 2-4 0-3-2-6-6-6z"/><path d="M9 22v-4a3 3 0 0 1 6 0v4"/><path d="M2 12h2M20 12h2"/></>,
  search:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  key:<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
  edit:<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  transfer:<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
  classes:<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></>,
  grades:<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  card:<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
  book:<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
  medal:<><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
  download:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  school:<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  globe:<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
};

const Icon = ({ name, size=20, color="currentColor", sw=1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name]}
  </svg>
);

const T = {
  h1:{ fontSize:"1.75rem", fontWeight:700, color:C.navy, letterSpacing:"-0.02em", margin:0 },
  h2:{ fontSize:"1.25rem", fontWeight:700, color:C.navy, letterSpacing:"-0.01em", margin:0 },
  h3:{ fontSize:"1rem", fontWeight:600, color:C.navy, margin:0 },
  body:{ fontSize:"0.9rem", color:C.slate, lineHeight:1.6 },
  small:{ fontSize:"0.78rem", color:C.slateLight },
  label:{ fontSize:"0.72rem", fontWeight:700, color:C.slateLight, letterSpacing:"0.08em", textTransform:"uppercase" },
  mono:{ fontFamily:"'Courier New',monospace", fontSize:"0.82rem", color:C.blue, background:C.bluePale, padding:"2px 6px", borderRadius:4 },
};

const inp = { width:"100%", border:`1.5px solid ${C.line}`, borderRadius:8, padding:"0.6rem 0.9rem", fontSize:"0.9rem", color:C.navy, background:C.white, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

const Btn = ({ children, onClick, variant="primary", size="md", icon, disabled, full }) => {
  const V = { primary:{background:C.blue,color:C.white,border:"none"}, secondary:{background:C.bluePale,color:C.blue,border:"none"}, ghost:{background:"transparent",color:C.slate,border:`1.5px solid ${C.line}`}, danger:{background:C.redPale,color:C.red,border:"none"}, success:{background:C.greenPale,color:C.green,border:"none"}, purple:{background:C.purplePale,color:C.purple,border:"none"}, teal:{background:C.tealPale,color:C.teal,border:"none"} };
  const S = { sm:{padding:"0.35rem 0.85rem",fontSize:"0.8rem",borderRadius:7}, md:{padding:"0.55rem 1.2rem",fontSize:"0.875rem",borderRadius:8}, lg:{padding:"0.75rem 1.6rem",fontSize:"0.95rem",borderRadius:10} };
  return <button onClick={onClick} disabled={disabled} style={{...V[variant],...S[size],display:"inline-flex",alignItems:"center",gap:7,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,fontFamily:"inherit",width:full?"100%":"auto",justifyContent:"center"}}>{icon&&<Icon name={icon} size={size==="sm"?14:16} color="currentColor"/>}{children}</button>;
};

const Badge = ({ children, color="blue" }) => {
  const M = { blue:[C.bluePale,C.blue], green:[C.greenPale,C.green], amber:[C.amberPale,C.amber], red:[C.redPale,C.red], slate:[C.sand,C.slate], purple:[C.purplePale,C.purple], teal:[C.tealPale,C.teal] };
  const [bg,fg] = M[color]||M.blue;
  return <span style={{background:bg,color:fg,borderRadius:20,padding:"0.2rem 0.7rem",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em"}}>{children}</span>;
};

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{background:C.white,borderRadius:14,border:`1px solid ${C.line}`,boxShadow:"0 1px 4px rgba(10,22,40,0.06)",padding:"1.5rem",cursor:onClick?"pointer":"default",...style}}>{children}</div>
);

const Divider = () => <div style={{height:1,background:C.line,margin:"1rem 0"}}/>;
const Msg = ({ text, type }) => text ? <div style={{fontSize:"0.83rem",color:type==="error"?C.red:C.green,marginTop:"0.6rem"}}>{text}</div> : null;

const GradeInput = ({ value, onChange }) => (
  <input type="number" min="0" max="20" step="0.5" style={{...inp,width:52,padding:"0.3rem 0.4rem",textAlign:"center",fontSize:"0.85rem"}} value={value??""} onChange={e=>onChange(e.target.value===""?null:Number(e.target.value))}/>
);

const GradeCell = ({ val }) => {
  if (val===null||val===undefined||val==="") return <span style={{color:C.slateLight}}>—</span>;
  const color = val>=16?C.green:val>=12?C.blue:val>=10?C.amber:C.red;
  return <span style={{fontWeight:700,color}}>{val}</span>;
};

const thS = { padding:"0.45rem 0.4rem",fontSize:"0.7rem",fontWeight:700,color:C.slateLight,textTransform:"uppercase",letterSpacing:"0.05em",textAlign:"center",background:C.blueFaint,borderBottom:`2px solid ${C.line}`,whiteSpace:"nowrap" };

const ProfileHeader = ({ title, subtitle, fields, accentColor, badge, onEdit }) => (
  <div style={{background:`linear-gradient(135deg,${C.navy} 0%,${accentColor||C.blue} 100%)`,borderRadius:20,padding:"2rem",marginBottom:"1.5rem",boxShadow:"0 16px 48px rgba(10,22,40,0.2)",position:"relative",overflow:"hidden"}}>
    <svg style={{position:"absolute",top:0,right:0,opacity:0.08}} width="200" height="200" viewBox="0 0 200 200">
      <circle cx="160" cy="40" r="100" stroke="white" strokeWidth="1" fill="none"/>
      <circle cx="160" cy="40" r="60" stroke="white" strokeWidth="1" fill="none"/>
    </svg>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"1.5rem",flexWrap:"wrap",gap:"1rem"}}>
      <div>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{title}</div>
        <div style={{color:C.white,fontSize:"1.6rem",fontWeight:800}}>{subtitle}</div>
      </div>
      {badge&&<div style={{background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"0.6rem 1rem",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)"}}>{badge}</div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"1rem"}}>
      {fields.map(([label,value])=>(
        <div key={label}>
          <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{label}</div>
          <div style={{color:C.white,fontSize:"0.88rem",fontWeight:500}}>{value||"—"}</div>
        </div>
      ))}
    </div>
    {onEdit&&<div style={{marginTop:"1rem"}}><button onClick={onEdit} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:C.white,borderRadius:8,padding:"0.4rem 0.9rem",cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Editar Informação</button></div>}
  </div>
);

const ScheduleTable = ({ slots }) => {
  const times = [...new Set(slots.map(s=>`${s.start}-${s.end}`))].sort();
  if (!times.length) return <p style={T.body}>Sem horário definido ainda.</p>;
  return (
    <Card style={{padding:0,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:C.navy}}>
            <th style={{...thS,color:C.white,background:C.navy,textAlign:"left",paddingLeft:12,width:110}}>Hora</th>
            {DAYS.map(d=><th key={d} style={{...thS,color:C.white,background:C.navy}}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {times.map((time,i)=>{
            const [start,end]=time.split("-");
            return (
              <tr key={time} style={{background:i%2===0?C.white:C.blueFaint}}>
                <td style={{padding:"0.6rem 0.75rem",fontFamily:"'Courier New',monospace",fontSize:"0.8rem",fontWeight:700,color:C.navy,whiteSpace:"nowrap"}}>{start}–{end}</td>
                {DAYS.map(day=>{
                  const slot=slots.find(s=>s.day===day&&s.start===start&&s.end===end);
                  const color=slot?.classType==="madrassa"?C.green:C.blue;
                  return (
                    <td key={day} style={{padding:"0.5rem",textAlign:"center",borderLeft:`1px solid ${C.line}`}}>
                      {slot?<div style={{background:color+"18",borderRadius:6,padding:"4px 6px"}}>
                        <div style={{fontWeight:600,fontSize:"0.78rem",color}}>{slot.className}</div>
                        {slot.subjectName&&<div style={{fontSize:"0.68rem",color:C.slate}}>{slot.subjectName}</div>}
                      </div>:<span style={{color:C.line}}>—</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,     setUser]     = useState(null);
  const [schools,  setSchools]  = useState([]);
  const [admins,   setAdmins]   = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [students, setStudents] = useState([]);
  const [reports,  setReports]  = useState([]);
  const [levels,   setLevels]   = useState([]);
  const [apiKey,   setApiKey]   = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sc,ad,t,c,s,r,l,k] = await Promise.all([
          supa.getAll("cim_schools"), supa.getAll("cim_admins"),
          supa.getAll("cim_teachers"), supa.getAll("cim_classes"),
          supa.getAll("cim_students"), supa.getAll("cim_reports"),
          supa.getAll("cim_levels"), supa.getConfig("apikey"),
        ]);
        setSchools(sc); setAdmins(ad); setTeachers(t); setClasses(c);
        setStudents(s); setReports(r); setLevels(l); setApiKey(k||"");
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const save = {
    schools:  useCallback(async v => { setSchools(v);  await supa.upsertAll("cim_schools",  v); }, []),
    admins:   useCallback(async v => { setAdmins(v);   await supa.upsertAll("cim_admins",   v); }, []),
    teachers: useCallback(async v => { setTeachers(v); await supa.upsertAll("cim_teachers", v); }, []),
    classes:  useCallback(async v => { setClasses(v);  await supa.upsertAll("cim_classes",  v); }, []),
    students: useCallback(async v => { setStudents(v); await supa.upsertAll("cim_students", v); }, []),
    reports:  useCallback(async v => { setReports(v);  await supa.upsertAll("cim_reports",  v); }, []),
    levels:   useCallback(async v => { setLevels(v);   await supa.upsertAll("cim_levels",   v); }, []),
    apiKey:   useCallback(async v => { setApiKey(v);   await supa.setConfig("apikey", v); }, []),
  };

  const login = useCallback((id, pw) => {
    // Super coordinator
    if (id==="coord" && pw==="admin123") { setUser({id:"coord",name:"Coordenador Geral",role:"supercoord"}); return true; }
    // School coordinator
    const ad = admins.find(a=>a.id===id&&a.password===pw);
    if (ad) { setUser({...ad,role:"schoolcoord"}); return true; }
    // Teacher
    const t = teachers.find(t=>t.id===id&&t.password===pw);
    if (t) { setUser({...t,role:"teacher"}); return true; }
    // Student
    const s = students.find(s=>s.code===id&&s.name.split(" ")[0].toLowerCase()===pw.toLowerCase());
    if (s) { setUser({...s,role:"student"}); return true; }
    return false;
  }, [admins, teachers, students]);

  const data = useMemo(() => ({ schools, admins, teachers, classes, students, reports, levels, apiKey }), [schools,admins,teachers,classes,students,reports,levels,apiKey]);

  if (loading&&!user) return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navy} 0%,#112244 100%)`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1.5rem",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{width:72,height:72,background:"rgba(255,255,255,0.1)",borderRadius:20,display:"inline-flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.15)"}}><Icon name="mosque" size={36} color={C.white} sw={1.4}/></div>
      <div style={{color:C.white,fontWeight:700,fontSize:"1.5rem"}}>C.I.M</div>
      <div style={{color:"rgba(255,255,255,0.5)",fontSize:"0.88rem"}}>A carregar...</div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={login}/>;
  if (user.role==="supercoord") return <SuperCoordShell user={user} data={data} save={save} onLogout={()=>setUser(null)}/>;
  if (user.role==="schoolcoord") return <SchoolCoordShell user={user} data={data} save={save} onLogout={()=>setUser(null)}/>;
  if (user.role==="teacher") return <TeacherShell user={user} data={data} save={save} onLogout={()=>setUser(null)}/>;
  if (user.role==="student") return <StudentShell user={user} data={data} onLogout={()=>setUser(null)}/>;
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const idRef = useRef(); const pwRef = useRef();
  const [err, setErr] = useState("");
  function submit() { if (!onLogin(idRef.current.value.trim(), pwRef.current.value)) setErr("Credenciais inválidas."); }
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navy} 0%,#112244 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div style={{width:72,height:72,background:"rgba(255,255,255,0.1)",borderRadius:20,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem",border:"1px solid rgba(255,255,255,0.15)"}}><Icon name="mosque" size={36} color={C.white} sw={1.4}/></div>
          <h1 style={{...T.h1,color:C.white,fontSize:"2rem",marginBottom:"0.4rem"}}>C.I.M</h1>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.88rem"}}>Sistema de Gestão Escolar</p>
        </div>
        <div style={{background:C.white,borderRadius:18,padding:"2rem",boxShadow:"0 24px 64px rgba(0,0,0,0.3)"}}>
          <p style={{...T.body,marginBottom:"1.5rem",fontWeight:500}}>Iniciar sessão</p>
          <div style={{marginBottom:"1rem"}}><div style={{...T.label,marginBottom:5}}>Identificador</div><input ref={idRef} style={inp} placeholder="coord · admin · prof · CIM0001" defaultValue="" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          <div style={{marginBottom:"1.5rem"}}><div style={{...T.label,marginBottom:5}}>Palavra-passe</div><input ref={pwRef} style={inp} type="password" placeholder="••••••••" defaultValue="" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          {err&&<div style={{color:C.red,fontSize:"0.84rem",marginBottom:"1rem",background:C.redPale,borderRadius:8,padding:"0.6rem 0.9rem",display:"flex",alignItems:"center",gap:8}}><Icon name="alert" size={16} color={C.red}/>{err}</div>}
          <Btn full size="lg" onClick={submit}>Entrar</Btn>
          <div style={{marginTop:"1.2rem",padding:"0.8rem",background:C.sand,borderRadius:8,border:`1px solid ${C.line}`}}>
            <div style={{...T.small,lineHeight:1.8}}><b>Coord. Geral:</b> coord / admin123<br/><b>Coord. Escola:</b> ID / senha<br/><b>Professor:</b> ID / senha<br/><b>Aluno:</b> nº CIM / primeiro nome</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function Shell({ user, nav, children, onLogout, subtitle }) {
  const [tab,setTab]=useState(nav[0].id);
  const [detail,setDetail]=useState(null);
  const roleColor = user.role==="supercoord"?C.teal:user.role==="schoolcoord"?C.blue:user.role==="teacher"?C.green:C.purple;
  const roleLabel = user.role==="supercoord"?"Coord. Geral":user.role==="schoolcoord"?"Coord. Escola":user.role==="teacher"?"Professor":"Aluno";
  return (
    <div style={{minHeight:"100vh",background:C.sand,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <header style={{background:C.navy,padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Icon name="mosque" size={22} color={C.blueLight}/>
          <span style={{color:C.white,fontWeight:700,fontSize:"1rem"}}>C.I.M</span>
          <span style={{color:"rgba(255,255,255,0.25)",margin:"0 4px"}}>|</span>
          <span style={{background:roleColor+"33",color:roleColor,borderRadius:6,padding:"2px 10px",fontSize:"0.78rem",fontWeight:700}}>{roleLabel}</span>
          <span style={{color:"rgba(255,255,255,0.55)",fontSize:"0.82rem"}}>{user.name}</span>
          {subtitle&&<span style={{color:"rgba(255,255,255,0.35)",fontSize:"0.78rem"}}>· {subtitle}</span>}
        </div>
        <button onClick={onLogout} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,color:"rgba(255,255,255,0.5)",fontSize:"0.82rem"}}><Icon name="logout" size={16} color="rgba(255,255,255,0.5)"/> Sair</button>
      </header>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <aside style={{width:220,background:C.white,borderRight:`1px solid ${C.line}`,padding:"1.5rem 0.75rem",flexShrink:0,overflowY:"auto"}}>
          {nav.map(n=>{
            const active=tab===n.id;
            return <button key={n.id} onClick={()=>{setTab(n.id);setDetail(null);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"0.65rem 0.9rem",borderRadius:9,border:"none",cursor:"pointer",background:active?C.bluePale:"transparent",color:active?C.blue:C.slate,fontWeight:active?600:400,fontSize:"0.875rem",marginBottom:2,fontFamily:"inherit"}}>
              <Icon name={n.icon} size={18} color={active?C.blue:C.slateLight}/>{n.label}
              {n.badge>0&&<span style={{marginLeft:"auto",background:C.amber,color:C.white,borderRadius:20,padding:"1px 7px",fontSize:"0.7rem",fontWeight:700}}>{n.badge}</span>}
            </button>;
          })}
        </aside>
        <main style={{flex:1,padding:"2rem",overflowY:"auto"}}>
          {children({tab,detail,setDetail,setTab})}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPER COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════════
function SuperCoordShell({ user, data, save, onLogout }) {
  const pending = data.reports.filter(r=>!r.approved).length;
  const nav = [
    {id:"overview", label:"Visão Geral",    icon:"dashboard"},
    {id:"schools",  label:"Escolas",        icon:"school"},
    {id:"admins",   label:"Coordenadores",  icon:"users"},
    {id:"levels",   label:"Níveis",         icon:"medal"},
    {id:"reports",  label:"Relatórios",     icon:"report", badge:pending},
    {id:"settings", label:"Definições",     icon:"key"},
  ];
  return (
    <Shell user={user} nav={nav} onLogout={onLogout}>
      {({tab,detail,setDetail})=><>
        {detail?.type==="school"  && <SchoolDetail school={detail.data} data={data} save={save} onBack={()=>setDetail(null)}/>}
        {detail?.type==="report"  && <ReportDetail report={detail.data} data={data} onSave={save.reports} onBack={()=>setDetail(null)}/>}
        {!detail&&tab==="overview" && <SuperOverview data={data} onSelectSchool={s=>setDetail({type:"school",data:s})} onSelectReport={r=>setDetail({type:"report",data:r})}/>}
        {!detail&&tab==="schools"  && <SchoolManager data={data} onSave={save.schools} onSelect={s=>setDetail({type:"school",data:s})}/>}
        {!detail&&tab==="admins"   && <AdminManager data={data} onSave={save.admins}/>}
        {!detail&&tab==="levels"   && <LevelManager data={data} onSave={save.levels}/>}
        {!detail&&tab==="reports"  && <ReportList data={data} onSave={save.reports} onSelect={r=>setDetail({type:"report",data:r})}/>}
        {!detail&&tab==="settings" && <Settings apiKey={data.apiKey} onSave={save.apiKey}/>}
      </>}
    </Shell>
  );
}

function SuperOverview({ data, onSelectSchool, onSelectReport }) {
  const {schools,admins,teachers,students,reports}=data;
  const pending=reports.filter(r=>!r.approved);
  const stats=[
    {label:"Escolas",     value:schools.length,   icon:"school",  color:C.teal},
    {label:"Coordenadores",value:admins.length,   icon:"users",   color:C.blue},
    {label:"Professores", value:teachers.length,  icon:"users",   color:C.blueMid},
    {label:"Alunos",      value:students.length,  icon:"student", color:C.green},
    {label:"Pendentes",   value:pending.length,   icon:"clock",   color:C.amber},
  ];
  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Visão Geral</h1><p style={{...T.body,marginTop:4}}>Painel do Coordenador Geral</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"1rem",marginBottom:"2rem"}}>
        {stats.map(s=>(
          <Card key={s.label} style={{padding:"1.2rem"}}>
            <div style={{width:40,height:40,borderRadius:10,background:s.color+"18",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"0.8rem"}}><Icon name={s.icon} size={20} color={s.color}/></div>
            <div style={{fontSize:"2rem",fontWeight:800,color:C.navy,lineHeight:1}}>{s.value}</div>
            <div style={{...T.small,marginTop:4}}>{s.label}</div>
          </Card>
        ))}
      </div>
      <h2 style={{...T.h2,marginBottom:"1rem"}}>Escolas</h2>
      <div style={{display:"grid",gap:"0.75rem",marginBottom:"2rem"}}>
        {schools.map(sc=>{
          const scTeachers=teachers.filter(t=>t.schoolId===sc.id);
          const scStudents=students.filter(s=>s.schoolId===sc.id);
          const scAdmin=admins.find(a=>a.schoolId===sc.id);
          return (
            <Card key={sc.id} style={{padding:"1rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}} onClick={()=>onSelectSchool(sc)}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:42,height:42,background:C.tealPale,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="school" size={20} color={C.teal}/></div>
                <div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={T.h3}>{sc.name}</span><span style={T.mono}>{sc.code}</span></div>
                  <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}><span style={T.small}>{scTeachers.length} prof. · {scStudents.length} alunos</span>{scAdmin&&<span style={T.small}>· {scAdmin.name}</span>}</div>
                </div>
              </div>
              <Icon name="eye" size={16} color={C.slateLight}/>
            </Card>
          );
        })}
        {schools.length===0&&<p style={T.body}>Nenhuma escola criada ainda.</p>}
      </div>
      {pending.length>0&&<>
        <h2 style={{...T.h2,marginBottom:"1rem"}}>Relatórios Pendentes</h2>
        <div style={{display:"grid",gap:"0.75rem"}}>
          {pending.slice(0,5).map(r=>{
            const t=teachers.find(t=>t.id===r.teacherId);
            const sc=schools.find(s=>s.id===r.schoolId);
            return <Card key={r.id} style={{padding:"1rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}} onClick={()=>onSelectReport(r)}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,background:C.amberPale,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="report" size={18} color={C.amber}/></div>
                <div><div style={T.h3}>{t?.name||r.teacherId} {sc&&<span style={{...T.small,marginLeft:4}}>· {sc.name}</span>}</div><div style={T.small}>{r.data?.semanas} · {r.data?.periodo}</div></div>
              </div>
              <Badge color="amber">Pendente</Badge>
            </Card>;
          })}
        </div>
      </>}
    </div>
  );
}

// ── School Manager ────────────────────────────────────────────────────────────
function SchoolManager({ data, onSave, onSelect }) {
  const {schools,teachers,students,admins}=data;
  const [name,setName]=useState("");
  const [location,setLocation]=useState("");
  const [msg,setMsg]=useState({text:"",type:""});

  function add(){
    if(!name.trim()){setMsg({text:"Escreve o nome.",type:"error"});return;}
    const code=nextCode(schools,"ESC");
    onSave([...schools,{id:`sch_${Date.now()}`,code,name:name.trim(),location:location.trim(),createdAt:new Date().toISOString()}]);
    setName("");setLocation("");setMsg({text:`Escola "${name}" criada — ${code}`,type:"success"});
  }

  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Escolas</h1></div>
      <Card style={{marginBottom:"1.5rem"}}>
        <h2 style={{...T.h2,fontSize:"1rem",marginBottom:"1.2rem"}}>Nova Escola</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
          <div><div style={{...T.label,marginBottom:5}}>Nome da Escola</div><input style={inp} value={name} placeholder="Ex: Madrassa Al-Nour" onChange={e=>setName(e.target.value)}/></div>
          <div><div style={{...T.label,marginBottom:5}}>Localização</div><input style={inp} value={location} placeholder="Ex: Maputo" onChange={e=>setLocation(e.target.value)}/></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}><Btn icon="plus" onClick={add}>Criar Escola</Btn><Msg {...msg}/></div>
      </Card>
      <div style={{display:"grid",gap:"0.75rem"}}>
        {schools.map(sc=>{
          const scT=teachers.filter(t=>t.schoolId===sc.id).length;
          const scS=students.filter(s=>s.schoolId===sc.id).length;
          const scAdmin=admins.find(a=>a.schoolId===sc.id);
          return (
            <Card key={sc.id} style={{padding:"1rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",flex:1}} onClick={()=>onSelect(sc)}>
                <div style={{width:44,height:44,background:C.tealPale,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="school" size={20} color={C.teal}/></div>
                <div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={T.h3}>{sc.name}</span><span style={T.mono}>{sc.code}</span></div>
                  <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                    {sc.location&&<span style={T.small}>{sc.location}</span>}
                    <span style={T.small}>· {scT} prof. · {scS} alunos</span>
                    {scAdmin&&<span style={T.small}>· Coord: {scAdmin.name}</span>}
                  </div>
                </div>
              </div>
              <Btn variant="danger" size="sm" icon="trash" onClick={()=>{if(window.confirm("Remover escola?"))onSave(schools.filter(x=>x.id!==sc.id));}}>Remover</Btn>
            </Card>
          );
        })}
        {schools.length===0&&<div style={{textAlign:"center",padding:"3rem",color:C.slateLight}}><Icon name="school" size={40} color={C.line}/><p style={{marginTop:"1rem"}}>Nenhuma escola ainda</p></div>}
      </div>
    </div>
  );
}

// ── School Detail (super coord view of one school) ────────────────────────────
function SchoolDetail({ school, data, save, onBack }) {
  const {teachers,students,classes,reports}=data;
  const scTeachers=teachers.filter(t=>t.schoolId===school.id);
  const scStudents=students.filter(s=>s.schoolId===school.id);
  const scReports=reports.filter(r=>r.schoolId===school.id);
  return (
    <div>
      <Btn variant="secondary" icon="back" size="sm" onClick={onBack}>Voltar</Btn>
      <ProfileHeader title="Escola" subtitle={school.name} accentColor={C.teal}
        badge={<div><div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase"}}>Código</div><div style={{color:C.white,fontWeight:800,fontSize:"1.1rem",fontFamily:"'Courier New',monospace"}}>{school.code}</div></div>}
        fields={[["Localização",school.location],["Professores",scTeachers.length],["Alunos",scStudents.length],["Relatórios",scReports.length]]}
      />
      <h2 style={{...T.h2,marginBottom:"1rem"}}>Professores</h2>
      <div style={{display:"grid",gap:"0.6rem",marginBottom:"2rem"}}>
        {scTeachers.map(t=>(
          <Card key={t.id} style={{padding:"0.9rem 1.2rem",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,background:C.bluePale,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="users" size={16} color={C.blue}/></div>
            <div><div style={T.h3}>{t.name}</div><div style={{display:"flex",gap:8,marginTop:2}}><span style={T.mono}>{t.id}</span></div></div>
          </Card>
        ))}
        {scTeachers.length===0&&<p style={T.body}>Sem professores.</p>}
      </div>
      <h2 style={{...T.h2,marginBottom:"1rem"}}>Alunos</h2>
      <div style={{display:"grid",gap:"0.6rem"}}>
        {scStudents.map(s=>{
          const cls=classes.find(c=>c.id===s.classId);
          return (
            <Card key={s.id} style={{padding:"0.9rem 1.2rem",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,background:C.greenPale,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="student" size={16} color={C.green}/></div>
              <div><div style={T.h3}>{s.name}</div><div style={{display:"flex",gap:8,marginTop:2}}><span style={T.mono}>{s.code}</span>{cls&&<span style={T.small}>· {cls.name}</span>}</div></div>
            </Card>
          );
        })}
        {scStudents.length===0&&<p style={T.body}>Sem alunos.</p>}
      </div>
    </div>
  );
}

// ── Admin Manager ─────────────────────────────────────────────────────────────
function AdminManager({ data, onSave }) {
  const {admins,schools}=data;
  const [name,setName]=useState(""); const [pw,setPw]=useState(""); const [schoolId,setSchoolId]=useState("");
  const [msg,setMsg]=useState({text:"",type:""});

  function add(){
    if(!name.trim()||!pw.trim()||!schoolId){setMsg({text:"Preenche todos os campos.",type:"error"});return;}
    const id="adm"+String(admins.length+1).padStart(2,"0");
    onSave([...admins,{id,name:name.trim(),password:pw.trim(),schoolId,createdAt:new Date().toISOString()}]);
    setName("");setPw("");setSchoolId("");setMsg({text:`Criado! Acesso: ${id} / ${pw}`,type:"success"});
  }

  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Coordenadores de Escola</h1></div>
      <Card style={{marginBottom:"1.5rem"}}>
        <h2 style={{...T.h2,fontSize:"1rem",marginBottom:"1.2rem"}}>Novo Coordenador</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"1rem",marginBottom:"1rem"}}>
          <div><div style={{...T.label,marginBottom:5}}>Nome</div><input style={inp} value={name} placeholder="Nome completo" onChange={e=>setName(e.target.value)}/></div>
          <div><div style={{...T.label,marginBottom:5}}>Palavra-passe</div><input style={inp} value={pw} placeholder="Senha" onChange={e=>setPw(e.target.value)}/></div>
          <div><div style={{...T.label,marginBottom:5}}>Escola</div>
            <select style={{...inp}} value={schoolId} onChange={e=>setSchoolId(e.target.value)}>
              <option value="">Selecionar...</option>
              {schools.map(s=><option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}><Btn icon="plus" onClick={add}>Criar Coordenador</Btn><Msg {...msg}/></div>
      </Card>
      <div style={{display:"grid",gap:"0.6rem"}}>
        {admins.map(a=>{
          const sc=schools.find(s=>s.id===a.schoolId);
          return (
            <Card key={a.id} style={{padding:"0.9rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,background:C.bluePale,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="users" size={18} color={C.blue}/></div>
                <div><div style={T.h3}>{a.name}</div><div style={{display:"flex",gap:8,marginTop:3}}><span style={T.mono}>{a.id}</span>{sc&&<span style={T.small}>· {sc.name}</span>}<span style={T.small}>· senha: {a.password}</span></div></div>
              </div>
              <Btn variant="danger" size="sm" icon="trash" onClick={()=>{if(window.confirm("Remover?"))onSave(admins.filter(x=>x.id!==a.id));}}>Remover</Btn>
            </Card>
          );
        })}
        {admins.length===0&&<p style={T.body}>Nenhum coordenador ainda.</p>}
      </div>
    </div>
  );
}

// ── Level Manager ─────────────────────────────────────────────────────────────
function LevelManager({ data, onSave }) {
  const {levels}=data;
  const [form,setForm]=useState({name:"",color:"#1251A3",patente:""});
  const [msg,setMsg]=useState({text:"",type:""});
  function add(){
    if(!form.name.trim()||!form.patente.trim()){setMsg({text:"Preenche nome e patente.",type:"error"});return;}
    onSave([...levels,{id:`lvl_${Date.now()}`,...form}]);
    setForm({name:"",color:"#1251A3",patente:""});setMsg({text:"Nível criado.",type:"success"});
  }
  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Níveis de Professor</h1></div>
      <Card style={{marginBottom:"1.5rem"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px",gap:"1rem",marginBottom:"1rem"}}>
          <div><div style={{...T.label,marginBottom:5}}>Nome</div><input style={inp} value={form.name} placeholder="Ex: Sénior" onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><div style={{...T.label,marginBottom:5}}>Patente</div><input style={inp} value={form.patente} placeholder="Ex: Professor Certificado" onChange={e=>setForm({...form,patente:e.target.value})}/></div>
          <div><div style={{...T.label,marginBottom:5}}>Cor</div><input type="color" style={{...inp,padding:"0.2rem",height:42,cursor:"pointer"}} value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}><Btn icon="plus" onClick={add}>Criar</Btn><Msg {...msg}/></div>
      </Card>
      <div style={{display:"grid",gap:"0.6rem"}}>
        {levels.map(l=>(
          <Card key={l.id} style={{padding:"0.9rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:l.color+"22",border:`2px solid ${l.color}`,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:16,height:16,borderRadius:"50%",background:l.color}}/></div>
              <div><div style={{fontWeight:700,color:C.navy}}>{l.name}</div><div style={T.small}>{l.patente}</div></div>
            </div>
            <button onClick={()=>onSave(levels.filter(x=>x.id!==l.id))} style={{background:"none",border:"none",cursor:"pointer",padding:6}}><Icon name="trash" size={15} color={C.slateLight}/></button>
          </Card>
        ))}
        {levels.length===0&&<p style={T.body}>Nenhum nível ainda.</p>}
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function Settings({ apiKey, onSave }) {
  const [key,setKey]=useState(apiKey); const [saved,setSaved]=useState(false);
  function save(){onSave(key.trim());setSaved(true);setTimeout(()=>setSaved(false),2000);}
  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Definições</h1></div>
      <Card style={{maxWidth:520}}>
        <h2 style={{...T.h2,fontSize:"1rem",marginBottom:"0.5rem"}}>Chave API Anthropic</h2>
        <p style={{...T.body,marginBottom:"1rem"}}>Necessária para análise de scans. Obtém em <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:C.blue}}>console.anthropic.com</a></p>
        <div style={{marginBottom:"1rem"}}><div style={{...T.label,marginBottom:5}}>Chave API</div><input style={inp} type="password" value={key} placeholder="sk-ant-..." onChange={e=>setKey(e.target.value)}/></div>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}><Btn icon="check" onClick={save}>Guardar</Btn>{saved&&<span style={{color:C.green,fontSize:"0.85rem"}}>Guardado!</span>}</div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHOOL COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════════
function SchoolCoordShell({ user, data, save, onLogout }) {
  const school = data.schools.find(s=>s.id===user.schoolId);
  const schoolData = useMemo(() => ({
    ...data,
    teachers: data.teachers.filter(t=>t.schoolId===user.schoolId),
    classes:  data.classes.filter(c=>c.schoolId===user.schoolId),
    students: data.students.filter(s=>s.schoolId===user.schoolId),
    reports:  data.reports.filter(r=>r.schoolId===user.schoolId),
  }), [data, user.schoolId]);

  const pending = schoolData.reports.filter(r=>!r.approved).length;
  const nav = [
    {id:"overview", label:"Visão Geral",  icon:"dashboard"},
    {id:"teachers", label:"Professores",  icon:"users"},
    {id:"classes",  label:"Turmas",       icon:"classes"},
    {id:"students", label:"Alunos",       icon:"student"},
    {id:"grades",   label:"Notas",        icon:"grades"},
    {id:"reports",  label:"Relatórios",   icon:"report", badge:pending},
    {id:"settings", label:"Definições",   icon:"key"},
  ];

  const schoolSave = {
    teachers: useCallback(async v => { const all=[...data.teachers.filter(t=>t.schoolId!==user.schoolId),...v]; save.teachers(all); }, [data.teachers, save.teachers, user.schoolId]),
    classes:  useCallback(async v => { const all=[...data.classes.filter(c=>c.schoolId!==user.schoolId),...v];  save.classes(all);  }, [data.classes,  save.classes,  user.schoolId]),
    students: useCallback(async v => { const all=[...data.students.filter(s=>s.schoolId!==user.schoolId),...v]; save.students(all); }, [data.students, save.students, user.schoolId]),
    reports:  useCallback(async v => { const all=[...data.reports.filter(r=>r.schoolId!==user.schoolId),...v];  save.reports(all);  }, [data.reports,  save.reports,  user.schoolId]),
  };

  return (
    <Shell user={user} nav={nav} onLogout={onLogout} subtitle={school?.name}>
      {({tab,detail,setDetail})=><>
        {detail?.type==="teacher" && <TeacherCard teacher={detail.data} data={schoolData} onBack={()=>setDetail(null)}/>}
        {detail?.type==="student" && <StudentCard student={detail.data} data={schoolData} onSaveStudents={schoolSave.students} onBack={()=>setDetail(null)}/>}
        {detail?.type==="report"  && <ReportDetail report={detail.data} data={schoolData} onSave={schoolSave.reports} onBack={()=>setDetail(null)}/>}
        {!detail&&tab==="overview" && <SchoolCoordOverview data={schoolData} school={school} onSelectReport={r=>setDetail({type:"report",data:r})}/>}
        {!detail&&tab==="teachers" && <TeacherManager data={schoolData} schoolId={user.schoolId} onSave={schoolSave.teachers} onSelect={t=>setDetail({type:"teacher",data:t})}/>}
        {!detail&&tab==="classes"  && <ClassManager data={schoolData} schoolId={user.schoolId} onSaveClasses={schoolSave.classes}/>}
        {!detail&&tab==="students" && <CoordStudents data={schoolData} onSave={schoolSave.students} onSelect={s=>setDetail({type:"student",data:s})}/>}
        {!detail&&tab==="grades"   && <GradeManager data={schoolData} onSave={schoolSave.students}/>}
        {!detail&&tab==="reports"  && <ReportList data={schoolData} onSave={schoolSave.reports} onSelect={r=>setDetail({type:"report",data:r})}/>}
        {!detail&&tab==="settings" && <Settings apiKey={data.apiKey} onSave={save.apiKey}/>}
      </>}
    </Shell>
  );
}

function SchoolCoordOverview({ data, school, onSelectReport }) {
  const {teachers,students,reports}=data;
  const pending=reports.filter(r=>!r.approved);
  const stats=[
    {label:"Professores",value:teachers.length,icon:"users",  color:C.blue},
    {label:"Alunos",     value:students.length,icon:"student",color:C.green},
    {label:"Pendentes",  value:pending.length, icon:"clock",  color:C.amber},
  ];
  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <h1 style={T.h1}>{school?.name||"A Minha Escola"}</h1>
        {school&&<div style={{display:"flex",gap:8,marginTop:6,alignItems:"center"}}><span style={T.mono}>{school.code}</span>{school.location&&<span style={T.small}>· {school.location}</span>}</div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"1rem",marginBottom:"2rem"}}>
        {stats.map(s=>(
          <Card key={s.label} style={{padding:"1.2rem"}}>
            <div style={{width:40,height:40,borderRadius:10,background:s.color+"18",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"0.8rem"}}><Icon name={s.icon} size={20} color={s.color}/></div>
            <div style={{fontSize:"2rem",fontWeight:800,color:C.navy,lineHeight:1}}>{s.value}</div>
            <div style={{...T.small,marginTop:4}}>{s.label}</div>
          </Card>
        ))}
      </div>
      {pending.length>0&&<>
        <h2 style={{...T.h2,marginBottom:"1rem"}}>Relatórios Pendentes</h2>
        <div style={{display:"grid",gap:"0.75rem"}}>
          {pending.map(r=>{const t=teachers.find(t=>t.id===r.teacherId);return(
            <Card key={r.id} style={{padding:"1rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}} onClick={()=>onSelectReport(r)}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,background:C.amberPale,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="report" size={18} color={C.amber}/></div>
                <div><div style={T.h3}>{t?.name||r.teacherId}</div><div style={T.small}>{r.data?.semanas} · {r.data?.periodo}</div></div>
              </div>
              <Badge color="amber">Pendente</Badge>
            </Card>
          );})}
        </div>
      </>}
    </div>
  );
}

// ── Teacher Manager ───────────────────────────────────────────────────────────
const TEACHER_FIELDS=[["Nome Completo","name","Ahmed Mansur"],["Palavra-passe","password","Senha"],["Email","email","email@exemplo.com"],["Telefone","telefone","+258 8x xxx xxxx"],["Morada","morada","Rua, cidade"],["Grau Académico","grauAcademico","Ex: Licenciatura"],["Ano de Adesão","anoAdesao","Ex: 2022"]];

function TeacherFormGrid({vals, onChange, levels}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:"1rem",marginBottom:"1rem"}}>
      {TEACHER_FIELDS.map(([label,field,ph])=>(
        <div key={field}><div style={{...T.label,marginBottom:5}}>{label}</div><input style={inp} value={vals[field]||""} placeholder={ph} onChange={e=>onChange({...vals,[field]:e.target.value})}/></div>
      ))}
      <div><div style={{...T.label,marginBottom:5}}>Nível</div>
        <select style={{...inp}} value={vals.levelId||""} onChange={e=>onChange({...vals,levelId:e.target.value})}>
          <option value="">Sem nível</option>
          {levels.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function TeacherManager({ data, onSave, onSelect, schoolId }) {
  const {teachers,classes,students,levels}=data;
  const [showForm,setShowForm]=useState(false);
  const emptyForm={name:"",password:"",email:"",telefone:"",morada:"",grauAcademico:"",levelId:"",anoAdesao:String(new Date().getFullYear())};
  const [form,setForm]=useState(emptyForm);
  const [editing,setEditing]=useState(null);
  const [msg,setMsg]=useState({text:"",type:""});

  function add(){
    if(!form.name||!form.password){setMsg({text:"Nome e senha obrigatórios.",type:"error"});return;}
    const id="prof"+String(teachers.length+1).padStart(2,"0");
    onSave([...teachers,{id,...form,schoolId,role:"teacher",createdAt:new Date().toISOString()}]);
    setForm(emptyForm);setShowForm(false);setMsg({text:`Criado! Acesso: ${id} / ${form.password}`,type:"success"});
  }

  function saveEdit(){onSave(teachers.map(t=>t.id===editing.id?{...t,...editing}:t));setEditing(null);setMsg({text:"Atualizado.",type:"success"});}

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2rem"}}>
        <h1 style={T.h1}>Professores</h1>
        <Btn icon={showForm?"back":"plus"} onClick={()=>setShowForm(!showForm)}>{showForm?"Cancelar":"Novo Professor"}</Btn>
      </div>
      {showForm&&<Card style={{marginBottom:"1.5rem"}}><TeacherFormGrid vals={form} onChange={setForm} levels={levels}/><div style={{display:"flex",alignItems:"center",gap:"1rem"}}><Btn icon="plus" onClick={add}>Criar</Btn><Msg {...msg}/></div></Card>}
      {!showForm&&msg.text&&<Msg {...msg}/>}
      <div style={{display:"grid",gap:"0.75rem"}}>
        {teachers.map(t=>{
          const myClasses=classes.filter(c=>c.teacherId===t.id||(c.schedule||[]).some(s=>s.slotTeacherId===t.id));
          const n=students.filter(s=>myClasses.some(c=>c.id===s.classId)).length;
          const level=levels.find(l=>l.id===t.levelId);
          const isEd=editing?.id===t.id;
          return(
            <Card key={t.id} style={{padding:"1rem 1.2rem"}}>
              {isEd?(
                <div><TeacherFormGrid vals={editing} onChange={setEditing} levels={levels}/><div style={{display:"flex",gap:8}}><Btn icon="check" variant="success" size="sm" onClick={saveEdit}>Guardar</Btn><Btn variant="ghost" size="sm" onClick={()=>setEditing(null)}>Cancelar</Btn></div></div>
              ):(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",flex:1,minWidth:0}} onClick={()=>onSelect(t)}>
                    <div style={{width:44,height:44,borderRadius:12,background:level?level.color+"22":C.bluePale,border:level?`2px solid ${level.color}`:undefined,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="users" size={20} color={level?level.color:C.blue}/></div>
                    <div style={{minWidth:0}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span style={T.h3}>{t.name}</span>{level&&<span style={{background:level.color+"22",color:level.color,borderRadius:20,padding:"1px 8px",fontSize:"0.7rem",fontWeight:700}}>{level.name}</span>}</div>
                      <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}><span style={T.mono}>{t.id}</span><span style={T.small}>· {myClasses.length} turma{myClasses.length!==1?"s":""} · {n} aluno{n!==1?"s":""}{t.anoAdesao?` · Desde ${t.anoAdesao}`:""}</span></div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}><Btn variant="secondary" size="sm" icon="edit" onClick={()=>setEditing({...t})}>Editar</Btn><Btn variant="danger" size="sm" icon="trash" onClick={()=>{if(window.confirm("Remover?"))onSave(teachers.filter(x=>x.id!==t.id));}}>Remover</Btn></div>
                </div>
              )}
            </Card>
          );
        })}
        {teachers.length===0&&<div style={{textAlign:"center",padding:"3rem",color:C.slateLight}}><Icon name="users" size={40} color={C.line}/><p style={{marginTop:"1rem"}}>Nenhum professor ainda</p></div>}
      </div>
    </div>
  );
}

// ── Teacher Card ──────────────────────────────────────────────────────────────
function TeacherCard({ teacher, data, onBack }) {
  const {classes,students,levels}=data;
  const level=levels.find(l=>l.id===teacher.levelId);
  const scheduleRef=useRef();
  const myClasses=classes.filter(c=>c.teacherId===teacher.id||(c.schedule||[]).some(s=>s.slotTeacherId===teacher.id));
  const allSlots=myClasses.flatMap(cls=>(cls.schedule||[]).filter(s=>!s.slotTeacherId||s.slotTeacherId===""||s.slotTeacherId===teacher.id).map(s=>({...s,className:cls.name,classType:cls.type||"cim",subjectName:(cls.subjects||[]).find(x=>x.id===s.subjectId)?.name||""})));

  function downloadSchedule(){
    const el=scheduleRef.current;if(!el)return;
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Horário - ${teacher.name}</title><style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:center}th{background:#0A1628;color:white}</style></head><body><h2>Horário — ${teacher.name}</h2>${el.innerHTML}</body></html>`;
    const blob=new Blob([html],{type:"text/html"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`horario_${teacher.name.replace(/\s+/g,"_")}.html`;a.click();URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Btn variant="secondary" icon="back" size="sm" onClick={onBack}>Voltar</Btn>
      <div style={{height:"1.5rem"}}/>
      <ProfileHeader title="Professor" subtitle={teacher.name} accentColor={level?.color||C.blue}
        badge={level&&<div><div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase"}}>Nível</div><div style={{color:C.white,fontWeight:700,fontSize:"0.95rem"}}>{level.name}</div><div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.75rem"}}>{level.patente}</div></div>}
        fields={[["ID",teacher.id],["Email",teacher.email],["Telefone",teacher.telefone],["Morada",teacher.morada],["Grau Académico",teacher.grauAcademico],["Ano de Adesão",teacher.anoAdesao]]}
      />
      <h2 style={{...T.h2,marginBottom:"1rem"}}>Turmas & Disciplinas</h2>
      <div style={{display:"grid",gap:"0.75rem",marginBottom:"2rem"}}>
        {myClasses.map(cls=>{
          const n=students.filter(s=>s.classId===cls.id).length;
          const isCIM=cls.type!=="madrassa";const color=isCIM?C.blue:C.green;
          return(<Card key={cls.id} style={{padding:"1rem 1.2rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:(cls.subjects||[]).length?8:0}}>
              <div style={{width:36,height:36,background:color+"18",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="classes" size={18} color={color}/></div>
              <div><div style={{fontWeight:600,color:C.navy}}>{cls.name}<span style={{marginLeft:8,background:color+"22",color,borderRadius:20,padding:"1px 7px",fontSize:"0.68rem",fontWeight:700}}>{isCIM?"CIM":"Madrassa"}</span></div><div style={T.small}>{n} aluno{n!==1?"s":""} · {cls.year}</div></div>
            </div>
            {(cls.subjects||[]).length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",paddingLeft:46}}>{(cls.subjects||[]).map(s=><span key={s.id} style={{background:C.bluePale,color:C.blue,borderRadius:20,padding:"2px 10px",fontSize:"0.78rem",fontWeight:600}}>{s.name}</span>)}</div>}
          </Card>);
        })}
        {myClasses.length===0&&<p style={T.body}>Nenhuma turma atribuída.</p>}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
        <h2 style={T.h2}>Horário Semanal</h2>
        <Btn variant="secondary" icon="download" size="sm" onClick={downloadSchedule}>Download</Btn>
      </div>
      <div ref={scheduleRef}><ScheduleTable slots={allSlots}/></div>
    </div>
  );
}

// ── Class Manager ─────────────────────────────────────────────────────────────
function ClassManager({ data, onSaveClasses, schoolId }) {
  const {classes,teachers,students}=data;
  const [name,setName]=useState(""); const [year,setYear]=useState("2025/2026");
  const [type,setType]=useState("cim"); const [teacherId,setTeacherId]=useState("");
  const [msg,setMsg]=useState({text:"",type:""});
  const [openId,setOpenId]=useState(null); const [openTab,setOpenTab]=useState("subjects");
  const [subjInput,setSubjInput]=useState(""); const [editing,setEditing]=useState(null);
  const emptySlot={day:"Segunda",start:"",end:"",subjectId:"",slotTeacherId:""};
  const [slot,setSlot]=useState(emptySlot);

  function addClass(){
    if(!name.trim()){setMsg({text:"Escreve o nome.",type:"error"});return;}
    const id=`cls_${Date.now()}`;
    onSaveClasses([...classes,{id,name:name.trim(),year,type,teacherId,schoolId,subjects:[],schedule:[],createdAt:new Date().toISOString()}]);
    setName("");setMsg({text:`Turma "${name}" criada.`,type:"success"});
  }
  function addSubject(cid){if(!subjInput.trim())return;onSaveClasses(classes.map(c=>c.id===cid?{...c,subjects:[...(c.subjects||[]),{id:`subj_${Date.now()}`,name:subjInput.trim()}]}:c));setSubjInput("");}
  function removeSubject(cid,sid){onSaveClasses(classes.map(c=>c.id===cid?{...c,subjects:(c.subjects||[]).filter(s=>s.id!==sid)}:c));}
  function addSlot(cid,ctype){
    if(!slot.start||!slot.end)return;
    const max=ctype==="cim"?5:3;
    const cls=classes.find(c=>c.id===cid);
    if((cls.schedule||[]).filter(s=>s.day===slot.day).length>=max){setMsg({text:`Máx. ${max} tempos/dia.`,type:"error"});return;}
    onSaveClasses(classes.map(c=>c.id===cid?{...c,schedule:[...(c.schedule||[]),{id:`sl_${Date.now()}`,...slot}]}:c));setSlot(emptySlot);
  }
  function removeSlot(cid,sid){onSaveClasses(classes.map(c=>c.id===cid?{...c,schedule:(c.schedule||[]).filter(s=>s.id!==sid)}:c));}
  function saveEdit(){onSaveClasses(classes.map(c=>c.id===editing.id?{...c,name:editing.name,year:editing.year,teacherId:editing.teacherId,type:editing.type}:c));setEditing(null);setMsg({text:"Atualizado.",type:"success"});}

  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Turmas</h1></div>
      <Card style={{marginBottom:"1.5rem"}}>
        <h2 style={{...T.h2,fontSize:"1rem",marginBottom:"1.2rem"}}>Nova Turma</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"1rem",marginBottom:"1rem"}}>
          <div><div style={{...T.label,marginBottom:5}}>Tipo</div><select style={{...inp}} value={type} onChange={e=>setType(e.target.value)}><option value="cim">CIM</option><option value="madrassa">Madrassa</option></select></div>
          <div><div style={{...T.label,marginBottom:5}}>Nome</div><input style={inp} value={name} placeholder="Ex: Turma A" onChange={e=>setName(e.target.value)}/></div>
          <div><div style={{...T.label,marginBottom:5}}>Ano Letivo</div><input style={inp} value={year} onChange={e=>setYear(e.target.value)}/></div>
          <div><div style={{...T.label,marginBottom:5}}>Professor</div><select style={{...inp}} value={teacherId} onChange={e=>setTeacherId(e.target.value)}><option value="">Selecionar</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}><Btn icon="plus" onClick={addClass}>Criar Turma</Btn><Msg {...msg}/></div>
      </Card>
      <div style={{display:"grid",gap:"0.75rem"}}>
        {classes.map(cls=>{
          const teacher=teachers.find(t=>t.id===cls.teacherId);
          const nS=students.filter(s=>s.classId===cls.id).length;
          const subjects=cls.subjects||[]; const schedule=cls.schedule||[];
          const isOpen=openId===cls.id; const isEd=editing?.id===cls.id;
          const isCIM=cls.type!=="madrassa"; const typeColor=isCIM?C.blue:C.green;
          return(
            <Card key={cls.id} style={{padding:"1rem 1.2rem"}}>
              {isEd?(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"0.75rem",marginBottom:"0.75rem"}}>
                    <div><div style={{...T.label,marginBottom:4}}>Nome</div><input style={inp} value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></div>
                    <div><div style={{...T.label,marginBottom:4}}>Ano</div><input style={inp} value={editing.year} onChange={e=>setEditing({...editing,year:e.target.value})}/></div>
                    <div><div style={{...T.label,marginBottom:4}}>Tipo</div><select style={{...inp}} value={editing.type||"cim"} onChange={e=>setEditing({...editing,type:e.target.value})}><option value="cim">CIM</option><option value="madrassa">Madrassa</option></select></div>
                    <div><div style={{...T.label,marginBottom:4}}>Professor</div><select style={{...inp}} value={editing.teacherId||""} onChange={e=>setEditing({...editing,teacherId:e.target.value})}><option value="">Sem professor</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                  </div>
                  <div style={{display:"flex",gap:8}}><Btn icon="check" variant="success" size="sm" onClick={saveEdit}>Guardar</Btn><Btn variant="ghost" size="sm" onClick={()=>setEditing(null)}>Cancelar</Btn></div>
                </div>
              ):(
                <>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:42,height:42,background:typeColor+"18",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="classes" size={20} color={typeColor}/></div>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={T.h3}>{cls.name}</span><span style={{background:typeColor+"22",color:typeColor,borderRadius:20,padding:"1px 8px",fontSize:"0.7rem",fontWeight:700}}>{isCIM?"CIM":"Madrassa"}</span><span style={{...T.small,fontWeight:400}}>{cls.year}</span></div>
                        <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>{teacher?<span style={T.small}>{teacher.name}</span>:<span style={{...T.small,color:C.amber}}>Sem professor</span>}<span style={T.small}>· {nS} aluno{nS!==1?"s":""}</span>{isCIM&&<span style={T.small}>· {subjects.length} disciplina{subjects.length!==1?"s":""}</span>}<span style={T.small}>· {schedule.length} tempo{schedule.length!==1?"s":""}</span></div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <Btn variant="secondary" size="sm" icon="clock" onClick={()=>{setOpenId(isOpen&&openTab==="schedule"?null:cls.id);setOpenTab("schedule");}}>Horário</Btn>
                      {isCIM&&<Btn variant="secondary" size="sm" icon="book" onClick={()=>{setOpenId(isOpen&&openTab==="subjects"?null:cls.id);setOpenTab("subjects");}}>Disciplinas</Btn>}
                      <Btn variant="secondary" size="sm" icon="edit" onClick={()=>setEditing({...cls})}>Editar</Btn>
                      <Btn variant="danger" size="sm" icon="trash" onClick={()=>{if(window.confirm("Remover?"))onSaveClasses(classes.filter(c=>c.id!==cls.id));}}>Remover</Btn>
                    </div>
                  </div>
                  {isOpen&&openTab==="subjects"&&isCIM&&(
                    <div style={{marginTop:"1rem",paddingTop:"1rem",borderTop:`1px solid ${C.line}`}}>
                      <div style={{...T.label,marginBottom:8}}>Disciplinas</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:"0.75rem"}}>
                        {subjects.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:5,background:C.bluePale,borderRadius:20,padding:"0.25rem 0.75rem"}}><span style={{fontSize:"0.82rem",color:C.blue,fontWeight:600}}>{s.name}</span><button style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}} onClick={()=>removeSubject(cls.id,s.id)}><Icon name="trash" size={13} color={C.slateLight}/></button></div>)}
                        {subjects.length===0&&<span style={T.small}>Sem disciplinas ainda.</span>}
                      </div>
                      <div style={{display:"flex",gap:8}}><input style={{...inp,flex:1}} value={subjInput} placeholder="Nome da disciplina..." onChange={e=>setSubjInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSubject(cls.id)}/><Btn icon="plus" size="sm" onClick={()=>addSubject(cls.id)}>Adicionar</Btn></div>
                    </div>
                  )}
                  {isOpen&&openTab==="schedule"&&(
                    <div style={{marginTop:"1rem",paddingTop:"1rem",borderTop:`1px solid ${C.line}`}}>
                      <div style={{...T.label,marginBottom:10}}>Horário — {isCIM?"máx. 5 tempos/dia":"máx. 3 tempos/dia"}</div>
                      <div style={{display:"grid",gap:"0.5rem",marginBottom:"1rem"}}>
                        {DAYS.map(day=>{
                          const daySlots=schedule.filter(s=>s.day===day).sort((a,b)=>a.start.localeCompare(b.start));
                          return(<div key={day} style={{display:"flex",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}>
                            <div style={{width:72,paddingTop:6,...T.label,fontSize:"0.68rem"}}>{day}</div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap",flex:1}}>
                              {daySlots.map(s=>{const subj=subjects.find(x=>x.id===s.subjectId);const slotT=teachers.find(t=>t.id===s.slotTeacherId);return(<div key={s.id} style={{display:"flex",alignItems:"center",gap:5,background:typeColor+"18",borderRadius:8,padding:"4px 10px",border:`1px solid ${typeColor}33`}}>
                                <span style={{fontSize:"0.8rem",fontWeight:700,color:typeColor}}>{s.start}–{s.end}</span>
                                {subj&&<span style={{fontSize:"0.78rem",fontWeight:600,color:C.navy}}>· {subj.name}</span>}
                                {slotT&&<span style={{fontSize:"0.75rem",color:C.slate}}>· {slotT.name}</span>}
                                <button style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}} onClick={()=>removeSlot(cls.id,s.id)}><Icon name="trash" size={12} color={C.slateLight}/></button>
                              </div>);})}
                              {daySlots.length===0&&<span style={{...T.small,paddingTop:6}}>Sem aulas</span>}
                            </div>
                          </div>);
                        })}
                      </div>
                      <div style={{background:C.sand,borderRadius:10,padding:"0.75rem",border:`1px solid ${C.line}`}}>
                        <div style={{...T.label,marginBottom:8}}>Adicionar Tempo</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,alignItems:"flex-end",marginBottom:8}}>
                          <div><div style={{...T.label,marginBottom:4,fontSize:"0.65rem"}}>Dia</div><select style={{...inp,padding:"0.45rem 0.6rem"}} value={slot.day} onChange={e=>setSlot({...slot,day:e.target.value})}>{DAYS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                          <div><div style={{...T.label,marginBottom:4,fontSize:"0.65rem"}}>Início</div><input style={{...inp,padding:"0.45rem 0.6rem"}} type="time" value={slot.start} onChange={e=>setSlot({...slot,start:e.target.value})}/></div>
                          <div><div style={{...T.label,marginBottom:4,fontSize:"0.65rem"}}>Fim</div><input style={{...inp,padding:"0.45rem 0.6rem"}} type="time" value={slot.end} onChange={e=>setSlot({...slot,end:e.target.value})}/></div>
                          {isCIM&&<div><div style={{...T.label,marginBottom:4,fontSize:"0.65rem"}}>Disciplina</div><select style={{...inp,padding:"0.45rem 0.6rem"}} value={slot.subjectId} onChange={e=>setSlot({...slot,subjectId:e.target.value})}><option value="">Selecionar...</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}
                          <div><div style={{...T.label,marginBottom:4,fontSize:"0.65rem"}}>Professor</div><select style={{...inp,padding:"0.45rem 0.6rem"}} value={slot.slotTeacherId} onChange={e=>setSlot({...slot,slotTeacherId:e.target.value})}><option value="">Selecionar...</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                        </div>
                        <Btn icon="plus" size="sm" onClick={()=>addSlot(cls.id,cls.type||"cim")}>Adicionar Tempo</Btn>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}
        {classes.length===0&&<div style={{textAlign:"center",padding:"3rem",color:C.slateLight}}><Icon name="classes" size={40} color={C.line}/><p style={{marginTop:"1rem"}}>Nenhuma turma ainda</p></div>}
      </div>
    </div>
  );
}

// ── Coord Students ────────────────────────────────────────────────────────────
function CoordStudents({ data, onSave, onSelect }) {
  const {students,teachers,classes}=data;
  const [search,setSearch]=useState(""); const [transferId,setTransferId]=useState(null); const [newClassId,setNewClassId]=useState(""); const [msg,setMsg]=useState("");
  function transfer(sid){if(!newClassId)return;const cls=classes.find(c=>c.id===newClassId);onSave(students.map(s=>s.id===sid?{...s,classId:newClassId,teacherId:cls?.teacherId}:s));setTransferId(null);setNewClassId("");setMsg("Transferido.");setTimeout(()=>setMsg(""),3000);}
  const filtered=students.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.code.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Alunos</h1><p style={{...T.body,marginTop:4}}>{students.length} aluno{students.length!==1?"s":""}</p>{msg&&<span style={{fontSize:"0.83rem",color:C.green}}>{msg}</span>}</div>
      <div style={{position:"relative",marginBottom:"1rem"}}><div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><Icon name="search" size={16} color={C.slateLight}/></div><input style={{...inp,paddingLeft:"2.4rem"}} placeholder="Pesquisar..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div style={{display:"grid",gap:"0.6rem"}}>
        {filtered.map(s=>{
          const cls=classes.find(c=>c.id===s.classId); const teacher=teachers.find(t=>t.id===cls?.teacherId); const isTr=transferId===s.id;
          return(<Card key={s.id} style={{padding:"0.9rem 1.2rem"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",flex:1}} onClick={()=>onSelect(s)}>
                <div style={{width:38,height:38,background:C.bluePale,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="student" size={18} color={C.blue}/></div>
                <div><div style={{...T.h3,fontSize:"0.9rem"}}>{s.name}</div><div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}><span style={T.mono}>{s.code}</span>{cls&&<span style={T.small}>· {cls.name}</span>}{teacher&&<span style={T.small}>· {teacher.name}</span>}</div></div>
              </div>
              <Btn variant="secondary" size="sm" icon="transfer" onClick={()=>{setTransferId(isTr?null:s.id);setNewClassId("");}}>Transferir</Btn>
            </div>
            {isTr&&<div style={{marginTop:"0.75rem",paddingTop:"0.75rem",borderTop:`1px solid ${C.line}`,display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{flex:1}}><div style={{...T.label,marginBottom:4}}>Transferir para</div><select style={{...inp}} value={newClassId} onChange={e=>setNewClassId(e.target.value)}><option value="">Selecionar...</option>{classes.filter(c=>c.id!==s.classId).map(c=>{const t=teachers.find(t=>t.id===c.teacherId);return<option key={c.id} value={c.id}>{c.name} {t?`— ${t.name}`:""}</option>;})}</select></div>
              <Btn variant="success" size="sm" icon="check" onClick={()=>transfer(s.id)} disabled={!newClassId}>Confirmar</Btn>
            </div>}
          </Card>);
        })}
        {filtered.length===0&&<div style={{textAlign:"center",padding:"3rem",color:C.slateLight}}><Icon name="student" size={40} color={C.line}/><p style={{marginTop:"1rem"}}>Nenhum aluno</p></div>}
      </div>
    </div>
  );
}

// ── Student Card ──────────────────────────────────────────────────────────────
function StudentCard({ student, data, onSaveStudents, onBack }) {
  const {classes,teachers}=data;
  const cls=classes.find(c=>c.id===student.classId); const teacher=teachers.find(t=>t.id===cls?.teacherId);
  const subjects=cls?.subjects||[]; const isMadrassa=cls?.type==="madrassa";
  const [editing,setEditing]=useState(false); const [form,setForm]=useState({...student});
  function saveEdit(){onSaveStudents(data.students.map(s=>s.id===student.id?{...s,...form}:s));setEditing(false);}
  const INFO_FIELDS=[["Data de Nascimento","dataNascimento","DD/MM/AAAA"],["Morada","morada","Rua, cidade"],["Contacto dos Pais","contactoPais","+258 8x xxx xxxx"],["Nome do Encarregado","nomePai","Nome completo"],["Ano de Adesão","anoAdesao","Ex: 2023"]];
  const slots=(cls?.schedule||[]).map(s=>({...s,className:cls.name,classType:cls.type||"cim",subjectName:(cls.subjects||[]).find(x=>x.id===s.subjectId)?.name||""}));
  return (
    <div>
      <Btn variant="secondary" icon="back" size="sm" onClick={onBack}>Voltar</Btn>
      <div style={{height:"1.5rem"}}/>
      <ProfileHeader title="Aluno" subtitle={student.name} accentColor={C.blue}
        badge={<div><div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase"}}>Nº CIM</div><div style={{color:C.white,fontWeight:800,fontSize:"1.1rem",fontFamily:"'Courier New',monospace"}}>{student.code}</div></div>}
        fields={[["Turma",cls?.name],["Professor",teacher?.name],["Data de Nascimento",student.dataNascimento],["Morada",student.morada],["Contacto dos Pais",student.contactoPais],["Encarregado",student.nomePai],["Ano de Adesão",student.anoAdesao]]}
        onEdit={()=>setEditing(!editing)}
      />
      {editing&&<Card style={{marginBottom:"1.5rem"}}>
        <h2 style={{...T.h2,fontSize:"1rem",marginBottom:"1rem"}}>Editar Informação</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"1rem",marginBottom:"1rem"}}>
          {INFO_FIELDS.map(([label,field,ph])=><div key={field}><div style={{...T.label,marginBottom:5}}>{label}</div><input style={inp} value={form[field]||""} placeholder={ph} onChange={e=>setForm({...form,[field]:e.target.value})}/></div>)}
        </div>
        <div style={{display:"flex",gap:8}}><Btn icon="check" variant="success" onClick={saveEdit}>Guardar</Btn><Btn variant="ghost" onClick={()=>setEditing(false)}>Cancelar</Btn></div>
      </Card>}
      {subjects.length>0&&<>
        <h2 style={{...T.h2,marginBottom:"1rem"}}>Notas</h2>
        {subjects.map(subj=>{
          const g=student.grades?.[subj.id]||{};
          const t1=isMadrassa?madTrimAvg(g,1):trimAvg(g,1), t2=isMadrassa?madTrimAvg(g,2):trimAvg(g,2), t3=isMadrassa?madTrimAvg(g,3):trimAvg(g,3);
          const mF=avg(t1,t2,t3);
          return(<Card key={subj.id} style={{marginBottom:"1rem",padding:0,overflow:"hidden"}}>
            <div style={{background:isMadrassa?C.green:C.blue,padding:"0.6rem 1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:C.white,fontWeight:700}}>{subj.name}</span>
              <span style={{color:"rgba(255,255,255,0.6)",fontSize:"0.82rem"}}>Faltas: {g.faltas??0}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr"}}>
              {[1,2,3].map(t=>{
                const tAvg=[t1,t2,t3][t-1];
                const fields=isMadrassa?[["Tajwid",`t${t}_tajwid`],["Hifz",`t${t}_hifz`],["Recit.",`t${t}_recitacao`]]:[["1ªAS",`t${t}_1as`],["2ªAS",`t${t}_2as`],["AT",`t${t}_at`]];
                return(<div key={t} style={{padding:"0.75rem",borderRight:`1px solid ${C.line}`,textAlign:"center"}}>
                  <div style={{...T.label,marginBottom:6}}>T{t}</div>
                  <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:4}}>
                    {fields.map(([fl,fk])=><div key={fk} style={{textAlign:"center"}}><div style={{...T.small,fontSize:"0.6rem"}}>{fl}</div><div style={{fontWeight:700}}><GradeCell val={g[fk]}/></div></div>)}
                  </div>
                  <div style={{fontWeight:700,color:isMadrassa?C.green:C.blue}}><GradeCell val={tAvg}/></div>
                </div>);
              })}
              <div style={{padding:"0.75rem",textAlign:"center",background:mF!==null&&mF>=12?C.greenPale:mF!==null?C.redPale:C.sand}}>
                <div style={{...T.label,marginBottom:4}}>Média Final</div>
                <div style={{fontSize:"1.4rem",fontWeight:800}}><GradeCell val={mF}/></div>
                {mF!==null&&mF>=12&&<><div style={{...T.label,marginTop:6,marginBottom:2,color:C.purple}}>Exame Final</div><div style={{fontWeight:700}}><GradeCell val={g.exame_final}/></div></>}
              </div>
            </div>
          </Card>);
        })}
      </>}
      {cls&&<><h2 style={{...T.h2,margin:"1.5rem 0 1rem"}}>Horário</h2><ScheduleTable slots={slots}/></>}
    </div>
  );
}

// ── Grade Manager ─────────────────────────────────────────────────────────────
function GradeManager({ data, onSave, filterTeacherId }) {
  const {classes,students}=data;
  const [selClass,setSelClass]=useState(null); const [selSubj,setSelSubj]=useState(null); const [editing,setEditing]=useState({});
  const myClasses=filterTeacherId?classes.filter(c=>c.teacherId===filterTeacherId||(c.schedule||[]).some(s=>s.slotTeacherId===filterTeacherId)):classes;
  const clsStudents=selClass?students.filter(s=>s.classId===selClass.id):[];
  const clsSubjects=selClass?(selClass.subjects||[]):[];
  const isMadrassa=selClass?.type==="madrassa";

  function getG(s,sid){return s.grades?.[sid]||{};}
  function updGrade(sid,subjId,field,val){setEditing(prev=>({...prev,[sid]:{...prev[sid],[subjId]:{...getG(students.find(s=>s.id===sid),subjId),...(prev[sid]?.[subjId]||{}),[field]:val}}}));}
  function saveGrades(){const updated=students.map(s=>{if(!editing[s.id])return s;const ng={...s.grades};Object.entries(editing[s.id]).forEach(([subjId,g])=>{ng[subjId]={...ng[subjId],...g};});return{...s,grades:ng};});onSave(updated);setEditing({});}

  const CIM_TRIMS=[{t:1,label:"1º Trimestre"},{t:2,label:"2º Trimestre"},{t:3,label:"3º Trimestre"}];
  const CIM_FIELDS=[{key:"1as",label:"1ª AS"},{key:"2as",label:"2ª AS"},{key:"at",label:"AT"}];
  const MAD_FIELDS=[{key:"tajwid",label:"Tajwid"},{key:"hifz",label:"Hifz"},{key:"recitacao",label:"Recitação"}];

  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Notas</h1></div>
      <div style={{display:"flex",gap:"0.6rem",flexWrap:"wrap",marginBottom:"1.2rem"}}>
        {myClasses.map(cls=><button key={cls.id} onClick={()=>{setSelClass(cls);setSelSubj(null);setEditing({});}} style={{padding:"0.5rem 1rem",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:"0.875rem",border:`1.5px solid ${selClass?.id===cls.id?C.blue:C.line}`,background:selClass?.id===cls.id?C.bluePale:C.white,color:selClass?.id===cls.id?C.blue:C.slate,fontWeight:selClass?.id===cls.id?700:400}}>{cls.name}</button>)}
        {myClasses.length===0&&<p style={T.body}>Sem turmas.</p>}
      </div>
      {selClass&&<>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"1.2rem"}}>
          {clsSubjects.map(s=><button key={s.id} onClick={()=>{setSelSubj(s);setEditing({});}} style={{padding:"0.4rem 0.9rem",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:"0.82rem",fontWeight:600,border:`1.5px solid ${selSubj?.id===s.id?C.blue:C.line}`,background:selSubj?.id===s.id?C.blue:C.white,color:selSubj?.id===s.id?C.white:C.slate}}>{s.name}</button>)}
          {clsSubjects.length===0&&<p style={T.small}>Sem disciplinas. Adiciona em Turmas.</p>}
        </div>
        {selSubj&&clsStudents.length>0&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <h2 style={{...T.h2,fontSize:"1.1rem"}}>{selSubj.name} — {selClass.name} {isMadrassa&&<Badge color="green">Madrassa</Badge>}</h2>
              {Object.keys(editing).length>0&&<Btn icon="check" variant="success" onClick={saveGrades}>Guardar Notas</Btn>}
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:isMadrassa?900:800}}>
                <thead>
                  <tr>
                    <th style={{...thS,textAlign:"left",paddingLeft:12,width:160}}>Aluno</th>
                    <th style={{...thS,width:56}}>Faltas</th>
                    {CIM_TRIMS.map(({t,label})=><th key={t} colSpan={isMadrassa?4:4} style={{...thS,background:t===1?C.blue:t===2?C.blueMid:C.blueLight,color:C.white}}>{label}</th>)}
                    <th style={{...thS,background:C.navy,color:C.white}}>Média Final</th>
                    <th style={{...thS,background:C.purple,color:C.white}}>Exame Final</th>
                  </tr>
                  <tr style={{background:C.blueFaint}}>
                    <th style={thS}/><th style={thS}/>
                    {CIM_TRIMS.map(({t})=><>{(isMadrassa?MAD_FIELDS:CIM_FIELDS).map(f=><th key={f.key} style={{...thS,fontSize:"0.66rem"}}>{f.label}</th>)}<th key={`m${t}`} style={{...thS,fontSize:"0.66rem",color:C.blue}}>Méd.</th></>)}
                    <th style={thS}/><th style={thS}/>
                  </tr>
                </thead>
                <tbody>
                  {clsStudents.map((s,i)=>{
                    const saved=getG(s,selSubj.id); const ed=editing[s.id]?.[selSubj.id]||{}; const g={...saved,...ed};
                    const fn=isMadrassa?madTrimAvg:trimAvg;
                    const t1=fn(g,1),t2=fn(g,2),t3=fn(g,3),mF=avg(t1,t2,t3);
                    const canExam=mF!==null&&mF>=12;
                    const fields=isMadrassa?MAD_FIELDS:CIM_FIELDS;
                    return(<tr key={s.id} style={{background:i%2===0?C.white:C.blueFaint,borderBottom:`1px solid ${C.line}`}}>
                      <td style={{padding:"0.4rem 0.75rem"}}><div style={{fontWeight:600,fontSize:"0.85rem",color:C.navy}}>{s.name}</div><span style={{...T.mono,fontSize:"0.7rem"}}>{s.code}</span></td>
                      <td style={{textAlign:"center"}}><GradeInput value={g.faltas} onChange={v=>updGrade(s.id,selSubj.id,"faltas",v)}/></td>
                      {CIM_TRIMS.map(({t})=><>
                        {fields.map(f=><td key={f.key} style={{textAlign:"center",padding:"0.3rem"}}><GradeInput value={g[`t${t}_${f.key}`]} onChange={v=>updGrade(s.id,selSubj.id,`t${t}_${f.key}`,v)}/></td>)}
                        <td key={`m${t}`} style={{textAlign:"center",padding:"0.3rem",fontWeight:700}}><GradeCell val={[t1,t2,t3][t-1]}/></td>
                      </>)}
                      <td style={{textAlign:"center",fontWeight:800,fontSize:"1rem"}}><GradeCell val={mF}/></td>
                      <td style={{textAlign:"center",padding:"0.3rem"}}>{canExam?<GradeInput value={g.exame_final} onChange={v=>updGrade(s.id,selSubj.id,"exame_final",v)}/>:<span style={{...T.small,fontSize:"0.68rem"}}>Méd. &lt; 12</span>}</td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
            {Object.keys(editing).length>0&&<div style={{marginTop:"1rem",display:"flex",justifyContent:"flex-end"}}><Btn icon="check" variant="success" onClick={saveGrades}>Guardar Notas</Btn></div>}
          </div>
        )}
        {selSubj&&clsStudents.length===0&&<p style={T.body}>Sem alunos nesta turma.</p>}
      </>}
    </div>
  );
}

// ── Report List & Detail ──────────────────────────────────────────────────────
function ReportList({ data, onSave, onSelect }) {
  const {reports,teachers}=data;
  const sorted=[...reports].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Relatórios Quinzenais</h1></div>
      <div style={{display:"grid",gap:"0.75rem"}}>
        {sorted.map(r=>{const teacher=teachers.find(t=>t.id===r.teacherId);return(
          <Card key={r.id} style={{padding:"1rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:r.approved?C.greenPale:C.amberPale,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="report" size={18} color={r.approved?C.green:C.amber}/></div>
              <div><div style={T.h3}>{teacher?.name||r.teacherId}</div><div style={T.small}>{r.data?.semanas} · {r.data?.periodo} · {new Date(r.createdAt).toLocaleDateString("pt-PT")}</div></div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <Badge color={r.approved?"green":"amber"}>{r.approved?"Aprovado":"Pendente"}</Badge>
              <Btn variant="secondary" size="sm" icon="eye" onClick={()=>onSelect(r)}>Ver</Btn>
              {!r.approved&&<Btn variant="success" size="sm" icon="check" onClick={()=>onSave(reports.map(x=>x.id===r.id?{...x,approved:true,approvedAt:new Date().toISOString()}:x))}>Aprovar</Btn>}
            </div>
          </Card>
        );})}
        {reports.length===0&&<div style={{textAlign:"center",padding:"3rem",color:C.slateLight}}><Icon name="report" size={40} color={C.line}/><p style={{marginTop:"1rem"}}>Nenhum relatório ainda</p></div>}
      </div>
    </div>
  );
}

function ReportDetail({ report, data, onSave, onBack }) {
  const {teachers,reports}=data; const teacher=teachers.find(t=>t.id===report.teacherId); const d=report.data||{};
  const SR=({label,v1,v2,total})=>(<tr style={{borderBottom:`1px solid ${C.line}`}}><td style={{padding:"0.6rem 1rem",color:C.slate,fontSize:"0.875rem"}}>{label}</td><td style={{padding:"0.6rem 1rem",textAlign:"center",fontWeight:600}}>{v1??"—"}</td><td style={{padding:"0.6rem 1rem",textAlign:"center",fontWeight:600}}>{v2??"—"}</td><td style={{padding:"0.6rem 1rem",textAlign:"center",fontWeight:700,color:C.blue}}>{total??"—"}</td></tr>);
  return (
    <div>
      <Btn variant="secondary" icon="back" size="sm" onClick={onBack}>Voltar</Btn>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",margin:"1.5rem 0",flexWrap:"wrap",gap:"1rem"}}>
        <div><h1 style={T.h1}>{teacher?.name||report.teacherId}</h1><p style={{...T.body,marginTop:4}}>{d.semanas} · {d.periodo}</p></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <Badge color={report.approved?"green":"amber"}>{report.approved?"Aprovado":"Pendente"}</Badge>
          {!report.approved&&<Btn variant="success" icon="check" onClick={()=>onSave(reports.map(r=>r.id===report.id?{...r,approved:true,approvedAt:new Date().toISOString()}:r))}>Aprovar</Btn>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginBottom:"1.5rem"}}>
        {[
          {title:"CIM",bg:C.blue,rows:[["Aulas Dadas",d.cim?.aulas_sem1,d.cim?.aulas_sem2,d.cim?.total_aulas],["Faltas",d.cim?.faltas_sem1,d.cim?.faltas_sem2,d.cim?.total_faltas]],extra:d.cim?.materias?`Matérias: ${d.cim.materias}`:null},
          {title:"Madrassa",bg:C.navy,rows:[["Sessões",d.madrassa?.sessoes_sem1,d.madrassa?.sessoes_sem2,d.madrassa?.total_sessoes],["Presenças",d.madrassa?.presencas_sem1,d.madrassa?.presencas_sem2,d.madrassa?.total_presencas],["Faltas",d.madrassa?.faltas_sem1,d.madrassa?.faltas_sem2,d.madrassa?.total_faltas]]},
        ].map(sec=>(<Card key={sec.title} style={{padding:0,overflow:"hidden"}}>
          <div style={{background:sec.bg,padding:"0.75rem 1rem"}}><span style={{color:C.white,fontWeight:700,fontSize:"0.875rem"}}>{sec.title}</span></div>
          <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{background:C.blueFaint}}>{["","Sem. 1","Sem. 2","Total"].map(h=><th key={h} style={{padding:"0.5rem 1rem",textAlign:h?"center":"left",fontSize:"0.72rem",fontWeight:700,color:C.slateLight,textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{sec.rows.map(([l,v1,v2,t])=><SR key={l} label={l} v1={v1} v2={v2} total={t}/>)}</tbody></table>
          {sec.extra&&<div style={{padding:"0.75rem 1rem",background:C.blueFaint,fontSize:"0.82rem",color:C.slate,borderTop:`1px solid ${C.line}`}}>{sec.extra}</div>}
        </Card>))}
      </div>
      {report.imageBase64&&<Card style={{marginTop:"1.5rem"}}><div style={{...T.label,marginBottom:10}}>Scan Original</div><img src={`data:${report.imageMime};base64,${report.imageBase64}`} style={{width:"100%",borderRadius:8,border:`1px solid ${C.line}`}} alt="Scan"/></Card>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER SHELL
// ═══════════════════════════════════════════════════════════════════════════════
function TeacherShell({ user, data, save, onLogout }) {
  const school=data.schools.find(s=>s.id===user.schoolId);
  const myClasses=data.classes.filter(c=>c.teacherId===user.id||(c.schedule||[]).some(s=>s.slotTeacherId===user.id));
  const myStudents=data.students.filter(s=>myClasses.some(c=>c.id===s.classId));
  const myReports=data.reports.filter(r=>r.teacherId===user.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const nav=[{id:"schedule",label:"Horário",icon:"clock"},{id:"students",label:"A Minha Turma",icon:"student"},{id:"grades",label:"Notas",icon:"grades"},{id:"submit",label:"Submeter Relatório",icon:"upload"},{id:"history",label:"Histórico",icon:"report"}];
  const teacherData=useMemo(()=>({...data,classes:myClasses,students:myStudents}),[data,myClasses,myStudents]);

  const teacherSave={
    students: useCallback(async v=>{const all=[...data.students.filter(s=>!myStudents.some(ms=>ms.id===s.id)),...v];save.students(all);},[data.students,myStudents,save.students]),
    reports:  useCallback(async v=>{const all=[...data.reports.filter(r=>r.teacherId!==user.id),...v];save.reports(all);},[data.reports,user.id,save.reports]),
  };

  return (
    <Shell user={user} nav={nav} onLogout={onLogout} subtitle={school?.name}>
      {({tab})=><>
        {tab==="schedule" && <TeacherSchedulePage user={user} data={data}/>}
        {tab==="students" && <TeacherStudents user={user} data={data} onSave={teacherSave.students} myClasses={myClasses}/>}
        {tab==="grades"   && <GradeManager data={teacherData} onSave={teacherSave.students} filterTeacherId={user.id}/>}
        {tab==="submit"   && <SubmitReport user={user} myStudents={myStudents} data={data} save={{...save,reports:teacherSave.reports,students:teacherSave.students}}/>}
        {tab==="history"  && <TeacherHistory myReports={myReports}/>}
      </>}
    </Shell>
  );
}

function TeacherSchedulePage({ user, data }) {
  const myClasses=data.classes.filter(c=>c.teacherId===user.id||(c.schedule||[]).some(s=>s.slotTeacherId===user.id));
  const allSlots=myClasses.flatMap(cls=>(cls.schedule||[]).filter(s=>!s.slotTeacherId||s.slotTeacherId===""||s.slotTeacherId===user.id).map(s=>({...s,className:cls.name,classType:cls.type||"cim",subjectName:(cls.subjects||[]).find(x=>x.id===s.subjectId)?.name||""})));
  return (<div><div style={{marginBottom:"2rem"}}><h1 style={T.h1}>O Meu Horário</h1></div>{myClasses.length===0?<Card><p style={T.body}>Nenhuma turma atribuída ainda.</p></Card>:<ScheduleTable slots={allSlots}/>}</div>);
}

function TeacherStudents({ user, data, onSave, myClasses }) {
  const {students}=data;
  const [selClass,setSelClass]=useState(myClasses[0]||null);
  const [name,setName]=useState(""); const [msg,setMsg]=useState({text:"",type:""});
  const [editingId,setEditingId]=useState(null); const [editForm,setEditForm]=useState({});
  const clsStudents=selClass?students.filter(s=>s.classId===selClass.id):[];
  const isMadrassa=selClass?.type==="madrassa";

  function add(){
    if(!name.trim()||!selClass){setMsg({text:"Escreve o nome.",type:"error"});return;}
    const code=nextCode(students,"CIM");
    onSave([...students,{id:`s_${Date.now()}`,name:name.trim(),code,classId:selClass.id,teacherId:user.id,schoolId:user.schoolId,createdAt:new Date().toISOString(),grades:{},level:isMadrassa?"1ª Parte":null,licaoApresentada:isMadrassa?"":null,licaoPorApresentar:isMadrassa?"":null,stats:{cim_faltas:0,madrassa_presencas:0,madrassa_faltas:0,madrassa_fj:0}}]);
    setName("");setMsg({text:`Adicionado — ${nextCode(students,"CIM")}`,type:"success"});setTimeout(()=>setMsg({text:"",type:""}),3000);
  }
  function saveStudentEdit(sid){onSave(students.map(s=>s.id===sid?{...s,...editForm}:s));setEditingId(null);setEditForm({});}

  return (
    <div>
      <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>A Minha Turma</h1></div>
      {myClasses.length>1&&<div style={{display:"flex",gap:"0.5rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
        {myClasses.map(cls=>{const clsColor=cls.type==="madrassa"?C.green:C.blue;return<button key={cls.id} onClick={()=>setSelClass(cls)} style={{padding:"0.45rem 1rem",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:"0.875rem",border:`1.5px solid ${selClass?.id===cls.id?clsColor:C.line}`,background:selClass?.id===cls.id?clsColor+"18":C.white,color:selClass?.id===cls.id?clsColor:C.slate,fontWeight:selClass?.id===cls.id?700:400}}>{cls.name}<span style={{marginLeft:6,fontSize:"0.7rem",opacity:0.7}}>({cls.type==="madrassa"?"Madrassa":"CIM"})</span></button>;})}
      </div>}
      {selClass?(<>
        <Card style={{marginBottom:"1.5rem"}}>
          <h2 style={{...T.h2,fontSize:"1rem",marginBottom:"1rem"}}>Adicionar Aluno — {selClass.name}</h2>
          <div style={{display:"flex",gap:"0.75rem",alignItems:"flex-end"}}>
            <div style={{flex:1}}><div style={{...T.label,marginBottom:5}}>Nome Completo</div><input style={inp} value={name} placeholder="Nome do aluno" onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}/></div>
            <Btn icon="plus" onClick={add}>Adicionar</Btn>
          </div>
          <Msg {...msg}/>
          <p style={{...T.small,marginTop:"0.5rem"}}>Número CIM atribuído automaticamente.{isMadrassa?" · Define nível e lições após adicionar.":""}</p>
        </Card>
        <div style={{display:"grid",gap:"0.6rem"}}>
          {clsStudents.map((s,i)=>{const isEd=editingId===s.id;return(
            <Card key={s.id} style={{padding:"0.9rem 1.2rem"}}>
              {isEd?(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.75rem",marginBottom:"0.75rem"}}>
                    <div><div style={{...T.label,marginBottom:4}}>Nível</div><select style={{...inp}} value={editForm.level||"1ª Parte"} onChange={e=>setEditForm({...editForm,level:e.target.value})}>{MADRASSA_LEVELS.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
                    <div><div style={{...T.label,marginBottom:4}}>Lição Apresentada</div><input style={inp} value={editForm.licaoApresentada||""} placeholder="Ex: Al-Fatiha" onChange={e=>setEditForm({...editForm,licaoApresentada:e.target.value})}/></div>
                    <div><div style={{...T.label,marginBottom:4}}>Lição por Apresentar</div><input style={inp} value={editForm.licaoPorApresentar||""} placeholder="Ex: Al-Baqarah" onChange={e=>setEditForm({...editForm,licaoPorApresentar:e.target.value})}/></div>
                  </div>
                  <div style={{display:"flex",gap:8}}><Btn icon="check" variant="success" size="sm" onClick={()=>saveStudentEdit(s.id)}>Guardar</Btn><Btn variant="ghost" size="sm" onClick={()=>setEditingId(null)}>Cancelar</Btn></div>
                </div>
              ):(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:34,height:34,background:isMadrassa?C.greenPale:C.bluePale,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.78rem",fontWeight:700,color:isMadrassa?C.green:C.blue}}>{i+1}</div>
                    <div>
                      <div style={{...T.h3,fontSize:"0.9rem"}}>{s.name}</div>
                      <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={T.mono}>{s.code}</span>
                        {isMadrassa&&s.level&&<Badge color="green">{s.level}</Badge>}
                        {isMadrassa&&s.licaoApresentada&&<span style={T.small}>✓ {s.licaoApresentada}</span>}
                        {isMadrassa&&s.licaoPorApresentar&&<span style={{...T.small,color:C.amber}}>→ {s.licaoPorApresentar}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {isMadrassa&&<Btn variant="secondary" size="sm" icon="edit" onClick={()=>{setEditingId(s.id);setEditForm({level:s.level||"1ª Parte",licaoApresentada:s.licaoApresentada||"",licaoPorApresentar:s.licaoPorApresentar||""});}}>Editar</Btn>}
                    <button onClick={()=>{if(window.confirm("Remover?"))onSave(students.filter(x=>x.id!==s.id));}} style={{background:"none",border:"none",cursor:"pointer",padding:6}}><Icon name="trash" size={15} color={C.slateLight}/></button>
                  </div>
                </div>
              )}
            </Card>
          );})}
          {clsStudents.length===0&&<div style={{textAlign:"center",padding:"3rem",color:C.slateLight}}><Icon name="student" size={40} color={C.line}/><p style={{marginTop:"1rem"}}>Nenhum aluno ainda</p></div>}
        </div>
      </>):<Card><p style={T.body}>Nenhuma turma atribuída. O coordenador deve criar e alocar uma turma.</p></Card>}
    </div>
  );
}

function TeacherHistory({ myReports }) {
  return (<div><div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Histórico de Relatórios</h1></div><div style={{display:"grid",gap:"0.75rem"}}>
    {myReports.map(r=>(<Card key={r.id} style={{padding:"1rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:10,background:r.approved?C.greenPale:C.amberPale,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={r.approved?"check":"clock"} size={18} color={r.approved?C.green:C.amber}/></div><div><div style={T.h3}>{r.data?.semanas}</div><div style={T.small}>{r.data?.periodo} · {new Date(r.createdAt).toLocaleDateString("pt-PT")}</div></div></div>
      <Badge color={r.approved?"green":"amber"}>{r.approved?"Aprovado":"A aguardar"}</Badge>
    </Card>))}
    {myReports.length===0&&<div style={{textAlign:"center",padding:"3rem",color:C.slateLight}}><Icon name="report" size={40} color={C.line}/><p style={{marginTop:"1rem"}}>Sem relatórios ainda</p></div>}
  </div></div>);
}

function SubmitReport({ user, myStudents, data, save }) {
  const [file,setFile]=useState(null); const [preview,setPreview]=useState(null);
  const [loading,setLoading]=useState(false); const [result,setResult]=useState(null);
  const [error,setError]=useState(""); const [done,setDone]=useState(false);
  const fileRef=useRef();

  async function analyzeReport(b64,mime){
    const list=myStudents.map(s=>`${s.code}: ${s.name}`).join("\n");
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":data.apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:mime,data:b64}},{type:"text",text:`Analisa esta folha quinzenal.\nAlunos:\n${list}\n\nJSON puro:\n{"semanas":"","periodo":"","cim":{"aulas_sem1":0,"aulas_sem2":0,"total_aulas":0,"faltas_sem1":0,"faltas_sem2":0,"total_faltas":0,"materias":""},"madrassa":{"sessoes_sem1":0,"sessoes_sem2":0,"total_sessoes":0,"presencas_sem1":0,"presencas_sem2":0,"total_presencas":0,"faltas_sem1":0,"faltas_sem2":0,"total_faltas":0},"alunos":[{"codigo":"","nome":"","cim_faltas":0,"madrassa_presencas":0,"madrassa_faltas":0,"madrassa_faltas_justificadas":0,"observacoes":null}],"observacoes_gerais":null}`}]}]})});
    const d=await res.json();const text=d.content?.map(b=>b.text||"").join("")||"";
    try{return JSON.parse(text.replace(/```json|```/g,"").trim());}catch{return null;}
  }

  function handleFile(e){const f=e.target.files[0];if(!f)return;setFile(f);setResult(null);setError("");setDone(false);const r=new FileReader();r.onload=ev=>setPreview(ev.target.result);r.readAsDataURL(f);}

  async function analyse(){
    if(!file)return;if(!data.apiKey){setError("Chave API não configurada.");return;}
    setLoading(true);setError("");setResult(null);
    try{const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});const d=await analyzeReport(b64,file.type);if(!d)throw new Error("Não foi possível extrair dados.");setResult({data:d,b64,mime:file.type});}
    catch(e){setError(e.message);}setLoading(false);
  }

  function submit(){
    if(!result)return;
    const su=result.data.alunos||[];
    const report={id:`r_${user.id}_${Date.now()}`,teacherId:user.id,schoolId:user.schoolId,data:result.data,studentUpdates:su,imageBase64:result.b64,imageMime:result.mime,approved:false,createdAt:new Date().toISOString()};
    const updStudents=data.students.map(s=>{const u=su.find(x=>x.codigo===s.code);if(!u)return s;return{...s,stats:{cim_faltas:(s.stats?.cim_faltas||0)+(u.cim_faltas||0),madrassa_presencas:(s.stats?.madrassa_presencas||0)+(u.madrassa_presencas||0),madrassa_faltas:(s.stats?.madrassa_faltas||0)+(u.madrassa_faltas||0),madrassa_fj:(s.stats?.madrassa_fj||0)+(u.madrassa_faltas_justificadas||0)}};});
    save.reports([...data.reports,report]);save.students(updStudents);
    setFile(null);setPreview(null);setResult(null);setDone(true);
  }

  if(done)return(<div style={{textAlign:"center",padding:"4rem 2rem"}}><div style={{width:72,height:72,background:C.greenPale,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:"1.5rem"}}><Icon name="check" size={32} color={C.green} sw={2}/></div><h2 style={{...T.h2,marginBottom:"0.5rem"}}>Relatório submetido</h2><p style={T.body}>O coordenador irá rever em breve.</p><div style={{marginTop:"1.5rem"}}><Btn variant="secondary" onClick={()=>setDone(false)}>Submeter outro</Btn></div></div>);

  return(<div>
    <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>Submeter Relatório Quinzenal</h1></div>
    <div style={{display:"grid",gridTemplateColumns:result?"1fr 1fr":"1fr",gap:"1.5rem"}}>
      <Card>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={handleFile}/>
        <div onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${C.blueMid}`,borderRadius:12,padding:"2.5rem 1rem",textAlign:"center",cursor:"pointer",background:C.blueFaint,marginBottom:"1rem"}}>
          {preview?<img src={preview} style={{maxWidth:"100%",maxHeight:260,borderRadius:8}} alt="preview"/>:<><div style={{width:56,height:56,background:C.bluePale,borderRadius:14,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"}}><Icon name="upload" size={26} color={C.blue}/></div><div style={{fontWeight:600,color:C.blue,marginBottom:4}}>Clica para selecionar ficheiro</div><div style={T.small}>JPG, PNG ou PDF</div></>}
        </div>
        {file&&!result&&<Btn full size="lg" icon="search" onClick={analyse} disabled={loading}>{loading?"A analisar...":"Analisar com IA"}</Btn>}
        {error&&<div style={{display:"flex",alignItems:"center",gap:8,color:C.red,fontSize:"0.84rem",marginTop:"0.8rem",background:C.redPale,borderRadius:8,padding:"0.6rem 0.9rem"}}><Icon name="alert" size={16} color={C.red}/>{error}</div>}
      </Card>
      {result&&<Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1.2rem"}}>
          <div style={{width:36,height:36,background:C.greenPale,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="check" size={18} color={C.green}/></div>
          <div><div style={{fontWeight:700,color:C.green,fontSize:"0.9rem"}}>Dados extraídos</div><div style={T.small}>{result.data.semanas} · {result.data.periodo}</div></div>
        </div>
        <Divider/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem",marginBottom:"1.2rem"}}>
          {[{label:"Aulas CIM",value:result.data.cim?.total_aulas,color:C.blue},{label:"Faltas CIM",value:result.data.cim?.total_faltas,color:C.red},{label:"Sessões Mad.",value:result.data.madrassa?.total_sessoes,color:C.blue},{label:"Presenças Mad.",value:result.data.madrassa?.total_presencas,color:C.green}].map(s=>(
            <div key={s.label} style={{background:C.sand,borderRadius:8,padding:"0.7rem 0.9rem"}}><div style={T.small}>{s.label}</div><div style={{fontSize:"1.4rem",fontWeight:800,color:s.color}}>{s.value??"—"}</div></div>
          ))}
        </div>
        <Btn full variant="success" icon="upload" size="lg" onClick={submit}>Submeter ao Coordenador</Btn>
      </Card>}
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT SHELL
// ═══════════════════════════════════════════════════════════════════════════════
function StudentShell({ user, data, onLogout }) {
  const school=data.schools.find(s=>s.id===user.schoolId);
  const nav=[{id:"card",label:"O Meu Cartão",icon:"card"},{id:"grades",label:"As Minhas Notas",icon:"grades"}];
  return(<Shell user={user} nav={nav} onLogout={onLogout} subtitle={school?.name}>
    {({tab})=><>{tab==="card"&&<MyStudentCard user={user} data={data}/>}{tab==="grades"&&<MyStudentGrades user={user} data={data}/>}</>}
  </Shell>);
}

function MyStudentCard({ user, data }) {
  const {classes,teachers,schools}=data;
  const cls=classes.find(c=>c.id===user.classId); const teacher=teachers.find(t=>t.id===cls?.teacherId); const school=schools.find(s=>s.id===user.schoolId);
  return(<div style={{maxWidth:480,margin:"0 auto"}}>
    <div style={{marginBottom:"1.5rem"}}><h1 style={T.h1}>O Meu Cartão</h1></div>
    <div style={{background:`linear-gradient(135deg,${C.navy} 0%,${C.blue} 100%)`,borderRadius:20,padding:"2rem",boxShadow:"0 16px 48px rgba(10,22,40,0.25)",position:"relative",overflow:"hidden",marginBottom:"1.5rem"}}>
      <svg style={{position:"absolute",top:0,right:0,opacity:0.08}} width="200" height="200" viewBox="0 0 200 200"><circle cx="160" cy="40" r="100" stroke="white" strokeWidth="1" fill="none"/><circle cx="160" cy="40" r="60" stroke="white" strokeWidth="1" fill="none"/></svg>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.8rem"}}>
        <Icon name="mosque" size={28} color="rgba(255,255,255,0.8)" sw={1.4}/>
        <div><div style={{color:C.white,fontWeight:800,fontSize:"1.1rem"}}>C.I.M</div><div style={{color:"rgba(255,255,255,0.5)",fontSize:"0.72rem"}}>{school?.name||"Centro Islâmico"}</div></div>
        <div style={{marginLeft:"auto",background:"rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 10px"}}><span style={{color:"rgba(255,255,255,0.7)",fontSize:"0.72rem",fontWeight:700}}>{cls?.year||"2025/2026"}</span></div>
      </div>
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Nome</div>
        <div style={{color:C.white,fontSize:"1.5rem",fontWeight:700}}>{user.name}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.2rem"}}>
        {[["Nº de Aluno",<span style={{fontFamily:"'Courier New',monospace",fontWeight:800,fontSize:"1.1rem"}}>{user.code}</span>],["Turma",cls?.name||"—"],["Professor",teacher?.name||"—"],["Acesso",`${user.code} / ${user.name.split(" ")[0]}`]].map(([label,value])=>(
          <div key={label}><div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>{label}</div><div style={{color:C.white,fontWeight:600,fontSize:"0.9rem"}}>{value}</div></div>
        ))}
      </div>
    </div>
    <p style={{...T.small,textAlign:"center"}}>O teu acesso é o número CIM e o teu primeiro nome.</p>
  </div>);
}

function MyStudentGrades({ user, data }) {
  const {classes}=data;
  const cls=classes.find(c=>c.id===user.classId);
  const subjects=cls?.subjects||[]; const isMadrassa=cls?.type==="madrassa";
  const gradeColor=v=>v>=16?C.green:v>=12?C.blue:v>=10?C.amber:C.red;
  return(<div>
    <div style={{marginBottom:"2rem"}}><h1 style={T.h1}>As Minhas Notas</h1>{cls&&<p style={{...T.body,marginTop:4}}>{cls.name}</p>}</div>
    {subjects.map(subj=>{
      const g=user.grades?.[subj.id]||{};
      const fn=isMadrassa?madTrimAvg:trimAvg;
      const t1=fn(g,1),t2=fn(g,2),t3=fn(g,3),mF=avg(t1,t2,t3);
      const canExam=mF!==null&&mF>=12;
      const fields=isMadrassa?[["Tajwid",`tajwid`],["Hifz",`hifz`],["Recit.",`recitacao`]]:[["1ªAS",`1as`],["2ªAS",`2as`],["AT",`at`]];
      return(<Card key={subj.id} style={{marginBottom:"1rem",overflow:"hidden",padding:0}}>
        <div style={{background:isMadrassa?C.green:C.navy,padding:"0.75rem 1.2rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:C.white,fontWeight:700}}>{subj.name}</span>
          <span style={{color:"rgba(255,255,255,0.5)",fontSize:"0.82rem"}}>Faltas: {g.faltas??0}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",borderBottom:`1px solid ${C.line}`}}>
          {[1,2,3].map(t=>{const tAvg=[t1,t2,t3][t-1];return(
            <div key={t} style={{padding:"1rem",borderRight:t<3?`1px solid ${C.line}`:undefined,textAlign:"center"}}>
              <div style={{...T.label,marginBottom:8}}>T{t}</div>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8}}>
                {fields.map(([fl,fk])=>(
                  <div key={fk} style={{textAlign:"center"}}>
                    <div style={{...T.small,fontSize:"0.62rem",marginBottom:2}}>{fl}</div>
                    <div style={{fontWeight:700,fontSize:"0.95rem",color:g[`t${t}_${fk}`]!=null?gradeColor(g[`t${t}_${fk}`]):C.slateLight}}>{g[`t${t}_${fk}`]??<span style={{color:C.slateLight}}>—</span>}</div>
                  </div>
                ))}
              </div>
              <div style={{fontWeight:700,fontSize:"1rem",color:tAvg!=null?gradeColor(tAvg):C.slateLight}}>{tAvg!=null?tAvg:"—"}</div>
            </div>
          );})}
        </div>
        <div style={{display:"grid",gridTemplateColumns:canExam?"1fr 1fr":"1fr"}}>
          <div style={{padding:"1rem",textAlign:"center",background:mF!==null&&mF>=12?C.greenPale:mF!==null?C.redPale:C.sand}}>
            <div style={{...T.label,marginBottom:4}}>Média Final</div>
            <div style={{fontSize:"2rem",fontWeight:800,color:mF!=null?gradeColor(mF):C.slateLight}}>{mF!=null?mF:"—"}</div>
          </div>
          {canExam&&<div style={{padding:"1rem",textAlign:"center",background:C.purplePale}}>
            <div style={{...T.label,marginBottom:4,color:C.purple}}>Exame Final</div>
            <div style={{fontSize:"2rem",fontWeight:800,color:g.exame_final!=null?gradeColor(g.exame_final):C.slateLight}}>{g.exame_final!=null?g.exame_final:"—"}</div>
          </div>}
        </div>
      </Card>);
    })}
    {subjects.length===0&&<p style={T.body}>Nenhuma disciplina atribuída ainda.</p>}
  </div>);
}
