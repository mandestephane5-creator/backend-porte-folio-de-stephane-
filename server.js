require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const contactRoutes = require("./src/routes/contact");
const projectsPublicRoutes = require("./src/routes/projects-public");
const projectsAdminRoutes = require("./src/routes/projects-admin");
const authRoutes = require("./src/routes/auth");
const domainsRoutes = require("./src/routes/domains");
const servicesRoutes = require("./src/routes/services");
const skillsRoutes = require("./src/routes/skills");
const journeyRoutes = require("./src/routes/journey");
const articlesRoutes = require("./src/routes/articles");
const messagesAdminRoutes = require("./src/routes/messages-admin");
const mediaRoutes = require("./src/routes/media");
const settingsRoutes = require("./src/routes/settings");
const socialsNavRoutes = require("./src/routes/socials-nav");

const app = express();

// ---------------------------------------------------------
// Securite de base : n'autoriser que votre site a appeler cette API
// ---------------------------------------------------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Autorise aussi les outils sans origine (Postman, curl) en dev
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origine non autorisee par la politique CORS."));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ---------------------------------------------------------
// Routes
// ---------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api", contactRoutes);
app.use("/api", projectsPublicRoutes);
app.use("/api", projectsAdminRoutes);
app.use("/api", authRoutes);
app.use("/api", domainsRoutes);
app.use("/api", servicesRoutes);
app.use("/api", skillsRoutes);
app.use("/api", journeyRoutes);
app.use("/api", articlesRoutes);
app.use("/api", messagesAdminRoutes);
app.use("/api", mediaRoutes);
app.use("/api", settingsRoutes);
app.use("/api", socialsNavRoutes);

// ---------------------------------------------------------
// Gestion des erreurs
// ---------------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur inattendue." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serveur demarre sur http://localhost:${PORT}`);
});
