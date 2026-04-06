const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const prisma = require("../prisma");
const inventoryRoutes = require("./routes/inventory");
const salesRoutes = require("./routes/sales");
const reportRoutes = require("./routes/reports");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL Connected via Prisma");
  } catch (error) {
    console.error(`❌ Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("🔌 Prisma disconnected. Goodbye!");
  process.exit(0);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});
