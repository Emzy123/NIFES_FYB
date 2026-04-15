const mongoose = require("mongoose");
const { seedIfEmpty } = require("./services/configService");

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI. Add your Atlas connection string to backend/.env");
    process.exit(1);
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  await seedIfEmpty();
  console.log("MongoDB connected");
}

module.exports = { connectDb };
