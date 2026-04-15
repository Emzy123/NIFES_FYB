import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { FaInstagram, FaFacebook, FaPhoneAlt, FaMusic, FaStar } from "react-icons/fa";
import BottomNav from "./components/BottomNav.jsx";
import RegistrationWizard from "./components/RegistrationWizard.jsx";
import SuccessCelebration from "./components/SuccessCelebration.jsx";
import VibeCheckModal from "./components/VibeCheckModal.jsx";
import fallbackSiteConfig, { mergeSiteConfig } from "./fallbackSiteConfig.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

const floatingEmojis = ["🎓", "✨", "🙌", "🔥", "🎉", "🥳", "💃", "🕺"];

function App() {
  const reduceMotion = useReducedMotion();
  const [partyMode, setPartyMode] = useState(() => localStorage.getItem("nifes_party") === "1");
  const [typed, setTyped] = useState("");
  const [lightbox, setLightbox] = useState("");
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [site, setSite] = useState(() => mergeSiteConfig(fallbackSiteConfig, {}));
  const [stats, setStats] = useState({ registrationCount: 0, earlyBirdSlotsLeft: 50, earlyBirdActive: true });
  const [celebration, setCelebration] = useState(null);
  const [vibeOpen, setVibeOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    matricNumber: "",
    department: "Computer Science",
    category: "Student",
    tickets: 1,
    diet: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const partyShakeClass = !reduceMotion && partyMode ? "party-shake" : "";

  useEffect(() => {
    localStorage.setItem("nifes_party", partyMode ? "1" : "0");
    document.documentElement.classList.toggle("party-mode", partyMode);
    return () => document.documentElement.classList.remove("party-mode");
  }, [partyMode]);

  const heroTitle = site.heroTitle || "";

  useEffect(() => {
    if (reduceMotion) {
      setTyped(heroTitle);
      return;
    }
    setTyped("");
  }, [heroTitle, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    if (typed.length < heroTitle.length) {
      const id = setTimeout(() => setTyped(heroTitle.slice(0, typed.length + 1)), 55);
      return () => clearTimeout(id);
    }
  }, [typed, heroTitle, reduceMotion]);

  useEffect(() => {
    const load = () => {
      fetch(`${API_BASE}/api/public/site`)
        .then((r) => r.json())
        .then((d) => {
          if (d.config) setSite(mergeSiteConfig(fallbackSiteConfig, d.config));
          if (d.stats)
            setStats({
              registrationCount: d.stats.registrationCount ?? 0,
              earlyBirdSlotsLeft: d.stats.earlyBirdSlotsLeft ?? 50,
              earlyBirdActive: d.stats.earlyBirdActive !== false,
            });
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? el.scrollTop / max : 0;
      el.style.setProperty("--progress-scale", String(Math.min(1, Math.max(0, p))));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!partyMode || reduceMotion) return;
    const onMove = (e) => {
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [partyMode, reduceMotion]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payRef = params.get("payref") || params.get("mockPaidRef");
    if (!payRef) return;
    setCelebration({ paymentReference: payRef, loading: true, ticket: null, error: null });
    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payment/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: payRef }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Verification failed");
        setCelebration({
          paymentReference: payRef,
          loading: false,
          ticket: data.ticket || null,
          error: null,
        });
      } catch (e) {
        setCelebration({
          paymentReference: payRef,
          loading: false,
          ticket: null,
          error: e.message || "Something went wrong.",
        });
      } finally {
        window.history.replaceState({}, "", "/");
      }
    };
    verify();
  }, []);

  const amountPreview = useMemo(() => {
    const t = Number(form.tickets);
    const p = site.pricing || {};
    if (form.category === "Sponsor") return Number(p.sponsorPrice ?? 25000);
    if (t === 5) return Number(p.tableFor5Price ?? 30000);
    if (stats.earlyBirdActive && stats.earlyBirdSlotsLeft > 0) return Number(p.earlyBirdPricePerTicket ?? 5000) * t;
    return Number(p.regularPricePerTicket ?? 7500) * t;
  }, [form.category, form.tickets, stats.earlyBirdActive, stats.earlyBirdSlotsLeft, site.pricing]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/payment/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to initialize payment.");
      window.location.href = data.authorizationUrl;
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const ctaConfetti = useCallback(() => {
    if (reduceMotion) return;
    confetti({ particleCount: 55, spread: 50, origin: { y: 0.85 } });
  }, [reduceMotion]);

  const ticker = useMemo(() => {
    const n = Math.max(stats.registrationCount, 0);
    const thr = site.marqueeHypeThreshold ?? 200;
    const fb = site.marqueeHypeFallback ?? "200+";
    const hype = n >= thr ? `${n}+` : fb;
    const tpl =
      site.marqueeTemplate ||
      "🔥 {hype} Final Year Brethren energy on campus • {count} paid flow registrations logged • Early bird slots left: {slots} • CUSTECH Osara stand up! 🎓✨";
    return tpl.replace(/\{hype\}/g, hype).replace(/\{count\}/g, String(n)).replace(/\{slots\}/g, String(stats.earlyBirdSlotsLeft ?? 0));
  }, [stats, site.marqueeHypeThreshold, site.marqueeHypeFallback, site.marqueeTemplate]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black pb-24 font-['Inter',system-ui,sans-serif] text-white md:pb-12">
      <div className="thread-progress" aria-hidden />

      <header className="fixed left-0 right-0 top-5 z-40 flex justify-center px-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0a192f]/80 px-2 py-2 pr-3 shadow-lg backdrop-blur-md">
          <span className="hidden rounded-full bg-gradient-to-r from-[#00A86B] to-[#FFD700] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#0a192f] sm:inline">
            {site.headerTagline}
          </span>
          <button
            type="button"
            onClick={() => {
              setPartyMode((p) => !p);
              ctaConfetti();
            }}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
              partyMode ? "bg-[#7B2EDA] text-white shadow-[0_0_20px_rgba(123,46,218,0.5)]" : "bg-white/10 text-white/90 hover:bg-white/15"
            }`}
          >
            <FaStar className="text-[#FFD700]" /> Party mode
          </button>
          <button
            type="button"
            title="Playlist links and prompts are editable in Admin → Site content"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/85 hover:bg-white/15"
            onClick={() => {
              ctaConfetti();
              setVibeOpen(true);
            }}
          >
            <FaMusic /> Vibe check
          </button>
        </div>
      </header>

      <section id="hero" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 text-center">
        <div
          className={`hero-mesh absolute inset-0 bg-[length:400%_400%] ${
            reduceMotion ? "bg-gradient-to-br from-[#0a192f] via-[#1a0a2e] to-black" : "bg-gradient-to-br from-[#0a192f] via-[#7B2EDA] via-40% to-[#00A86B]"
          }`}
        />
        <img
          src={site.heroBackgroundImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0a192f]/80 to-black" />

        {!reduceMotion &&
          floatingEmojis.map((em, i) => (
            <motion.span
              key={em + i}
              className="pointer-events-none absolute text-3xl sm:text-4xl"
              style={{ left: `${8 + i * 11}%`, top: `${18 + (i % 3) * 18}%` }}
              animate={{ y: [0, -18, 0], rotate: [0, 8, -6, 0] }}
              transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              {em}
            </motion.span>
          ))}

        <div className="relative z-10 max-w-4xl">
          <p className="font-['Caveat',cursive] text-2xl text-[#FFD700] sm:text-3xl">{site.heroKicker}</p>
          <motion.h1
            className="mt-2 font-['Montserrat',sans-serif] text-4xl font-black uppercase leading-tight tracking-tight sm:text-6xl md:text-7xl"
            initial={false}
            animate={reduceMotion ? undefined : { scale: [1, 1.02, 1] }}
            transition={{ duration: 3.2, repeat: Infinity }}
          >
            <span className="bg-gradient-to-r from-[#FFD700] via-[#FF9F4A] to-[#00A86B] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(255,215,0,0.35)]">
              {typed}
              {!reduceMotion && <span className="animate-pulse text-[#FFD700]">|</span>}
            </span>
          </motion.h1>
          <p className="mt-4 font-['Caveat',cursive] text-2xl text-white/90 sm:text-3xl">{site.heroSubtitle}</p>

          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {["days", "hours", "mins", "secs"].map((label, i) => (
              <CountBox key={label} label={label} index={i} eventDate={site.eventDate} reduceMotion={reduceMotion} />
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <motion.a
              href="#register"
              onClick={ctaConfetti}
              className={`inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF9F4A] px-8 py-4 font-['Montserrat',sans-serif] text-sm font-black uppercase tracking-wide text-white shadow-[0_0_40px_rgba(255,107,107,0.45)] sm:w-auto ${partyShakeClass}`}
              whileHover={reduceMotion ? undefined : { scale: 1.05 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            >
              Get Your Ticket 🎟️
            </motion.a>
            <motion.a
              href="#register"
              onClick={() => {
                setForm((f) => ({ ...f, category: "Sponsor", tickets: 1 }));
                ctaConfetti();
              }}
              className={`inline-flex w-full items-center justify-center rounded-2xl border-2 border-[#FFD700] bg-[#0a192f]/60 px-8 py-4 font-['Montserrat',sans-serif] text-sm font-black uppercase tracking-wide text-[#FFD700] backdrop-blur sm:w-auto ${partyShakeClass}`}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            >
              I&apos;m a Sponsor ✨
            </motion.a>
          </div>
        </div>

        <div className="relative z-10 mt-12 w-full overflow-hidden border-y border-white/10 bg-black/30 py-3 backdrop-blur-sm">
          <div className={`flex whitespace-nowrap ${reduceMotion ? "" : "animate-marquee"}`} style={reduceMotion ? { transform: "none" } : undefined}>
            <span className="px-8 text-sm font-bold text-white/85">{ticker}</span>
            <span className="px-8 text-sm font-bold text-white/85">{ticker}</span>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-16 px-4 py-16">
        <section id="experience" className="space-y-8">
          <SectionTitle kicker={site.experienceSectionKicker} title={site.experienceSectionTitle} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(site.experience || []).map((item, idx) => (
              <motion.article
                key={`${item.title}-${idx}`}
                initial={reduceMotion ? false : { opacity: 0, y: 24, rotate: -2 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: idx * 0.05 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a192f]/80 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={item.img} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-3xl drop-shadow-lg">{item.emoji}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-['Montserrat',sans-serif] text-xl font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{item.desc}</p>
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="register" className="scroll-mt-28 space-y-6">
          <SectionTitle kicker={site.registrationSectionKicker} title={site.registrationSectionTitle} />
          <RegistrationWizard
            form={form}
            setForm={setForm}
            amountPreview={amountPreview}
            loading={loading}
            message={message}
            onSubmit={onSubmit}
            reduceMotion={reduceMotion}
            earlyBirdSlotsLeft={stats.earlyBirdSlotsLeft}
            partyShakeClass={partyShakeClass}
            departments={site.departments}
          />
        </section>

        <section id="gallery" className="space-y-8">
          <SectionTitle kicker={site.gallerySectionKicker} title={site.gallerySectionTitle} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {(site.galleryItems || []).map((item, n) => {
              const src = item.thumbUrl || item.img;
              const full = item.fullUrl || item.thumbUrl;
              const caption = item.caption || `Photo ${n + 1}`;
              const rot = n % 2 === 0 ? "rotate-2" : "-rotate-2";
              return (
                <motion.button
                  key={src + n}
                  type="button"
                  onClick={() => setLightbox(full)}
                  whileHover={reduceMotion ? undefined : { rotate: 0, scale: 1.03 }}
                  className={`relative rounded-[1.2rem] border-[10px] border-white bg-white p-2 pb-8 text-left shadow-xl ${rot} transition`}
                >
                  <img src={src} alt={caption} className="aspect-square w-full rounded-lg object-cover" loading="lazy" decoding="async" />
                  <span className="absolute bottom-2 left-4 font-['Caveat',cursive] text-lg text-neutral-700">{caption}</span>
                </motion.button>
              );
            })}
          </div>
          <p className="text-center text-sm text-white/65">
            Submit your photos: <span className="text-[#FFD700]">{site.gallerySubmitEmail}</span>
          </p>
        </section>

        <section id="testimonials" className="space-y-6">
          <SectionTitle kicker="Testimonials" title="Real talk from FYB alumni 🔊" />
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={16}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true }}
            breakpoints={{ 768: { slidesPerView: 2 } }}
            className="!pb-12"
          >
            {(site.testimonials || []).map((t) => (
              <SwiperSlide key={t.name}>
                <div className="relative h-full rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a192f] to-black p-6 shadow-lg">
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${t.color} font-black text-white shadow-md`}>
                    ▶
                  </div>
                  <p className="text-lg font-semibold leading-relaxed text-white/90">&ldquo;{t.text}&rdquo;</p>
                  <p className="mt-4 text-sm font-bold text-[#FFD700]">{t.name}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        <section id="sponsors" className="space-y-6">
          <SectionTitle kicker={site.sponsorsSectionKicker} title={site.sponsorsSectionTitle} />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a192f]/60 py-8">
            <div className={`flex w-max gap-10 ${reduceMotion ? "" : "animate-marquee"}`}>
              {[0, 1].map((dup) => (
                <div key={dup} className="flex gap-10">
                  {(site.sponsors || []).map((s) => (
                    <div
                      key={`${dup}-${s}`}
                      className="relative flex h-20 min-w-[140px] items-center justify-center rounded-2xl border border-[#FFD700]/30 bg-black/40 px-6 font-['Montserrat',sans-serif] text-sm font-black uppercase text-[#FFD700] shadow-inner"
                    >
                      <span className="relative z-10">{s}</span>
                      <span className="pointer-events-none absolute inset-0 animate-shimmer opacity-40" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(site.sponsorSpotlightTiers || []).map((tier) => (
              <motion.div
                key={tier}
                whileHover={reduceMotion ? undefined : { y: -6 }}
                className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 text-center"
              >
                <p className="font-['Montserrat',sans-serif] text-lg font-black text-white">{tier}</p>
                <p className="mt-2 text-sm text-white/65">{site.sponsorSpotlightCopy}</p>
                <a href="#register" className="mt-4 inline-block rounded-full bg-[#00A86B] px-4 py-2 text-xs font-black uppercase text-white">
                  Partner with us
                </a>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="committee" className="space-y-6">
          <SectionTitle kicker={site.committeeSectionKicker} title={site.committeeSectionTitle} />
          <div className="grid gap-4 sm:grid-cols-2">
            {(site.committee || []).map((m) => (
              <motion.div
                key={m.name}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a192f]/90 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FF6B6B] font-black text-[#0a192f] shadow-lg">
                    {m.name
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-['Montserrat',sans-serif] font-black text-white">{m.name}</p>
                    <span className="mt-1 inline-block rounded-full bg-[#7B2EDA]/30 px-3 py-0.5 text-xs font-bold text-[#e9d5ff]">{m.role}</span>
                  </div>
                </div>
                <div className="mt-4 max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-20 group-hover:opacity-100">
                  <a href={`https://wa.me/${m.wa}`} className="text-sm font-bold text-[#25D366]">
                    WhatsApp the team →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <footer id="footer" className="space-y-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0a192f] via-black to-[#1a0a2e] p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-['Caveat',cursive] text-2xl text-[#FFD700]">{site.footerStillCelebrating}</p>
              <h3 className="font-['Montserrat',sans-serif] text-2xl font-black text-white">{site.footerOrgTitle}</h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/75">
                <FaPhoneAlt className="text-[#00A86B]" /> {site.contactPhoneDisplay} · {site.contactEmail}
              </p>
            </div>
            <div className="flex gap-3">
              <a href={site.instagramUrl} className="rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FF9F4A] p-4 text-[#0a192f] shadow-lg transition hover:scale-105">
                <FaInstagram className="text-xl" />
              </a>
              <a href={site.facebookUrl} className="rounded-2xl bg-gradient-to-br from-[#7B2EDA] to-[#FF6B6B] p-4 text-white shadow-lg transition hover:scale-105">
                <FaFacebook className="text-xl" />
              </a>
              <a
                href={site.whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-[#25D366] p-4 text-white shadow-lg transition hover:scale-105"
              >
                <span className="text-xl font-black">WA</span>
              </a>
            </div>
          </div>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setNewsletterDone(true);
              if (!reduceMotion) confetti({ particleCount: 80, spread: 60, origin: { y: 0.9 } });
            }}
          >
            <input
              type="email"
              required
              placeholder="Newsletter — drop your email for FYB updates"
              className="flex-1 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#FFD700]"
            />
            <button type="submit" className={`rounded-2xl bg-gradient-to-r from-[#00A86B] to-[#7B2EDA] px-8 py-3 font-black uppercase text-white ${partyShakeClass}`}>
              {newsletterDone ? "You're on the list 🎉" : "Notify me"}
            </button>
          </form>
        </footer>
      </main>

      <BottomNav />

      <AnimatePresence>
        {lightbox ? (
          <motion.button
            type="button"
            className="fixed inset-0 z-[150] grid place-items-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox("")}
          >
            <img src={lightbox} alt="Gallery" className="max-h-[90vh] max-w-full rounded-2xl object-contain" />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {vibeOpen ? (
          <VibeCheckModal onClose={() => setVibeOpen(false)} vibeCheck={site.vibeCheck} reduceMotion={reduceMotion} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {celebration ? (
          <SuccessCelebration
            ticket={celebration.ticket}
            loading={celebration.loading}
            error={celebration.error}
            paymentReference={celebration.paymentReference}
            reduceMotion={reduceMotion}
            eventDate={site.eventDate}
            onClose={() => setCelebration(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SectionTitle({ kicker, title }) {
  return (
    <div className="text-center">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[#00A86B]">{kicker}</p>
      <h2 className="mt-2 font-['Montserrat',sans-serif] text-3xl font-black text-white sm:text-4xl">{title}</h2>
    </div>
  );
}

function CountBox({ label, index, eventDate, reduceMotion }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const target = new Date(eventDate).getTime();
      const dist = Math.max(target - now, 0);
      const map = {
        days: Math.floor(dist / 86400000),
        hours: Math.floor((dist / 3600000) % 24),
        mins: Math.floor((dist / 60000) % 60),
        secs: Math.floor((dist / 1000) % 60),
      };
      setV(map[label]);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventDate, label]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 280, damping: 18 }}
      className="rounded-2xl border border-[#FFD700]/40 bg-black/50 p-4 shadow-[0_0_25px_rgba(0,168,107,0.15)] backdrop-blur-sm"
    >
      <p className="font-['Montserrat',sans-serif] text-3xl font-black text-[#FFD700]">{String(v).padStart(2, "0")}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label}</p>
    </motion.div>
  );
}

export default App;
