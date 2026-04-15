/**
 * Persisted registration / ticket record shape (JSON store: data/registrations.json).
 * Status flow: pending → paid. Ticket: ticketStatus issued | downloaded | checkedIn.
 */
const TICKET_RECORD_FIELDS = [
  { key: "reference", type: "string", note: "Paystack / mock reference; unique payment id" },
  { key: "status", type: '"pending" | "paid"', note: "Set paid after successful verification" },
  { key: "fullName", type: "string", required: true },
  { key: "email", type: "string", required: true },
  { key: "phone", type: "string", required: true },
  { key: "category", type: '"Student" | "Alumni" | "Guest" | "Sponsor"', note: "Pricing & VIP seating rules" },
  { key: "tickets", type: "number", note: "Quantity; table bundle uses 5" },
  { key: "ticketId", type: "string", note: "FYB-{year}-{#####} after payment" },
  { key: "attendeeId", type: "string (uuid)", note: "Stable id for QR + wallet flows" },
  { key: "tableNumber", type: "number" },
  { key: "seatNumber", type: "number" },
  { key: "assignedSeat", type: "string", note: 'e.g. "Table 7, Seat 12"' },
  { key: "isVipTable", type: "boolean", note: "Tables 1–3" },
  { key: "amountPaid", type: "number" },
  { key: "paymentReference", type: "string" },
  { key: "eventDateIso", type: "string", note: "YYYY-MM-DD" },
  { key: "eventDateDisplay", type: "string", note: "Long weekday format" },
  { key: "ticketStatus", type: '"issued" | "downloaded" | "checkedIn"', note: "Derived from downloads + check-in" },
  { key: "downloads", type: "number", default: 0 },
  { key: "checkedIn", type: "boolean", default: false },
  { key: "issuedAt", type: "string (ISO)", note: "When ticket was first issued" },
  { key: "matricNumber", type: "string?", note: "Optional" },
  { key: "department", type: "string?" },
  { key: "diet", type: "string?" },
];

module.exports = { TICKET_RECORD_FIELDS };
