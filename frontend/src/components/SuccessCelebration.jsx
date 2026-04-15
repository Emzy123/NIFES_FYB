import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { FaTimes, FaWallet } from "react-icons/fa";
import TicketCard from "./TicketCard.jsx";

const SHARE_CAPTION = "I'm attending the FYB Dinner & Thanksgiving! 🎓✨ Can't wait to celebrate!";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

function safeDownloadName(fullName) {
  const s = String(fullName || "Guest")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_");
  return s || "Guest";
}

export default function SuccessCelebration({ ticket, loading, error, paymentReference, reduceMotion, eventDate, onClose }) {
  const { width, height } = useWindowSize();
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [downloading, setDownloading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
  const ticketRef = useRef(null);
  const celebratedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      const target = new Date(eventDate).getTime();
      const dist = Math.max(target - now, 0);
      setCd({
        d: Math.floor(dist / 86400000),
        h: Math.floor((dist / 3600000) % 24),
        m: Math.floor((dist / 60000) % 60),
        s: Math.floor((dist / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(t);
  }, [eventDate]);

  useEffect(() => {
    if (!ticket || loading || reduceMotion) return;
    if (celebratedRef.current) return;
    celebratedRef.current = true;
    setConfettiOn(true);
    const t = setTimeout(() => setConfettiOn(false), 4500);
    return () => clearTimeout(t);
  }, [ticket, loading, reduceMotion]);

  const trackDownload = async () => {
    const ref = paymentReference;
    if (!ref) return;
    try {
      await fetch(`${API_BASE}/api/ticket/track-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref }),
      });
    } catch {
      /* non-blocking */
    }
  };

  const handleSavePng = async () => {
    const el = ticketRef.current;
    if (!el || !ticket) return;
    setDownloading(true);
    try {
      const w = el.offsetWidth;
      const scale = 1080 / Math.max(w, 1);
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        backgroundColor: "#0a2f1f",
        logging: false,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FYB_Ticket_${safeDownloadName(ticket.fullName)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      await trackDownload();
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const text = SHARE_CAPTION;
    try {
      if (navigator.share) {
        await navigator.share({ title: "NIFES FYB Dinner", text, url: window.location.origin });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
      setResendMsg("Link copied — paste to share.");
      setTimeout(() => setResendMsg(""), 3200);
    } catch {
      /* ignore */
    }
  };

  const handleResendEmail = async () => {
    if (!paymentReference || !ticket?.email) return;
    setResendBusy(true);
    setResendMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/ticket/resend-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: paymentReference, email: ticket.email }),
      });
      const data = await res.json().catch(() => ({}));
      setResendMsg(res.ok ? "Check your inbox — we sent the ticket again." : data.message || "Could not resend.");
    } catch {
      setResendMsg("Network error — try again.");
    } finally {
      setResendBusy(false);
    }
  };

  const walletHint = () => {
    window.alert(
      "Apple Wallet and Google Wallet passes need organization signing certificates. Use Save Ticket to keep a PNG that works everywhere."
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-3 py-6 backdrop-blur-md sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
    >
      {confettiOn && !reduceMotion ? (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={220}
          recycle={false}
          gravity={0.22}
          colors={["#00A86B", "#FFD700", "#7B2EDA", "#FF6B6B", "#FF9F4A"]}
        />
      ) : null}

      <motion.div
        initial={reduceMotion ? false : { scale: 0.92, y: 48 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-[#ffd700]/50 bg-gradient-to-b from-[#0a192f] via-[#121a2f] to-black p-4 text-center shadow-[0_0_60px_rgba(123,46,218,0.35)] sm:p-6 print:border-0 print:shadow-none"
      >
        <button
          type="button"
          onClick={onClose}
          className="ticket-actions absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 print:hidden"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        {loading ? (
          <>
            <p className="mt-8 font-['Caveat',cursive] text-2xl text-[#ffd700]">Almost there…</p>
            <h2 id="success-title" className="mt-2 font-['Montserrat',sans-serif] text-2xl font-black text-white sm:text-3xl">
              ✨ Preparing your celebration ticket...
            </h2>
            <p className="mt-3 text-sm text-white/65">Confirming payment and locking your seat.</p>
            <div className="mx-auto mt-10 h-12 w-12 animate-spin rounded-full border-2 border-[#ffd700] border-t-transparent" aria-hidden />
          </>
        ) : error ? (
          <>
            <h2 id="success-title" className="mt-8 font-['Montserrat',sans-serif] text-xl font-black text-white">
              Couldn&apos;t verify payment
            </h2>
            <p className="mt-3 text-sm text-[#FF6B6B]">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="ticket-actions mt-6 rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold text-white"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <p className="font-['Caveat',cursive] text-2xl text-[#ffd700]">Glory to God!</p>
            <h2 id="success-title" className="mt-1 font-['Montserrat',sans-serif] text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
              YOU&apos;RE IN! 🎓✨
            </h2>
            <p className="mt-2 text-sm text-white/75">
              Your live ticket is below — save it, share it, or print. We&apos;ve also emailed your PNG.
            </p>

            <div className="fyb-ticket-print-sheet mx-auto mt-5 w-full max-w-[432px] px-4 sm:px-0 print:max-w-none">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.2 }
                    : { type: "spring", stiffness: 420, damping: 20, mass: 0.85, delay: 0.06 }
                }
              >
                <TicketCard ref={ticketRef} ticket={ticket} />
              </motion.div>
            </div>

            <div className="ticket-actions mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              <button
                type="button"
                onClick={handleSavePng}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00A86B] to-[#0d4d2f] px-4 py-3 text-sm font-black text-white shadow-lg disabled:opacity-60"
              >
                📥 {downloading ? "Saving…" : "Save Ticket"}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ffd700]/50 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                📤 Share Ticket
              </button>
              <button
                type="button"
                onClick={walletHint}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/90 hover:bg-white/10"
              >
                <FaWallet className="text-[#d4af37]" /> Wallet
              </button>
            </div>

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendBusy || !ticket?.email}
              className="ticket-actions mt-2 text-xs font-semibold text-[#d4af37]/90 underline decoration-[#d4af37]/40 underline-offset-2 hover:text-[#ffd700] disabled:opacity-50"
            >
              {resendBusy ? "Sending…" : "Email ticket again"}
            </button>
            {resendMsg ? <p className="mt-2 text-xs text-white/70">{resendMsg}</p> : null}

            <div className="mt-6 rounded-2xl border border-[#00A86B]/50 bg-black/40 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#00A86B]">Ticket ID</p>
              <p className="mt-1 font-mono text-lg font-bold text-[#ffd700] sm:text-xl">{ticket?.ticketId}</p>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-white/80">
                <div className="rounded-lg bg-white/5 py-2">
                  <div className="font-black text-[#ffd700]">{String(cd.d).padStart(2, "0")}</div>days
                </div>
                <div className="rounded-lg bg-white/5 py-2">
                  <div className="font-black text-[#ffd700]">{String(cd.h).padStart(2, "0")}</div>hrs
                </div>
                <div className="rounded-lg bg-white/5 py-2">
                  <div className="font-black text-[#ffd700]">{String(cd.m).padStart(2, "0")}</div>min
                </div>
                <div className="rounded-lg bg-white/5 py-2">
                  <div className="font-black text-[#ffd700]">{String(cd.s).padStart(2, "0")}</div>sec
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ticket-actions mt-6 w-full rounded-2xl bg-gradient-to-r from-[#7B2EDA] via-[#FF6B6B] to-[#FF9F4A] py-3 font-black uppercase tracking-wide text-white shadow-lg"
            >
              Continue celebrating
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
