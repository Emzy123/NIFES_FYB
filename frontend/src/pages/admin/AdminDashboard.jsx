import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import fallbackSiteConfig, { mergeSiteConfig } from "../../fallbackSiteConfig.js";
import ContentListEditor from "./ContentListEditor.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "event", label: "Event & hero" },
  { id: "pricing", label: "Pricing" },
  { id: "content", label: "Site content" },
  { id: "registrations", label: "Registrations" },
];

function Field({ label, children }) {
  return (
    <label className="admin-field">
      <span className="admin-field-label">{label}</span>
      {children}
    </label>
  );
}

export default function AdminDashboard({ password, onLogout }) {
  const [tab, setTab] = useState("overview");
  const [cfg, setCfg] = useState(null);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [loadErr, setLoadErr] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [regs, setRegs] = useState([]);
  const [regQ, setRegQ] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [checkInId, setCheckInId] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const headers = useMemo(() => ({ "x-admin-password": password, "Content-Type": "application/json" }), [password]);

  const loadConfig = useCallback(async () => {
    setLoadErr("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/config`, { headers: { "x-admin-password": password } });
      if (!res.ok) {
        const raw = await res.text();
        let detail = raw;
        try {
          const j = JSON.parse(raw);
          if (j.message) detail = j.message;
        } catch {
          /* use raw */
        }
        throw new Error(`Config failed (${res.status}): ${detail || res.statusText} — Is the backend running on ${API_BASE}?`);
      }
      const data = await res.json();
      const merged = mergeSiteConfig(fallbackSiteConfig, data);
      setCfg(merged);
    } catch (e) {
      setLoadErr(e.message || "Load failed — check that the API is reachable and MongoDB is connected.");
    }
  }, [password]);

  const loadStats = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: { "x-admin-password": password } });
    if (res.ok) setStats(await res.json());
  }, [password]);

  const loadRegs = useCallback(async () => {
    const q = new URLSearchParams({ limit: "400" });
    if (regQ.trim()) q.set("q", regQ.trim());
    const res = await fetch(`${API_BASE}/api/admin/registrations?${q}`, { headers: { "x-admin-password": password } });
    if (res.ok) setRegs(await res.json());
  }, [password, regQ]);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, [loadConfig, loadStats]);

  useEffect(() => {
    if (tab !== "registrations") return;
    loadRegs();
  }, [tab, loadRegs]);

  const patchField = (key, value) => {
    setCfg((c) => (c ? { ...c, [key]: value } : c));
  };

  const patchPricing = (key, value) => {
    setCfg((c) => (c ? { ...c, pricing: { ...c.pricing, [key]: Number(value) } } : c));
  };

  const saveConfig = async () => {
    if (!cfg) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const body = {
        ...cfg,
      };
      delete body.__v;
      const res = await fetch(`${API_BASE}/api/admin/config`, { method: "PUT", headers, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Save failed");
      setCfg(mergeSiteConfig(fallbackSiteConfig, data));
      setSaveMsg("Saved to MongoDB ✓");
      setTimeout(() => setSaveMsg(""), 4000);
    } catch (e) {
      setSaveMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    window.open(`${API_BASE}/api/admin/export?password=${encodeURIComponent(password)}`, "_blank");
  };

  const adminResend = async () => {
    setActionMsg("");
    const res = await fetch(`${API_BASE}/api/admin/resend-ticket`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: resendEmail }),
    });
    const data = await res.json().catch(() => ({}));
    setActionMsg(res.ok ? "Ticket resent." : data.message || "Failed");
    loadStats();
  };

  const adminCheckIn = async () => {
    setActionMsg("");
    const res = await fetch(`${API_BASE}/api/admin/check-in`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ticketId: checkInId }),
    });
    const data = await res.json().catch(() => ({}));
    setActionMsg(res.ok ? "Checked in." : data.message || "Failed");
    loadStats();
    loadRegs();
  };

  if (loadErr && !cfg) {
    return (
      <main className="admin-shell">
        <p className="admin-load-err">{loadErr}</p>
        <button type="button" className="mt-4" onClick={loadConfig}>
          Retry
        </button>
      </main>
    );
  }

  if (!cfg) {
    return (
      <main className="admin-shell">
        <p>Loading dashboard…</p>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-dash-header">
        <div>
          <h1>FYB Admin</h1>
          <p className="admin-dash-sub">Season {cfg.seasonLabel} · MongoDB Atlas</p>
        </div>
        <div className="admin-dash-actions">
          <Link to="/" className="admin-link-btn">
            ← Public site
          </Link>
          <button type="button" className="admin-link-btn" onClick={onLogout}>
            Log out
          </button>
          <button type="button" className="admin-primary-btn" onClick={saveConfig} disabled={saving}>
            {saving ? "Saving…" : "Save all changes"}
          </button>
        </div>
      </header>
      {saveMsg ? <p className="admin-banner">{saveMsg}</p> : null}

      <nav className="admin-tabs" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <section className="admin-panel">
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <p className="admin-stat-label">Total registration rows</p>
              <p className="admin-stat-value">{stats.total}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Checked in</p>
              <p className="admin-stat-value">{stats.checkedIn}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Early-bird capacity</p>
              <p className="admin-stat-value">{cfg.pricing?.earlyBirdCapacity ?? 50}</p>
            </div>
          </div>
          <p className="admin-hint">
            Public pages read from <code>/api/public/site</code>. After you change the season or event date, visitors see updates on refresh.
          </p>
          <button type="button" className="admin-secondary-btn" onClick={exportCsv}>
            Export all registrations (CSV)
          </button>
          <div className="admin-divider" />
          <h2>Quick actions</h2>
          <div className="admin-row">
            <Field label="Resend ticket email">
              <input value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} placeholder="registrant@email" />
            </Field>
            <button type="button" className="admin-secondary-btn" onClick={adminResend}>
              Resend
            </button>
          </div>
          <div className="admin-row">
            <Field label="Check-in ticket ID">
              <input value={checkInId} onChange={(e) => setCheckInId(e.target.value)} placeholder="FYB-2026-00001" />
            </Field>
            <button type="button" className="admin-secondary-btn" onClick={adminCheckIn}>
              Mark attended
            </button>
          </div>
          {actionMsg ? <p className="admin-muted">{actionMsg}</p> : null}
        </section>
      )}

      {tab === "event" && (
        <section className="admin-panel admin-form-grid">
          <Field label="Season label (display)">
            <input value={cfg.seasonLabel || ""} onChange={(e) => patchField("seasonLabel", e.target.value)} />
          </Field>
          <Field label="Event date (countdown & tickets) — ISO string">
            <input
              value={cfg.eventDate || ""}
              onChange={(e) => patchField("eventDate", e.target.value)}
              placeholder="2026-07-18T17:00:00.000+01:00"
            />
          </Field>
          <Field label="Header tagline">
            <input value={cfg.headerTagline || ""} onChange={(e) => patchField("headerTagline", e.target.value)} />
          </Field>
          <Field label="Hero kicker (script font)">
            <input value={cfg.heroKicker || ""} onChange={(e) => patchField("heroKicker", e.target.value)} />
          </Field>
          <Field label="Hero title (typing animation)">
            <input value={cfg.heroTitle || ""} onChange={(e) => patchField("heroTitle", e.target.value)} />
          </Field>
          <Field label="Hero subtitle">
            <input value={cfg.heroSubtitle || ""} onChange={(e) => patchField("heroSubtitle", e.target.value)} />
          </Field>
          <Field label="Hero background image URL">
            <input value={cfg.heroBackgroundImage || ""} onChange={(e) => patchField("heroBackgroundImage", e.target.value)} />
          </Field>
          <Field label="Ticket card event title">
            <input value={cfg.ticketCardEventTitle || ""} onChange={(e) => patchField("ticketCardEventTitle", e.target.value)} />
          </Field>
          <Field label="Event time label">
            <input value={cfg.eventTimeLabel || ""} onChange={(e) => patchField("eventTimeLabel", e.target.value)} />
          </Field>
          <Field label="Venue">
            <input value={cfg.venue || ""} onChange={(e) => patchField("venue", e.target.value)} />
          </Field>
          <Field label="Dress code">
            <input value={cfg.dressCode || ""} onChange={(e) => patchField("dressCode", e.target.value)} />
          </Field>
          <Field label="Entry gate">
            <input value={cfg.entryGate || ""} onChange={(e) => patchField("entryGate", e.target.value)} />
          </Field>
          <Field label="Email subject (ticket email)">
            <input value={cfg.emailSubject || ""} onChange={(e) => patchField("emailSubject", e.target.value)} />
          </Field>
          <Field label="Section: Registration kicker / title">
            <input value={cfg.registrationSectionKicker || ""} onChange={(e) => patchField("registrationSectionKicker", e.target.value)} />
            <input value={cfg.registrationSectionTitle || ""} onChange={(e) => patchField("registrationSectionTitle", e.target.value)} />
          </Field>
          <Field label="Section: Experience kicker / title">
            <input value={cfg.experienceSectionKicker || ""} onChange={(e) => patchField("experienceSectionKicker", e.target.value)} />
            <input value={cfg.experienceSectionTitle || ""} onChange={(e) => patchField("experienceSectionTitle", e.target.value)} />
          </Field>
          <Field label="Section: Gallery kicker / title / submit email">
            <input value={cfg.gallerySectionKicker || ""} onChange={(e) => patchField("gallerySectionKicker", e.target.value)} />
            <input value={cfg.gallerySectionTitle || ""} onChange={(e) => patchField("gallerySectionTitle", e.target.value)} />
            <input value={cfg.gallerySubmitEmail || ""} onChange={(e) => patchField("gallerySubmitEmail", e.target.value)} />
          </Field>
          <Field label="Section: Testimonials kicker / title">
            <input value={cfg.testimonialsSectionKicker || ""} onChange={(e) => patchField("testimonialsSectionKicker", e.target.value)} />
            <input value={cfg.testimonialsSectionTitle || ""} onChange={(e) => patchField("testimonialsSectionTitle", e.target.value)} />
          </Field>
          <Field label="Section: Sponsors kicker / title / spotlight copy">
            <input value={cfg.sponsorsSectionKicker || ""} onChange={(e) => patchField("sponsorsSectionKicker", e.target.value)} />
            <input value={cfg.sponsorsSectionTitle || ""} onChange={(e) => patchField("sponsorsSectionTitle", e.target.value)} />
            <input value={cfg.sponsorSpotlightCopy || ""} onChange={(e) => patchField("sponsorSpotlightCopy", e.target.value)} />
          </Field>
          <Field label="Section: Committee kicker / title">
            <input value={cfg.committeeSectionKicker || ""} onChange={(e) => patchField("committeeSectionKicker", e.target.value)} />
            <input value={cfg.committeeSectionTitle || ""} onChange={(e) => patchField("committeeSectionTitle", e.target.value)} />
          </Field>
          <Field label="Footer lines">
            <input value={cfg.footerStillCelebrating || ""} onChange={(e) => patchField("footerStillCelebrating", e.target.value)} />
            <input value={cfg.footerOrgTitle || ""} onChange={(e) => patchField("footerOrgTitle", e.target.value)} />
          </Field>
          <Field label="Contact phone (display)">
            <input value={cfg.contactPhoneDisplay || ""} onChange={(e) => patchField("contactPhoneDisplay", e.target.value)} />
          </Field>
          <Field label="Contact email">
            <input value={cfg.contactEmail || ""} onChange={(e) => patchField("contactEmail", e.target.value)} />
          </Field>
          <Field label="WhatsApp share URL">
            <input value={cfg.whatsappShareUrl || ""} onChange={(e) => patchField("whatsappShareUrl", e.target.value)} />
          </Field>
          <Field label="Instagram URL">
            <input value={cfg.instagramUrl || ""} onChange={(e) => patchField("instagramUrl", e.target.value)} />
          </Field>
          <Field label="Facebook URL">
            <input value={cfg.facebookUrl || ""} onChange={(e) => patchField("facebookUrl", e.target.value)} />
          </Field>
          <Field label="Marquee template ({hype} {count} {slots})">
            <textarea rows={3} value={cfg.marqueeTemplate || ""} onChange={(e) => patchField("marqueeTemplate", e.target.value)} />
          </Field>
          <Field label="Marquee hype threshold / fallback">
            <input
              type="number"
              value={cfg.marqueeHypeThreshold ?? 200}
              onChange={(e) => patchField("marqueeHypeThreshold", Number(e.target.value))}
            />
            <input value={cfg.marqueeHypeFallback || ""} onChange={(e) => patchField("marqueeHypeFallback", e.target.value)} />
          </Field>
        </section>
      )}

      {tab === "pricing" && (
        <section className="admin-panel admin-form-grid">
          <Field label="Early-bird capacity (slots)">
            <input
              type="number"
              value={cfg.pricing?.earlyBirdCapacity ?? 50}
              onChange={(e) => patchPricing("earlyBirdCapacity", e.target.value)}
            />
          </Field>
          <Field label="Early-bird price / ticket (₦)">
            <input
              type="number"
              value={cfg.pricing?.earlyBirdPricePerTicket ?? 5000}
              onChange={(e) => patchPricing("earlyBirdPricePerTicket", e.target.value)}
            />
          </Field>
          <Field label="Regular price / ticket (₦)">
            <input
              type="number"
              value={cfg.pricing?.regularPricePerTicket ?? 7500}
              onChange={(e) => patchPricing("regularPricePerTicket", e.target.value)}
            />
          </Field>
          <Field label="Table for 5 (₦)">
            <input
              type="number"
              value={cfg.pricing?.tableFor5Price ?? 30000}
              onChange={(e) => patchPricing("tableFor5Price", e.target.value)}
            />
          </Field>
          <Field label="Sponsor price (₦)">
            <input
              type="number"
              value={cfg.pricing?.sponsorPrice ?? 25000}
              onChange={(e) => patchPricing("sponsorPrice", e.target.value)}
            />
          </Field>
          <p className="admin-hint">Paystack still uses live keys from server <code>.env</code>. Amounts are calculated from these numbers.</p>
        </section>
      )}

      {tab === "content" && <ContentListEditor cfg={cfg} setCfg={setCfg} />}

      {tab === "registrations" && (
        <section className="admin-panel">
          <div className="admin-row">
            <input value={regQ} onChange={(e) => setRegQ(e.target.value)} placeholder="Search name, email, ref, ticket ID" />
            <button type="button" className="admin-secondary-btn" onClick={loadRegs}>
              Search
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Ticket</th>
                  <th>Seat</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r._id || r.reference}>
                    <td>{r.fullName}</td>
                    <td className="admin-mono">{r.email}</td>
                    <td>{r.status}{r.checkedIn ? " ✓" : ""}</td>
                    <td className="admin-mono">{r.ticketId || "—"}</td>
                    <td>{r.assignedSeat || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
