require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { indiaDestinations } = require("./src/indiaDestinations");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "development-only-change-this-secret";
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

const initialDb = { users: [], trips: [], expenses: [], bookings: [], customDestinations: [], destinationOverrides: {}, disabledDestinationIds: [], advisories: [], auditLogs: [] };
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
    return { ...initialDb, ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
  } catch (e) {
    console.error("Could not read database:", e.message);
    return { ...initialDb };
  }
}
let db = readDb();
function saveDb() {
  const temp = DB_FILE + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(db, null, 2));
  fs.renameSync(temp, DB_FILE);
}
function id() { return crypto.randomUUID(); }
function cleanUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role || "traveler", active: user.active !== false, createdAt: user.createdAt }; }
function signToken(user) { return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" }); }
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "Account not found." });
    if (user.active === false) return res.status(403).json({ error: "This account has been suspended. Contact an administrator." });
    req.user = user;
    next();
  } catch { return res.status(401).json({ error: "Session expired or invalid. Please sign in again." }); }
}
function ownedTrip(req, res, next) {
  const trip = db.trips.find(t => t.id === req.params.id && t.userId === req.user.id);
  if (!trip) return res.status(404).json({ error: "Trip not found." });
  req.trip = trip;
  next();
}
function requiredString(value, label, max = 120) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  if (value.trim().length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value.trim();
}
function safeNumber(value, label, min = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) throw new Error(`${label} must be a valid number greater than or equal to ${min}.`);
  return n;
}
function handleError(res, error, status = 400) { return res.status(status).json({ error: error.message || "Request failed." }); }

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Administrator access required." });
  next();
}
function audit(req, action, targetType, targetId, details = "") {
  db.auditLogs ||= [];
  db.auditLogs.unshift({ id: id(), actorId: req.user.id, actorEmail: req.user.email, action, targetType, targetId, details: String(details).slice(0, 500), createdAt: new Date().toISOString() });
  db.auditLogs = db.auditLogs.slice(0, 1000);
}
function allDestinations(includeDisabled = false) {
  const base = indiaDestinations.map(d => ({ ...d, ...(db.destinationOverrides?.[d.id] || {}), isCustom: false }));
  const custom = (db.customDestinations || []).map(d => ({ ...d, isCustom: true }));
  const disabled = new Set(db.disabledDestinationIds || []);
  return [...base, ...custom].filter(d => includeDisabled || !disabled.has(d.id)).map(d => ({ ...d, active: !disabled.has(d.id) }));
}


app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "dist")));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Smart Trip Planner API", time: new Date().toISOString() }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = requiredString(req.body.name, "Name", 80);
    const email = requiredString(req.body.email, "Email", 160).toLowerCase();
    const password = requiredString(req.body.password, "Password", 200);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (db.users.some(u => u.email === email)) return res.status(409).json({ error: "An account with this email already exists." });
    const user = { id: id(), name, email, passwordHash: await bcrypt.hash(password, 12), role: "traveler", active: true, createdAt: new Date().toISOString() };
    db.users.push(user); saveDb();
    res.status(201).json({ token: signToken(user), user: cleanUser(user) });
  } catch (e) { handleError(res, e); }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Email or password is incorrect." });
  if (user.active === false) return res.status(403).json({ error: "This account has been suspended. Contact an administrator." });
  res.json({ token: signToken(user), user: cleanUser(user) });
});

app.get("/api/auth/me", auth, (req, res) => res.json({ user: cleanUser(req.user) }));

app.get("/api/dashboard", auth, (req, res) => {
  const trips = db.trips.filter(t => t.userId === req.user.id);
  const expenses = db.expenses.filter(e => e.userId === req.user.id);
  const bookings = db.bookings.filter(b => b.userId === req.user.id);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter(t => t.startDate >= today).sort((a,b) => a.startDate.localeCompare(b.startDate)).slice(0, 3);
  res.json({
    stats: {
      trips: trips.length,
      upcoming: trips.filter(t => t.startDate >= today).length,
      spent: expenses.reduce((sum, e) => sum + e.amount, 0),
      bookings: bookings.length
    },
    upcoming,
    recentExpenses: expenses.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  });
});

app.get("/api/trips", auth, (req, res) => {
  const trips = db.trips.filter(t => t.userId === req.user.id).sort((a,b) => a.startDate.localeCompare(b.startDate));
  res.json({ trips });
});
app.post("/api/trips", auth, (req, res) => {
  try {
    const destination = requiredString(req.body.destination, "Destination", 120);
    const startDate = requiredString(req.body.startDate, "Start date", 10);
    const endDate = requiredString(req.body.endDate, "End date", 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("Dates must use YYYY-MM-DD format.");
    if (endDate < startDate) throw new Error("End date cannot be before the start date.");
    const budget = safeNumber(req.body.budget ?? 0, "Budget");
    const trip = {
      id: id(), userId: req.user.id, destination, startDate, endDate, budget,
      travelers: Math.max(1, Math.min(30, Number(req.body.travelers) || 1)),
      notes: String(req.body.notes || "").slice(0, 2000),
      status: "planned", createdAt: new Date().toISOString()
    };
    db.trips.push(trip); saveDb(); res.status(201).json({ trip });
  } catch (e) { handleError(res, e); }
});
app.get("/api/trips/:id", auth, ownedTrip, (req, res) => {
  const itinerary = db.bookings.filter(b => b.userId === req.user.id && b.tripId === req.trip.id);
  const expenses = db.expenses.filter(e => e.userId === req.user.id && e.tripId === req.trip.id);
  res.json({ trip: req.trip, bookings: itinerary, expenses });
});
app.put("/api/trips/:id", auth, ownedTrip, (req, res) => {
  try {
    const destination = requiredString(req.body.destination, "Destination", 120);
    const startDate = requiredString(req.body.startDate, "Start date", 10);
    const endDate = requiredString(req.body.endDate, "End date", 10);
    if (endDate < startDate) throw new Error("End date cannot be before the start date.");
    req.trip.destination = destination; req.trip.startDate = startDate; req.trip.endDate = endDate;
    req.trip.budget = safeNumber(req.body.budget ?? req.trip.budget, "Budget");
    req.trip.travelers = Math.max(1, Math.min(30, Number(req.body.travelers) || 1));
    req.trip.notes = String(req.body.notes || "").slice(0, 2000);
    saveDb(); res.json({ trip: req.trip });
  } catch (e) { handleError(res, e); }
});
app.delete("/api/trips/:id", auth, ownedTrip, (req, res) => {
  db.trips = db.trips.filter(t => t.id !== req.trip.id);
  db.expenses = db.expenses.filter(e => e.tripId !== req.trip.id || e.userId !== req.user.id);
  db.bookings = db.bookings.filter(b => b.tripId !== req.trip.id || b.userId !== req.user.id);
  saveDb(); res.json({ success: true });
});

app.get("/api/expenses", auth, (req, res) => res.json({ expenses: db.expenses.filter(e => e.userId === req.user.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)) }));
app.post("/api/expenses", auth, (req, res) => {
  try {
    const title = requiredString(req.body.title, "Expense title", 120);
    const amount = safeNumber(req.body.amount, "Amount", 0.01);
    const category = requiredString(req.body.category || "Other", "Category", 40);
    const date = req.body.date && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date) ? req.body.date : new Date().toISOString().slice(0,10);
    let tripId = req.body.tripId || null;
    if (tripId && !db.trips.some(t => t.id === tripId && t.userId === req.user.id)) throw new Error("Selected trip does not exist.");
    const expense = { id: id(), userId: req.user.id, tripId, title, amount, category, date, createdAt: new Date().toISOString() };
    db.expenses.push(expense); saveDb(); res.status(201).json({ expense });
  } catch (e) { handleError(res, e); }
});
app.delete("/api/expenses/:id", auth, (req, res) => {
  const expense = db.expenses.find(e => e.id === req.params.id && e.userId === req.user.id);
  if (!expense) return res.status(404).json({ error: "Expense not found." });
  db.expenses = db.expenses.filter(e => e.id !== expense.id); saveDb(); res.json({ success: true });
});

app.get("/api/bookings", auth, (req, res) => res.json({ bookings: db.bookings.filter(b => b.userId === req.user.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)) }));
app.post("/api/bookings", auth, (req, res) => {
  try {
    const title = requiredString(req.body.title, "Booking title", 120);
    const type = requiredString(req.body.type || "Activity", "Booking type", 40);
    const date = requiredString(req.body.date, "Booking date", 10);
    const cost = safeNumber(req.body.cost ?? 0, "Cost");
    let tripId = req.body.tripId || null;
    if (tripId && !db.trips.some(t => t.id === tripId && t.userId === req.user.id)) throw new Error("Selected trip does not exist.");
    const booking = { id: id(), userId: req.user.id, tripId, title, type, date, cost, confirmation: "SP-" + crypto.randomBytes(3).toString("hex").toUpperCase(), status: "saved", createdAt: new Date().toISOString() };
    db.bookings.push(booking); saveDb(); res.status(201).json({ booking });
  } catch (e) { handleError(res, e); }
});
app.delete("/api/bookings/:id", auth, (req, res) => {
  const booking = db.bookings.find(b => b.id === req.params.id && b.userId === req.user.id);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  db.bookings = db.bookings.filter(b => b.id !== booking.id); saveDb(); res.json({ success: true });
});

app.get("/api/destinations", (_req, res) => {
  res.json({ destinations: allDestinations(false) });
});

// Admin APIs. Every route is protected by both authentication and a server-side role check.
app.get("/api/admin/overview", auth, requireAdmin, (req, res) => {
  const users = db.users || [], trips = db.trips || [], bookings = db.bookings || [], expenses = db.expenses || [];
  res.json({ stats: {
    users: users.length, activeUsers: users.filter(u => u.active !== false).length,
    trips: trips.length, bookings: bookings.length,
    bookingValue: bookings.reduce((sum, b) => sum + Number(b.cost || 0), 0),
    expenses: expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    destinations: allDestinations(false).length,
    pendingBookings: bookings.filter(b => (b.status || "saved") === "pending").length
  }, recentUsers: users.slice().sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,6).map(cleanUser),
  recentAudit: (db.auditLogs || []).slice(0,10) });
});
app.get("/api/admin/users", auth, requireAdmin, (req, res) => {
  res.json({ users: (db.users || []).slice().sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(cleanUser) });
});
app.patch("/api/admin/users/:id/status", auth, requireAdmin, (req, res) => {
  const target = db.users.find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "User not found." });
  if (target.role === "admin") return res.status(400).json({ error: "Admin accounts cannot be suspended from this user-management screen." });
  if (target.id === req.user.id && req.body.active === false) return res.status(400).json({ error: "You cannot suspend your own account." });
  if (!['admin','traveler'].includes(target.role || 'traveler')) return res.status(400).json({ error: "Unknown account role." });
  target.active = req.body.active !== false;
  audit(req, target.active ? "user.activated" : "user.suspended", "user", target.id, target.email);
  saveDb(); res.json({ user: cleanUser(target) });
});
app.get("/api/admin/trips", auth, requireAdmin, (req, res) => {
  const users = new Map(db.users.map(u => [u.id, { name: u.name, email: u.email }]));
  res.json({ trips: db.trips.slice().sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(t => ({ ...t, traveler: users.get(t.userId) || null })) });
});
app.get("/api/admin/bookings", auth, requireAdmin, (req, res) => {
  const users = new Map(db.users.map(u => [u.id, { name: u.name, email: u.email }]));
  res.json({ bookings: db.bookings.slice().sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(b => ({ ...b, status: b.status || "saved", traveler: users.get(b.userId) || null })) });
});
app.patch("/api/admin/bookings/:id/status", auth, requireAdmin, (req, res) => {
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking record not found." });
  const allowed = ["saved", "pending", "confirmed", "cancelled", "completed"];
  const status = String(req.body.status || "");
  if (!allowed.includes(status)) return res.status(400).json({ error: "Choose a valid booking-record status." });
  booking.status = status;
  audit(req, "booking.status_changed", "booking", booking.id, `${booking.confirmation || booking.title}: ${status}`);
  saveDb(); res.json({ booking });
});
app.get("/api/admin/destinations", auth, requireAdmin, (req, res) => res.json({ destinations: allDestinations(true) }));
app.post("/api/admin/destinations", auth, requireAdmin, (req, res) => {
  try {
    const name = requiredString(req.body.name, "Destination name", 120);
    const state = requiredString(req.body.state, "State / region", 120);
    const category = requiredString(req.body.category || "Culture", "Category", 60);
    const destination = { id: "custom-" + id(), name, state, country: "India", category,
      budget: safeNumber(req.body.budget ?? 2500, "Daily budget"), days: Math.max(1, Math.min(30, Number(req.body.days) || 2)),
      lat: Number.isFinite(Number(req.body.lat)) ? Number(req.body.lat) : 20.5937, lon: Number.isFinite(Number(req.body.lon)) ? Number(req.body.lon) : 78.9629,
      bestMonths: String(req.body.bestMonths || "Check local seasonality").slice(0, 120), bestTime: String(req.body.bestTime || "Daylight hours").slice(0, 120),
      specialty: String(req.body.specialty || "Local crafts and cuisine").slice(0, 300), specialtyWhere: String(req.body.specialtyWhere || "Established local markets").slice(0, 300),
      safety: String(req.body.safety || "Check official local advisories before travel.").slice(0, 1000), description: String(req.body.description || `${category} destination in ${state}, India.`).slice(0, 1000),
      stops: Array.isArray(req.body.stops) ? req.body.stops.slice(0, 30) : [], active: true, createdAt: new Date().toISOString() };
    db.customDestinations ||= []; db.customDestinations.push(destination); audit(req, "destination.created", "destination", destination.id, destination.name); saveDb(); res.status(201).json({ destination });
  } catch (e) { handleError(res, e); }
});
app.put("/api/admin/destinations/:id", auth, requireAdmin, (req, res) => {
  try {
    const idValue = req.params.id;
    const current = allDestinations(true).find(d => d.id === idValue);
    if (!current) return res.status(404).json({ error: "Destination not found." });
    const name = requiredString(req.body.name ?? current.name, "Destination name", 120);
    const state = requiredString(req.body.state ?? current.state, "State / region", 120);
    const updated = { ...current, name, state, category: requiredString(req.body.category ?? current.category, "Category", 60),
      budget: safeNumber(req.body.budget ?? current.budget, "Daily budget"), days: Math.max(1, Math.min(30, Number(req.body.days ?? current.days) || 1)),
      bestMonths: String(req.body.bestMonths ?? current.bestMonths ?? "").slice(0,120), bestTime: String(req.body.bestTime ?? current.bestTime ?? "").slice(0,120),
      specialty: String(req.body.specialty ?? current.specialty ?? "").slice(0,300), specialtyWhere: String(req.body.specialtyWhere ?? current.specialtyWhere ?? "").slice(0,300),
      safety: String(req.body.safety ?? current.safety ?? "").slice(0,1000), description: String(req.body.description ?? current.description ?? "").slice(0,1000) };
    delete updated.isCustom; delete updated.active;
    if (idValue.startsWith("custom-")) db.customDestinations = db.customDestinations.map(d => d.id === idValue ? { ...d, ...updated } : d);
    else { db.destinationOverrides ||= {}; db.destinationOverrides[idValue] = { ...(db.destinationOverrides[idValue] || {}), ...updated }; }
    audit(req, "destination.updated", "destination", idValue, name); saveDb(); res.json({ destination: { ...updated, id: idValue } });
  } catch (e) { handleError(res, e); }
});
app.patch("/api/admin/destinations/:id/status", auth, requireAdmin, (req, res) => {
  const destination = allDestinations(true).find(d => d.id === req.params.id);
  if (!destination) return res.status(404).json({ error: "Destination not found." });
  db.disabledDestinationIds ||= [];
  if (req.body.active === false) { if (!db.disabledDestinationIds.includes(destination.id)) db.disabledDestinationIds.push(destination.id); }
  else db.disabledDestinationIds = db.disabledDestinationIds.filter(idValue => idValue !== destination.id);
  audit(req, req.body.active === false ? "destination.deactivated" : "destination.activated", "destination", destination.id, destination.name);
  saveDb(); res.json({ success: true, active: req.body.active !== false });
});
app.delete("/api/admin/destinations/:id", auth, requireAdmin, (req, res) => {
  const target = allDestinations(true).find(d => d.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Destination not found." });
  if (target.id.startsWith("custom-")) db.customDestinations = db.customDestinations.filter(d => d.id !== target.id);
  else { db.disabledDestinationIds ||= []; if (!db.disabledDestinationIds.includes(target.id)) db.disabledDestinationIds.push(target.id); }
  audit(req, target.id.startsWith("custom-") ? "destination.deleted" : "destination.deactivated", "destination", target.id, target.name);
  saveDb(); res.json({ success: true });
});
app.get("/api/advisories", (_req, res) => res.json({ advisories: (db.advisories || []).filter(a => a.active !== false) }));
app.get("/api/admin/advisories", auth, requireAdmin, (req, res) => res.json({ advisories: db.advisories || [] }));
app.post("/api/admin/advisories", auth, requireAdmin, (req, res) => {
  try {
    const advisory = { id: id(), title: requiredString(req.body.title, "Title", 140), region: requiredString(req.body.region || "India", "Region", 120), severity: ["info","caution","high"].includes(req.body.severity) ? req.body.severity : "info", message: requiredString(req.body.message, "Message", 2000), active: req.body.active !== false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.advisories ||= []; db.advisories.unshift(advisory); audit(req, "advisory.created", "advisory", advisory.id, advisory.title); saveDb(); res.status(201).json({ advisory });
  } catch (e) { handleError(res, e); }
});
app.put("/api/admin/advisories/:id", auth, requireAdmin, (req, res) => {
  const advisory = (db.advisories || []).find(a => a.id === req.params.id);
  if (!advisory) return res.status(404).json({ error: "Advisory not found." });
  try { advisory.title = requiredString(req.body.title ?? advisory.title, "Title", 140); advisory.region = requiredString(req.body.region ?? advisory.region, "Region", 120); advisory.severity = ["info","caution","high"].includes(req.body.severity) ? req.body.severity : advisory.severity; advisory.message = requiredString(req.body.message ?? advisory.message, "Message", 2000); advisory.active = req.body.active !== false; advisory.updatedAt = new Date().toISOString(); audit(req, "advisory.updated", "advisory", advisory.id, advisory.title); saveDb(); res.json({ advisory }); } catch (e) { handleError(res, e); }
});
app.delete("/api/admin/advisories/:id", auth, requireAdmin, (req, res) => {
  const advisory = (db.advisories || []).find(a => a.id === req.params.id);
  if (!advisory) return res.status(404).json({ error: "Advisory not found." });
  db.advisories = db.advisories.filter(a => a.id !== advisory.id); audit(req, "advisory.deleted", "advisory", advisory.id, advisory.title); saveDb(); res.json({ success: true });
});
app.get("/api/admin/audit", auth, requireAdmin, (req, res) => res.json({ audit: (db.auditLogs || []).slice(0, 250) }));


// Live forecast from Open-Meteo (no API key required). Forecast availability depends on the provider.
app.get("/api/weather", async (req, res) => {
  const lat = Number(req.query.lat), lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return res.status(400).json({ error: "Valid latitude and longitude are required." });
  }
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat)); url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    url.searchParams.set("timezone", "auto"); url.searchParams.set("forecast_days", "5");
    const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error("Weather provider is temporarily unavailable.");
    res.set("Cache-Control", "public, max-age=900");
    res.json(await response.json());
  } catch (e) { res.status(502).json({ error: "Live weather is temporarily unavailable. Check a local forecast before travel." }); }
});

// Optional hosted AI assistance. Without OPENAI_API_KEY, the frontend's transparent local planner remains available.
app.post("/api/assistant", auth, async (req, res) => {
  const question = String(req.body.question || "").trim().slice(0, 1800);
  const destination = String(req.body.destination || "India").trim().slice(0, 120);
  const language = String(req.body.language || "English").trim().slice(0, 40);
  if (!question) return res.status(400).json({ error: "Please enter a travel question." });
  if (!process.env.OPENAI_API_KEY) {
    const place = indiaDestinations.find(d => d.name.toLowerCase() === destination.toLowerCase()) || indiaDestinations.find(d => destination.toLowerCase().includes(d.name.toLowerCase()));
    const details = place ? `For ${place.name}, ${place.state}: the suggested season is ${place.bestMonths}; the usual recommended visit window is ${place.bestTime}; an illustrative local budget is ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(place.budget)} per person per day. Local specialities include ${place.specialty}, often found at ${place.specialtyWhere}. Safety note: ${place.safety}` : `For ${destination}, choose a season that suits the region and check current weather, transport schedules and local advisories.`;
    return res.json({ mode: "local", answer: `${details}\n\nBudget tip: multiply your daily budget by trip days and travellers, then keep 10–15% aside for contingencies. Hotel and transport search links are suggestions only; confirm terms, cancellation policies and final prices directly with providers.\n\nRegarding “${question}”: use the itinerary and forecast panels to compare visit times and transfer estimates, and verify exact opening hours and live route times before departure.`, language });
  }
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.5, max_tokens: 650,
        messages: [
          { role: "system", content: `You are an India-focused travel planning assistant. Reply in ${language}. Use INR, distinguish estimates from confirmed prices, provide practical itineraries, transport time ranges, seasonality and safety precautions. Never claim to have made a booking or guarantee live conditions. Tell users to verify permits, opening hours, weather and current advisories.` },
          { role: "user", content: `Destination: ${destination}. Travel question: ${question}` }
        ] })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "AI provider request failed.");
    res.json({ mode: "ai", answer: data.choices?.[0]?.message?.content || "I couldn't generate a suggestion just now." });
  } catch (e) { res.status(502).json({ error: "AI assistance is temporarily unavailable. The built-in itinerary planner still works." }); }
});

// Serve SPA routes; API misses stay JSON.
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.listen(PORT, () => console.log(`Smart Trip Planner running at http://localhost:${PORT}`));
