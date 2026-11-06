const express = require("express");
const rateLimit = require("express-rate-limit");
const supabase = require("../config/supabase");
const { alerterNouveauMessage } = require("../lib/notify");

const router = express.Router();

// Empeche le spam : max 5 envois par 15 minutes par IP sur ces routes publiques.
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de messages envoyes. Reessayez plus tard." },
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const propre = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Champ piege invisible pour les humains : un robot qui le remplit
// recoit une reponse normale, mais rien n'est enregistre.
const estUnRobot = (body) => typeof body.website === "string" && body.website.trim() !== "";

async function enregistrer(res, ligne) {
  const { data, error } = await supabase.from("messages").insert(ligne).select().single();
  if (error) {
    console.error("Erreur insertion message :", error);
    return res.status(500).json({ error: "Erreur serveur, message non enregistre." });
  }
  // L'alerte part en arriere-plan : le visiteur n'attend pas l'envoi de l'e-mail.
  alerterNouveauMessage(data).catch(() => {});
  return res.status(201).json({ success: true, id: data.id });
}

/**
 * POST /api/contact
 * Formulaire de contact general (page contact.html).
 * Appele EN PARALLELE de l'ouverture WhatsApp cote frontend.
 */
router.post("/contact", formLimiter, async (req, res) => {
  if (estUnRobot(req.body)) return res.status(201).json({ success: true });
  const firstName = propre(req.body.firstName, 80), lastName = propre(req.body.lastName, 80);
  const email = propre(req.body.email, 160), phone = propre(req.body.phone, 40), message = propre(req.body.message, 5000);

  if (!firstName || !email || !message) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }
  if (!EMAIL.test(email)) return res.status(400).json({ error: "Adresse e-mail invalide." });

  return enregistrer(res, {
    type: "contact",
    first_name: firstName,
    last_name: lastName || null,
    email,
    phone: phone || null,
    message,
  });
});

/**
 * POST /api/start-project
 * Formulaire "Demarrer votre projet".
 * Appele EN PARALLELE de l'ouverture WhatsApp cote frontend.
 */
router.post("/start-project", formLimiter, async (req, res) => {
  if (estUnRobot(req.body)) return res.status(201).json({ success: true });
  const name = propre(req.body.name, 120), email = propre(req.body.email, 160);
  const projectType = propre(req.body.projectType, 120), budget = propre(req.body.budget, 80);
  const description = propre(req.body.description, 5000), phone = propre(req.body.phone, 40);

  if (!name || !email || !description) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }
  if (!EMAIL.test(email)) return res.status(400).json({ error: "Adresse e-mail invalide." });

  return enregistrer(res, {
    type: "projet",
    first_name: name,
    email,
    phone: phone || null,
    project_type: projectType || null,
    budget: budget || null,
    message: description,
  });
});

module.exports = router;
