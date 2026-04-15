import { forwardRef, useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";

const CATEGORY_BADGE = {
  Student: {
    icon: "🎓",
    className: "bg-gradient-to-r from-emerald-800 to-emerald-500 text-white border-emerald-400/50",
  },
  Alumni: {
    icon: "🌟",
    className: "bg-gradient-to-r from-violet-800 to-purple-500 text-white border-purple-400/50",
  },
  Guest: {
    icon: "🤝",
    className: "bg-gradient-to-r from-sky-800 to-blue-500 text-white border-sky-400/50",
  },
  Sponsor: {
    icon: "👑",
    className: "bg-gradient-to-r from-[#8a6a1a] via-[#d4af37] to-[#f5b042] text-[#1a1204] border-[#f5b042]/60",
  },
};

const QR_DISPLAY_PX = 78;

function formatNaira(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return "₦0";
  return `₦${v.toLocaleString("en-NG")}`;
}

function truncateRef(ref, max = 20) {
  const s = String(ref || "");
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

const TicketCard = forwardRef(function TicketCard({ ticket, className = "" }, ref) {
  const category = ticket?.category || "Guest";
  const badge = CATEGORY_BADGE[category] || CATEGORY_BADGE.Guest;

  const qrValue = useMemo(() => {
    if (!ticket) return "";
    return JSON.stringify({
      ticketId: ticket.ticketId,
      attendeeId: ticket.attendeeId,
      name: ticket.fullName,
      category: ticket.category,
      table: ticket.tableNumber,
      seat: ticket.seatNumber,
      eventDate: ticket.eventDateIso,
      checkedIn: Boolean(ticket.checkedIn),
    });
  }, [ticket]);

  if (!ticket) return null;

  const showVip = Boolean(ticket.isVipTable);

  return (
    <div
      ref={ref}
      className={`fyb-ticket-card group relative mx-auto w-full max-w-[400px] px-0 sm:px-0 print:max-w-none ${className}`}
    >
      <div className="ticket-border-glow pointer-events-none absolute -inset-[3px] rounded-[1.05rem] opacity-80 print:hidden" aria-hidden />
      <div className="fyb-ticket-card-inner relative flex h-[220px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0A2F1F] via-[#06180f] to-black shadow-[0_20px_50px_rgba(0,0,0,0.55)] print:h-auto print:min-h-[220px] print:overflow-visible print:border print:border-neutral-300 print:bg-white print:shadow-none">
        <div className="ticket-pattern pointer-events-none absolute inset-0 opacity-[0.05] print:hidden" aria-hidden />
        <p className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 select-none font-['Montserrat',sans-serif] text-[2.75rem] font-black uppercase tracking-widest text-white/[0.035] print:text-black/[0.06]">
          NIFES
        </p>
        <div className="pointer-events-none absolute left-1.5 top-1.5 text-[#f5b042]/90 print:hidden">
          <span className="ticket-sparkle block text-sm leading-none">✦</span>
        </div>
        <div className="pointer-events-none absolute right-1.5 top-1.5 text-[#f5b042]/90 print:hidden">
          <span className="ticket-sparkle-delay block text-sm leading-none">✦</span>
        </div>
        <div className="pointer-events-none absolute bottom-16 left-1.5 text-[#f5b042]/65 print:hidden">
          <span className="ticket-sparkle block text-xs">✦</span>
        </div>
        <div className="pointer-events-none absolute bottom-16 right-1.5 text-[#f5b042]/65 print:hidden">
          <span className="ticket-sparkle-delay block text-xs">✦</span>
        </div>

        <div className="relative grid min-h-0 flex-1 grid-cols-[1fr_auto] gap-x-2 gap-y-0 px-3 pb-1 pt-2.5">
          <div className="min-w-0 overflow-hidden">
            <h3 className="bg-gradient-to-r from-[#F5B042] to-[#D4AF37] bg-clip-text font-['Oswald','Montserrat',sans-serif] text-[0.68rem] font-bold uppercase leading-snug tracking-wide text-transparent">
              {ticket.ticketCardEventTitle || "FYB DINNER & THANKSGIVING"}
            </h3>
            <p className="mt-1 line-clamp-2 font-['Montserrat',sans-serif] text-[0.95rem] font-black leading-tight text-white print:text-neutral-900">
              {ticket.fullName}
            </p>
            <p className="mt-0.5 font-mono text-[9px] font-semibold tracking-wide text-[#e8c547] print:text-amber-900">{ticket.ticketId}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-px text-[9px] font-bold uppercase tracking-wide ${badge.className}`}
              >
                <span aria-hidden>{badge.icon}</span>
                {category}
              </span>
              {showVip ? (
                <span className="rounded-full border border-[#f5b042]/55 bg-gradient-to-r from-[#8a7018]/90 to-[#d4af37]/90 px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-white shadow-sm print:border-amber-700 print:text-amber-950">
                  VIP table
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] leading-tight text-white/90 print:text-neutral-800">
              🪑 {ticket.assignedSeat || "—"}
            </p>
            <p className="mt-0.5 text-[10px] text-white/70 print:text-neutral-600">🚪 {ticket.entryGate || "Main Gate A"}</p>
          </div>

          <div className="relative flex shrink-0 flex-col items-end pt-0.5">
            <div className="ticket-qr-glow pointer-events-none absolute -right-1 top-2 h-28 w-28 rounded-full blur-xl print:hidden" aria-hidden />
            <div className="fyb-ticket-qr-wrap relative rounded-lg border-[3px] border-transparent bg-gradient-to-br from-[#f5b042] via-[#d4af37] to-[#f5b042] p-[2px] shadow-inner print:border-amber-800">
              <div className="rounded-md bg-white p-0.5">
                <span className="ticket-qr-pulse inline-block leading-none">
                  <QRCodeCanvas value={qrValue} size={QR_DISPLAY_PX} level="M" marginSize={1} fgColor="#0a2f1f" bgColor="#ffffff" />
                </span>
              </div>
            </div>
            <p className="mt-1 text-right text-[13px] font-bold text-[#f5b042] print:text-amber-900">{formatNaira(ticket.amountPaid)}</p>
            <p className="max-w-[6.5rem] text-right font-mono text-[8px] leading-tight text-white/50 print:text-neutral-600">
              {truncateRef(ticket.paymentReference)}
            </p>
          </div>
        </div>

        <div className="relative z-[1] mx-2 mb-2 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[10px] leading-snug text-white/88 print:border-neutral-200 print:bg-neutral-50 print:text-neutral-800">
          <p className="font-semibold text-white print:text-neutral-900">
            {ticket.eventDateDisplay} · {ticket.eventTimeLabel || "5:00 PM WAT"}
          </p>
          <p className="mt-px truncate text-white/78 print:text-neutral-700">{ticket.venue}</p>
          <p className="mt-px text-[9px] text-[#d4af37]/95 print:text-amber-900">{ticket.dressCode}</p>
        </div>

        <p className="mb-1.5 text-center font-mono text-[7px] text-white/30 print:text-neutral-400">Scan for check-in · FYB · CUSTECH Osara</p>
      </div>
    </div>
  );
});

export default TicketCard;
