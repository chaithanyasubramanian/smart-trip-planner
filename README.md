# Tripwise — India Smart Trip Planner (React + Express)

A responsive React + Vite website with a Node.js/Express API. The project is designed for India-first travel planning and uses **Indian rupees (₹ / INR)** throughout.

## Features

- **130 curated Indian destinations** across cities, states, hill stations, heritage sites, coastlines, wildlife areas, islands and multi-stop circuits.
- Search and filter destinations by place, state and category.
- **Smart Trip Planner:** choose destination, trip length, travellers, daily INR budget, pace and language preference.
- Day-by-day itinerary suggestions with recommended visit windows, visit durations and approximate travel time between stops.
- **Weather:** current conditions and a five-day forecast from Open-Meteo when the app has internet access. Forecasts are not guarantees.
- **Budget and expenses:** trip budgets, expense categories, trip-linked costs and INR totals.
- **Hotel and transport discovery:** outbound search links for hotels, maps and transport. These links do not make a booking.
- **Booking records and reports:** save booking details, dates, costs and a reference; export a CSV report. Saved records are not confirmed supplier reservations.
- **Local specialities:** destination-specific shopping ideas and suggested markets/shops.
- **Safety and seasonality:** recommended travel months, suggested time windows and destination-specific precautions.
- **Travel history:** completed/upcoming trip timeline and CSV export.
- **Language preference:** English, Hindi, Tamil, Telugu, Bengali and Marathi labels in the Smart Planner.
- **Travel assistant:** personalised built-in guidance works without an AI key. Optional hosted AI responses can be enabled with an OpenAI API key.
- Registration/login with bcrypt password hashing, JWT-protected routes and user-specific trips, expenses and saved bookings.
- JSON-file persistence for local demonstration; responsive desktop/tablet/mobile layout.

## Requirements

- Node.js 18 or newer (Node v24 is compatible)
- npm
- Internet access for weather data, external search links, fonts/photos and optional hosted AI

## Run on Windows PowerShell

Open PowerShell in the **inner** `Smart_Trip_Planner_React` directory — the one containing `package.json`.

```powershell
npm.cmd install
```

Create a local environment file by copying `.env.example` to `.env`. Set `JWT_SECRET` to a long random value before using accounts beyond a local demo. `OPENAI_API_KEY` is optional.

Build the frontend:

```powershell
npm.cmd run build
```

Start the application:

```powershell
npm.cmd start
```

Open **http://localhost:3000**. Keep the terminal open while using the site.

If you get `EADDRINUSE` for port 3000, another process is already using that port. First check `http://localhost:3000`; if it is not this app, inspect the PID with `netstat -ano | findstr :3000` and stop only the process you recognise as safe to stop, or set `PORT=3001` in `.env` and open `http://localhost:3001`.

## Optional development mode

Run the API in one PowerShell window:

```powershell
npm.cmd start
```

Run Vite in a second window:

```powershell
npm.cmd run dev
```

Open the Vite URL printed by the terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to port 3000.

## Optional hosted AI assistance

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY` to your own server-side API key.
3. Optionally set `OPENAI_MODEL` to a model available to your API account.
4. Restart the server.

Do not share `.env` or commit it to source control. If no key is configured, the app returns curated local guidance and still supports destination selection, itinerary planning and weather.

## Important accuracy and booking notes

- Daily budgets, visit windows, and travel times between stops are **planning estimates**, not live quotes or turn-by-turn navigation. Actual costs and times vary with season, traffic, closures, queues, group size and travel style.
- The weather panel retrieves a current snapshot and five-day forecast from Open-Meteo when reachable. Always re-check conditions near departure, especially in mountains, wildlife parks, islands and monsoon regions.
- Hotel and transport buttons open external search pages. The app does **not** book rooms/tickets, process payments, guarantee availability or issue supplier confirmations. Booking references saved inside the app are personal notes only.
- Destination information is a curated starter catalogue. Check official tourism/park/monument websites for current permits, opening days, restrictions and advisories before travelling.
- The optional hosted AI assistant needs your own API key and may incur provider charges. Without it, built-in destination-specific travel guidance remains available.
- JSON persistence is suitable for a local demo/small single-instance project, not a production multi-user deployment. A production release should use a database, rate limiting, audit logs, backups, stronger secret management, monitoring and deployment-specific security hardening.


## Administrator console

The project includes a separate, role-protected Admin Panel for destination catalogue management, user status management, trip oversight, saved booking-record status, travel safety advisories, CSV exports and an audit log. The admin panel is visible only to accounts with the `admin` role, and the API independently checks that role on every `/api/admin/*` route.

### Create the first administrator (Windows PowerShell)

1. Build the frontend as above (`npm.cmd run build`).
2. If the server is running, stop it with **Ctrl+C** before changing the JSON database.
3. In the project directory, set a new admin email and a strong password of at least 12 characters. Use a unique admin account rather than your everyday traveller account:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "Use-A-Unique-Long-Password-Here-2026!"
$env:ADMIN_NAME = "Tripwise Administrator"
npm.cmd run admin:create
Remove-Item Env:ADMIN_PASSWORD
Remove-Item Env:ADMIN_EMAIL
Remove-Item Env:ADMIN_NAME
```

Replace the example email and password with your own private values. The script hashes the password before saving it. Do not paste the password into chat or share it. If that email already exists in the database, the script promotes it to admin but keeps its existing password unless `ADMIN_RESET_PASSWORD=true` is explicitly set.

4. Start the server again with `npm.cmd start`, then sign in using the admin account through the normal login page. The **Admin panel** navigation item will appear.

### Admin modules

- Dashboard counts for users, trips, saved booking records, destinations, tracked expenses and booking-record value (all INR).
- Destination create/edit/deactivate operations; built-in catalogue entries can be deactivated, while custom entries can be deleted. Changes are persisted in `data/db.json` and update public destination discovery.
- User account search, CSV export and suspend/reactivate controls. Admin accounts are protected from suspension in the user-management endpoint.
- Read-only trip oversight, booking-record status changes, CSV reports, custom regional travel advisories and administrative audit events.

### Limitations and production checklist

This is a local project/demo using JSON-file persistence. Admin status management and booking statuses apply to records in this application; they do not contact a hotel, airline, railway or payment provider. Custom advisories are returned by `/api/advisories`, but should be verified against official sources before publication. Before public deployment, migrate JSON storage to a transactional database, add rate limiting and CSRF/session hardening appropriate to the chosen auth model, protect secrets with deployment secret storage, add automated tests and backups, and review privacy/retention requirements.
