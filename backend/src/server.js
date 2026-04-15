const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const axios = require("axios");
const nodemailer = require("nodemailer");
const { Parser } = require("json2csv");
const { connectDb } = require("./db");
const Registration = require("./models/Registration");
const { getSiteConfig, updateSiteConfig, publicSitePayload } = require("./services/configService");
const { createTicketPng } = require("./createTicketPng");
const {
  nextFybTicketId,
  assignSeat,
  ensureAttendeeId,
  getEventDateIso,
  formatEventDateLong,
  getEventYear,
} = require("./ticketLogic");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

/* No-DB probes — registered first so a quick browser check always hits this codebase. */
app.get("/api/health", (req, res) => res.json({ ok: true, service: "nifes-fyb-backend" }));
app.get(["/api", "/api/"], (req, res) => {
  res.json({
    name: "nifes-fyb-backend",
    hasAdminConfig: true,
    hint: "Restart backend after git pull if you see Cannot GET /api",
  });
});

const ticketsDir = path.join(__dirname, "..", "tickets");
if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir, { recursive: true });
app.use("/api/tickets", express.static(ticketsDir, { extensions: ["png"], maxAge: "1d" }));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calcPrice(category, tickets, totalRegCount, cfg) {
  const p = cfg.pricing || {};
  if (category === "Sponsor") return Number(p.sponsorPrice ?? 25000);
  if (Number(tickets) === 5) return Number(p.tableFor5Price ?? 30000);
  const cap = Number(p.earlyBirdCapacity ?? 50);
  const early = Number(p.earlyBirdPricePerTicket ?? 5000);
  const reg = Number(p.regularPricePerTicket ?? 7500);
  if (totalRegCount < cap) return early * Number(tickets);
  return reg * Number(tickets);
}

async function buildPublicTicket(reg, cfg) {
  const safeFile = `${String(reg.ticketId).replace(/[^\w.-]+/g, "_")}.png`;
  const iso = reg.eventDateIso || getEventDateIso(cfg);
  return {
    ticketId: reg.ticketId,
    attendeeId: reg.attendeeId,
    fullName: reg.fullName,
    email: reg.email,
    phone: reg.phone,
    category: reg.category,
    amountPaid: Number(reg.amountPaid ?? reg.amount ?? 0),
    paymentReference: reg.paymentReference || reg.reference,
    assignedSeat: reg.assignedSeat || reg.seatLabel,
    tableNumber: String(reg.tableNumber ?? ""),
    seatNumber: String(reg.seatNumber ?? ""),
    eventDateIso: iso,
    eventDateDisplay: reg.eventDateDisplay || formatEventDateLong(iso),
    eventTimeLabel: reg.eventTimeLabel || cfg.eventTimeLabel,
    venue: reg.venue || cfg.venue,
    dressCode: reg.dressCode || cfg.dressCode,
    entryGate: reg.entryGate || cfg.entryGate,
    ticketCardEventTitle: reg.ticketCardEventTitle || cfg.ticketCardEventTitle,
    ticketStatus: reg.ticketStatus || "issued",
    downloads: reg.downloads ?? 0,
    checkedIn: Boolean(reg.checkedIn),
    isVipTable: Boolean(reg.isVipTable),
    issuedAt: reg.issuedAt,
    ticketPngFile: safeFile,
    reference: reg.reference,
  };
}

const requireAdmin = (req, res, next) => {
  if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

const sendTicketEmail = async (registration, ticketImagePath, cfg) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const seat = registration.assignedSeat || registration.seatLabel || "—";
  const when =
    registration.eventDateDisplay || formatEventDateLong(registration.eventDateIso || getEventDateIso(cfg));
  const gate = registration.entryGate || cfg.entryGate;
  const ven = registration.venue || cfg.venue;
  const dress = registration.dressCode || cfg.dressCode;
  const timeL = registration.eventTimeLabel || cfg.eventTimeLabel;
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#0a192f;">
<div style="font-family:Segoe UI,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#f5f5f5;">
  <p style="font-size:14px;letter-spacing:0.2em;text-transform:uppercase;color:#d4af37;margin:0;">NIFES · CUSTECH Osara</p>
  <h1 style="font-size:22px;margin:12px 0 8px;color:#fff;">Your FYB Dinner ticket is ready ✨</h1>
  <p style="margin:0 0 16px;line-height:1.55;color:rgba(255,255,255,0.85);">Dear <strong>${registration.fullName}</strong>, thank you for registering. Your QR below matches the attached high-resolution ticket — show it at <strong>${gate}</strong>.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;background:rgba(0,0,0,0.35);border:1px solid rgba(212,175,55,0.45);border-radius:12px;">
    <tr><td style="padding:16px 18px;">
      <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#d4af37;">Ticket ID</p>
      <p style="margin:0;font-family:Consolas,monospace;font-size:18px;color:#fff;">${registration.ticketId}</p>
      <p style="margin:14px 0 4px;font-size:12px;text-transform:uppercase;color:#d4af37;">Seat</p>
      <p style="margin:0;color:#fff;">${seat}</p>
      <p style="margin:14px 0 4px;font-size:12px;text-transform:uppercase;color:#d4af37;">Category</p>
      <p style="margin:0;color:#fff;">${registration.category || "Guest"}</p>
    </td></tr>
  </table>
  <div style="margin:20px 0;text-align:center;">
    <img src="cid:fybTicket" alt="FYB event ticket" width="520" style="max-width:100%;height:auto;border-radius:14px;border:2px solid #d4af37;display:block;margin:0 auto;" />
  </div>
  <p style="font-size:13px;line-height:1.5;color:rgba(255,255,255,0.72);margin:0;"><strong>${when}</strong> · ${timeL}<br/>${ven}<br/>Dress: ${dress}</p>
</div></body></html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: registration.email,
    subject: cfg.emailSubject || "Your NIFES FYB Dinner Ticket",
    html,
    attachments: [{ filename: `FYB_${registration.ticketId}.png`, path: ticketImagePath, cid: "fybTicket" }],
  });
};

app.post("/api/payment/initialize", async (req, res) => {
  try {
    const cfg = await getSiteConfig();
    const payload = req.body;
    const allowedCat = new Set(["Student", "Alumni", "Guest", "Sponsor"]);
    if (!allowedCat.has(String(payload.category || "")))
      return res.status(400).json({ message: "Invalid category." });
    const phoneValid = /^(?:\+234|0)[789][01]\d{8}$/.test(String(payload.phone || "").replace(/\s/g, ""));
    if (!phoneValid) return res.status(400).json({ message: "Invalid Nigerian phone number." });
    const totalCount = await Registration.countDocuments();
    const amount = calcPrice(payload.category, payload.tickets, totalCount, cfg);
    const reference = `NIFES-${Date.now()}-${Math.floor(Math.random() * 99999)}`;
    await Registration.create({ ...payload, amount, reference, status: "pending" });

    if (!PAYSTACK_SECRET) {
      return res.json({ authorizationUrl: `${FRONTEND_URL}/?mockPaidRef=${reference}` });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: payload.email,
        amount: amount * 100,
        reference,
        callback_url: `${FRONTEND_URL}/?payref=${reference}`,
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );
    return res.json({ authorizationUrl: response.data.data.authorization_url });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Duplicate transaction reference." });
    return res.status(500).json({ message: "Payment initialization failed." });
  }
});

app.post("/api/payment/verify", async (req, res) => {
  try {
    const cfg = await getSiteConfig();
    const { reference } = req.body;
    const existing = await Registration.findOne({ reference }).lean();
    if (!existing) return res.status(404).json({ message: "Transaction not found." });

    if (existing.status === "paid" && existing.ticketId) {
      return res.json({
        message: "Already verified.",
        ticket: await buildPublicTicket(existing, cfg),
        ticketId: existing.ticketId,
        alreadyIssued: true,
      });
    }

    const isMockReference = String(reference).startsWith("NIFES-");
    let paid = isMockReference || !PAYSTACK_SECRET;
    let amountPaid = Number(existing.amount);
    let paymentReference = reference;
    if (PAYSTACK_SECRET && !isMockReference) {
      const verify = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      paid = verify.data.data.status === "success";
      if (paid && verify.data.data.amount != null) {
        amountPaid = Number(verify.data.data.amount) / 100;
      }
      if (paid && verify.data.data.reference) paymentReference = verify.data.data.reference;
    }
    if (!paid) return res.status(400).json({ message: "Payment not successful." });

    const eventDateIso = getEventDateIso(cfg);
    const eventDateDisplay = formatEventDateLong(eventDateIso);
    const allRegs = await Registration.find({}).sort({ createdAt: 1 }).lean();
    const idx = allRegs.findIndex((r) => r.reference === reference);
    const year = getEventYear(cfg);
    const ticketId = nextFybTicketId(allRegs, year);
    const attendeeId = ensureAttendeeId(existing);
    const seatInfo = assignSeat(existing.category, allRegs, idx);

    const registration = {
      ...existing,
      attendeeId,
      ticketId,
      tableNumber: seatInfo.tableNumber,
      seatNumber: seatInfo.seatNumber,
      assignedSeat: seatInfo.assignedSeat,
      seatLabel: seatInfo.assignedSeat,
      isVipTable: seatInfo.isVipTable,
      amountPaid,
      paymentReference,
      eventDateIso,
      eventDateDisplay,
      venue: cfg.venue,
      dressCode: cfg.dressCode,
      entryGate: cfg.entryGate,
      eventTimeLabel: cfg.eventTimeLabel,
      ticketCardEventTitle: cfg.ticketCardEventTitle,
      status: "paid",
      checkedIn: false,
      ticketStatus: "issued",
      downloads: existing.downloads ?? 0,
      issuedAt: new Date(),
    };

    const { _id, __v, ...toSet } = registration;
    await Registration.updateOne({ reference }, { $set: toSet });
    const saved = await Registration.findOne({ reference }).lean();
    const ticketPath = await createTicketPng(saved, ticketsDir, cfg);
    await sendTicketEmail(saved, ticketPath, cfg);
    return res.json({
      message: "Verified and ticket sent.",
      ticketId: saved.ticketId,
      ticket: await buildPublicTicket(saved, cfg),
      alreadyIssued: false,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Verification failed." });
  }
});

app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  const total = await Registration.countDocuments();
  const checkedIn = await Registration.countDocuments({ checkedIn: true });
  res.json({ total, checkedIn });
});

app.get("/api/admin/export", async (req, res) => {
  if (req.query.password !== ADMIN_PASSWORD) return res.status(401).send("Unauthorized");
  const records = await Registration.find({}).lean();
  const parser = new Parser();
  const csv = parser.parse(records);
  res.header("Content-Type", "text/csv");
  res.attachment("nifes-registrants.csv");
  res.send(csv);
});

app.get("/api/admin/config", requireAdmin, async (req, res) => {
  try {
    res.json(await getSiteConfig());
  } catch (e) {
    console.error("getSiteConfig", e);
    res.status(500).json({ message: e.message || "Could not read site config from database." });
  }
});

app.put("/api/admin/config", requireAdmin, async (req, res) => {
  try {
    const updated = await updateSiteConfig(req.body);
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: "Invalid config payload." });
  }
});

app.get("/api/admin/registrations", requireAdmin, async (req, res) => {
  const q = String(req.query.q || "").trim();
  const filter =
    q.length > 0
      ? {
          $or: [
            { email: new RegExp(escapeRegex(q), "i") },
            { fullName: new RegExp(escapeRegex(q), "i") },
            { reference: new RegExp(escapeRegex(q), "i") },
            { ticketId: new RegExp(escapeRegex(q), "i") },
          ],
        }
      : {};
  const limit = Math.min(Number(req.query.limit) || 300, 1000);
  const rows = await Registration.find(filter).sort({ updatedAt: -1 }).limit(limit).lean();
  res.json(rows);
});

app.post("/api/admin/resend-ticket", requireAdmin, async (req, res) => {
  const cfg = await getSiteConfig();
  const { email } = req.body;
  const reg = await Registration.findOne({ email, ticketId: { $exists: true, $ne: null } })
    .sort({ issuedAt: -1 })
    .lean();
  if (!reg) return res.status(404).json({ message: "Ticket not found." });
  const ticketPath = await createTicketPng(reg, ticketsDir, cfg);
  await sendTicketEmail(reg, ticketPath, cfg);
  return res.json({ message: "Ticket resent." });
});

app.post("/api/admin/check-in", requireAdmin, async (req, res) => {
  const { ticketId } = req.body;
  const r = await Registration.findOneAndUpdate(
    { ticketId },
    { $set: { checkedIn: true, ticketStatus: "checkedIn" } },
    { new: true }
  ).lean();
  if (!r) return res.status(404).json({ message: "Invalid ticket." });
  res.json({ message: "Attendance marked." });
});

app.post("/api/ticket/track-download", async (req, res) => {
  try {
    const { reference } = req.body || {};
    if (!reference) return res.status(400).json({ message: "reference required" });
    const reg = await Registration.findOne({
      reference,
      status: "paid",
      ticketId: { $exists: true, $ne: null },
    }).lean();
    if (!reg) return res.status(404).json({ message: "Ticket not found." });
    const next = (reg.downloads || 0) + 1;
    const ticketStatus = reg.checkedIn ? "checkedIn" : "downloaded";
    await Registration.updateOne({ reference }, { $set: { downloads: next, ticketStatus } });
    res.json({ downloads: next, ticketStatus });
  } catch (e) {
    res.status(500).json({ message: "Failed to track download." });
  }
});

app.post("/api/ticket/resend-email", async (req, res) => {
  try {
    const cfg = await getSiteConfig();
    const { reference, email } = req.body || {};
    if (!reference || !email) return res.status(400).json({ message: "reference and email required" });
    const reg = await Registration.findOne({
      reference,
      email,
      status: "paid",
      ticketId: { $exists: true, $ne: null },
    }).lean();
    if (!reg) return res.status(404).json({ message: "Ticket not found for this email." });
    const ticketPath = await createTicketPng(reg, ticketsDir, cfg);
    await sendTicketEmail(reg, ticketPath, cfg);
    return res.json({ message: "Ticket email sent." });
  } catch (e) {
    res.status(500).json({ message: "Could not resend email." });
  }
});

app.get("/api/public/site", async (req, res) => {
  try {
    const cfg = await getSiteConfig();
    const n = await Registration.countDocuments();
    const cap = Number(cfg.pricing?.earlyBirdCapacity ?? 50);
    res.json({
      config: publicSitePayload(cfg),
      stats: {
        registrationCount: n,
        earlyBirdSlotsLeft: Math.max(0, cap - n),
        earlyBirdActive: n < cap,
      },
    });
  } catch (e) {
    res.status(500).json({ message: "Config unavailable." });
  }
});

app.get("/api/public/stats", async (req, res) => {
  const cfg = await getSiteConfig();
  const n = await Registration.countDocuments();
  const cap = Number(cfg.pricing?.earlyBirdCapacity ?? 50);
  res.json({
    registrationCount: n,
    earlyBirdSlotsLeft: Math.max(0, cap - n),
    earlyBirdActive: n < cap,
  });
});

const port = Number(process.env.PORT || 5050);

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`FYB backend listening on http://localhost:${port}`);
      console.log(`  Probe: GET http://localhost:${port}/api  (should list hasAdminConfig: true)`);
      console.log(`  Admin: GET http://localhost:${port}/api/admin/config  (needs x-admin-password header)`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
