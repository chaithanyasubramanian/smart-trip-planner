import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, Bookmark, CalendarDays,
  Check, ChevronDown, CircleHelp, Compass, CreditCard, DollarSign, Globe2, LayoutDashboard,
  LogOut, MapPin, Menu, MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sparkles,
  Ticket, Trash2, TrendingUp, Users, Wallet, X, Plane, Mountain, Waves, Landmark, Leaf,
  Clock3, Luggage, SlidersHorizontal, Heart, Pencil, Eye, EyeOff, CloudSun, Languages,
  History, FileText, Bot, Route, ShoppingBag, Clock, Navigation, Sun, AlertTriangle,
  CalendarRange, Hotel, Train, Car, ExternalLink, Download, MapPinned, Compass as CompassIcon
} from "lucide-react";
import "./styles.css";

const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
const dateLabel = (s) => s ? new Date(`${s}T12:00:00`).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Date not set";
const today = () => new Date().toISOString().slice(0, 10);
const api = async (url, options = {}, token) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
};

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, section: "WORKSPACE" },
  { id: "explore", label: "Explore India", icon: Compass },
  { id: "planner", label: "Smart trip planner", icon: Route },
  { id: "trips", label: "My trips", icon: MapPin, countKey: "trips" },
  { id: "expenses", label: "Budget & expenses", icon: Wallet },
  { id: "bookings", label: "Booking reports", icon: Ticket, countKey: "bookings" },
  { id: "history", label: "Travel history", icon: History }
];

const destinationImages = {
  "Kyoto, Japan": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=85",
  "Bali, Indonesia": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85",
  "Lisbon, Portugal": "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=85",
  "Queenstown, New Zealand": "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=900&q=85",
  "Jaipur, India": "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=85",
  "Reykjavik, Iceland": "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=900&q=85"
};
const destinationIcon = { Culture: Landmark, Nature: Leaf, City: Globe2, Adventure: Mountain };
const destinationCategoryImages = {
  'Culture': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=85',
  'Heritage': 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=85',
  'Nature': 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=85',
  'Hill station': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85',
  'Adventure': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85',
  'Coastal': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
  'Island & nature': 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=85',
  'Wildlife': 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=900&q=85',
  'Spiritual': 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=900&q=85',
  'Desert': 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=900&q=85'
};
function destinationImage(d) {
  if (destinationImages[d.name]) return destinationImages[d.name];
  const c = String(d.category || '').toLowerCase();
  if (c.includes('nature') || c.includes('backwater') || c.includes('trek') || c.includes('mountain') || c.includes('hill')) return destinationCategoryImages['Nature'];
  if (c.includes('coast') || c.includes('beach') || c.includes('island')) return destinationCategoryImages['Coastal'];
  if (c.includes('wildlife') || c.includes('bird')) return destinationCategoryImages['Wildlife'];
  if (c.includes('desert')) return destinationCategoryImages['Desert'];
  if (c.includes('spiritual')) return destinationCategoryImages['Spiritual'];
  if (c.includes('culture') || c.includes('heritage') || c.includes('history')) return destinationCategoryImages['Culture'];
  return destinationImages['Jaipur, India'];
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const result = await api(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST", body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password })
      });
      onAuth(result);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell">
    <section className="auth-art">
      <div className="brand brand-light"><span className="brand-mark"><Compass size={20}/></span><span>tripwise</span></div>
      <div className="auth-art-copy">
        <span className="eyebrow light-eyebrow"><Sparkles size={14}/> YOUR NEXT CHAPTER STARTS HERE</span>
        <h1>Make room for<br/>the <em>unexpected.</em></h1>
        <p>Thoughtful trip planning, all in one place. Spend less time organizing and more time out there.</p>
      </div>
      <div className="auth-photo-credit"><span className="photo-dot"/> Inspired by places that stay with you</div>
      <div className="auth-art-image" />
    </section>
    <section className="auth-panel">
      <div className="auth-mobile-brand brand"><span className="brand-mark"><Compass size={20}/></span><span>tripwise</span></div>
      <div className="auth-form-wrap">
        <div className="auth-heading"><span className="eyebrow">WELCOME {mode === "login" ? "BACK" : "ABOARD"}</span><h2>{mode === "login" ? "Your world awaits." : "Start your journey."}</h2><p>{mode === "login" ? "Sign in to pick up right where you left off." : "Create an account to bring your travel ideas together."}</p></div>
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && <label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required autoComplete="name"/></label>}
          <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></label>
          <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="register" ? "At least 8 characters" : "Enter your password"} minLength={mode==="register" ? 8 : 1} required autoComplete={mode==="login" ? "current-password" : "new-password"}/><button type="button" className="icon-button password-toggle" onClick={()=>setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary button-wide" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={17}/></button>
        </form>
        <div className="auth-switch">{mode === "login" ? "New around here?" : "Already have an account?"} <button onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}}>{mode==="login"?"Create an account":"Sign in"}</button></div>
        <div className="auth-assurance"><ShieldCheck size={15}/> Your trips are private to your account</div>
      </div>
      <div className="auth-footer">© 2026 Tripwise <span>Made for the way you wander.</span></div>
    </section>
  </main>;
}

function App() {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tripwise-session") || "null"); } catch { return null; }
  });
  const [page, setPage] = useState("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [user, setUser] = useState(auth?.user || null);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(Boolean(auth?.token));
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All places");
  const [refreshKey, setRefreshKey] = useState(0);
  const [language, setLanguage] = useState(() => localStorage.getItem("tripwise-language") || "English");

  const notify = useCallback((message) => { setToast(message); window.setTimeout(() => setToast(""), 3000); }, []);
  const token = auth?.token;
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [me, t, e, b, d] = await Promise.all([
        api("/api/auth/me", {}, token), api("/api/trips", {}, token), api("/api/expenses", {}, token),
        api("/api/bookings", {}, token), api("/api/destinations")
      ]);
      setUser(me.user); setTrips(t.trips); setExpenses(e.expenses); setBookings(b.bookings); setDestinations(d.destinations);
    } catch (err) {
      if (/session expired|authentication required|account not found/i.test(err.message)) logout();
      else notify(err.message);
    } finally { setLoading(false); }
  }, [token, refreshKey]);
  useEffect(() => { if (token) load(); else api("/api/destinations").then(d=>setDestinations(d.destinations)).catch(()=>{}); }, [token, load]);
  function onAuth(result) {
    const next = { token: result.token, user: result.user };
    localStorage.setItem("tripwise-session", JSON.stringify(next)); setAuth(next); setUser(result.user); setPage("overview");
  }
  function logout() { localStorage.removeItem("tripwise-session"); setAuth(null); setUser(null); setTrips([]); setExpenses([]); setBookings([]); setPage("overview"); }
  const stats = useMemo(() => ({
    trips: trips.length,
    upcoming: trips.filter(t=>t.startDate >= today()).length,
    spent: expenses.reduce((sum,e)=>sum+Number(e.amount),0),
    bookings: bookings.length
  }), [trips, expenses, bookings]);
  const spentForTrip = (tripId) => expenses.filter(e=>e.tripId===tripId).reduce((s,e)=>s+Number(e.amount),0);
  const activeTrip = trips.filter(t=>t.startDate >= today()).sort((a,b)=>a.startDate.localeCompare(b.startDate))[0];
  const filteredDestinations = destinations.filter(d => (category==="All places" || d.category===category) && `${d.name} ${d.state || ""} ${d.country} ${d.description}`.toLowerCase().includes(search.toLowerCase()));

  async function createTrip(data) {
    const result = await api("/api/trips", { method:"POST", body:JSON.stringify(data) }, token);
    setTrips(v=>[...v,result.trip].sort((a,b)=>a.startDate.localeCompare(b.startDate)));
    setModal(null); setPage("trips"); notify("Your trip has been created.");
  }
  async function updateTrip(id, data) {
    const result = await api(`/api/trips/${id}`, {method:"PUT", body:JSON.stringify(data)}, token);
    setTrips(v=>v.map(t=>t.id===id?result.trip:t)); setModal(null); notify("Trip details updated.");
  }
  async function deleteTrip(id) {
    if (!window.confirm("Delete this trip and its linked expenses and bookings?")) return;
    await api(`/api/trips/${id}`, {method:"DELETE"}, token);
    setTrips(v=>v.filter(t=>t.id!==id)); setExpenses(v=>v.filter(e=>e.tripId!==id)); setBookings(v=>v.filter(b=>b.tripId!==id)); notify("Trip deleted.");
  }
  async function createExpense(data) {
    const result=await api("/api/expenses",{method:"POST",body:JSON.stringify(data)},token);
    setExpenses(v=>[result.expense,...v]); setModal(null); notify("Expense added.");
  }
  async function deleteExpense(id) {
    await api(`/api/expenses/${id}`,{method:"DELETE"},token); setExpenses(v=>v.filter(e=>e.id!==id)); notify("Expense removed.");
  }
  async function createBooking(data) {
    const result=await api("/api/bookings",{method:"POST",body:JSON.stringify(data)},token);
    setBookings(v=>[result.booking,...v]); setModal(null); notify("Booking saved to your trip.");
  }
  async function deleteBooking(id) {
    await api(`/api/bookings/${id}`,{method:"DELETE"},token); setBookings(v=>v.filter(b=>b.id!==id)); notify("Saved booking removed.");
  }
  if (!auth?.token) return <AuthScreen onAuth={onAuth}/>;

  const visibleNavItems = [...navItems, ...(user?.role === "admin" ? [{ id: "admin", label: "Admin panel", icon: ShieldCheck, section: "ADMINISTRATION" }] : [])];
  const currentNav = visibleNavItems.find(n=>n.id===page);
  return <div className="app-shell">
    {mobileNav && <button className="mobile-scrim" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
    <aside className={`sidebar ${mobileNav?"sidebar-open":""}`}>
      <div className="brand"><span className="brand-mark"><Compass size={20}/></span><span>tripwise</span><span className="brand-beta">BETA</span></div>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav className="main-nav">
        {visibleNavItems.map((item,i)=><React.Fragment key={item.id}>
          {item.section && <div className="nav-section">{item.section}</div>}
          <button className={`nav-link ${page===item.id?"active":""}`} onClick={()=>{setPage(item.id);setMobileNav(false);}}>
            <item.icon size={18} strokeWidth={1.8}/><span>{item.label}</span>
            {item.countKey && (item.countKey==="trips"?trips.length:bookings.length)>0 && <span className="nav-count">{item.countKey==="trips"?trips.length:bookings.length}</span>}
          </button>
        </React.Fragment>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>Your next great trip is just a few clicks away.</p><button onClick={()=>notify("Tip: create a trip, then connect expenses and saved bookings to it.")}>Quick tips <ArrowRight size={14}/></button></div>
        <div className="sidebar-profile"><div className="avatar">{(user?.name||"T").slice(0,1).toUpperCase()}</div><div className="profile-text"><strong>{user?.name||"Traveler"}</strong><span>{user?.email||"Your account"}</span></div><button className="icon-button logout-button" title="Sign out" onClick={logout}><LogOut size={17}/></button></div>
      </div>
    </aside>
    <main className="main-panel">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu" onClick={()=>setMobileNav(true)} aria-label="Open menu"><Menu size={21}/></button><div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{currentNav?.label || "Overview"}</strong></div></div>
        <div className="topbar-actions"><div className="today-pill"><span className="status-dot"/>{new Date().toLocaleDateString("en-IN",{weekday:"short",month:"short",day:"numeric"})}</div><button className="icon-button notification-button" title="Notifications" onClick={()=>notify("You're all caught up — no new notifications.")}><Bell size={18}/><i/></button><div className="topbar-divider"/><button className="topbar-user" onClick={()=>notify(`Signed in as ${user?.email||"traveler"}.`)}><span className="avatar avatar-small">{(user?.name||"T").slice(0,1).toUpperCase()}</span><ChevronDown size={15}/></button></div>
      </header>
      <div className="page-content">
        {loading && <div className="loading-bar"><span/></div>}
        {page==="overview" && <Overview user={user} stats={stats} trips={trips} expenses={expenses} bookings={bookings} destinations={destinations} activeTrip={activeTrip} spentForTrip={spentForTrip} onPage={setPage} onNewTrip={()=>setModal({type:"trip"})} onExplore={()=>setPage("explore")} />}
        {page==="explore" && <Explore destinations={filteredDestinations} search={search} setSearch={setSearch} category={category} setCategory={setCategory} onPlan={(d)=>setModal({type:"trip",destination:d.name,suggestedDays:d.days,suggestedBudget:d.budget*d.days})} />}
        {page==="planner" && <SmartPlanner destinations={destinations} token={token} language={language} setLanguage={v=>{setLanguage(v);localStorage.setItem("tripwise-language",v);}} onPlan={(d,days,budget)=>setModal({type:"trip",destination:d.name,suggestedDays:days,suggestedBudget:budget,notes:d.notes||""})} notify={notify} />}
        {page==="history" && <TravelHistory trips={trips} expenses={expenses} bookings={bookings} onPage={setPage} />}
        {page==="trips" && <Trips trips={trips} expenses={expenses} spentForTrip={spentForTrip} onCreate={()=>setModal({type:"trip"})} onEdit={trip=>setModal({type:"trip",trip})} onDelete={deleteTrip} onAddBooking={trip=>setModal({type:"booking",tripId:trip.id})} onAddExpense={trip=>setModal({type:"expense",tripId:trip.id})} />}
        {page==="expenses" && <Expenses expenses={expenses} trips={trips} stats={stats} onCreate={()=>setModal({type:"expense"})} onDelete={deleteExpense} />}
        {page==="bookings" && <Bookings bookings={bookings} trips={trips} onCreate={()=>setModal({type:"booking"})} onDelete={deleteBooking} />}
        {page==="admin" && user?.role === "admin" && <AdminPanel token={token} notify={notify} />}
      </div>
      <footer className="app-footer"><span>© 2026 Tripwise</span><span>Go places. Keep the good stuff.</span><button onClick={()=>notify("Tripwise keeps your trips and planning details in your account.")}><ShieldCheck size={13}/> Privacy-minded by design</button></footer>
    </main>
    {modal && <Modal modal={modal} trips={trips} onClose={()=>setModal(null)} onCreateTrip={createTrip} onUpdateTrip={updateTrip} onCreateExpense={createExpense} onCreateBooking={createBooking}/>}
    {toast && <div className="toast"><span className="toast-check"><Check size={15}/></span>{toast}<button onClick={()=>setToast("")}><X size={15}/></button></div>}
  </div>;
}

function PageHeading({eyebrow,title,description,action,actionLabel="Create new trip"}) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action&&<button className="button button-primary" onClick={action}><Plus size={17}/>{actionLabel}</button>}</div>;
}
function Overview({user,stats,trips,expenses,bookings,destinations,activeTrip,spentForTrip,onPage,onNewTrip,onExplore}) {
  const firstName=(user?.name||"traveler").split(" ")[0];
  const budget=activeTrip?Number(activeTrip.budget||0):0, spent=activeTrip?spentForTrip(activeTrip.id):0;
  const progress=budget?Math.min(100,spent/budget*100):0;
  const recent=expenses.slice(0,4);
  return <div className="view-stack">
    <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={13}/> YOUR TRAVEL SPACE</div><h1>Good to see you, {firstName}<span className="wave">✳</span></h1><p>Big plans or little escapes — let's make them happen.</p></div><button className="button button-primary" onClick={onNewTrip}><Plus size={17}/> Plan a new trip</button></div>
    <section className="hero-banner">
      <div className="hero-content"><span className="hero-tag"><Sparkles size={13}/> A LITTLE INSPIRATION</span><h2>India is full of stories.<br/><em>Find your next one.</em></h2><p>From mountain trails to coastal towns, plan your India trip with INR budgets and practical local tips.</p><button className="button button-white" onClick={onExplore}>Find your somewhere <ArrowRight size={16}/></button></div>
      <div className="hero-photo" aria-label="Scenic travel destination"/><div className="hero-scribble">go<br/>slowly<span>↗</span></div>
    </section>
    <section className="stats-grid">
      <StatCard label="Trips planned" value={stats.trips} note={`${stats.upcoming} upcoming`} icon={Luggage} tone="lilac" trend="Your travel list"/>
      <StatCard label="Total expenses" value={money(stats.spent)} note="Across all trips" icon={Wallet} tone="mint" trend="Tracked spending"/>
      <StatCard label="Saved bookings" value={stats.bookings} note="Travel details saved" icon={Ticket} tone="peach" trend="All in one place"/>
      <StatCard label="Places to explore" value={destinations.length} note="Curated inspiration" icon={Compass} tone="blue" trend="Find your next stop"/>
    </section>
    <div className="dashboard-grid">
      <section className="surface upcoming-surface">
        <div className="section-heading"><div><div className="eyebrow">ON THE HORIZON</div><h2>Your next adventures</h2></div><button className="text-link" onClick={()=>onPage("trips")}>All trips <ArrowRight size={15}/></button></div>
        {trips.length===0 ? <EmptyState icon={MapPin} title="Your story starts somewhere" description="Create your first trip and bring the details together." action="Plan a trip" onClick={onNewTrip}/> :
          <div className="trip-list">{trips.slice().sort((a,b)=>a.startDate.localeCompare(b.startDate)).slice(0,3).map(t=><TripRow key={t.id} trip={t} spent={spentForTrip(t.id)} onClick={()=>onPage("trips")}/>)}</div>}
      </section>
      <section className="surface budget-surface">
        <div className="section-heading"><div><div className="eyebrow">MONEY, MINDFULLY</div><h2>Trip budget</h2></div><button className="icon-button" onClick={()=>onPage("expenses")} aria-label="View expenses"><ArrowUpRight size={18}/></button></div>
        {activeTrip ? <><div className="budget-trip-label"><span className="budget-trip-icon"><MapPin size={16}/></span><div><strong>{activeTrip.destination}</strong><span>{dateLabel(activeTrip.startDate)} – {dateLabel(activeTrip.endDate)}</span></div></div><div className="budget-total"><strong>{money(spent)}</strong><span>of {money(budget)} planned</span></div><div className="progress-track"><span style={{width:`${progress}%`}}/></div><div className="budget-foot"><span>{budget?`${Math.round(progress)}% used`:"Set a budget to track spending"}</span><strong>{money(Math.max(0,budget-spent))} left</strong></div></> : <EmptyState icon={Wallet} title="A budget with room to breathe" description="Add a trip budget to keep your spending in view." action="Create a trip" onClick={onNewTrip}/>}
      </section>
    </div>
    <div className="bottom-grid">
      <section className="surface recent-surface"><div className="section-heading"><div><div className="eyebrow">THE LITTLE DETAILS</div><h2>Recent expenses</h2></div><button className="text-link" onClick={()=>onPage("expenses")}>View all <ArrowRight size={15}/></button></div>
        {recent.length ? <div className="expense-mini-list">{recent.map(e=><div className="expense-mini" key={e.id}><div className={`expense-category-icon ${categoryTone(e.category)}`}>{expenseIcon(e.category)}</div><div className="expense-mini-info"><strong>{e.title}</strong><span>{e.category} · {dateLabel(e.date)}</span></div><strong className="expense-amount">−{money(e.amount)}</strong></div>)}</div> : <EmptyState icon={CreditCard} title="No expenses yet" description="Keep track of the small things and big spends."/ >}
      </section>
      <section className="surface inspiration-surface"><div className="section-heading"><div><div className="eyebrow">A CHANGE OF SCENERY</div><h2>On our mind</h2></div><button className="text-link" onClick={onExplore}>Explore <ArrowRight size={15}/></button></div>
        <div className="mini-destinations">{destinations.slice(0,2).map(d=><button className="mini-destination" key={d.name} onClick={onExplore}><img src={destinationImage(d)} alt={d.name} loading="lazy"/><span><strong>{d.name}</strong><small>{d.days} days · from {money(d.budget)}/day</small></span><ArrowUpRight size={16}/></button>)}</div>
      </section>
    </div>
  </div>;
}
function StatCard({label,value,note,icon:Icon,tone,trend}) {
  return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}><Icon size={19}/></span><span className="stat-trend"><TrendingUp size={12}/>{trend}</span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-note">{note}</div></div>;
}
function TripRow({trip,spent,onClick}) {
  const past=trip.endDate<today();
  return <button className="trip-row" onClick={onClick}><div className={`trip-date-box ${past?"date-muted":""}`}><strong>{new Date(`${trip.startDate}T12:00:00`).getDate()}</strong><span>{new Date(`${trip.startDate}T12:00:00`).toLocaleDateString("en-IN",{month:"short"})}</span></div><div className="trip-row-main"><strong>{trip.destination}</strong><span><CalendarDays size={13}/>{dateLabel(trip.startDate)} – {dateLabel(trip.endDate)} <span className="row-dot">·</span><Users size={13}/>{trip.travelers} {Number(trip.travelers)===1?"traveler":"travelers"}</span></div><div className="trip-row-right"><span className={`trip-status ${past?"status-past":"status-planned"}`}>{past?"Completed":"Planned"}</span><strong>{money(trip.budget)}</strong></div><ArrowRight className="trip-row-arrow" size={17}/></button>;
}
function Explore({destinations,search,setSearch,category,setCategory,onPlan}) {
  const cats=["All places",...new Set(destinations.map(d=>d.category))];
  return <div className="view-stack"><PageHeading eyebrow="FIND YOUR SOMEWHERE" title="Places worth the journey." description="A little inspiration for your next chapter. Save a place by turning it into a trip."/>
    <div className="explore-toolbar"><label className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search 130+ Indian destinations, states, places…"/></label><div className="filter-pills"><SlidersHorizontal size={16}/>{cats.map(c=><button key={c} className={category===c?"selected":""} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>
    <div className="destinations-grid">{destinations.map((d,i)=>{const Icon=destinationIcon[d.category]||Compass;return <article className="destination-card" key={d.name}><div className="destination-image"><img src={destinationImage(d)} alt={d.name} loading="lazy"/><span className="destination-category"><Icon size={13}/>{d.category}</span><button className="destination-save" onClick={()=>onPlan(d)} title="Plan a trip here"><Plus size={17}/></button><span className="image-index">0{i+1}</span></div><div className="destination-body"><div className="destination-country">{(d.state || d.country).toUpperCase()}</div><h3>{d.name}</h3><p>{d.description}</p><div className="destination-meta"><span><Clock3 size={14}/>{d.days} days suggested</span><span><strong>{money(d.budget)}</strong> / day</span></div><div className="destination-card-footer"><span>Estimated daily budget</span><button className="button button-outline" onClick={()=>onPlan(d)}>Plan this trip <ArrowRight size={15}/></button></div></div></article>})}</div>
    {destinations.length===0&&<EmptyState icon={Search} title="No places found" description="Try another search or category."/>}
    <div className="note-strip"><Sparkles size={17}/><p><strong>A note on estimates:</strong> Daily budgets are illustrative starter estimates, not live prices. Use your trip budget to plan for your own travel style.</p></div>
  </div>;
}
function Trips({trips,expenses,spentForTrip,onCreate,onEdit,onDelete,onAddBooking,onAddExpense}) {
  const [filter,setFilter]=useState("All trips");
  const filtered=trips.filter(t=>filter==="All trips"|| (filter==="Upcoming"?t.startDate>=today():t.endDate<today()));
  return <div className="view-stack"><PageHeading eyebrow="YOUR PLANS, YOUR PACE" title="My trips" description="Every little detail, gathered in one place." action={onCreate} actionLabel="New trip"/>
    <div className="list-toolbar"><div className="filter-pills">{["All trips","Upcoming","Completed"].map(x=><button key={x} className={filter===x?"selected":""} onClick={()=>setFilter(x)}>{x}</button>)}</div><span className="muted-small">{filtered.length} {filtered.length===1?"trip":"trips"}</span></div>
    {filtered.length===0?<div className="surface empty-large"><EmptyState icon={Luggage} title={trips.length?"No trips in this view yet":"Your next adventure starts here"} description={trips.length?"Try another filter to see your trips.":"Add a destination, dates and a budget to start planning."} action={trips.length?undefined:"Create your first trip"} onClick={onCreate}/></div>:
    <div className="trip-cards">{filtered.map(t=>{const spent=spentForTrip(t.id),budget=Number(t.budget||0),pct=budget?Math.min(100,spent/budget*100):0;return <article className="surface trip-card" key={t.id}><div className="trip-card-top"><div className="trip-card-destination"><span className="trip-card-pin"><MapPin size={18}/></span><div><h3>{t.destination}</h3><span>{dateLabel(t.startDate)} – {dateLabel(t.endDate)}</span></div></div><div className="card-actions"><button className="icon-button" onClick={()=>onEdit(t)} title="Edit trip"><Pencil size={16}/></button><button className="icon-button danger-hover" onClick={()=>onDelete(t.id)} title="Delete trip"><Trash2 size={16}/></button></div></div><div className="trip-card-facts"><span><Users size={15}/>{t.travelers} travelers</span><span><CalendarDays size={15}/>{Math.max(1,Math.round((new Date(t.endDate)-new Date(t.startDate))/86400000)+1)} days</span><span className="trip-status status-planned">{t.endDate<today()?"Completed":"Planned"}</span></div>{t.notes&&<p className="trip-notes">{t.notes}</p>}<div className="trip-budget-line"><div><span>Budget used</span><strong>{money(spent)} <small>of {money(budget)}</small></strong></div><strong>{budget?`${Math.round(pct)}%`:"—"}</strong></div><div className="progress-track"><span style={{width:`${pct}%`}}/></div><div className="trip-card-footer"><span>{money(Math.max(0,budget-spent))} remaining</span><div><button className="small-action" onClick={()=>onAddExpense(t)}><Plus size={14}/> Expense</button><button className="small-action" onClick={()=>onAddBooking(t)}><Plus size={14}/> Booking</button></div></div></article>})}</div>}
  </div>;
}
function Expenses({expenses,trips,stats,onCreate,onDelete}) {
  const [filter,setFilter]=useState("All categories");
  const cats=["All categories","Accommodation","Transport","Food","Activities","Shopping","Other"];
  const filtered=expenses.filter(e=>filter==="All categories"||e.category===filter);
  const total=filtered.reduce((s,e)=>s+Number(e.amount),0);
  return <div className="view-stack"><PageHeading eyebrow="KEEP THE BALANCE" title="Budget & expenses" description="The numbers, without the spreadsheet headache." action={onCreate} actionLabel="Add expense"/>
    <div className="expense-summary-grid"><div className="surface expense-summary"><span className="summary-icon mint"><Wallet size={18}/></span><span>Total tracked</span><strong>{money(stats.spent)}</strong><small>Across all trips</small></div><div className="surface expense-summary"><span className="summary-icon lilac"><CreditCard size={18}/></span><span>Transactions</span><strong>{expenses.length}</strong><small>Recorded expenses</small></div><div className="surface expense-summary"><span className="summary-icon peach"><DollarSign size={18}/></span><span>Average expense</span><strong>{money(expenses.length?stats.spent/expenses.length:0)}</strong><small>Per transaction</small></div></div>
    <section className="surface table-surface"><div className="table-header"><div><h2>Expense log</h2><p>Every spend, in one easy view.</p></div><select className="select-control" value={filter} onChange={e=>setFilter(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
      {filtered.length===0?<EmptyState icon={Wallet} title="No expenses to show" description="Add your first expense to start tracking your travel budget." action="Add expense" onClick={onCreate}/>:
      <div className="table-scroll"><table className="data-table"><thead><tr><th>DESCRIPTION</th><th>CATEGORY</th><th>TRIP</th><th>DATE</th><th className="align-right">AMOUNT</th><th></th></tr></thead><tbody>{filtered.map(e=><tr key={e.id}><td><div className="table-primary-cell"><span className={`expense-category-icon ${categoryTone(e.category)}`}>{expenseIcon(e.category)}</span><strong>{e.title}</strong></div></td><td><span className="category-chip">{e.category}</span></td><td>{trips.find(t=>t.id===e.tripId)?.destination||"General"}</td><td>{dateLabel(e.date)}</td><td className="align-right amount-cell">−{money(e.amount)}</td><td><button className="icon-button table-delete" onClick={()=>onDelete(e.id)} title="Delete expense"><Trash2 size={15}/></button></td></tr>)}</tbody><tfoot><tr><td colSpan="4">Total for this view</td><td className="align-right amount-cell">{money(total)}</td><td/></tr></tfoot></table></div>}
    </section>
    <div className="note-strip"><ShieldCheck size={17}/><p>Keep an eye on spending as you go. Expenses can be linked to a trip to make its budget easier to follow.</p></div>
  </div>;
}
function Bookings({bookings,trips,onCreate,onDelete}) {
  const [filter,setFilter]=useState("All");
  const filtered=bookings.filter(b=>filter==="All"||b.type===filter);
  const types=["All",...new Set(bookings.map(b=>b.type))];
  return <div className="view-stack"><PageHeading eyebrow="DETAILS, SAFELY TUCKED AWAY" title="Booking reports" description="Keep confirmation references, dates and INR costs together. These records do not confirm external reservations." action={onCreate} actionLabel="Save a booking"/><div className="report-toolbar"><span>Export your saved booking register for sharing or offline reference.</span><button className="button button-outline" onClick={()=>downloadCsv("booking-report.csv",[["Booking","Type","Date","Destination","Cost INR","Reference","Record status"],...bookings.map(b=>[b.title,b.type,b.date,trips.find(t=>t.id===b.tripId)?.destination||"",b.cost,b.confirmation,"Saved record only"])])}><FileText size={15}/> Export booking report</button></div>
    <div className="booking-note"><span><Bookmark size={18}/></span><div><strong>Your travel details, in one place</strong><p>Save confirmation references, dates and costs here. These are personal records only — bookings are not made through Tripwise.</p></div></div>
    <div className="list-toolbar"><div className="filter-pills">{types.map(x=><button key={x} className={filter===x?"selected":""} onClick={()=>setFilter(x)}>{x}</button>)}</div><span className="muted-small">{filtered.length} saved</span></div>
    {filtered.length===0?<div className="surface empty-large"><EmptyState icon={Ticket} title="Nothing booked on paper yet" description="Save a hotel, flight, activity or other booking detail so it is easy to find later." action="Save a booking" onClick={onCreate}/></div>:
    <div className="booking-list">{filtered.map(b=><article className="surface booking-card" key={b.id}><div className={`booking-type-icon ${bookingTone(b.type)}`}>{bookingIcon(b.type)}</div><div className="booking-main"><div className="booking-type">{b.type.toUpperCase()}</div><h3>{b.title}</h3><div className="booking-details"><span><CalendarDays size={14}/>{dateLabel(b.date)}</span><span><MapPin size={14}/>{trips.find(t=>t.id===b.tripId)?.destination||"Not linked to a trip"}</span></div><div className="confirmation-ref"><span>REFERENCE</span><strong>{b.confirmation}</strong><button onClick={()=>navigator.clipboard?.writeText(b.confirmation)} title="Copy reference">Copy</button></div></div><div className="booking-right"><span className="trip-status status-planned">Saved</span><strong>{money(b.cost)}</strong><button className="small-action delete-action" onClick={()=>onDelete(b.id)}><Trash2 size={14}/> Remove</button></div></article>)}</div>}
  </div>;
}
const plannerCopy = {
  English: { eyebrow: 'INDIA-FIRST TRAVEL ASSISTANT', title: 'Plan a trip that fits you.', desc: 'Build a practical India itinerary with INR budgets, visit windows, travel-time estimates, weather and safety notes.', destination: 'Destination', days: 'Trip length', budget: 'Daily budget per person (₹)', travelers: 'Travellers', pace: 'Places per day', language: 'Language preference', generate: 'Build my itinerary', save: 'Save as a trip', weather: 'Local weather forecast', best: 'Best season & time', safety: 'Safety checklist', shopping: 'Local specialities & where to find them', assistant: 'Ask the travel assistant', ask: 'Ask about your trip, transport, budget or safety…', send: 'Get suggestions' },
  Hindi: { eyebrow: 'भारत-केंद्रित यात्रा सहायक', title: 'अपने हिसाब से यात्रा बनाएं।', desc: 'भारतीय रुपये में बजट, घूमने का समय, यात्रा-अवधि, मौसम और सुरक्षा सुझावों के साथ यात्रा बनाएं।', destination: 'गंतव्य', days: 'यात्रा की अवधि', budget: 'प्रति व्यक्ति दैनिक बजट (₹)', travelers: 'यात्री', pace: 'प्रतिदिन स्थान', language: 'भाषा', generate: 'यात्रा योजना बनाएं', save: 'यात्रा के रूप में सेव करें', weather: 'स्थानीय मौसम पूर्वानुमान', best: 'सबसे अच्छा मौसम और समय', safety: 'सुरक्षा सूची', shopping: 'स्थानीय प्रसिद्ध वस्तुएँ और कहाँ मिलेंगी', assistant: 'यात्रा सहायक से पूछें', ask: 'यात्रा, परिवहन, बजट या सुरक्षा के बारे में पूछें…', send: 'सुझाव पाएं' },
  Tamil: { eyebrow: 'இந்தியா பயண உதவியாளர்', title: 'உங்களுக்கு ஏற்ற பயணத்தைத் திட்டமிடுங்கள்.', desc: 'ரூபாய் பட்ஜெட், பார்வை நேரம், பயண இடைவெளி, வானிலை மற்றும் பாதுகாப்பு குறிப்புகளுடன் திட்டமிடுங்கள்.', destination: 'இடம்', days: 'பயண நாட்கள்', budget: 'ஒருவருக்கான தினசரி பட்ஜெட் (₹)', travelers: 'பயணிகள்', pace: 'ஒரு நாளில் இடங்கள்', language: 'மொழி விருப்பம்', generate: 'பயணத் திட்டம் உருவாக்கு', save: 'பயணமாக சேமி', weather: 'உள்ளூர் வானிலை', best: 'சிறந்த பருவம் மற்றும் நேரம்', safety: 'பாதுகாப்பு குறிப்புகள்', shopping: 'பிரபலமான பொருட்கள் மற்றும் கிடைக்கும் இடங்கள்', assistant: 'பயண உதவியாளரிடம் கேளுங்கள்', ask: 'பயணம், போக்குவரத்து, செலவு அல்லது பாதுகாப்பு பற்றி கேளுங்கள்…', send: 'பரிந்துரைகளைப் பெறுங்கள்' },
  Telugu: { eyebrow: 'భారత ప్రయాణ సహాయకుడు', title: 'మీకు సరిపోయే ప్రయాణాన్ని ప్లాన్ చేయండి.', desc: 'రూపాయి బడ్జెట్, సందర్శన సమయాలు, ప్రయాణ వ్యవధి, వాతావరణం మరియు భద్రతా సూచనలతో ప్లాన్ చేయండి.', destination: 'గమ్యం', days: 'ప్రయాణ రోజులు', budget: 'వ్యక్తికి రోజువారీ బడ్జెట్ (₹)', travelers: 'ప్రయాణికులు', pace: 'రోజుకు ప్రదేశాలు', language: 'భాష', generate: 'ప్రయాణ ప్రణాళిక రూపొందించండి', save: 'ట్రిప్‌గా సేవ్ చేయండి', weather: 'స్థానిక వాతావరణం', best: 'ఉత్తమ సీజన్ మరియు సమయం', safety: 'భద్రతా సూచనలు', shopping: 'ప్రసిద్ధ వస్తువులు మరియు ఎక్కడ దొరుకుతాయి', assistant: 'ట్రావెల్ అసిస్టెంట్‌ను అడగండి', ask: 'ప్రయాణం, రవాణా, బడ్జెట్ లేదా భద్రత గురించి అడగండి…', send: 'సూచనలు పొందండి' },
  Bengali: { eyebrow: 'ভারত-কেন্দ্রিক ভ্রমণ সহায়ক', title: 'আপনার মতো করে ভ্রমণ পরিকল্পনা করুন।', desc: 'রুপি বাজেট, দর্শনের সময়, যাত্রার সময়, আবহাওয়া ও নিরাপত্তার পরামর্শসহ পরিকল্পনা করুন।', destination: 'গন্তব্য', days: 'ভ্রমণের দিন', budget: 'প্রতি ব্যক্তির দৈনিক বাজেট (₹)', travelers: 'ভ্রমণকারী', pace: 'প্রতিদিনের স্থান', language: 'ভাষা', generate: 'ভ্রমণ পরিকল্পনা তৈরি করুন', save: 'ভ্রমণ হিসেবে সংরক্ষণ করুন', weather: 'স্থানীয় আবহাওয়ার পূর্বাভাস', best: 'সেরা ঋতু ও সময়', safety: 'নিরাপত্তা তালিকা', shopping: 'স্থানীয় বিখ্যাত জিনিস ও কোথায় পাবেন', assistant: 'ভ্রমণ সহায়ককে জিজ্ঞাসা করুন', ask: 'ভ্রমণ, পরিবহন, বাজেট বা নিরাপত্তা সম্পর্কে জিজ্ঞাসা করুন…', send: 'পরামর্শ পান' },
  Marathi: { eyebrow: 'भारत-केंद्रित प्रवास सहाय्यक', title: 'तुमच्यासाठी योग्य प्रवास आखा.', desc: 'रुपयातील बजेट, भेटीची वेळ, प्रवासाचा कालावधी, हवामान आणि सुरक्षिततेच्या सूचनांसह योजना करा.', destination: 'गंतव्य', days: 'प्रवासाचे दिवस', budget: 'प्रति व्यक्ती दैनिक बजेट (₹)', travelers: 'प्रवासी', pace: 'दररोज ठिकाणे', language: 'भाषा', generate: 'प्रवास योजना तयार करा', save: 'ट्रिप म्हणून जतन करा', weather: 'स्थानिक हवामान अंदाज', best: 'सर्वोत्तम हंगाम आणि वेळ', safety: 'सुरक्षितता तपासणी', shopping: 'प्रसिद्ध स्थानिक वस्तू आणि कुठे मिळतील', assistant: 'प्रवास सहाय्यकाला विचारा', ask: 'प्रवास, वाहतूक, बजेट किंवा सुरक्षिततेबद्दल विचारा…', send: 'सूचना मिळवा' }
};
const weatherText = code => ({0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Depositing rime fog',51:'Light drizzle',53:'Drizzle',55:'Dense drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Rain showers',81:'Showers',82:'Heavy showers',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Severe thunderstorm'})[code] || 'Variable conditions';
function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
function SmartPlanner({destinations,token,language,setLanguage,onPlan,notify}) {
  const [query,setQuery] = useState('');
  const [selectedId,setSelectedId] = useState(destinations[0]?.id || '');
  const [days,setDays] = useState(3), [budget,setBudget] = useState(2500), [travelers,setTravelers] = useState(2), [pace,setPace] = useState(2);
  const [weather,setWeather] = useState(null), [weatherLoading,setWeatherLoading] = useState(false), [weatherError,setWeatherError] = useState('');
  const [question,setQuestion] = useState(''), [answer,setAnswer] = useState(''), [assistantBusy,setAssistantBusy] = useState(false), [assistantMode,setAssistantMode] = useState('');
  const [showAllDestinations,setShowAllDestinations] = useState(false), [hasGenerated,setHasGenerated] = useState(false);
  const copy = plannerCopy[language] || plannerCopy.English;
  const selected = destinations.find(d => d.id === selectedId) || destinations.find(d => d.name === selectedId) || destinations[0];
  const filtered = destinations.filter(d => `${d.name} ${d.state} ${d.category}`.toLowerCase().includes(query.toLowerCase()));
  const placeCount = selected ? Math.min(selected.stops?.length || 3, days * pace) : 0;
  const planStops = (selected?.stops || []).slice(0, placeCount);
  const totalBudget = Number(budget) * Number(days) * Number(travelers);
  useEffect(() => {
    if (!selected?.lat || !selected?.lon) return;
    let active = true; setWeatherLoading(true); setWeatherError(''); setWeather(null);
    fetch(`/api/weather?lat=${selected.lat}&lon=${selected.lon}`).then(r => r.ok ? r.json() : r.json().then(d=>Promise.reject(new Error(d.error || 'Weather unavailable'))))
      .then(d => { if(active) setWeather(d); }).catch(e => { if(active) setWeatherError(e.message || 'Live weather is unavailable.'); })
      .finally(() => { if(active) setWeatherLoading(false); });
    return () => { active = false; };
  }, [selected?.id, selected?.lat, selected?.lon]);
  async function askAssistant(e) {
    e.preventDefault(); if (!question.trim() || !selected) return;
    setAssistantBusy(true); setAnswer('');
    try { const result = await api('/api/assistant', {method:'POST',body:JSON.stringify({question,destination:selected.name,language})}, token); setAnswer(result.answer); setAssistantMode(result.mode); }
    catch (e) { setAnswer(e.message); setAssistantMode('notice'); }
    finally { setAssistantBusy(false); }
  }
  function savePlan() {
    if (!selected) return;
    const notes = `Smart itinerary: ${days} day(s); ${placeCount} curated stops; ${language} assistance. Suggested stops: ${planStops.map(s=>s.name).join('; ')}. Best season: ${selected.bestMonths}. Safety: ${selected.safety}`;
    onPlan({...selected,notes},days,totalBudget);
  }
  if (!selected) return <EmptyState icon={Compass} title="Destination catalogue is loading" description="Please refresh the page in a moment."/>;
  return <div className="view-stack smart-planner-view">
    <section className="planner-hero"><div><span className="eyebrow"><Sparkles size={13}/> {copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.desc}</p><div className="planner-hero-points"><span><Check size={14}/> 130+ Indian destinations</span><span><Check size={14}/> INR-first budgets</span><span><Check size={14}/> Weather & safety context</span></div></div><div className="planner-hero-art"><span>🇮🇳</span><i>₹</i><b>↗</b></div></section>
    <div className="planner-main-grid">
      <section className="surface planner-controls"><div className="section-heading"><div><div className="eyebrow">PERSONALISE YOUR PLAN</div><h2>Tell us how you travel</h2></div><span className="planner-number">01</span></div>
        <label className="planner-field">{copy.destination}<div className="planner-search"><Search size={16}/><input value={query} onChange={e=>{setQuery(e.target.value);setShowAllDestinations(true);}} placeholder="Search city, state, nature, heritage…"/></div></label>
        <label className="planner-field"><span>{copy.destination} — {filtered.length} matching places</span><select value={selected.id} onChange={e=>{setSelectedId(e.target.value);const next=destinations.find(d=>d.id===e.target.value);if(next)setBudget(next.budget);setHasGenerated(false);}}>{filtered.map(d=><option key={d.id} value={d.id}>{d.name} — {d.state}</option>)}</select></label>
        {query && <button className="text-link planner-clear" onClick={()=>{setQuery('');setShowAllDestinations(false);}}>Clear search <X size={14}/></button>}
        <div className="planner-form-row"><label className="planner-field">{copy.days}<select value={days} onChange={e=>setDays(Number(e.target.value))}>{[1,2,3,4,5,6,7,8,10,12,14].map(n=><option key={n} value={n}>{n} {n===1?'day':'days'}</option>)}</select></label><label className="planner-field">{copy.travelers}<input type="number" min="1" max="30" value={travelers} onChange={e=>setTravelers(Math.max(1,Math.min(30,Number(e.target.value)||1)))}/></label></div>
        <label className="planner-field">{copy.budget}<div className="planner-money-input"><span>₹</span><input type="number" min="300" step="100" value={budget} onChange={e=>setBudget(Math.max(300,Number(e.target.value)||300))}/></div><small>Indicative local daily spend; long-distance travel and bookings may be extra.</small></label>
        <label className="planner-field">{copy.pace}<select value={pace} onChange={e=>setPace(Number(e.target.value))}><option value="1">Relaxed · 1 place/day</option><option value="2">Balanced · 2 places/day</option><option value="3">Full day · 3 places/day</option><option value="4">Fast-paced · 4 places/day</option></select></label>
        <label className="planner-field">{copy.language}<select value={language} onChange={e=>setLanguage(e.target.value)}>{['English','Hindi','Tamil','Telugu','Bengali','Marathi'].map(l=><option key={l}>{l}</option>)}</select></label>
        <div className="planner-budget-preview"><div><span>Estimated total budget</span><strong>{money(totalBudget)}</strong></div><div><span>Per traveller</span><strong>{money(Number(budget)*Number(days))}</strong></div></div>
        <button className="button button-primary button-wide" onClick={()=>{setHasGenerated(true);notify(`Your ${days}-day itinerary for ${selected.name} is ready to review.`);}}><Sparkles size={16}/>{copy.generate}</button>{hasGenerated&&<div className="planner-generated-note"><Check size={14}/> Itinerary prepared for {selected.name}. Review the suggested times and local advisories before travel.</div>}
      </section>
      <div className="planner-results">
        <section className="surface selected-destination-panel"><div className="selected-destination-top"><div><span className="eyebrow">YOUR DESTINATION</span><h2>{selected.name}</h2><p>{selected.state}, India · {selected.category}</p></div><span className="selected-destination-emoji">{selected.emoji}</span></div><p className="selected-destination-description">{selected.description}</p>
          <div className="destination-facts-grid"><div><span><CalendarRange size={15}/> Suggested stay</span><strong>{selected.days} days</strong></div><div><span><Wallet size={15}/> Local daily estimate</span><strong>{money(selected.budget)}</strong></div><div><span><Sun size={15}/> Best months</span><strong>{selected.bestMonths}</strong></div><div><span><Clock size={15}/> Best visiting window</span><strong>{selected.bestTime}</strong></div></div>
          <div className="planner-inline-actions"><a className="button button-outline" href={selected.mapUrl} target="_blank" rel="noreferrer"><MapPinned size={15}/> Open map <ExternalLink size={13}/></a><a className="button button-outline" href={selected.hotelSearchUrl} target="_blank" rel="noreferrer"><Hotel size={15}/> Find hotels <ExternalLink size={13}/></a><a className="button button-outline" href={selected.transportSearchUrl} target="_blank" rel="noreferrer"><Train size={15}/> Find transport <ExternalLink size={13}/></a><button className="button button-primary" onClick={savePlan}><Bookmark size={15}/>{copy.save}</button></div>
        </section>
        <section className="surface itinerary-panel"><div className="section-heading"><div><div className="eyebrow">DAY-BY-DAY SUGGESTION</div><h2>Your suggested itinerary</h2><p>{placeCount} curated places across {days} day(s) · adjust the pace above</p></div><button className="icon-button" title="Download itinerary CSV" onClick={()=>downloadCsv(`${selected.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-itinerary.csv`,[['Day','Place','Suggested time','Visit duration','Travel from previous'],...planStops.map((s,i)=>[Math.min(days,Math.floor(i*days/Math.max(1,planStops.length))+1),s.name,s.time,s.duration,s.travelFromPrevious])])}><Download size={17}/></button></div>
          {planStops.length ? <div className="itinerary-stop-list">{planStops.map((stop,i)=>{const day=Math.min(days,Math.floor(i*days/Math.max(1,planStops.length))+1);return <article className="itinerary-stop" key={`${stop.name}-${i}`}><div className="itinerary-stop-day"><span>DAY</span><strong>{day}</strong></div><div className="itinerary-stop-content"><h3>{stop.name}</h3><div className="itinerary-stop-meta"><span><Clock3 size={13}/>{stop.time}</span><span><CalendarDays size={13}/>{stop.duration}</span><span><Route size={13}/>{stop.travelFromPrevious}</span></div></div></article>})}</div> : <p>No curated stop details are available for this destination yet.</p>}
          <p className="estimate-note"><AlertTriangle size={14}/> Visit windows and inter-place travel times are planning estimates, not live navigation. Traffic, queues, permits and opening hours can change.</p>
        </section>
      </div>
    </div>
    <div className="planner-support-grid">
      <section className="surface weather-panel"><div className="section-heading"><div><div className="eyebrow">LIVE DATA WHEN AVAILABLE</div><h2>{copy.weather}</h2></div><CloudSun size={22}/></div>
        {weatherLoading ? <p className="muted-small">Checking the latest available forecast…</p> : weatherError ? <div className="weather-unavailable"><CloudSun size={25}/><p>{weatherError}</p><small>Forecast service needs an internet connection. Seasonal guidance is shown separately.</small></div> : weather?.current ? <><div className="weather-current"><div><span>Current conditions</span><strong>{Math.round(weather.current.temperature_2m)}°C</strong><small>{weatherText(weather.current.weather_code)}</small></div><div className="weather-current-extra"><span>Feels like {Math.round(weather.current.apparent_temperature)}°C</span><span>Humidity {weather.current.relative_humidity_2m}%</span><span>Wind {Math.round(weather.current.wind_speed_10m)} km/h</span></div></div><div className="weather-days">{(weather.daily?.time||[]).map((date,i)=><div className="weather-day" key={date}><span>{new Date(`${date}T12:00:00`).toLocaleDateString('en-IN',{weekday:'short'})}</span><CloudSun size={18}/><strong>{Math.round(weather.daily.temperature_2m_max[i])}° / {Math.round(weather.daily.temperature_2m_min[i])}°</strong><small>{weatherText(weather.daily.weather_code[i])}</small>{weather.daily.precipitation_probability_max?.[i]!=null&&<small>{weather.daily.precipitation_probability_max[i]}% rain</small>}</div>)}</div></> : <p className="muted-small">Forecast is not available yet.</p>}
        <p className="estimate-note"><AlertTriangle size={14}/> Forecasts change quickly. Re-check close to departure, especially for mountains, islands and monsoon travel.</p>
      </section>
      <section className="surface planner-info-panel"><div className="section-heading"><div><div className="eyebrow">LOCAL KNOW-HOW</div><h2>{copy.shopping}</h2></div><ShoppingBag size={21}/></div><div className="specialty-card"><div className="specialty-icon"><ShoppingBag size={18}/></div><div><strong>{selected.specialty}</strong><p>Look for it at: {selected.specialtyWhere}.</p></div></div><div className="info-divider"/><div className="section-heading"><div><div className="eyebrow">PRACTICAL ADVICE</div><h2>{copy.safety}</h2></div><ShieldCheck size={21}/></div><p className="safety-copy">{selected.safety}</p><ul className="safety-general"><li>Keep digital and paper copies of IDs, tickets and emergency contacts.</li><li>Use registered hotels, licensed guides and verified transport providers.</li><li>Check local government advisories, permits and opening days before departure.</li><li>Keep a 10–15% contingency in your INR budget.</li></ul></section>
    </div>
    <section className="surface assistant-panel"><div className="assistant-title"><span className="assistant-icon"><Bot size={22}/></span><div><div className="eyebrow">TRAVEL ASSISTANT · {language.toUpperCase()}</div><h2>{copy.assistant}</h2><p>Ask for route ideas, a family-friendly pace, budget trade-offs or local safety considerations.</p></div><span className="assistant-status">Assist mode</span></div><form className="assistant-form" onSubmit={askAssistant}><textarea rows="2" value={question} onChange={e=>setQuestion(e.target.value)} placeholder={copy.ask} maxLength="1800" required/><button className="button button-primary" disabled={assistantBusy}>{assistantBusy?'Thinking…':copy.send}<ArrowRight size={15}/></button></form>{answer&&<div className="assistant-answer"><div><Sparkles size={16}/><strong>{assistantMode==='ai'?'AI-assisted response':assistantMode==='local'?'Built-in travel guidance':'Travel assistant'}</strong></div><p>{answer}</p>{assistantMode==='local'&&<small>For hosted AI responses, configure OPENAI_API_KEY in your local .env file. The planner and destination data work without it.</small>}</div>}</section>
    <div className="note-strip"><ShieldCheck size={17}/><p><strong>Planning transparency:</strong> Budgets and transfer times are estimates. Weather is fetched from Open-Meteo when available. Hotel and transport links open external search results; this app does not take payments or confirm reservations.</p></div>
  </div>;
}
function TravelHistory({trips,expenses,bookings,onPage}) {
  const sorted = [...trips].sort((a,b)=>b.endDate.localeCompare(a.endDate));
  const completed = sorted.filter(t=>t.endDate<today());
  const totalSpent = expenses.reduce((s,e)=>s+Number(e.amount||0),0);
  return <div className="view-stack"><PageHeading eyebrow="YOUR JOURNEY SO FAR" title="Travel history & reports" description="Review past trips, spending and saved booking references in one place." action={()=>onPage('bookings')} actionLabel="View booking reports"/><div className="history-summary-grid"><div className="surface history-summary"><span>Trips recorded</span><strong>{trips.length}</strong><small>{completed.length} completed</small></div><div className="surface history-summary"><span>Tracked expenses</span><strong>{money(totalSpent)}</strong><small>{expenses.length} transactions</small></div><div className="surface history-summary"><span>Booking records</span><strong>{bookings.length}</strong><small>References saved in your account</small></div></div><section className="surface history-list-panel"><div className="section-heading"><div><div className="eyebrow">TIMELINE</div><h2>All recorded trips</h2></div><button className="button button-outline" onClick={()=>downloadCsv('trip-history.csv',[['Destination','Start date','End date','Travellers','Budget INR','Status','Notes'],...sorted.map(t=>[t.destination,t.startDate,t.endDate,t.travelers,t.budget,t.endDate<today()?'Completed':'Upcoming',t.notes||''])])}><Download size={15}/> Export history</button></div>{sorted.length===0?<EmptyState icon={History} title="No travel history yet" description="Trips you create will appear here, including upcoming plans." action="Explore destinations" onClick={()=>onPage('explore')}/>:<div className="history-trip-list">{sorted.map(t=><article className="history-trip" key={t.id}><span className={`history-status ${t.endDate<today()?'history-done':'history-upcoming'}`}>{t.endDate<today()?'Completed':'Upcoming'}</span><div><h3>{t.destination}</h3><p>{dateLabel(t.startDate)} – {dateLabel(t.endDate)} · {t.travelers} traveller(s)</p>{t.notes&&<small>{t.notes}</small>}</div><strong>{money(t.budget)}</strong></article>)}</div>}</section></div>;
}

function EmptyState({icon:Icon,title,description,action,onClick}) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={22}/></span><h3>{title}</h3><p>{description}</p>{action&&<button className="button button-outline" onClick={onClick}>{action}<ArrowRight size={15}/></button>}</div>;
}
function Modal({modal,trips,onClose,onCreateTrip,onUpdateTrip,onCreateExpense,onCreateBooking}) {
  const isEdit=modal.type==="trip"&&Boolean(modal.trip);
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  const [trip,setTrip]=useState({destination:modal.destination||"",startDate:today(),endDate:modal.suggestedDays ? new Date(Date.now() + (modal.suggestedDays - 1) * 86400000).toISOString().slice(0,10) : "",budget:modal.suggestedBudget || 15000,travelers:1,notes:modal.notes || "",...(modal.trip||{})});
  const [expense,setExpense]=useState({title:"",amount:"",category:"Food",date:today(),tripId:modal.tripId||""});
  const [booking,setBooking]=useState({title:"",type:"Hotel",date:today(),cost:0,tripId:modal.tripId||""});
  const setT=(k,v)=>setTrip(s=>({...s,[k]:v})),setE=(k,v)=>setExpense(s=>({...s,[k]:v})),setB=(k,v)=>setBooking(s=>({...s,[k]:v}));
  async function submit(e){e.preventDefault();setBusy(true);setError("");try{
    if(modal.type==="trip"){if(trip.endDate<trip.startDate)throw new Error("End date cannot be before the start date.");isEdit?await onUpdateTrip(modal.trip.id,{...trip,budget:Number(trip.budget),travelers:Number(trip.travelers)}):await onCreateTrip({...trip,budget:Number(trip.budget),travelers:Number(trip.travelers)});}
    if(modal.type==="expense")await onCreateExpense({...expense,amount:Number(expense.amount),tripId:expense.tripId||null});
    if(modal.type==="booking")await onCreateBooking({...booking,cost:Number(booking.cost),tripId:booking.tripId||null});
  }catch(err){setError(err.message)}finally{setBusy(false)}}
  const title=modal.type==="trip"?(isEdit?"Edit trip":"Plan a new trip"):modal.type==="expense"?"Add an expense":"Save a booking";
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><span className="eyebrow">MAKE IT YOURS</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19}/></button></div>
    <form onSubmit={submit} className="modal-form">
      {modal.type==="trip"&&<><label className="full-field">Destination<input value={trip.destination} onChange={e=>setT("destination",e.target.value)} placeholder="e.g. Jaipur, Rajasthan" required maxLength="120"/></label><div className="form-row"><label>Start date<input type="date" value={trip.startDate} onChange={e=>setT("startDate",e.target.value)} required/></label><label>End date<input type="date" value={trip.endDate} min={trip.startDate} onChange={e=>setT("endDate",e.target.value)} required/></label></div><div className="form-row"><label>Budget (INR ₹)<input type="number" min="0" step="1" value={trip.budget} onChange={e=>setT("budget",e.target.value)} required/></label><label>Travelers<input type="number" min="1" max="30" value={trip.travelers} onChange={e=>setT("travelers",e.target.value)} required/></label></div><label className="full-field">Notes (optional)<textarea value={trip.notes} onChange={e=>setT("notes",e.target.value)} rows="3" placeholder="Must-see places, ideas, reminders…"/></label></>}
      {modal.type==="expense"&&<><label className="full-field">Expense name<input value={expense.title} onChange={e=>setE("title",e.target.value)} placeholder="e.g. Dinner by the sea" required maxLength="120"/></label><div className="form-row"><label>Amount (INR ₹)<input type="number" min="0.01" step="0.01" value={expense.amount} onChange={e=>setE("amount",e.target.value)} required/></label><label>Category<select value={expense.category} onChange={e=>setE("category",e.target.value)}>{["Accommodation","Transport","Food","Activities","Shopping","Other"].map(c=><option key={c}>{c}</option>)}</select></label></div><div className="form-row"><label>Date<input type="date" value={expense.date} onChange={e=>setE("date",e.target.value)} required/></label><label>Link to trip<select value={expense.tripId} onChange={e=>setE("tripId",e.target.value)}><option value="">General expense</option>{trips.map(t=><option key={t.id} value={t.id}>{t.destination}</option>)}</select></label></div></>}
      {modal.type==="booking"&&<><label className="full-field">Booking title<input value={booking.title} onChange={e=>setB("title",e.target.value)} placeholder="e.g. Hotel reservation" required maxLength="120"/></label><div className="form-row"><label>Type<select value={booking.type} onChange={e=>setB("type",e.target.value)}>{["Flight","Hotel","Train","Car rental","Activity","Restaurant","Other"].map(c=><option key={c}>{c}</option>)}</select></label><label>Cost (INR ₹)<input type="number" min="0" step="0.01" value={booking.cost} onChange={e=>setB("cost",e.target.value)} required/></label></div><div className="form-row"><label>Date<input type="date" value={booking.date} onChange={e=>setB("date",e.target.value)} required/></label><label>Link to trip<select value={booking.tripId} onChange={e=>setB("tripId",e.target.value)}><option value="">No linked trip</option>{trips.map(t=><option key={t.id} value={t.id}>{t.destination}</option>)}</select></label></div><div className="form-hint"><Bookmark size={15}/> Save a reference for your own records. This does not make a reservation.</div></>}
      {error&&<div className="form-error">{error}</div>}
      <div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy?"Saving…":modal.type==="trip"?(isEdit?"Save changes":"Create trip"):modal.type==="expense"?"Add expense":"Save booking"}<ArrowRight size={16}/></button></div>
    </form>
  </section></div>;
}

function AdminPanel({ token, notify }) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({ overview: null, users: [], trips: [], bookings: [], destinations: [], advisories: [], audit: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const emptyDestination = { name:"", state:"", category:"Culture", budget:2500, days:2, bestMonths:"", bestTime:"", specialty:"", specialtyWhere:"", safety:"", description:"" };
  const [destinationForm, setDestinationForm] = useState(null);
  const [advisoryForm, setAdvisoryForm] = useState(null);
  const [query, setQuery] = useState("");
  const request = (url, options={}) => api(url, options, token);
  const refresh = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const [overview, users, trips, bookings, destinations, advisories, audit] = await Promise.all([
        request("/api/admin/overview"), request("/api/admin/users"), request("/api/admin/trips"),
        request("/api/admin/bookings"), request("/api/admin/destinations"), request("/api/admin/advisories"), request("/api/admin/audit")
      ]);
      setData({ overview: overview.stats, recentUsers: overview.recentUsers || [], users: users.users, trips: trips.trips, bookings: bookings.bookings, destinations: destinations.destinations, advisories: advisories.advisories, audit: audit.audit });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }, [token]);
  useEffect(() => { refresh(); }, [refresh]);
  async function changeUser(user, active) {
    try { await request(`/api/admin/users/${user.id}/status`, { method:"PATCH", body:JSON.stringify({active}) }); notify(active ? "User account activated." : "User account suspended."); await refresh(); }
    catch(e) { notify(e.message); }
  }
  async function changeBooking(booking, status) {
    try { await request(`/api/admin/bookings/${booking.id}/status`, { method:"PATCH", body:JSON.stringify({status}) }); notify("Booking record status updated."); await refresh(); }
    catch(e) { notify(e.message); }
  }
  async function saveDestination(e) {
    e.preventDefault();
    try {
      const payload = { ...destinationForm, budget:Number(destinationForm.budget), days:Number(destinationForm.days) };
      if (destinationForm.id) await request(`/api/admin/destinations/${destinationForm.id}`, {method:"PUT",body:JSON.stringify(payload)});
      else await request("/api/admin/destinations", {method:"POST",body:JSON.stringify(payload)});
      setDestinationForm(null); notify("Destination saved."); await refresh();
    } catch(e) { notify(e.message); }
  }
  async function toggleDestination(d) {
    try { await request(`/api/admin/destinations/${d.id}/status`, {method:"PATCH",body:JSON.stringify({active:d.active===false})}); notify(d.active===false?"Destination activated.":"Destination deactivated."); await refresh(); }
    catch(e) { notify(e.message); }
  }
  async function deleteDestination(d) {
    if (!window.confirm(`Remove/deactivate ${d.name}? Existing trip records are not changed.`)) return;
    try { await request(`/api/admin/destinations/${d.id}`, {method:"DELETE"}); notify("Destination removed from public discovery."); await refresh(); }
    catch(e) { notify(e.message); }
  }
  async function saveAdvisory(e) {
    e.preventDefault();
    try {
      const payload = {...advisoryForm};
      if (payload.id) await request(`/api/admin/advisories/${payload.id}`, {method:"PUT",body:JSON.stringify(payload)});
      else await request("/api/admin/advisories", {method:"POST",body:JSON.stringify(payload)});
      setAdvisoryForm(null); notify("Travel advisory saved."); await refresh();
    } catch(e) { notify(e.message); }
  }
  async function deleteAdvisory(a) {
    if (!window.confirm(`Delete advisory “${a.title}”?`)) return;
    try { await request(`/api/admin/advisories/${a.id}`, {method:"DELETE"}); notify("Advisory deleted."); await refresh(); }
    catch(e) { notify(e.message); }
  }
  const filteredUsers = data.users.filter(u => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase()));
  const filteredDestinations = data.destinations.filter(d => `${d.name} ${d.state} ${d.category}`.toLowerCase().includes(query.toLowerCase()));
  const filteredBookings = data.bookings.filter(b => `${b.title} ${b.type} ${b.traveler?.name||""} ${b.confirmation}`.toLowerCase().includes(query.toLowerCase()));
  const tabs = [["overview","Overview"],["destinations","Destinations"],["users","Users"],["trips","Trips"],["bookings","Bookings"],["advisories","Safety advisories"],["reports","Reports & audit"]];
  return <div className="view-stack admin-view">
    <div className="page-heading"><div><div className="eyebrow"><ShieldCheck size={13}/> ADMINISTRATION</div><h1>Control centre</h1><p>Manage the India destination catalogue, traveller accounts, booking records and travel guidance.</p></div><button className="button button-outline" onClick={refresh} disabled={busy}><History size={15}/>{busy?"Refreshing…":"Refresh data"}</button></div>
    <div className="admin-tabs">{tabs.map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>{setTab(id);setQuery("")}}>{label}</button>)}</div>
    {error && <div className="admin-error"><AlertTriangle size={17}/><span>{error} If you are signed in as a traveller, create/promote an admin account using the README instructions, then sign out and sign back in.</span></div>}
    {tab==="overview" && <>
      <div className="admin-stat-grid">{[["Registered users",data.overview?.users??"—",Users],["All trips",data.overview?.trips??"—",MapPinned],["Booking records",data.overview?.bookings??"—",Ticket],["Destinations",data.overview?.destinations??"—",Compass],["Booking value",money(data.overview?.bookingValue),Wallet],["Tracked expenses",money(data.overview?.expenses),TrendingUp]].map(([label,value,Icon])=><div className="surface admin-stat" key={label}><span><Icon size={17}/>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="admin-two-col"><section className="surface admin-section"><div className="section-heading"><div><div className="eyebrow">RECENT SIGNUPS</div><h2>Traveller accounts</h2></div><button className="button button-ghost" onClick={()=>setTab("users")}>Manage <ArrowRight size={14}/></button></div>{(data.recentUsers||[]).length?data.recentUsers.map(u=><div className="admin-list-row" key={u.id}><span className="avatar">{u.name?.slice(0,1).toUpperCase()}</span><div><strong>{u.name}</strong><small>{u.email}</small></div><span className={`admin-pill ${u.active===false?"muted":"good"}`}>{u.active===false?"Suspended":"Active"}</span></div>):<p className="admin-muted">No registered accounts yet.</p>}</section>
      <section className="surface admin-section"><div className="section-heading"><div><div className="eyebrow">RECENT ACTIONS</div><h2>Audit activity</h2></div><button className="button button-ghost" onClick={()=>setTab("reports")}>View logs <ArrowRight size={14}/></button></div>{data.audit.slice(0,6).map(a=><div className="admin-audit-row" key={a.id}><span className="admin-audit-dot"/><div><strong>{a.action.replaceAll("."," ")}</strong><small>{a.actorEmail} · {new Date(a.createdAt).toLocaleString("en-IN")}</small></div></div>)}{!data.audit.length&&<p className="admin-muted">Administrative changes will appear here.</p>}</section></div>
      <div className="admin-notice"><ShieldCheck size={18}/><div><strong>Administrator access is enforced by the API.</strong><p>Admin operations require an authenticated account with the admin role; hiding the panel in the UI is not the security boundary.</p></div></div>
    </>}
    {tab==="destinations" && <section className="surface admin-section"><div className="admin-toolbar"><div><h2>Destination catalogue</h2><p>Manage the destinations shown to travellers. Base destinations can be deactivated; custom destinations can be edited or removed.</p></div><button className="button button-primary" onClick={()=>setDestinationForm({...emptyDestination})}><Plus size={16}/> Add destination</button></div><div className="admin-filter"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search destination, state or category…"/><span>{filteredDestinations.length} results</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Destination</th><th>State / region</th><th>Category</th><th>Daily budget</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredDestinations.map(d=><tr key={d.id}><td><strong>{d.name}</strong><small>{d.isCustom?"Custom destination":"Curated catalogue"}</small></td><td>{d.state}</td><td>{d.category}</td><td>{money(d.budget)}</td><td><span className={`admin-pill ${d.active===false?"muted":"good"}`}>{d.active===false?"Inactive":"Active"}</span></td><td><div className="admin-actions"><button className="button button-ghost button-small" onClick={()=>setDestinationForm({...emptyDestination,...d})}><Pencil size={13}/> Edit</button><button className="button button-ghost button-small" onClick={()=>toggleDestination(d)}>{d.active===false?"Activate":"Deactivate"}</button><button className="button button-ghost button-small danger" onClick={()=>deleteDestination(d)}><Trash2 size={13}/></button></div></td></tr>)}</tbody></table></div></section>}
    {tab==="users" && <section className="surface admin-section"><div className="admin-toolbar"><div><h2>User accounts</h2><p>Review account roles and status. Suspended users cannot sign in or call protected APIs.</p></div><button className="button button-outline" onClick={()=>downloadCsv("tripwise-users.csv",[["Name","Email","Role","Status","Created"],...data.users.map(u=>[u.name,u.email,u.role,u.active===false?"Suspended":"Active",u.createdAt])])}><Download size={15}/> Export users</button></div><div className="admin-filter"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, email or role…"/><span>{filteredUsers.length} users</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredUsers.map(u=><tr key={u.id}><td><strong>{u.name}</strong><small>{u.email}</small></td><td><span className="admin-role">{u.role||"traveler"}</span></td><td>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td><td><span className={`admin-pill ${u.active===false?"muted":"good"}`}>{u.active===false?"Suspended":"Active"}</span></td><td>{u.role==="admin"?<span className="admin-muted">Admin protected</span>:<button className="button button-ghost button-small" onClick={()=>changeUser(u,u.active===false)}>{u.active===false?"Reactivate":"Suspend account"}</button>}</td></tr>)}</tbody></table></div></section>}
    {tab==="trips" && <section className="surface admin-section"><div className="admin-toolbar"><div><h2>All traveller trips</h2><p>Read-only oversight of trip plans and budgets.</p></div><button className="button button-outline" onClick={()=>downloadCsv("tripwise-trips.csv",[["Destination","Traveler","Email","Start","End","Travelers","Budget INR","Status"],...data.trips.map(t=>[t.destination,t.traveler?.name||"",t.traveler?.email||"",t.startDate,t.endDate,t.travelers,t.budget,t.status])])}><Download size={15}/> Export trips</button></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Trip</th><th>Traveller</th><th>Dates</th><th>People</th><th>Budget</th><th>Status</th></tr></thead><tbody>{data.trips.map(t=><tr key={t.id}><td><strong>{t.destination}</strong><small>{t.notes||"No notes"}</small></td><td>{t.traveler?.name||"Unknown"}<small>{t.traveler?.email||""}</small></td><td>{t.startDate} – {t.endDate}</td><td>{t.travelers}</td><td>{money(t.budget)}</td><td><span className="admin-pill good">{t.status||"planned"}</span></td></tr>)}</tbody></table></div></section>}
    {tab==="bookings" && <section className="surface admin-section"><div className="admin-toolbar"><div><h2>Booking records</h2><p>These are user-saved records, not supplier-confirmed reservations unless separately integrated.</p></div><button className="button button-outline" onClick={()=>downloadCsv("tripwise-booking-report.csv",[["Title","Type","Traveller","Email","Date","Cost INR","Reference","Status"],...data.bookings.map(b=>[b.title,b.type,b.traveler?.name||"",b.traveler?.email||"",b.date,b.cost,b.confirmation,b.status||"saved"])])}><Download size={15}/> Export report</button></div><div className="admin-filter"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search booking, reference or traveller…"/><span>{filteredBookings.length} records</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Booking</th><th>Traveller</th><th>Date</th><th>Value</th><th>Reference</th><th>Record status</th></tr></thead><tbody>{filteredBookings.map(b=><tr key={b.id}><td><strong>{b.title}</strong><small>{b.type}</small></td><td>{b.traveler?.name||"Unknown"}<small>{b.traveler?.email||""}</small></td><td>{b.date}</td><td>{money(b.cost)}</td><td>{b.confirmation}</td><td><select className="admin-status-select" value={b.status||"saved"} onChange={e=>changeBooking(b,e.target.value)}>{["saved","pending","confirmed","cancelled","completed"].map(x=><option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table></div></section>}
    {tab==="advisories" && <section className="surface admin-section"><div className="admin-toolbar"><div><h2>Travel safety advisories</h2><p>Create and maintain notices for regions. Advice should be verified against official sources before publication.</p></div><button className="button button-primary" onClick={()=>setAdvisoryForm({title:"",region:"India",severity:"info",message:"",active:true})}><Plus size={16}/> Add advisory</button></div>{data.advisories.length===0&&<p className="admin-muted">No custom advisories yet. Add a notice when you have verified information to share.</p>}{data.advisories.map(a=><article className="admin-advisory" key={a.id}><div><span className={`admin-pill ${a.severity==="high"?"danger-pill":a.severity==="caution"?"warn-pill":"good"}`}>{a.severity}</span><h3>{a.title}</h3><small>{a.region} · {a.active?"Published":"Draft / inactive"}</small><p>{a.message}</p></div><div className="admin-actions"><button className="button button-ghost button-small" onClick={()=>setAdvisoryForm({...a})}><Pencil size={13}/> Edit</button><button className="button button-ghost button-small danger" onClick={()=>deleteAdvisory(a)}><Trash2 size={13}/> Delete</button></div></article>)}</section>}
    {tab==="reports" && <div className="admin-report-grid"><section className="surface admin-section"><h2>Export reports</h2><p className="admin-muted">Download the operational data as CSV files for spreadsheet review.</p><div className="admin-export-list">{[["Users","tripwise-users.csv",[["Name","Email","Role","Active","Created"],...data.users.map(u=>[u.name,u.email,u.role,u.active!==false,u.createdAt])]], ["Trips","tripwise-trips.csv",[["Destination","Start","End","Travelers","Budget INR","Traveler email"],...data.trips.map(t=>[t.destination,t.startDate,t.endDate,t.travelers,t.budget,t.traveler?.email||""]) ]], ["Bookings","tripwise-bookings.csv",[["Title","Type","Date","Cost INR","Reference","Status","Traveler email"],...data.bookings.map(b=>[b.title,b.type,b.date,b.cost,b.confirmation,b.status||"saved",b.traveler?.email||""]) ]], ["Destinations","tripwise-destinations.csv",[["Name","State","Category","Daily budget INR","Active"],...data.destinations.map(d=>[d.name,d.state,d.category,d.budget,d.active!==false]) ]]].map(([label,file,rows])=><div key={label}><span><FileText size={17}/><strong>{label}</strong></span><button className="button button-outline button-small" onClick={()=>downloadCsv(file,rows)}><Download size={14}/> Download CSV</button></div>)}</div></section><section className="surface admin-section"><h2>Audit log</h2><p className="admin-muted">Recent administrative actions. Logs are capped to the latest 1,000 events in local JSON storage.</p>{data.audit.length?data.audit.map(a=><div className="admin-audit-row" key={a.id}><span className="admin-audit-dot"/><div><strong>{a.action.replaceAll("."," ")}</strong><small>{a.actorEmail} · {a.targetType} · {new Date(a.createdAt).toLocaleString("en-IN")}</small><small>{a.details}</small></div></div>):<p className="admin-muted">No administrative actions recorded yet.</p>}</section></div>}
    {destinationForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDestinationForm(null)}}><section className="modal-card admin-edit-modal"><div className="modal-header"><div><span className="eyebrow">DESTINATION CATALOGUE</span><h2>{destinationForm.id?"Edit destination":"Add destination"}</h2></div><button className="icon-button" onClick={()=>setDestinationForm(null)}><X size={18}/></button></div><form className="modal-form" onSubmit={saveDestination}><div className="form-row"><label>Destination name<input required maxLength="120" value={destinationForm.name} onChange={e=>setDestinationForm({...destinationForm,name:e.target.value})}/></label><label>State / region<input required maxLength="120" value={destinationForm.state} onChange={e=>setDestinationForm({...destinationForm,state:e.target.value})}/></label></div><div className="form-row"><label>Category<input required value={destinationForm.category} onChange={e=>setDestinationForm({...destinationForm,category:e.target.value})}/></label><label>Daily budget (₹)<input type="number" min="0" required value={destinationForm.budget} onChange={e=>setDestinationForm({...destinationForm,budget:e.target.value})}/></label></div><div className="form-row"><label>Suggested days<input type="number" min="1" max="30" value={destinationForm.days} onChange={e=>setDestinationForm({...destinationForm,days:e.target.value})}/></label><label>Best months<input value={destinationForm.bestMonths} onChange={e=>setDestinationForm({...destinationForm,bestMonths:e.target.value})}/></label></div><label className="full-field">Recommended time window<input value={destinationForm.bestTime} onChange={e=>setDestinationForm({...destinationForm,bestTime:e.target.value})}/></label><label className="full-field">Description<textarea rows="2" value={destinationForm.description} onChange={e=>setDestinationForm({...destinationForm,description:e.target.value})}/></label><div className="form-row"><label>Famous speciality<input value={destinationForm.specialty} onChange={e=>setDestinationForm({...destinationForm,specialty:e.target.value})}/></label><label>Where to find it<input value={destinationForm.specialtyWhere} onChange={e=>setDestinationForm({...destinationForm,specialtyWhere:e.target.value})}/></label></div><label className="full-field">Safety precautions<textarea rows="3" value={destinationForm.safety} onChange={e=>setDestinationForm({...destinationForm,safety:e.target.value})}/></label><div className="modal-actions"><button type="button" className="button button-ghost" onClick={()=>setDestinationForm(null)}>Cancel</button><button className="button button-primary">Save destination <Check size={15}/></button></div></form></section></div>}
    {advisoryForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAdvisoryForm(null)}}><section className="modal-card"><div className="modal-header"><div><span className="eyebrow">TRAVEL SAFETY</span><h2>{advisoryForm.id?"Edit advisory":"New advisory"}</h2></div><button className="icon-button" onClick={()=>setAdvisoryForm(null)}><X size={18}/></button></div><form className="modal-form" onSubmit={saveAdvisory}><label className="full-field">Title<input required value={advisoryForm.title} onChange={e=>setAdvisoryForm({...advisoryForm,title:e.target.value})}/></label><div className="form-row"><label>Region<input required value={advisoryForm.region} onChange={e=>setAdvisoryForm({...advisoryForm,region:e.target.value})}/></label><label>Severity<select value={advisoryForm.severity} onChange={e=>setAdvisoryForm({...advisoryForm,severity:e.target.value})}><option value="info">Information</option><option value="caution">Caution</option><option value="high">High risk</option></select></label></div><label className="full-field">Message<textarea rows="4" required value={advisoryForm.message} onChange={e=>setAdvisoryForm({...advisoryForm,message:e.target.value})}/></label><label className="admin-checkbox"><input type="checkbox" checked={advisoryForm.active!==false} onChange={e=>setAdvisoryForm({...advisoryForm,active:e.target.checked})}/> Active / visible for publication</label><div className="modal-actions"><button type="button" className="button button-ghost" onClick={()=>setAdvisoryForm(null)}>Cancel</button><button className="button button-primary">Save advisory <Check size={15}/></button></div></form></section></div>}
  </div>;
}

function categoryTone(c){return ({Accommodation:"lilac",Transport:"blue",Food:"peach",Activities:"mint",Shopping:"rose",Other:"gray"})[c]||"gray"}
function expenseIcon(c){return ({Accommodation:"⌂",Transport:"↗",Food:"✳",Activities:"◇",Shopping:"＋",Other:"·"})[c]||"·"}
function bookingTone(t){return ({Flight:"blue",Hotel:"lilac",Train:"mint", "Car rental":"peach",Activity:"rose",Restaurant:"peach"})[t]||"gray"}
function bookingIcon(t){return ({Flight:<Plane size={19}/>,Hotel:<Luggage size={19}/>,Train:<ArrowRight size={19}/>,"Car rental":<Compass size={19}/>,Activity:<Sparkles size={19}/>,Restaurant:<Waves size={19}/>})[t]||<Ticket size={19}/>}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
