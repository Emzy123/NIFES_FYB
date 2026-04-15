const { v4: uuidv4 } = require("uuid");

function parseConfigEventDate(config) {
  const raw =
    config?.eventDate || process.env.EVENT_DATE || "2026-07-18T17:00:00.000+01:00";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return { iso: "2026-07-18", year: new Date().getFullYear(), raw };
  }
  return { iso: d.toISOString().slice(0, 10), year: d.getFullYear(), raw };
}

function getEventDateIso(config) {
  return parseConfigEventDate(config).iso;
}

function getEventYear(config) {
  return parseConfigEventDate(config).year;
}

function formatEventDateLong(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function nextFybTicketId(records, year) {
  const prefix = `FYB-${year}-`;
  let max = 0;
  for (const r of records) {
    const id = r.ticketId;
    if (!id || typeof id !== "string" || !id.startsWith(prefix)) continue;
    const part = id.slice(prefix.length);
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  const next = max + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

function collectSeatUsage(records, excludeIndex) {
  const vip = new Set();
  const standard = new Set();
  records.forEach((r, i) => {
    if (i === excludeIndex || r.status !== "paid" || !r.ticketId) return;
    const t = Number(r.tableNumber);
    const s = Number(r.seatNumber);
    if (!Number.isFinite(t) || !Number.isFinite(s)) return;
    const key = `${t}-${s}`;
    if (t >= 1 && t <= 3) vip.add(key);
    if (t >= 4) standard.add(key);
  });
  return { vip, standard };
}

function assignSeat(category, records, recordIndex) {
  const { vip, standard } = collectSeatUsage(records, recordIndex);
  const isSponsor = category === "Sponsor";

  const takeFromRanges = (ranges, used) => {
    for (const { tMin, tMax } of ranges) {
      for (let t = tMin; t <= tMax; t++) {
        for (let s = 1; s <= 8; s++) {
          const key = `${t}-${s}`;
          if (!used.has(key)) {
            return {
              tableNumber: t,
              seatNumber: s,
              assignedSeat: `Table ${t}, Seat ${s}`,
              isVipTable: t >= 1 && t <= 3,
            };
          }
        }
      }
    }
    return null;
  };

  if (isSponsor) {
    const vipSeat = takeFromRanges([{ tMin: 1, tMax: 3 }], vip);
    if (vipSeat) return vipSeat;
    const overflow = takeFromRanges([{ tMin: 4, tMax: 20 }], standard);
    if (overflow) return overflow;
  } else {
    const std = takeFromRanges([{ tMin: 4, tMax: 20 }], standard);
    if (std) return std;
  }

  return {
    tableNumber: 20,
    seatNumber: 8,
    assignedSeat: "Table 20, Seat 8",
    isVipTable: false,
  };
}

function buildQrPayload(registration, config) {
  const eventDate = registration.eventDateIso || getEventDateIso(config);
  return {
    ticketId: registration.ticketId,
    attendeeId: registration.attendeeId,
    name: registration.fullName,
    category: registration.category,
    table: String(registration.tableNumber ?? ""),
    seat: String(registration.seatNumber ?? ""),
    eventDate,
    checkedIn: Boolean(registration.checkedIn),
  };
}

function ensureAttendeeId(registration) {
  if (registration.attendeeId) return registration.attendeeId;
  return uuidv4();
}

module.exports = {
  parseConfigEventDate,
  getEventDateIso,
  getEventYear,
  formatEventDateLong,
  nextFybTicketId,
  assignSeat,
  buildQrPayload,
  ensureAttendeeId,
};
