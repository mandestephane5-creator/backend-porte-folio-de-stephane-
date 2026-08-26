const express = require("express");
const rateLimit = require("express-rate-limit");
const supabase = require("../config/supabase");

const router = express.Router();

// Empeche le spam : max 5 envois par 15 minutes par IP sur ces routes publiques.
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de messages envoyes. Reessayez plus tard." },
});

/**
 * POST /api/contact
 * Formulaire de contact general (page contact.html).
 * Appele EN PARALLELE de l'ouverture WhatsApp cote frontend.
 */
router.post("/contact", formLimiter, async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      type: "contact",
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      message,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur insertion message contact :", error);
    return res.status(500).json({ error: "Erreur serveur, message non enregistre." });
  }

  return res.status(201).json({ success: true, id: data.id });
});

/**
 * POST /api/start-project
 * Formulaire "Demarrer votre projet".
 * Appele EN PARALLELE de l'ouverture WhatsApp cote frontend.
 */
router.post("/start-project", formLimiter, async (req, res) => {
  const { name, email, projectType, budget, description } = req.body;

  if (!name || !email || !description) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      type: "projet",
      first_name: name,
      email,
      project_type: projectType || null,
      budget: budget || null,
      message: description,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur insertion demande projet :", error);
    return res.status(500).json({ error: "Erreur serveur, demande non enregistree." });
  }

  return res.status(201).json({ success: true, id: data.id });
});

module.exports = router;
