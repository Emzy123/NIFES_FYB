import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { FaFire, FaGlassCheers, FaCrown, FaHandshake } from "react-icons/fa";

const departments = [
  "Computer Science",
  "Software Engineering",
  "Cyber Security",
  "Biochemistry",
  "Microbiology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Economics",
  "Accounting",
  "Business Administration",
];

function burst(reduceMotion) {
  if (reduceMotion) return;
  confetti({
    particleCount: 42,
    spread: 64,
    origin: { y: 0.75 },
    colors: ["#00A86B", "#FFD700", "#7B2EDA", "#FF6B6B"],
  });
}

export default function RegistrationWizard({
  form,
  setForm,
  amountPreview,
  loading,
  message,
  onSubmit,
  reduceMotion,
  earlyBirdSlotsLeft,
  partyShakeClass,
  departments: departmentsProp,
}) {
  const departmentOptions = departmentsProp?.length ? departmentsProp : departments;
  const [step, setStep] = useState(1);
  const [tier, setTier] = useState("regular");

  const applyTier = (t) => {
    setTier(t);
    if (t === "table") setForm((f) => ({ ...f, tickets: 5, category: "Student" }));
    else if (t === "partner") setForm((f) => ({ ...f, tickets: 1, category: "Sponsor" }));
    else setForm((f) => ({ ...f, category: "Student" }));
    burst(reduceMotion);
  };

  const tierCards = useMemo(
    () => [
      {
        id: "early",
        title: "Early Bird",
        sub: "First 50 — fastest fingers",
        icon: FaFire,
        accent: "from-[#FF6B6B] to-[#FF9F4A]",
        slots: earlyBirdSlotsLeft,
      },
      {
        id: "regular",
        title: "Regular",
        sub: "Still premium energy",
        icon: FaGlassCheers,
        accent: "from-[#00A86B] to-[#7B2EDA]",
      },
      {
        id: "table",
        title: "Table for 5",
        sub: "Squad pricing unlocked",
        icon: FaCrown,
        accent: "from-[#FFD700] to-[#FF9F4A]",
      },
      {
        id: "partner",
        title: "Partner / VIP",
        sub: "Recognition + VIP glow",
        icon: FaHandshake,
        accent: "from-[#7B2EDA] to-[#FF6B6B]",
      },
    ],
    [earlyBirdSlotsLeft]
  );

  const onFieldDone = (valid) => {
    if (valid) burst(reduceMotion);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a192f]/95 to-black/90 p-5 shadow-[0_0_50px_rgba(0,168,107,0.12)] md:p-8">
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#00A86B] via-[#FFD700] to-[#7B2EDA]"
              initial={false}
              animate={{ width: step >= n ? "100%" : "0%" }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="s1"
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 16 }}
            className="space-y-4"
          >
            <h3 className="font-['Montserrat',sans-serif] text-2xl font-black text-white">Pick your ticket energy</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {tierCards.map((c) => {
                const Icon = c.icon;
                const selected =
                  (c.id === "early" && tier === "early") ||
                  (c.id === "regular" && tier === "regular") ||
                  (c.id === "table" && tier === "table") ||
                  (c.id === "partner" && tier === "partner");
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (c.id === "early" || c.id === "regular") {
                        setTier(c.id);
                        setForm((f) => ({ ...f, category: "Student" }));
                        burst(reduceMotion);
                      } else applyTier(c.id);
                    }}
                    className={`group relative rounded-2xl border-2 p-4 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                      selected
                        ? "border-[#ffd700] shadow-[0_0_24px_rgba(255,215,0,0.25)]"
                        : "border-white/10 bg-white/5 hover:border-[#00A86B]/50"
                    }`}
                  >
                    <div className={`inline-flex rounded-xl bg-gradient-to-br ${c.accent} p-2 text-white shadow-md`}>
                      <Icon className="text-xl" />
                    </div>
                    <p className="mt-3 font-['Montserrat',sans-serif] text-lg font-black text-white">{c.title}</p>
                    <p className="text-sm text-white/65">{c.sub}</p>
                    {c.id === "early" && (
                      <p className="mt-2 text-xs font-bold text-[#FF9F4A]">{c.slots} early-bird slots left (server applies price)</p>
                    )}
                    <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100 group-hover:shadow-[inset_0_0_0_1px_rgba(255,215,0,0.35)]" />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                burst(reduceMotion);
                setStep(2);
              }}
              className={`w-full rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF9F4A] py-4 font-black uppercase tracking-wide text-white ${partyShakeClass}`}
            >
              Next: Your details →
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="s2"
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 16 }}
            className="space-y-3"
          >
            <h3 className="font-['Montserrat',sans-serif] text-2xl font-black text-white">Tell us about you</h3>
            <input
              required
              placeholder="Full Name"
              value={form.fullName}
              onBlur={(e) => onFieldDone(e.target.value.trim().length > 2)}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none ring-[#00A86B] focus:border-[#00A86B] focus:ring-2"
            />
            <input
              required
              type="email"
              placeholder="Email (for ticket delivery)"
              value={form.email}
              onBlur={(e) => onFieldDone(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value))}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#7B2EDA] focus:ring-2 focus:ring-[#7B2EDA]"
            />
            <input
              required
              placeholder="Phone (+234…)"
              value={form.phone}
              onBlur={(e) => onFieldDone(/^(?:\+234|0)[789][01]\d{8}$/.test(e.target.value.replace(/\s/g, "")))}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/50"
            />
            <input
              placeholder="Matric Number (students)"
              value={form.matricNumber}
              onChange={(e) => setForm({ ...form, matricNumber: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#00A86B]"
            />
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#7B2EDA]"
            >
              {departmentOptions.map((d) => (
                <option key={d} className="bg-[#0a192f]">
                  {d}
                </option>
              ))}
            </select>
            {tier !== "table" && tier !== "partner" ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/55">Attendee category</p>
                <div className="flex flex-wrap gap-2">
                  {["Student", "Alumni", "Guest"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, category: c });
                        burst(reduceMotion);
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs font-black uppercase transition ${
                        form.category === c
                          ? "border-[#ffd700] bg-[#ffd700]/15 text-[#ffd700]"
                          : "border-white/15 bg-black/30 text-white/80 hover:border-[#00A86B]/40"
                      }`}
                    >
                      {c === "Student" ? "🎓 " : c === "Alumni" ? "🌟 " : "🤝 "}
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {tier !== "table" && tier !== "partner" && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm font-bold text-white/80">Tickets (max 5)</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="rounded-lg bg-white/10 px-3 py-1 font-black text-[#ffd700]"
                    onClick={() => {
                      setForm((f) => ({ ...f, tickets: Math.max(1, Number(f.tickets) - 1) }));
                      burst(reduceMotion);
                    }}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-black text-white">{form.tickets}</span>
                  <button
                    type="button"
                    className="rounded-lg bg-white/10 px-3 py-1 font-black text-[#ffd700]"
                    onClick={() => {
                      setForm((f) => ({ ...f, tickets: Math.min(5, Number(f.tickets) + 1) }));
                      burst(reduceMotion);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            <input
              placeholder="Dietary notes (optional)"
              value={form.diet}
              onChange={(e) => setForm({ ...form, diet: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#FF9F4A]"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-2xl border border-white/20 py-3 font-bold text-white/90">
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  burst(reduceMotion);
                  setStep(3);
                }}
                className={`flex-[2] rounded-2xl bg-gradient-to-r from-[#00A86B] to-[#7B2EDA] py-3 font-black uppercase text-white ${partyShakeClass}`}
              >
                Review & pay
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.form
            key="s3"
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 16 }}
            onSubmit={onSubmit}
            className="space-y-4"
          >
            <h3 className="font-['Montserrat',sans-serif] text-2xl font-black text-white">Let&apos;s seal it 🎟️</h3>
            <p className="rounded-2xl border border-[#ffd700]/30 bg-black/50 p-4 text-left text-sm text-white/80">
              <span className="font-bold text-[#ffd700]">Summary:</span> {form.fullName || "—"} · {form.category} · {form.tickets} ticket(s)
              <br />
              <span className="text-white/60">Paystack (test/live per backend keys). Mock mode works with no secret key.</span>
            </p>
            <div className="rounded-2xl bg-gradient-to-r from-[#FFD700]/20 via-[#00A86B]/20 to-[#7B2EDA]/25 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Amount due</p>
              <p className="mt-1 font-['Montserrat',sans-serif] text-4xl font-black text-[#ffd700]">₦{amountPreview.toLocaleString()}</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl bg-gradient-to-r from-[#FF6B6B] via-[#FFD700] to-[#00A86B] py-4 text-lg font-black uppercase tracking-wide text-[#0a192f] shadow-[0_0_30px_rgba(255,215,0,0.35)] disabled:opacity-60 ${partyShakeClass}`}
            >
              {loading ? "Hold on! Your celebration ticket is being prepared 🎉" : "Pay with Paystack →"}
            </button>
            {message ? <p className="text-center text-sm font-semibold text-[#FF6B6B]">{message}</p> : null}
            <button type="button" onClick={() => setStep(2)} className="w-full rounded-2xl border border-white/15 py-3 text-sm font-bold text-white/80">
              ← Edit details
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
