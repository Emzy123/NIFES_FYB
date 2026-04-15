/**
 * One-time: import data/registrations.json into MongoDB.
 * Usage: MONGODB_URI=... node src/scripts/migrateFromJson.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const { seedIfEmpty } = require("../services/configService");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI");
    process.exit(1);
  }
  await mongoose.connect(uri);
  await seedIfEmpty();

  const dataFile = path.join(__dirname, "..", "..", "data", "registrations.json");
  if (!fs.existsSync(dataFile)) {
    console.log("No registrations.json — nothing to migrate.");
    process.exit(0);
  }
  const rows = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  let n = 0;
  for (const r of rows) {
    if (!r.reference) continue;
    await Registration.updateOne({ reference: r.reference }, { $set: r }, { upsert: true });
    n++;
  }
  console.log(`Migrated ${n} registration rows.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
