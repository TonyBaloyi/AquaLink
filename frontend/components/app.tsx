 "use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle, BarChart3, Bell, BookOpen, CreditCard, Droplets, FileText, Gauge,
  Home, LayoutDashboard, LogOut, Menu, RefreshCw, Search, Settings, ShieldCheck,
  Users, X, Zap
} from "lucide-react"
import { authApi, clearSession, getStoredProfile, getStoredUser, saveSession } from "@/lib/api"
import { supplierService, householdService, boreholeService, subscriptionService, paymentService, readingService, alertService, reportService } from "@/lib/services"

type User = { id:string; name:string; email:string; phone?:string; role:"admin"|"supplier"|"household"; status:string }
type View = "dashboard"|"suppliers"|"households"|"boreholes"|"subscriptions"|"payments"|"water"|"tanks"|"alerts"|"reports"|"settings"

const navAdmin = [
  ["dashboard","Overview",LayoutDashboard],["suppliers","Suppliers",Users],["households","Households",Home],
  ["boreholes","Boreholes",Droplets],["subscriptions","Subscriptions",BookOpen],["payments","Payments",CreditCard],
  ["water","Water usage",Gauge],["tanks","Tanks",Droplets],["alerts","Alerts",AlertTriangle],["reports","Reports",BarChart3],["settings","Settings",Settings]
] as const
const navSupplier = [
  ["dashboard","My overview",LayoutDashboard],["households","Households",Home],["boreholes","My boreholes",Droplets],
  ["subscriptions","Subscriptions",BookOpen],["payments","Payments",CreditCard],["water","Water usage",Gauge],["tanks","Tank monitoring",Droplets],["alerts","Alerts",AlertTriangle],["settings","Profile & security",Settings]
] as const

function money(v:any){ return `R${Number(v||0).toLocaleString("en-ZA",{minimumFractionDigits:0,maximumFractionDigits:0})}` }
function fmtDate(v:any){ if(!v) return "—"; return new Date(v).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"}) }
function initials(name:string){ return name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase() }

/**
 * Safely normalize API list responses.
 *
 * api.ts already unwraps the backend { data: ... } envelope,
 * so list endpoints normally return arrays directly.
 *
 * This helper also supports an accidentally wrapped response,
 * preventing screens from silently showing "No records found".
 */
function listOf<T=any>(value:any):T[]{
  if(Array.isArray(value)) return value
  if(Array.isArray(value?.data)) return value.data
  return []
}

export default function AquaLinkApp(){
  const [user,setUser]=useState<User|null>(getStoredUser())
  const [view,setView]=useState<View>("dashboard")
  const [loginError,setLoginError]=useState("")
  const [loading,setLoading]=useState(false)
  const [mobileNav,setMobileNav]=useState(false)

  async function login(email:string,password:string,userType:string){
    setLoading(true); setLoginError("")
    try {
      const data=await authApi.login({email,password,userType})
      saveSession(data); setUser(data.user); setView("dashboard")
    } catch(e:any){ setLoginError(e.message || "Unable to sign in.") }
    finally{ setLoading(false) }
  }
  async function logout(){
    try { await authApi.logout() } catch {}
    clearSession(); setUser(null)
  }

  if(!user) return <Login onLogin={login} loading={loading} error={loginError}/>

  const nav=user.role==="admin"?navAdmin:navSupplier
  const activeLabel=nav.find(n=>n[0]===view)?.[1] || "Overview"

  return <div className="app">
    <aside className={`sidebar ${mobileNav?"open":""}`}>
      <div className="brand"><div className="logo-mark">A</div><div><strong>AquaLink</strong><small>Water network operations</small></div></div>
      <nav className="nav">
        <div className="nav-label">Workspace</div>
        {nav.map(([key,label,Icon])=><button key={key} className={view===key?"active":""} onClick={()=>{setView(key);setMobileNav(false)}}><Icon/><span>{label}</span></button>)}
      </nav>
      <div className="sidebar-footer"><div className="user-mini"><div className="avatar">{initials(user.name)}</div><div><strong>{user.name}</strong><span>{user.role}</span></div></div><button className="nav button" onClick={logout}><LogOut/><span>Sign out</span></button></div>
    </aside>

    <div className="main">
      <header className="topbar">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button className="icon-btn mobile-menu" onClick={()=>setMobileNav(!mobileNav)}><Menu size={18}/></button>
          <div className="page-title"><h1>{activeLabel}</h1><p>Manage the AquaLink water network with live operational data.</p></div>
        </div>
        <div className="top-actions">
          <button className="icon-btn notification-dot" title="Alerts" onClick={()=>setView("alerts")}><Bell size={18}/></button>
          <div className="avatar">{initials(user.name)}</div>
        </div>
      </header>
      <main className="content">
        <ViewRenderer user={user} view={view} onNavigate={setView}/>
      </main>
    </div>
  </div>
}

function Login({onLogin,loading,error}:{onLogin:(e:string,p:string,t:string)=>void;loading:boolean;error:string}){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [type,setType]=useState("admin")
  const [show,setShow]=useState(false); const [forgot,setForgot]=useState(false); const [message,setMessage]=useState("")
  async function reset(){
    try { await authApi.forgotPassword(email); setMessage("If the account exists, a password-reset email has been requested.") }
    catch(e:any){ setMessage(e.message||"Unable to request reset.") }
  }
  return <div className="login-shell">
    <section className="login-visual">
      <div className="brand" style={{padding:0}}><div className="logo-mark">A</div><div><strong>AquaLink</strong><small style={{color:"#cfe3ff"}}>Water network operations</small></div></div>
      <h1>Water infrastructure, clearly managed.</h1>
      <p>AquaLink connects suppliers, households, boreholes, tanks, payments and operational alerts in one working view.</p>
      <div className="login-points">
        {["Supplier and household management","Live tank and water-usage monitoring","Payments, subscriptions and operational alerts"].map(x=><div className="login-point" key={x}><b>✓</b>{x}</div>)}
      </div>
    </section>
    <section className="login-box"><div className="login-card">
      <h2>{forgot?"Reset access":"Welcome back"}</h2>
      <div className="sub">{forgot?"Enter your email and we’ll request a secure reset link.":"Sign in to the AquaLink operations platform."}</div>
      {error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}
      <div className="form-group"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="name@example.com"/></div>
      {!forgot&&<><div className="form-group"><label>Password</label><div style={{display:"flex",gap:7}}><input style={{flex:1}} value={password} onChange={e=>setPassword(e.target.value)} type={show?"text":"password"} placeholder="••••••••"/><button className="btn" type="button" onClick={()=>setShow(!show)}>{show?"Hide":"Show"}</button></div></div>
      <div className="form-group"><label>Account type</label><select value={type} onChange={e=>setType(e.target.value)}><option value="admin">Administrator</option><option value="supplier">Water supplier</option><option value="household">Household</option></select></div>
      <button className="login-btn" disabled={loading} onClick={()=>onLogin(email,password,type)}>{loading?"Signing in…":"Sign in"}</button>
      <button className="btn" style={{width:"100%",marginTop:10}} onClick={()=>setForgot(true)}>Forgot password?</button></>}
      {forgot&&<><button className="login-btn" onClick={reset}>Request reset email</button><button className="btn" style={{width:"100%",marginTop:10}} onClick={()=>setForgot(false)}>Back to sign in</button></>}
      <div className="footer-note">Credentials are handled by the AquaLink backend and Supabase Auth.</div>
    </div></section>
  </div>
}

function ViewRenderer({user,view,onNavigate}:{user:User;view:View;onNavigate:(v:View)=>void}){
  switch(view){
    case "dashboard": return <Dashboard user={user} onNavigate={onNavigate}/>
    case "suppliers": return <Suppliers/>
    case "households": return <Households user={user}/>
    case "boreholes": return <Boreholes/>
    case "subscriptions": return <Subscriptions/>
    case "payments": return <Payments/>
    case "water": return <WaterUsage/>
    case "tanks": return <Tanks/>
    case "alerts": return <Alerts/>
    case "reports": return <Reports/>
    case "settings": return <SettingsView user={user}/>
  }
}

function Dashboard({user,onNavigate}:{user:User;onNavigate:(v:View)=>void}){
  const [data,setData]=useState<any>(null); const [alerts,setAlerts]=useState<any>(null); const [usage,setUsage]=useState<any[]>([]); const [error,setError]=useState("")
  const [busy,setBusy]=useState(true)
  async function load(){
    setBusy(true); setError("")
    try{
      if(user.role==="admin"){ const [o,a,u]=await Promise.all([reportService.overview(),alertService.list("status=open&limit=5"),readingService.usage("granularity=day&days=14")]); setData(o); setAlerts(a); setUsage(listOf(u)) }
      else { const [d,a,u]=await Promise.all([supplierService.dashboard(),alertService.list("status=open&limit=5"),readingService.usage("granularity=day&days=14")]); setData(d); setAlerts(a); setUsage(listOf(u)) }
    }catch(e:any){setError(e.message||"Could not load dashboard.")}
    finally{setBusy(false)}
  }
  useEffect(()=>{load()},[])
  if(busy) return <Loading/>
  if(error) return <ErrorState message={error} retry={load}/>
  const stats=user.role==="admin"?[
    ["Active suppliers",data?.active_suppliers||0,Users],["Active households",data?.active_households||0,Home],["Active subscriptions",data?.active_subscriptions||0,BookOpen],
    ["Water today",`${Number(data?.litres_today||0).toLocaleString()} L`,Droplets],["Collected this month",money(data?.collected_this_month),CreditCard],["Open alerts",data?.open_alerts||0,AlertTriangle]
  ]:[
    ["Boreholes",data?.boreholes||0,Droplets],["Connected households",data?.households||0,Home],["Water today",`${Number(data?.litres_today||0).toLocaleString()} L`,Gauge],
    ["Income this month",money(data?.income_this_month),CreditCard],["Open alerts",data?.open_alerts||0,AlertTriangle],["Tank assets",data?.tanks?.length||0,Droplets]
  ]
  const max=Math.max(...usage.map(x=>Number(x.litres||0)),1)
  return <>
    <div className="grid stats">{stats.map(([label,value,Icon]:any)=><div className="card stat" key={label}><div className="stat-top"><span>{label}</span><div className="stat-icon"><Icon size={17}/></div></div><div className="stat-value">{value}</div><div className="stat-note">{user.role==="admin"?"Current system snapshot":"Your supplier network"}</div></div>)}</div>
    <div className="section-head"><div><h2>Network overview</h2><p>Operational signals from the backend.</p></div><button className="btn small" onClick={load}><RefreshCw size={13}/> Refresh</button></div>
    <div className="grid two-col">
      <div className="card panel"><h3 className="panel-title">Water supplied</h3><div className="panel-subtitle">Daily litres · last 14 days</div>
        {usage.length?<div className="chart">{usage.slice(-14).map((x,i)=><div className="bar" key={i} style={{height:`${Math.max(5,(Number(x.litres||0)/max)*88)}%`}}><span>{new Date(x.period).toLocaleDateString("en-ZA",{day:"2-digit"})}</span></div>)}</div>:<div className="empty"><strong>No readings yet</strong>Water readings will appear here when sensors report data.</div>}
      </div>
      <div className="card panel"><h3 className="panel-title">Open alerts</h3><div className="panel-subtitle">Items requiring attention</div><div style={{marginTop:14}}>{listOf(alerts).length?listOf(alerts).map((a:any)=><AlertRow key={a.id} a={a} onOpen={()=>onNavigate("alerts")}/>):<div className="empty"><strong>All clear</strong>No open alerts were returned.</div>}</div></div>
    </div>
    {user.role==="admin"&&<div className="grid two-col">
      <div className="card panel"><h3 className="panel-title">Financial position</h3><div className="panel-subtitle">Current month and outstanding invoices</div><div style={{display:"flex",gap:34,marginTop:24}}><Metric label="Collected" value={money(data?.collected_this_month)}/><Metric label="Outstanding" value={money(data?.outstanding)}/></div></div>
      <div className="card panel"><h3 className="panel-title">Quick actions</h3><div className="toolbar" style={{marginTop:16}}><button className="btn primary" onClick={()=>onNavigate("suppliers")}><Users size={14}/> Suppliers</button><button className="btn" onClick={()=>onNavigate("households")}><Home size={14}/> Households</button><button className="btn" onClick={()=>onNavigate("alerts")}><AlertTriangle size={14}/> Alerts</button></div></div>
    </div>}
  </>
}

function Metric({label,value}:{label:string,value:any}){return <div><div className="muted" style={{fontSize:11}}>{label}</div><div style={{fontFamily:"Manrope",fontWeight:800,fontSize:24,marginTop:4}}>{value}</div></div>}

function Suppliers(){
  const [res,setRes]=useState<any>(null); const [q,setQ]=useState(""); const [busy,setBusy]=useState(true); const [error,setError]=useState("");
  const [showForm,setShowForm]=useState(false); const [editing,setEditing]=useState<any>(null); const [saving,setSaving]=useState(false); const [formError,setFormError]=useState("");
  const [form,setForm]=useState({name:"",contact_phone:"",contact_email:"",village:"",region:"",account_email:"",account_password:""});
  async function load(){setBusy(true);setError("");try{setRes(await supplierService.list(`search=${encodeURIComponent(q)}&limit=50`))}catch(e:any){setError(e.message||"Could not load suppliers.")}finally{setBusy(false)}}
  useEffect(()=>{load()},[])
  function resetForm(){setForm({name:"",contact_phone:"",contact_email:"",village:"",region:"",account_email:"",account_password:""});setFormError("")}
  function openAdd(){setEditing(null);resetForm();setShowForm(true)}
  function openEdit(s:any){setEditing(s);setForm({name:s.name||"",contact_phone:s.contact_phone||"",contact_email:s.contact_email||"",village:s.village||"",region:s.region||"",account_email:"",account_password:""});setFormError("");setShowForm(true)}
  function closeForm(){if(saving)return;setShowForm(false);setEditing(null);resetForm()}
  function updateField(field:string,value:string){setForm(prev=>({...prev,[field]:value}))}
  async function saveSupplier(e:React.FormEvent){
    e.preventDefault();setFormError("");
    const name=form.name.trim();const contactEmail=form.contact_email.trim();const accountEmail=form.account_email.trim();const accountPassword=form.account_password;
    if(name.length<2){setFormError("Supplier name must contain at least 2 characters.");return}
    if(contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)){setFormError("Please enter a valid contact email address.");return}
    if(!editing&&accountEmail){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)){setFormError("Please enter a valid login email address.");return}if(accountPassword.length<8){setFormError("Login password must be at least 8 characters.");return}}
    if(!editing&&accountPassword&&!accountEmail){setFormError("Enter a login email if you want to create a supplier login.");return}
    setSaving(true);
    try{const body:any={name,contact_phone:form.contact_phone.trim()||undefined,contact_email:contactEmail||undefined,village:form.village.trim()||undefined,region:form.region.trim()||undefined};if(!editing&&accountEmail)body.account={email:accountEmail,password:accountPassword};if(editing)await supplierService.update(editing.id,body);else await supplierService.create(body);setShowForm(false);setEditing(null);resetForm();await load()}catch(e:any){setFormError(e.message||"Could not save supplier.")}finally{setSaving(false)}}
  async function deleteSupplier(s:any){if(!window.confirm(`Delete supplier "${s.name}"?\n\nThis action cannot be undone.`))return;try{setError("");setBusy(true);await supplierService.remove(s.id);await load()}catch(e:any){setError(e.message||"Could not delete supplier.");setBusy(false)}}
  return <>
    <DataScreen title="Supplier network" subtitle="Borehole owners and their connected infrastructure." toolbar={<><input className="input search" placeholder="Search suppliers or villages…" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")load()}}/><button className="btn primary" onClick={load}><Search size={14}/> Search</button><button className="btn primary" onClick={openAdd}>+ Add Supplier</button></>}>
      {busy?<Loading/>:error?<ErrorState message={error} retry={load}/>:<Table rows={listOf(res)} columns={["Supplier","Contact","Village / region","Boreholes","Households","Status","Actions"]} render={(s:any)=><tr key={s.id}><td><strong>{s.name}</strong><div className="muted">{s.id.slice(0,8)}…</div></td><td>{s.contact_phone||"—"}<div className="muted">{s.contact_email||s.user_email||"—"}</div></td><td>{s.village||"—"}{s.region&&<div className="muted">{s.region}</div>}</td><td>{s.borehole_count||0}</td><td>{s.household_count||0}</td><td><Badge value={s.status}/></td><td><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="btn small" onClick={()=>openEdit(s)}>Edit</button><button className="btn small" onClick={()=>deleteSupplier(s)}>Delete</button></div></td></tr>}/>} 
    </DataScreen>
    {showForm&&<div className="card panel" style={{marginTop:16}}><div className="section-head" style={{marginTop:0}}><div><h2>{editing?"Edit Supplier":"Add Supplier"}</h2><p>{editing?"Update the supplier's information.":"Register a new borehole supplier."}</p></div><button className="icon-btn" type="button" onClick={closeForm} disabled={saving} title="Close"><X size={17}/></button></div>
      <form onSubmit={saveSupplier}><div className="grid two-col">
        <div className="form-group"><label>Supplier name</label><input className="input" value={form.name} onChange={e=>updateField("name",e.target.value)} placeholder="e.g. Thabo Water Services" required/></div>
        <div className="form-group"><label>Phone number</label><input className="input" value={form.contact_phone} onChange={e=>updateField("contact_phone",e.target.value)} placeholder="e.g. 082 123 4567"/></div>
        <div className="form-group"><label>Contact email</label><input className="input" type="email" value={form.contact_email} onChange={e=>updateField("contact_email",e.target.value)} placeholder="supplier@example.com"/></div>
        <div className="form-group"><label>Village</label><input className="input" value={form.village} onChange={e=>updateField("village",e.target.value)} placeholder="e.g. Mankweng"/></div>
        <div className="form-group"><label>Region</label><input className="input" value={form.region} onChange={e=>updateField("region",e.target.value)} placeholder="e.g. Limpopo"/></div>
      </div>
      {!editing&&<><div className="section-head" style={{marginTop:24}}><div><h2 style={{fontSize:16}}>Supplier login</h2><p>Optional. Fill in both fields to create a supplier login account.</p></div></div><div className="grid two-col"><div className="form-group"><label>Login email</label><input className="input" type="email" value={form.account_email} onChange={e=>updateField("account_email",e.target.value)} placeholder="supplier-login@example.com"/></div><div className="form-group"><label>Login password</label><input className="input" type="password" value={form.account_password} onChange={e=>updateField("account_password",e.target.value)} placeholder="Minimum 8 characters"/></div></div></>}
      {formError&&<div className="error" style={{marginTop:16}}>{formError}</div>}<div className="toolbar" style={{marginTop:18}}><button className="btn primary" type="submit" disabled={saving}>{saving?(editing?"Saving…":"Creating…"):(editing?"Save Changes":"Create Supplier")}</button><button className="btn" type="button" onClick={closeForm} disabled={saving}>Cancel</button></div></form>
    </div>}
  </>
}

function Households({user}:{user:User}){
  const [res,setRes]=useState<any>(null)
  const [boreholes,setBoreholes]=useState<any[]>([])
  const [busy,setBusy]=useState(true)
  const [error,setError]=useState("")
  const [search,setSearch]=useState("")
  const [showForm,setShowForm]=useState(false)
  const [editing,setEditing]=useState<any>(null)
  const [saving,setSaving]=useState(false)
  const [actionError,setActionError]=useState("")

  const [form,setForm]=useState<any>({
    address:"",
    village:"",
    household_size:1,
    meter_number:"",
    borehole_id:"",
    account_name:"",
    account_email:"",
    account_phone:"",
    account_password:""
  })

  async function load(){
    setBusy(true)
    setError("")

    try{
      const [households,boreholeData]=await Promise.all([
        householdService.list(search ? `limit=100&search=${encodeURIComponent(search)}` : "limit=100"),
        boreholeService.list("limit=100")
      ])

      setRes(households)
      setBoreholes(listOf(boreholeData))
    }catch(e:any){
      setError(e.message || "Failed to load households")
    }finally{
      setBusy(false)
    }
  }

  useEffect(()=>{
    load()
  },[])

  function openCreate(){
    setEditing(null)
    setActionError("")
    setForm({
      address:"",
      village:"",
      household_size:1,
      meter_number:"",
      borehole_id:"",
      account_name:"",
      account_email:"",
      account_phone:"",
      account_password:""
    })
    setShowForm(true)
  }

  function openEdit(h:any){
    setEditing(h)
    setActionError("")
    setForm({
      address:h.address || "",
      village:h.village || "",
      household_size:h.household_size || 1,
      meter_number:h.meter_number || "",
      borehole_id:h.borehole_id || "",
      account_name:"",
      account_email:"",
      account_phone:"",
      account_password:""
    })
    setShowForm(true)
  }

  async function save(){
    setSaving(true)
    setActionError("")

    try{
      if(editing){
        await householdService.update(editing.id,{
          address:form.address,
          village:form.village,
          household_size:Number(form.household_size),
          meter_number:form.meter_number || undefined,
          borehole_id:form.borehole_id || undefined
        })
      }else{
        const body:any={
          address:form.address,
          village:form.village || undefined,
          household_size:Number(form.household_size),
          meter_number:form.meter_number || undefined,
          borehole_id:form.borehole_id || undefined
        }

        if(form.account_email){
          body.account={
            name:form.account_name,
            email:form.account_email,
            phone:form.account_phone || undefined,
            password:form.account_password
          }
        }

        await householdService.create(body)
      }

      setShowForm(false)
      await load()
    }catch(e:any){
      setActionError(e.message || "Failed to save household")
    }finally{
      setSaving(false)
    }
  }

  async function removeHousehold(h:any){
    const confirmed=window.confirm(
      `Delete household "${h.contact_name || h.address}"? This action cannot be undone.`
    )

    if(!confirmed)return

    try{
      await householdService.remove(h.id)
      await load()
    }catch(e:any){
      window.alert(e.message || "Failed to delete household")
    }
  }

  async function changeStatus(h:any,status:string){
    try{
      await householdService.update(h.id,{status})
      await load()
    }catch(e:any){
      window.alert(e.message || "Failed to update household status")
    }
  }

  const rows=listOf(res)

  return <DataScreen
    title="Households"
    subtitle={
      user.role==="admin"
        ?"Manage registered service households, accounts and water connections."
        :"Households connected to your supplier network."
    }
  >
    <div style={{
      display:"flex",
      justifyContent:"space-between",
      alignItems:"center",
      gap:12,
      marginBottom:18,
      flexWrap:"wrap"
    }}>
      <div style={{
        display:"flex",
        gap:8,
        flex:1,
        minWidth:260
      }}>
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          onKeyDown={e=>{
            if(e.key==="Enter")load()
          }}
          placeholder="Search households..."
          className="input"
          style={{flex:1}}
        />

        <button
          className="btn secondary"
          onClick={load}
        >
          Search
        </button>
      </div>

      {user.role==="admin" && (
        <button
          className="btn"
          onClick={openCreate}
        >
          + Add Household
        </button>
      )}
    </div>

    {busy ? (
      <Loading/>
    ) : error ? (
      <ErrorState message={error} retry={load}/>
    ) : (
      <Table
        rows={rows}
        columns={[
          "Household",
          "Contact",
          "Address",
          "Village",
          "Borehole",
          "Subscription",
          "Meter",
          "Status",
          "Actions"
        ]}
        render={(h:any)=>
          <tr key={h.id}>
            <td>
              <strong>
                {h.contact_name || "Unassigned household"}
              </strong>

              {h.household_size && (
                <div className="muted" style={{fontSize:11}}>
                  {h.household_size} people
                </div>
              )}
            </td>

            <td>
              <div>{h.email || "—"}</div>
              <div className="muted" style={{fontSize:11}}>
                {h.phone || "No phone"}
              </div>
            </td>

            <td>{h.address || "—"}</td>

            <td>{h.village || "—"}</td>

            <td>
              {h.borehole_name || "Not assigned"}
            </td>

            <td>
              <Badge value={h.subscription_status || "pending"}/>

              {h.monthly_fee !== null &&
               h.monthly_fee !== undefined && (
                <div className="muted" style={{fontSize:11,marginTop:4}}>
                  R{Number(h.monthly_fee).toFixed(2)}/month
                </div>
              )}
            </td>

            <td>
              {h.meter_number || "—"}
            </td>

            <td>
              <select
                value={h.status || "pending"}
                onChange={e=>changeStatus(h,e.target.value)}
                className="input"
                style={{
                  minWidth:110,
                  padding:"6px 8px",
                  fontSize:12
                }}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </td>

            <td>
              <div style={{
                display:"flex",
                gap:6,
                flexWrap:"wrap"
              }}>
                <button
                  className="btn small"
                  onClick={()=>openEdit(h)}
                >
                  Edit
                </button>

                {user.role==="admin" && (
                  <button
                    className="btn small secondary"
                    onClick={()=>removeHousehold(h)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </td>
          </tr>
        }
      />
    )}

    {showForm && (
      <div className="modal-backdrop">
        <div
          className="card panel"
          style={{
            width:"min(720px,95vw)",
            maxHeight:"90vh",
            overflowY:"auto"
          }}
        >
          <div style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            marginBottom:20
          }}>
            <div>
              <h2 className="panel-title">
                {editing ? "Edit Household" : "Add Household"}
              </h2>

              <div className="panel-subtitle">
                {editing
                  ?"Update the household connection details."
                  :"Register a new household and optionally create its login account."
                }
              </div>
            </div>

            <button
              className="icon-btn"
              onClick={()=>setShowForm(false)}
            >
              ×
            </button>
          </div>

          {actionError && (
            <div className="error" style={{marginBottom:16}}>
              {actionError}
            </div>
          )}

          <div className="grid two-col">

            <div className="form-group">
              <label>Address *</label>
              <input
                className="input"
                value={form.address}
                onChange={e=>setForm({
                  ...form,
                  address:e.target.value
                })}
                placeholder="House number and street"
              />
            </div>

            <div className="form-group">
              <label>Village</label>
              <input
                className="input"
                value={form.village}
                onChange={e=>setForm({
                  ...form,
                  village:e.target.value
                })}
                placeholder="Village"
              />
            </div>

            <div className="form-group">
              <label>Household Size</label>
              <input
                className="input"
                type="number"
                min="1"
                value={form.household_size}
                onChange={e=>setForm({
                  ...form,
                  household_size:e.target.value
                })}
              />
            </div>

            <div className="form-group">
              <label>Meter Number</label>
              <input
                className="input"
                value={form.meter_number}
                onChange={e=>setForm({
                  ...form,
                  meter_number:e.target.value
                })}
                placeholder="e.g. MTR-001"
              />
            </div>

            <div className="form-group">
              <label>Borehole</label>

              <select
                className="input"
                value={form.borehole_id}
                onChange={e=>setForm({
                  ...form,
                  borehole_id:e.target.value
                })}
              >
                <option value="">
                  No borehole assigned
                </option>

                {boreholes.map((b:any)=>(
                  <option
                    key={b.id}
                    value={b.id}
                  >
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {!editing && (
            <>
              <div style={{
                marginTop:26,
                marginBottom:12
              }}>
                <h3 className="panel-title">
                  Household Login Account
                </h3>

                <div className="panel-subtitle">
                  Leave the email blank if the household will not have
                  an online account yet.
                </div>
              </div>

              <div className="grid two-col">

                <div className="form-group">
                  <label>Account Name</label>
                  <input
                    className="input"
                    value={form.account_name}
                    onChange={e=>setForm({
                      ...form,
                      account_name:e.target.value
                    })}
                    placeholder="Full name"
                  />
                </div>

                <div className="form-group">
                  <label>Account Email</label>
                  <input
                    className="input"
                    type="email"
                    value={form.account_email}
                    onChange={e=>setForm({
                      ...form,
                      account_email:e.target.value
                    })}
                    placeholder="household@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    className="input"
                    value={form.account_phone}
                    onChange={e=>setForm({
                      ...form,
                      account_phone:e.target.value
                    })}
                    placeholder="+27..."
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    className="input"
                    type="password"
                    value={form.account_password}
                    onChange={e=>setForm({
                      ...form,
                      account_password:e.target.value
                    })}
                    placeholder="Minimum 8 characters"
                  />
                </div>

              </div>
            </>
          )}

          <div style={{
            display:"flex",
            justifyContent:"flex-end",
            gap:10,
            marginTop:26
          }}>
            <button
              className="btn secondary"
              onClick={()=>setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="btn"
              onClick={save}
              disabled={
                saving ||
                !form.address ||
                (!editing &&
                  form.account_email &&
                  (!form.account_name ||
                   !form.account_password))
              }
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Create Household"
              }
            </button>
          </div>

        </div>
      </div>
    )}
  </DataScreen>
}

function Boreholes(){
  const [res,setRes]=useState<any>(null); const [busy,setBusy]=useState(true); const [error,setError]=useState("")
  async function load(){setBusy(true);try{setRes(await boreholeService.list("limit=100"))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
  useEffect(()=>{load()},[])
  return <DataScreen title="Boreholes" subtitle="Source infrastructure, tank capacity and connected households.">
    {busy?<Loading/>:error?<ErrorState message={error} retry={load}/>:<Table rows={listOf(res)} columns={["Borehole","Supplier","Location","Capacity","Yield","Households","Status"]} render={(b:any)=><tr key={b.id}><td><strong>{b.name}</strong></td><td>{b.supplier_name||"—"}</td><td>{b.location||"—"}</td><td>{Number(b.tank_capacity_litres||0).toLocaleString()} L</td><td>{b.yield_litres_per_hour?`${Number(b.yield_litres_per_hour).toLocaleString()} L/h`:"—"}</td><td>{b.household_count||0}</td><td><Badge value={b.status}/></td></tr>}/>}
  </DataScreen>
}

function Subscriptions(){
  const [res,setRes]=useState<any>(null); const [plans,setPlans]=useState<any[]>([]); const [busy,setBusy]=useState(true); const [error,setError]=useState("")
  async function load(){setBusy(true);try{const [s,p]=await Promise.all([subscriptionService.list("limit=100"),subscriptionService.plans()]);setRes(s);setPlans(listOf(p))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
  useEffect(()=>{load()},[])
  return <><DataScreen title="Subscriptions" subtitle="Plans and household service agreements."><div className="grid three-col">{plans.map(p=><div className="card panel" key={p.id}><div className="muted" style={{fontSize:11}}>Plan</div><h3 className="panel-title" style={{fontSize:16,marginTop:4}}>{p.name}</h3><div style={{fontFamily:"Manrope",fontWeight:800,fontSize:25,marginTop:14}}>{money(p.monthly_fee)}<span className="muted" style={{fontSize:11,fontFamily:"DM Sans"}}>/ month</span></div><p className="muted" style={{fontSize:11,lineHeight:1.5}}>{p.litres_included?.toLocaleString()} L included · {p.rate_per_extra_litre||0} / extra litre</p></div>)}</div></DataScreen>
    <DataScreen title="Active agreements" subtitle="Latest subscription records.">{busy?<Loading/>:error?<ErrorState message={error} retry={load}/>:<Table rows={listOf(res)} columns={["Household","Plan","Monthly fee","Start","Next billing","Status"]} render={(s:any)=><tr key={s.id}><td>{s.address}</td><td><strong>{s.plan_name}</strong></td><td>{money(s.monthly_fee)}</td><td>{fmtDate(s.start_date)}</td><td>{fmtDate(s.next_billing_date)}</td><td><Badge value={s.status}/></td></tr>}/>}</DataScreen>
  </>
}

function Payments(){
  const [res,setRes]=useState<any>(null); const [busy,setBusy]=useState(true); const [error,setError]=useState("")
  async function load(){setBusy(true);try{setRes(await paymentService.list("limit=100"))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
  useEffect(()=>{load()},[])
  return <DataScreen title="Payments" subtitle="Invoices, collections and payment status.">{busy?<Loading/>:error?<ErrorState message={error} retry={load}/>:<Table rows={listOf(res)} columns={["Payer","Amount","Method","Reference","Period","Status","Paid"]} render={(p:any)=><tr key={p.id}><td><strong>{p.payer_name||p.address}</strong><div className="muted">{p.email||""}</div></td><td>{money(p.amount)}</td><td>{p.method||"—"}</td><td>{p.reference||"Pending"}</td><td>{fmtDate(p.period_start)} – {fmtDate(p.period_end)}</td><td><Badge value={p.status}/></td><td>{fmtDate(p.paid_at)}</td></tr>}/>}</DataScreen>
}

function WaterUsage(){
  const [res,setRes]=useState<any[]>([]); const [days,setDays]=useState("30"); const [busy,setBusy]=useState(true); const [error,setError]=useState("")
  async function load(){setBusy(true);try{setRes(listOf(await readingService.usage(`granularity=day&days=${days}`)))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
  useEffect(()=>{load()},[days])
  const max=Math.max(...res.map(x=>Number(x.litres||0)),1)
  return <DataScreen title="Water usage" subtitle="Sensor-derived supply volume and average tank levels." toolbar={<select className="select" value={days} onChange={e=>setDays(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>}>{busy?<Loading/>:error?<ErrorState message={error} retry={load}/>:<><div className="card panel"><h3 className="panel-title">Supply volume</h3><div className="panel-subtitle">Litres supplied per day</div>{res.length?<div className="chart">{res.slice(-30).map((x,i)=><div className="bar" key={i} style={{height:`${Math.max(4,(Number(x.litres||0)/max)*88)}%`}}><span>{new Date(x.period).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</span></div>)}</div>:<div className="empty"><strong>No readings</strong>Sensor readings will populate this chart.</div>}</div><div className="card panel" style={{marginTop:16}}><Table rows={res} columns={["Period","Litres","Average tank level"]} render={(x:any)=><tr key={x.period}><td>{fmtDate(x.period)}</td><td>{Number(x.litres||0).toLocaleString()} L</td><td>{x.avg_tank_level==null?"—":`${Number(x.avg_tank_level).toFixed(1)}%`}</td></tr>}/></div></>}</DataScreen>
}

function Tanks(){
  const [res,setRes]=useState<any>(null); const [busy,setBusy]=useState(true); const [error,setError]=useState("")
  async function load(){setBusy(true);try{setRes(await boreholeService.list("limit=100"))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
  useEffect(()=>{load()},[])
  return <DataScreen title="Tank monitoring" subtitle="Latest buffer-tank readings by borehole.">{busy?<Loading/>:error?<ErrorState message={error} retry={load}/>:<div className="grid three-col">{listOf(res).map((b:any)=><TankCard key={b.id} borehole={b}/>)}</div>}</DataScreen>
}

function TankCard({ borehole }: { borehole: any }) {
  const [tank, setTank] = useState<any>(null);

  useEffect(() => {
    boreholeService
      .tank(borehole.id)
      .then(setTank)
      .catch(() => setTank(null));
  }, [borehole.id]);

  const pct = Number(tank?.water_level_percent || 0);

  const status =
    pct <= 10
      ? "critical"
      : pct <= 25
        ? "warning"
        : "normal";

  return (
    <div className="card panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <h3 className="panel-title">
            {borehole.name}
          </h3>

          <div className="panel-subtitle">
            {Number(
              borehole.tank_capacity_litres || 0
            ).toLocaleString()}{" "}
            L capacity
          </div>
        </div>

        <Badge value={status} />
      </div>

      <div
        className="tank"
        style={{ marginTop: 20 }}
      >
        <div
          className="tank-ring"
          style={
            {
              "--pct": `${pct}%`,
            } as React.CSSProperties
          }
        >
          <strong>{pct}%</strong>
        </div>

        <div>
          <div
            className="muted"
            style={{ fontSize: 11 }}
          >
            Estimated water
          </div>

          <strong
            style={{
              fontFamily: "Manrope",
              fontSize: 20,
            }}
          >
            {Number(
              tank?.estimated_litres || 0
            ).toLocaleString()}{" "}
            L
          </strong>

          <div
            className="muted"
            style={{
              fontSize: 10,
              marginTop: 5,
            }}
          >
            Last reading{" "}
            {fmtDate(tank?.recorded_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Alerts(){
  const [res,setRes]=useState<any>(null); const [busy,setBusy]=useState(true); const [error,setError]=useState("")
  async function load(){setBusy(true);try{setRes(await alertService.list("limit=100"))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
  async function resolve(id:string){try{await alertService.resolve(id);load()}catch(e:any){setError(e.message)}}
  useEffect(()=>{load()},[])
  return <DataScreen title="Alerts & notifications" subtitle="Operational events generated by the AquaLink monitoring layer.">{busy?<Loading/>:error?<ErrorState message={error} retry={load}/>:<Table rows={listOf(res)} columns={["Severity","Type","Message","Asset","Created","Status","Action"]} render={(a:any)=><tr key={a.id}><td><Badge value={a.severity}/></td><td>{a.type.replaceAll("_"," ")}</td><td style={{maxWidth:340,whiteSpace:"normal"}}>{a.message}</td><td>{a.borehole_name||a.household_address||"System"}</td><td>{fmtDate(a.created_at)}</td><td><Badge value={a.status}/></td><td>{a.status!=="resolved"&&<button className="btn small" onClick={()=>resolve(a.id)}>Resolve</button>}</td></tr>}/>}</DataScreen>
}

function Reports(){
  const [overview,setOverview]=useState<any>(null); const [rev,setRev]=useState<any[]>([]); const [usage,setUsage]=useState<any[]>([]); const [top,setTop]=useState<any[]>([]); const [busy,setBusy]=useState(true); const [error,setError]=useState("")
  async function load(){setBusy(true);try{const [o,r,u,t]=await Promise.all([reportService.overview(),reportService.revenue("months=12"),reportService.usage(""),reportService.topConsumers("limit=10&days=30")]);setOverview(o);setRev(listOf(r));setUsage(listOf(u));setTop(listOf(t))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
  useEffect(()=>{load()},[])
  if(busy)return <Loading/>; if(error)return <ErrorState message={error} retry={load}/>
  const max=Math.max(...rev.map(x=>Math.max(Number(x.collected||0),Number(x.outstanding||0))),1)
  return <><div className="grid stats"><div className="card stat"><div className="stat-top">Collected this month</div><div className="stat-value">{money(overview?.collected_this_month)}</div></div><div className="card stat"><div className="stat-top">Outstanding</div><div className="stat-value">{money(overview?.outstanding)}</div></div><div className="card stat"><div className="stat-top">Water this month</div><div className="stat-value">{Number(overview?.litres_this_month||0).toLocaleString()} L</div></div></div><div className="section-head"><div><h2>Revenue trend</h2><p>Collected vs outstanding by month.</p></div><button className="btn small" onClick={load}><RefreshCw size={13}/> Refresh</button></div><div className="card panel"><div className="chart">{rev.map((x,i)=><div key={i} className="bar" style={{height:`${Math.max(5,(Number(x.collected||0)/max)*88)}%`}}><span>{new Date(x.period).toLocaleDateString("en-ZA",{month:"short"})}</span></div>)}</div></div><div className="section-head"><div><h2>Usage by borehole</h2><p>Operational volume over the report period.</p></div></div><div className="card panel"><Table rows={usage} columns={["Borehole","Supplier","Households","Litres supplied"]} render={(x:any)=><tr key={x.borehole_id}><td><strong>{x.borehole_name}</strong></td><td>{x.supplier_name}</td><td>{x.households}</td><td>{Number(x.litres_supplied||0).toLocaleString()} L</td></tr>}/></div><div className="section-head"><div><h2>Highest consumption</h2><p>Useful for operational review and potential leak investigation.</p></div></div><div className="card panel"><Table rows={top} columns={["Household","Meter","Size","Litres","Litres/person"]} render={(x:any)=><tr key={x.id}><td>{x.address}</td><td>{x.meter_number||"—"}</td><td>{x.household_size}</td><td>{Number(x.litres||0).toLocaleString()} L</td><td>{Number(x.litres_per_person||0).toLocaleString()} L</td></tr>}/></div></>
}

function SettingsView({user}:{user:User}){
  const [profile,setProfile]=useState<any>(getStoredProfile()); const [me,setMe]=useState<any>(null)
  useEffect(()=>{authApi.me().then(x=>{setMe(x); if(x.profile)setProfile(x.profile)}).catch(()=>{})},[])
  const u=me?.user||user
  return <><div className="card panel"><h3 className="panel-title">Account</h3><div className="panel-subtitle">Authenticated identity from AquaLink API.</div><div className="grid three-col" style={{marginTop:18}}><div><div className="muted" style={{fontSize:11}}>Name</div><strong>{u.name}</strong></div><div><div className="muted" style={{fontSize:11}}>Email</div><strong>{u.email}</strong></div><div><div className="muted" style={{fontSize:11}}>Role</div><strong style={{textTransform:"capitalize"}}>{u.role}</strong></div></div></div><div className="card panel" style={{marginTop:16}}><h3 className="panel-title">Profile</h3><div className="grid three-col" style={{marginTop:18}}><div><div className="muted" style={{fontSize:11}}>Phone</div><strong>{u.phone||profile?.contact_phone||"Not provided"}</strong></div><div><div className="muted" style={{fontSize:11}}>Status</div><Badge value={u.status}/></div><div><div className="muted" style={{fontSize:11}}>Profile ID</div><strong>{profile?.id?String(profile.id).slice(0,12)+"…":"—"}</strong></div></div></div></>
}

function DataScreen({title,subtitle,toolbar,children}:{title:string;subtitle:string;toolbar?:React.ReactNode;children:React.ReactNode}){
 return <><div className="section-head" style={{marginTop:0}}><div><h2>{title}</h2><p>{subtitle}</p></div></div>{toolbar&&<div className="toolbar">{toolbar}</div>}<div className="card panel">{children}</div></>
}
function Table({rows,columns,render}:{rows:any[];columns:string[];render:(r:any)=>React.ReactNode}){return rows.length?<div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map(render)}</tbody></table></div>:<div className="empty"><strong>No records found</strong>The backend returned no matching records.</div>}
function Badge({value}:{value:any}){return <span className={`badge ${String(value||"").toLowerCase()}`}>{String(value||"unknown").replaceAll("_"," ")}</span>}
function AlertRow({a,onOpen}:{a:any;onOpen:()=>void}){return <div className="alert-item" style={{marginBottom:8}}><div className="alert-icon"><AlertTriangle size={15}/></div><div style={{flex:1}}><strong>{a.message}</strong><p>{a.type?.replaceAll("_"," ")} · {fmtDate(a.created_at)}</p></div><button className="btn small" onClick={onOpen}>View</button></div>}
function Loading(){return <div className="empty"><RefreshCw size={20} style={{animation:"spin 1s linear infinite",marginBottom:10}}/><strong>Loading AquaLink data…</strong>Connecting to the backend.</div>}
function ErrorState({message,retry}:{message:string;retry:()=>void}){return <div className="empty"><AlertTriangle size={24} style={{color:"var(--danger)",marginBottom:8}}/><strong>We couldn’t load this view</strong><div style={{marginBottom:12}}>{message}</div><button className="btn primary" onClick={retry}>Retry</button></div>}
