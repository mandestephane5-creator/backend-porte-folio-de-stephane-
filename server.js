
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Variables indispensables : on s'arrete tout de suite avec un message clair
// plutot que de demarrer un serveur qui echouera a la premiere connexion.
for (const cle of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"]) {
  if (!process.env[cle]) {
    console.error(`Variable d'environnement manquante : ${cle} (voir .env.example).`);
    process.exit(1);
  }
}

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

// Necessaire derriere un proxy inverse (Render, Railway, Heroku...) :
// sans ca, express-rate-limit (utilise sur /login, /contact...) plante
// en tentant de lire l'adresse IP du visiteur, provoquant une erreur 502.
app.set("trust proxy", 1);
app.disable("x-powered-by");

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
        const err = new Error("Origine non autorisee par la politique CORS.");
        err.status = 403;
        callback(err);
      }
    },
    credentials: true,
  })
);

// En-tetes de securite simples (l'API ne renvoie que du JSON)
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  next();
});

app.use(express.json({ limit: "1mb" })); // un long article tient largement dans 1 Mo
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

app.use("/api", (req, res) => res.status(404).json({ error: "Route introuvable." }));

// ---------------------------------------------------------
// Gestion des erreurs
// ---------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Contenu trop volumineux." });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Donnees envoyees illisibles." });
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Erreur serveur inattendue." });
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur demarre sur http://localhost:${PORT}`);
  });
}

module.exports = app;
