import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { FaTimes, FaMusic, FaExternalLinkAlt } from "react-icons/fa";

function bandLabelForEnergy(energy, bands) {
  if (!bands?.length) return "";
  const n = Math.round(Number(energy) || 0);
  const hit = bands.find((b) => n >= Math.min(b.min, b.max) && n <= Math.max(b.min, b.max));
  if (hit) return hit.label;
  return bands[bands.length - 1]?.label || "";
}

export default function VibeCheckModal({ onClose, vibeCheck, reduceMotion }) {
  const [energy, setEnergy] = useState(50);
  const [moodId, setMoodId] = useState("");
  const [phase, setPhase] = useState("pick");

  const moods = vibeCheck?.moods ?? [];
  const tracks = vibeCheck?.tracks ?? [];
  const bands = vibeCheck?.energyBands ?? [];

  useEffect(() => {
    setEnergy(50);
    setMoodId(vibeCheck?.moods?.[0]?.id || "");
    setPhase("pick");
    // Intentionally once per mount — avoid resetting if /api/public/site refreshes while open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMood = useMemo(() => moods.find((m) => m.id === moodId) || moods[0], [moods, moodId]);
  const bandLine = useMemo(() => bandLabelForEnergy(energy, bands), [energy, bands]);

  const fireConfetti = () => {
    if (reduceMotion) return;
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 } });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[190] flex items-center justify-center bg-black/80 px-3 py-6 backdrop-blur-md sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vibe-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.92, y: 36 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-[#ffd700]/45 bg-gradient-to-b from-[#0a192f] via-[#121a2f] to-black p-5 shadow-[0_0_50px_rgba(123,46,218,0.3)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        {phase === "done" ? (
          <div className="pt-6 text-center">
            <p className="font-['Caveat',cursive] text-2xl text-[#ffd700]">{vibeCheck?.modalEyebrow || "Vibe check"}</p>
            <h2 id="vibe-modal-title" className="mt-2 font-['Montserrat',sans-serif] text-xl font-black text-white sm:text-2xl">
              {vibeCheck?.confirmMessage || "You locked in."}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#00A86B] to-[#7B2EDA] py-3 font-['Montserrat',sans-serif] text-sm font-black uppercase tracking-wide text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="font-['Caveat',cursive] text-2xl text-[#ffd700]">{vibeCheck?.modalEyebrow || "Vibe check"}</p>
            <h2 id="vibe-modal-title" className="mt-1 font-['Montserrat',sans-serif] text-2xl font-black uppercase tracking-tight text-white">
              {vibeCheck?.modalTitle || "How are we entering FYB night?"}
            </h2>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/50">
                <span>{vibeCheck?.energyLabel || "Your energy"}</span>
                <span className="text-[#ffd700]">{Math.round(energy)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#FFD700]"
              />
              {bandLine ? <p className="mt-2 text-sm text-white/75">{bandLine}</p> : null}
            </div>

            <div className="mt-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00A86B]">Mood</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {moods.length === 0 ? (
                  <p className="text-sm text-white/60">No moods configured yet.</p>
                ) : (
                  moods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMoodId(m.id)}
                      className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                        moodId === m.id
                          ? "border-[#ffd700] bg-[#ffd700]/15 text-white"
                          : "border-white/15 bg-white/5 text-white/70 hover:border-white/40"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))
                )}
              </div>
              {selectedMood?.prompt ? (
                <p className="mt-3 rounded-2xl border border-white/10 bg-black/30 py-3 px-4 text-sm leading-relaxed text-white/85">
                  {selectedMood.prompt}
                </p>
              ) : null}
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#00A86B]">
                <FaMusic className="text-[#ffd700]" /> Playlist links
              </p>
              <ul className="mt-2 space-y-2">
                {tracks.length === 0 ? (
                  <li className="text-sm text-white/55">Add tracks in the admin dashboard.</li>
                ) : (
                  tracks.map((t, i) => (
                    <li key={`${t.title}-${i}`}>
                      <a
                        href={t.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 transition hover:border-[#ffd700]/40 hover:bg-white/10"
                      >
                        <span className="truncate">{t.title || "Playlist"}</span>
                        <FaExternalLinkAlt className="shrink-0 text-[#ffd700]" />
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                fireConfetti();
                setPhase("done");
              }}
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF9F4A] py-3 font-['Montserrat',sans-serif] text-sm font-black uppercase tracking-wide text-white shadow-[0_0_30px_rgba(255,107,107,0.35)]"
            >
              {vibeCheck?.confirmLabel || "I'm locked in"}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
