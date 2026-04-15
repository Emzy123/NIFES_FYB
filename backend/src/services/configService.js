const SiteConfig = require("../models/SiteConfig");
const defaults = require("../defaultSiteConfig");

function mergeVibeCheck(base, patch) {
  if (!base) return patch || undefined;
  if (!patch) return { ...base, moods: [...(base.moods || [])], tracks: [...(base.tracks || [])], energyBands: [...(base.energyBands || [])] };
  return {
    ...base,
    ...patch,
    moods: Array.isArray(patch.moods) ? patch.moods : base.moods,
    tracks: Array.isArray(patch.tracks) ? patch.tracks : base.tracks,
    energyBands: Array.isArray(patch.energyBands) ? patch.energyBands : base.energyBands,
  };
}

function mergeWithDefaults(doc) {
  if (!doc) return { ...defaults, pricing: { ...defaults.pricing }, vibeCheck: mergeVibeCheck(defaults.vibeCheck, null) };
  const { _id, __v, ...rest } = doc;
  return {
    ...defaults,
    ...rest,
    pricing: { ...defaults.pricing, ...(rest.pricing || {}) },
    vibeCheck: mergeVibeCheck(defaults.vibeCheck, rest.vibeCheck),
  };
}

async function seedIfEmpty() {
  const existing = await SiteConfig.findById("global");
  if (existing) return;
  await SiteConfig.create({ _id: "global", ...defaults });
}

async function getSiteConfig() {
  await seedIfEmpty();
  const doc = await SiteConfig.findById("global").lean();
  return mergeWithDefaults(doc);
}

/** Merge partial updates (admin); preserves nested objects where appropriate */
async function updateSiteConfig(patch) {
  const allowedTop = new Set([
    "seasonLabel",
    "eventDate",
    "ticketCardEventTitle",
    "headerTagline",
    "heroKicker",
    "heroTitle",
    "heroSubtitle",
    "heroBackgroundImage",
    "registrationSectionKicker",
    "registrationSectionTitle",
    "experienceSectionKicker",
    "experienceSectionTitle",
    "gallerySectionKicker",
    "gallerySectionTitle",
    "gallerySubmitEmail",
    "testimonialsSectionKicker",
    "testimonialsSectionTitle",
    "sponsorsSectionKicker",
    "sponsorsSectionTitle",
    "sponsorSpotlightCopy",
    "committeeSectionKicker",
    "committeeSectionTitle",
    "footerStillCelebrating",
    "footerOrgTitle",
    "eventTimeLabel",
    "venue",
    "dressCode",
    "entryGate",
    "emailSubject",
    "contactPhoneDisplay",
    "contactEmail",
    "whatsappShareUrl",
    "instagramUrl",
    "facebookUrl",
    "marqueeHypeThreshold",
    "marqueeHypeFallback",
    "marqueeTemplate",
    "pricing",
    "departments",
    "experience",
    "testimonials",
    "committee",
    "sponsors",
    "sponsorSpotlightTiers",
    "galleryItems",
    "vibeCheck",
  ]);
  const $set = {};
  for (const k of Object.keys(patch || {})) {
    if (!allowedTop.has(k)) continue;
    $set[k] = patch[k];
  }
  if (Object.keys($set).length === 0) return getSiteConfig();
  await SiteConfig.findByIdAndUpdate("global", { $set }, { new: true });
  return getSiteConfig();
}

function publicSitePayload(config) {
  const clone = JSON.parse(JSON.stringify(config));
  delete clone._id;
  delete clone.__v;
  return clone;
}

module.exports = { getSiteConfig, updateSiteConfig, seedIfEmpty, publicSitePayload };
