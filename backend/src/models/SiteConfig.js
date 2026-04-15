const mongoose = require("mongoose");

const PricingSchema = new mongoose.Schema(
  {
    earlyBirdCapacity: { type: Number, default: 50 },
    earlyBirdPricePerTicket: { type: Number, default: 5000 },
    regularPricePerTicket: { type: Number, default: 7500 },
    tableFor5Price: { type: Number, default: 30000 },
    sponsorPrice: { type: Number, default: 25000 },
  },
  { _id: false }
);

const SiteConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "global" },
    seasonLabel: String,
    eventDate: String,
    ticketCardEventTitle: String,
    headerTagline: String,
    heroKicker: String,
    heroTitle: String,
    heroSubtitle: String,
    heroBackgroundImage: String,
    registrationSectionKicker: String,
    registrationSectionTitle: String,
    experienceSectionKicker: String,
    experienceSectionTitle: String,
    gallerySectionKicker: String,
    gallerySectionTitle: String,
    gallerySubmitEmail: String,
    testimonialsSectionKicker: String,
    testimonialsSectionTitle: String,
    sponsorsSectionKicker: String,
    sponsorsSectionTitle: String,
    sponsorSpotlightCopy: String,
    committeeSectionKicker: String,
    committeeSectionTitle: String,
    footerStillCelebrating: String,
    footerOrgTitle: String,
    eventTimeLabel: String,
    venue: String,
    dressCode: String,
    entryGate: String,
    emailSubject: String,
    contactPhoneDisplay: String,
    contactEmail: String,
    whatsappShareUrl: String,
    instagramUrl: String,
    facebookUrl: String,
    marqueeHypeThreshold: Number,
    marqueeHypeFallback: String,
    marqueeTemplate: String,
    pricing: PricingSchema,
    departments: [String],
    experience: [mongoose.Schema.Types.Mixed],
    testimonials: [mongoose.Schema.Types.Mixed],
    committee: [mongoose.Schema.Types.Mixed],
    sponsors: [String],
    sponsorSpotlightTiers: [String],
    galleryItems: [mongoose.Schema.Types.Mixed],
    vibeCheck: mongoose.Schema.Types.Mixed,
  },
  { collection: "siteconfigs" }
);

module.exports = mongoose.model("SiteConfig", SiteConfigSchema);
