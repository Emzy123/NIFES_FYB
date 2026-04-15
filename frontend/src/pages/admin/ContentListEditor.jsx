const TESTIMONIAL_COLOR_PRESETS = [
  { label: "Emerald → Purple", value: "from-[#00A86B] to-[#7B2EDA]" },
  { label: "Gold → Coral", value: "from-[#FFD700] to-[#FF6B6B]" },
  { label: "Purple → Orange", value: "from-[#7B2EDA] to-[#FF9F4A]" },
  { label: "Gold → Green", value: "from-[#FFD700] to-[#00A86B]" },
];

function Subsection({ title, hint, children, actions }) {
  return (
    <div className="admin-subsection">
      <div className="admin-subsection-head">
        <div>
          <h2 className="admin-subsection-title">{title}</h2>
          {hint ? <p className="admin-subsection-hint">{hint}</p> : null}
        </div>
        {actions}
      </div>
      <div className="admin-subsection-body">{children}</div>
    </div>
  );
}

function ItemCard({ title, onRemove, children, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  return (
    <div className="admin-item-card">
      <div className="admin-item-card-head">
        <span className="admin-item-card-title">{title}</span>
        <div className="admin-item-card-actions">
          <button type="button" className="admin-icon-btn" disabled={!canMoveUp} onClick={onMoveUp} title="Move up">
            ↑
          </button>
          <button type="button" className="admin-icon-btn" disabled={!canMoveDown} onClick={onMoveDown} title="Move down">
            ↓
          </button>
          <button type="button" className="admin-danger-btn" onClick={onRemove}>
            Delete
          </button>
        </div>
      </div>
      <div className="admin-item-card-fields">{children}</div>
    </div>
  );
}

function moveInArray(arr, index, delta) {
  const next = [...arr];
  const j = index + delta;
  if (j < 0 || j >= next.length) return arr;
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

export default function ContentListEditor({ cfg, setCfg }) {
  const experience = cfg.experience || [];
  const testimonials = cfg.testimonials || [];
  const committee = cfg.committee || [];
  const galleryItems = cfg.galleryItems || [];
  const sponsors = cfg.sponsors || [];
  const sponsorSpotlightTiers = cfg.sponsorSpotlightTiers || [];
  const departments = cfg.departments || [];
  const vibe = cfg.vibeCheck || {};
  const vibeMoods = vibe.moods || [];
  const vibeTracks = vibe.tracks || [];
  const vibeBands = vibe.energyBands || [];

  const setKey = (key, value) => setCfg((c) => ({ ...c, [key]: value }));
  const setVibe = (partial) => setCfg((c) => ({ ...c, vibeCheck: { ...(c.vibeCheck || {}), ...partial } }));

  return (
    <section className="admin-panel admin-content-sections">
      <Subsection
        title="Vibe check (header button)"
        hint="Copy for the modal opened from “Vibe check” on the public site: title, energy slider bands, moods with prompts, and playlist links."
      >
        <label className="admin-mini-field admin-mini-field-full">
          <span>Eyebrow</span>
          <input
            value={vibe.modalEyebrow || ""}
            onChange={(e) => setVibe({ modalEyebrow: e.target.value })}
          />
        </label>
        <label className="admin-mini-field admin-mini-field-full">
          <span>Modal title</span>
          <input
            value={vibe.modalTitle || ""}
            onChange={(e) => setVibe({ modalTitle: e.target.value })}
          />
        </label>
        <label className="admin-mini-field admin-mini-field-full">
          <span>Energy slider label</span>
          <input value={vibe.energyLabel || ""} onChange={(e) => setVibe({ energyLabel: e.target.value })} />
        </label>
        <label className="admin-mini-field admin-mini-field-full">
          <span>Confirm button label</span>
          <input value={vibe.confirmLabel || ""} onChange={(e) => setVibe({ confirmLabel: e.target.value })} />
        </label>
        <label className="admin-mini-field admin-mini-field-full">
          <span>After-confirm message</span>
          <textarea rows={2} value={vibe.confirmMessage || ""} onChange={(e) => setVibe({ confirmMessage: e.target.value })} />
        </label>

        <h3 className="admin-subsection-title mt-6 text-base">Energy bands</h3>
        <p className="admin-subsection-hint mb-3">One line per band; slider value 0–100 must fall in min–max (inclusive).</p>
        {vibeBands.length === 0 ? <p className="admin-empty">No bands — add one.</p> : null}
        {vibeBands.map((b, i) => (
          <ItemCard
            key={`vb-${i}`}
            title={`Band ${i + 1}`}
            canMoveUp={i > 0}
            canMoveDown={i < vibeBands.length - 1}
            onMoveUp={() => setVibe({ energyBands: moveInArray(vibeBands, i, -1) })}
            onMoveDown={() => setVibe({ energyBands: moveInArray(vibeBands, i, 1) })}
            onRemove={() => setVibe({ energyBands: vibeBands.filter((_, j) => j !== i) })}
          >
            <label className="admin-mini-field">
              <span>Min</span>
              <input
                type="number"
                min={0}
                max={100}
                value={b.min ?? ""}
                onChange={(e) => {
                  const next = [...vibeBands];
                  next[i] = { ...next[i], min: Number(e.target.value) };
                  setVibe({ energyBands: next });
                }}
              />
            </label>
            <label className="admin-mini-field">
              <span>Max</span>
              <input
                type="number"
                min={0}
                max={100}
                value={b.max ?? ""}
                onChange={(e) => {
                  const next = [...vibeBands];
                  next[i] = { ...next[i], max: Number(e.target.value) };
                  setVibe({ energyBands: next });
                }}
              />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>Label</span>
              <input
                value={b.label || ""}
                onChange={(e) => {
                  const next = [...vibeBands];
                  next[i] = { ...next[i], label: e.target.value };
                  setVibe({ energyBands: next });
                }}
              />
            </label>
          </ItemCard>
        ))}
        <button
          type="button"
          className="admin-add-btn mt-2"
          onClick={() => setVibe({ energyBands: [...vibeBands, { min: 0, max: 100, label: "New band" }] })}
        >
          + Add energy band
        </button>

        <h3 className="admin-subsection-title mt-8 text-base">Moods</h3>
        <p className="admin-subsection-hint mb-3">Stable id (e.g. grateful); label is shown on chips; prompt appears under the selection.</p>
        {vibeMoods.length === 0 ? <p className="admin-empty">No moods.</p> : null}
        {vibeMoods.map((item, i) => (
          <ItemCard
            key={`vm-${item.id}-${i}`}
            title={item.label || `Mood ${i + 1}`}
            canMoveUp={i > 0}
            canMoveDown={i < vibeMoods.length - 1}
            onMoveUp={() => setVibe({ moods: moveInArray(vibeMoods, i, -1) })}
            onMoveDown={() => setVibe({ moods: moveInArray(vibeMoods, i, 1) })}
            onRemove={() => setVibe({ moods: vibeMoods.filter((_, j) => j !== i) })}
          >
            <label className="admin-mini-field">
              <span>Id</span>
              <input
                value={item.id || ""}
                onChange={(e) => {
                  const next = [...vibeMoods];
                  next[i] = { ...next[i], id: e.target.value.replace(/\s+/g, "-").toLowerCase() };
                  setVibe({ moods: next });
                }}
              />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>Label</span>
              <input
                value={item.label || ""}
                onChange={(e) => {
                  const next = [...vibeMoods];
                  next[i] = { ...next[i], label: e.target.value };
                  setVibe({ moods: next });
                }}
              />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>Prompt</span>
              <textarea
                rows={2}
                value={item.prompt || ""}
                onChange={(e) => {
                  const next = [...vibeMoods];
                  next[i] = { ...next[i], prompt: e.target.value };
                  setVibe({ moods: next });
                }}
              />
            </label>
          </ItemCard>
        ))}
        <button
          type="button"
          className="admin-add-btn mt-2"
          onClick={() =>
            setVibe({
              moods: [...vibeMoods, { id: `mood-${Date.now()}`, label: "✨ New mood", prompt: "Your prompt here." }],
            })
          }
        >
          + Add mood
        </button>

        <h3 className="admin-subsection-title mt-8 text-base">Playlist links</h3>
        <p className="admin-subsection-hint mb-3">Spotify, YouTube Music, Apple Music, etc. — full https URLs.</p>
        {vibeTracks.length === 0 ? <p className="admin-empty">No tracks.</p> : null}
        {vibeTracks.map((item, i) => (
          <ItemCard
            key={`vt-${i}`}
            title={item.title || `Playlist ${i + 1}`}
            canMoveUp={i > 0}
            canMoveDown={i < vibeTracks.length - 1}
            onMoveUp={() => setVibe({ tracks: moveInArray(vibeTracks, i, -1) })}
            onMoveDown={() => setVibe({ tracks: moveInArray(vibeTracks, i, 1) })}
            onRemove={() => setVibe({ tracks: vibeTracks.filter((_, j) => j !== i) })}
          >
            <label className="admin-mini-field admin-mini-field-full">
              <span>Title</span>
              <input
                value={item.title || ""}
                onChange={(e) => {
                  const next = [...vibeTracks];
                  next[i] = { ...next[i], title: e.target.value };
                  setVibe({ tracks: next });
                }}
              />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>URL</span>
              <input
                value={item.link || ""}
                onChange={(e) => {
                  const next = [...vibeTracks];
                  next[i] = { ...next[i], link: e.target.value };
                  setVibe({ tracks: next });
                }}
              />
            </label>
          </ItemCard>
        ))}
        <button
          type="button"
          className="admin-add-btn mt-2"
          onClick={() =>
            setVibe({
              tracks: [...vibeTracks, { title: "New playlist", link: "https://" }],
            })
          }
        >
          + Add playlist
        </button>
      </Subsection>

      <Subsection
        title="Experience cards"
        hint="Shown on the homepage “Experience” section. Each card needs emoji, title, short description, and image URL."
        actions={
          <button
            type="button"
            className="admin-add-btn"
            onClick={() =>
              setKey("experience", [
                ...experience,
                { emoji: "✨", title: "New highlight", desc: "Description here.", img: "https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?w=800" },
              ])
            }
          >
            + Add card
          </button>
        }
      >
        {experience.length === 0 ? <p className="admin-empty">No cards yet. Add one to get started.</p> : null}
        {experience.map((item, i) => (
          <ItemCard
            key={`exp-${i}`}
            index={i}
            title={item.title || `Card ${i + 1}`}
            canMoveUp={i > 0}
            canMoveDown={i < experience.length - 1}
            onMoveUp={() => setKey("experience", moveInArray(experience, i, -1))}
            onMoveDown={() => setKey("experience", moveInArray(experience, i, 1))}
            onRemove={() => setKey("experience", experience.filter((_, j) => j !== i))}
          >
            <label className="admin-mini-field">
              <span>Emoji</span>
              <input value={item.emoji || ""} onChange={(e) => {
                const next = [...experience];
                next[i] = { ...next[i], emoji: e.target.value };
                setKey("experience", next);
              }} />
            </label>
            <label className="admin-mini-field">
              <span>Title</span>
              <input value={item.title || ""} onChange={(e) => {
                const next = [...experience];
                next[i] = { ...next[i], title: e.target.value };
                setKey("experience", next);
              }} />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>Description</span>
              <textarea rows={2} value={item.desc || ""} onChange={(e) => {
                const next = [...experience];
                next[i] = { ...next[i], desc: e.target.value };
                setKey("experience", next);
              }} />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>Image URL</span>
              <input value={item.img || ""} onChange={(e) => {
                const next = [...experience];
                next[i] = { ...next[i], img: e.target.value };
                setKey("experience", next);
              }} />
            </label>
          </ItemCard>
        ))}
      </Subsection>

      <Subsection
        title="Testimonials"
        hint="Name, quote, and a Tailwind gradient class for the avatar ring (or pick a preset)."
        actions={
          <button
            type="button"
            className="admin-add-btn"
            onClick={() =>
              setKey("testimonials", [
                ...testimonials,
                { name: "New voice", text: "Your quote here.", color: "from-[#00A86B] to-[#7B2EDA]" },
              ])
            }
          >
            + Add testimonial
          </button>
        }
      >
        {testimonials.length === 0 ? <p className="admin-empty">No testimonials yet.</p> : null}
        {testimonials.map((item, i) => (
          <ItemCard
            key={`test-${i}`}
            title={item.name || `Testimonial ${i + 1}`}
            canMoveUp={i > 0}
            canMoveDown={i < testimonials.length - 1}
            onMoveUp={() => setKey("testimonials", moveInArray(testimonials, i, -1))}
            onMoveDown={() => setKey("testimonials", moveInArray(testimonials, i, 1))}
            onRemove={() => setKey("testimonials", testimonials.filter((_, j) => j !== i))}
          >
            <label className="admin-mini-field">
              <span>Name</span>
              <input value={item.name || ""} onChange={(e) => {
                const next = [...testimonials];
                next[i] = { ...next[i], name: e.target.value };
                setKey("testimonials", next);
              }} />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>Quote</span>
              <textarea rows={3} value={item.text || ""} onChange={(e) => {
                const next = [...testimonials];
                next[i] = { ...next[i], text: e.target.value };
                setKey("testimonials", next);
              }} />
            </label>
            <div className="admin-mini-field admin-mini-field-full">
              <span className="admin-mini-label">Avatar gradient</span>
              <select
                className="admin-select"
                value={TESTIMONIAL_COLOR_PRESETS.some((p) => p.value === item.color) ? item.color : "__custom__"}
                onChange={(e) => {
                  const v = e.target.value;
                  const next = [...testimonials];
                  if (v === "__custom__") next[i] = { ...next[i], color: item.color || "from-[#00A86B] to-[#7B2EDA]" };
                  else next[i] = { ...next[i], color: v };
                  setKey("testimonials", next);
                }}
              >
                {TESTIMONIAL_COLOR_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                <option value="__custom__">Custom (type below)</option>
              </select>
              {!TESTIMONIAL_COLOR_PRESETS.some((p) => p.value === (item.color || "")) ? (
                <input
                  className="admin-custom-color-input"
                  placeholder="from-[#00A86B] to-[#7B2EDA]"
                  value={item.color || ""}
                  onChange={(e) => {
                    const next = [...testimonials];
                    next[i] = { ...next[i], color: e.target.value };
                    setKey("testimonials", next);
                  }}
                />
              ) : null}
            </div>
          </ItemCard>
        ))}
      </Subsection>

      <Subsection
        title="Committee"
        hint="Team members for the “Meet the team” section. WhatsApp field: digits only (e.g. 2348012345678)."
        actions={
          <button
            type="button"
            className="admin-add-btn"
            onClick={() =>
              setKey("committee", [...committee, { name: "New member", role: "Role", wa: "2348000000000" }])
            }
          >
            + Add member
          </button>
        }
      >
        {committee.length === 0 ? <p className="admin-empty">No committee members yet.</p> : null}
        {committee.map((item, i) => (
          <ItemCard
            key={`com-${i}`}
            title={item.name || `Member ${i + 1}`}
            canMoveUp={i > 0}
            canMoveDown={i < committee.length - 1}
            onMoveUp={() => setKey("committee", moveInArray(committee, i, -1))}
            onMoveDown={() => setKey("committee", moveInArray(committee, i, 1))}
            onRemove={() => setKey("committee", committee.filter((_, j) => j !== i))}
          >
            <label className="admin-mini-field">
              <span>Name</span>
              <input value={item.name || ""} onChange={(e) => {
                const next = [...committee];
                next[i] = { ...next[i], name: e.target.value };
                setKey("committee", next);
              }} />
            </label>
            <label className="admin-mini-field">
              <span>Role</span>
              <input value={item.role || ""} onChange={(e) => {
                const next = [...committee];
                next[i] = { ...next[i], role: e.target.value };
                setKey("committee", next);
              }} />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>WhatsApp (no +)</span>
              <input value={item.wa || ""} onChange={(e) => {
                const next = [...committee];
                next[i] = { ...next[i], wa: e.target.value.replace(/\D/g, "") };
                setKey("committee", next);
              }} placeholder="2348012345678"
              />
            </label>
          </ItemCard>
        ))}
      </Subsection>

      <Subsection
        title="Gallery"
        hint="Polaroid-style grid: thumbnail URL, full-size URL for lightbox, and caption."
        actions={
          <button
            type="button"
            className="admin-add-btn"
            onClick={() =>
              setKey("galleryItems", [
                ...galleryItems,
                {
                  thumbUrl: "https://picsum.photos/seed/new/600/600",
                  fullUrl: "https://picsum.photos/seed/new/1400/1400",
                  caption: "New photo",
                },
              ])
            }
          >
            + Add photo
          </button>
        }
      >
        {galleryItems.length === 0 ? <p className="admin-empty">No gallery items yet.</p> : null}
        {galleryItems.map((item, i) => (
          <ItemCard
            key={`gal-${i}`}
            title={item.caption || `Photo ${i + 1}`}
            canMoveUp={i > 0}
            canMoveDown={i < galleryItems.length - 1}
            onMoveUp={() => setKey("galleryItems", moveInArray(galleryItems, i, -1))}
            onMoveDown={() => setKey("galleryItems", moveInArray(galleryItems, i, 1))}
            onRemove={() => setKey("galleryItems", galleryItems.filter((_, j) => j !== i))}
          >
            <label className="admin-mini-field admin-mini-field-full">
              <span>Thumbnail URL</span>
              <input value={item.thumbUrl || ""} onChange={(e) => {
                const next = [...galleryItems];
                next[i] = { ...next[i], thumbUrl: e.target.value };
                setKey("galleryItems", next);
              }} />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>Full image URL</span>
              <input value={item.fullUrl || ""} onChange={(e) => {
                const next = [...galleryItems];
                next[i] = { ...next[i], fullUrl: e.target.value };
                setKey("galleryItems", next);
              }} />
            </label>
            <label className="admin-mini-field admin-mini-field-full">
              <span>Caption</span>
              <input value={item.caption || ""} onChange={(e) => {
                const next = [...galleryItems];
                next[i] = { ...next[i], caption: e.target.value };
                setKey("galleryItems", next);
              }} />
            </label>
          </ItemCard>
        ))}
      </Subsection>

      <Subsection
        title="Sponsor marquee"
        hint="Names shown in the scrolling sponsor strip (e.g. tier names for placeholder logos)."
        actions={
          <button type="button" className="admin-add-btn" onClick={() => setKey("sponsors", [...sponsors, "New sponsor"])}>
            + Add name
          </button>
        }
      >
        {sponsors.length === 0 ? <p className="admin-empty">No marquee names.</p> : null}
        <div className="admin-string-list">
          {sponsors.map((s, i) => (
            <div key={`sp-${i}`} className="admin-string-row">
              <input
                value={s}
                onChange={(e) => {
                  const next = [...sponsors];
                  next[i] = e.target.value;
                  setKey("sponsors", next);
                }}
              />
              <div className="admin-string-row-actions">
                <button type="button" className="admin-icon-btn" disabled={i === 0} onClick={() => setKey("sponsors", moveInArray(sponsors, i, -1))}>
                  ↑
                </button>
                <button type="button" className="admin-icon-btn" disabled={i === sponsors.length - 1} onClick={() => setKey("sponsors", moveInArray(sponsors, i, 1))}>
                  ↓
                </button>
                <button type="button" className="admin-danger-btn" onClick={() => setKey("sponsors", sponsors.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </Subsection>

      <Subsection
        title="Sponsor spotlight tiers"
        hint="The three (or more) cards under the marquee with “Partner with us” (e.g. Platinum, Gold, Silver)."
        actions={
          <button type="button" className="admin-add-btn" onClick={() => setKey("sponsorSpotlightTiers", [...sponsorSpotlightTiers, "New tier"])}>
            + Add tier
          </button>
        }
      >
        {sponsorSpotlightTiers.length === 0 ? <p className="admin-empty">No spotlight tiers.</p> : null}
        <div className="admin-string-list">
          {sponsorSpotlightTiers.map((s, i) => (
            <div key={`st-${i}`} className="admin-string-row">
              <input
                value={s}
                onChange={(e) => {
                  const next = [...sponsorSpotlightTiers];
                  next[i] = e.target.value;
                  setKey("sponsorSpotlightTiers", next);
                }}
              />
              <div className="admin-string-row-actions">
                <button type="button" className="admin-icon-btn" disabled={i === 0} onClick={() => setKey("sponsorSpotlightTiers", moveInArray(sponsorSpotlightTiers, i, -1))}>
                  ↑
                </button>
                <button type="button" className="admin-icon-btn" disabled={i === sponsorSpotlightTiers.length - 1} onClick={() => setKey("sponsorSpotlightTiers", moveInArray(sponsorSpotlightTiers, i, 1))}>
                  ↓
                </button>
                <button type="button" className="admin-danger-btn" onClick={() => setKey("sponsorSpotlightTiers", sponsorSpotlightTiers.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </Subsection>

      <Subsection
        title="Departments"
        hint="Options in the registration form department dropdown."
        actions={
          <button type="button" className="admin-add-btn" onClick={() => setKey("departments", [...departments, "New department"])}>
            + Add department
          </button>
        }
      >
        {departments.length === 0 ? <p className="admin-empty">No departments.</p> : null}
        <div className="admin-string-list">
          {departments.map((s, i) => (
            <div key={`dep-${i}`} className="admin-string-row">
              <input
                value={s}
                onChange={(e) => {
                  const next = [...departments];
                  next[i] = e.target.value;
                  setKey("departments", next);
                }}
              />
              <div className="admin-string-row-actions">
                <button type="button" className="admin-icon-btn" disabled={i === 0} onClick={() => setKey("departments", moveInArray(departments, i, -1))}>
                  ↑
                </button>
                <button type="button" className="admin-icon-btn" disabled={i === departments.length - 1} onClick={() => setKey("departments", moveInArray(departments, i, 1))}>
                  ↓
                </button>
                <button type="button" className="admin-danger-btn" onClick={() => setKey("departments", departments.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </Subsection>
    </section>
  );
}
