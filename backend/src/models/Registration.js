const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    fullName: String,
    email: String,
    phone: String,
    matricNumber: String,
    department: String,
    category: String,
    tickets: { type: Number, default: 1 },
    diet: String,
    amount: Number,
    amountPaid: Number,
    paymentReference: String,
    ticketId: String,
    attendeeId: String,
    tableNumber: Number,
    seatNumber: Number,
    assignedSeat: String,
    seatLabel: String,
    isVipTable: Boolean,
    eventDateIso: String,
    eventDateDisplay: String,
    venue: String,
    dressCode: String,
    entryGate: String,
    eventTimeLabel: String,
    ticketCardEventTitle: String,
    ticketStatus: { type: String, default: "issued" },
    downloads: { type: Number, default: 0 },
    checkedIn: { type: Boolean, default: false },
    issuedAt: Date,
  },
  { timestamps: true, collection: "registrations" }
);

RegistrationSchema.index({ email: 1 });
RegistrationSchema.index({ ticketId: 1 }, { sparse: true });

module.exports = mongoose.model("Registration", RegistrationSchema);
