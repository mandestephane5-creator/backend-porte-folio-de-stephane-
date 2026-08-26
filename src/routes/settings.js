const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   PUBLIC — le frontend recupere ces reglages pour s'afficher
========================================================= */
router.get("/theme", async (req, res) => {
  const { data, error } = await supabase.from("theme_settings").select("*").eq("id", 1).single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ theme: data });
});

router.get("/settings", async (req, res) => {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ settings: data });
});

router.get("/seo", async (req, res) => {
  const { data, error } = await supabase.from("seo_settings").select("*").eq("id", 1).single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ seo: data });
});

/* =========================================================
   ADMIN (protege) — chaque ressource est une ligne unique
========================================================= */
router.use("/admin/theme", requireAuth);
router.use("/admin/settings", requireAuth);
router.use("/admin/seo", requireAuth);

// ---- Apparence / theme ----
router.patch("/admin/theme", async (req, res) => {
  const allowed = [
    "bg_primary", "bg_secondary", "card_color", "color_primary", "color_secondary",
    "color_accent", "color_accent_secondary", "text_primary", "text_secondary",
    "border_color", "button_color", "default_mode",
  ];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("theme_settings").update(updates).eq("id", 1).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ theme: data });
});

// GET /api/admin/theme/reset — reinitialise aux couleurs par defaut
router.post("/admin/theme/reset", async (req, res) => {
  const defaults = {
    bg_primary: "#ffffff", bg_secondary: "#f1f2f6", card_color: "#ffffff",
    color_primary: "#7c5cff", color_secondary: "#6a49f2", color_accent: "#7c5cff",
    color_accent_secondary: "#a78bfa", text_primary: "#05060a", text_secondary: "#7a8096",
    border_color: "rgba(5,6,10,0.08)", button_color: "#7c5cff", default_mode: "system",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("theme_settings").update(defaults).eq("id", 1).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ theme: data });
});

// ---- Parametres generaux ----
router.patch("/admin/settings", async (req, res) => {
  const allowed = [
    "first_name", "last_name", "display_name", "professional_title", "short_description",
    "email", "phone", "whatsapp", "logo_url", "favicon_url", "copyright_text",
  ];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("site_settings").update(updates).eq("id", 1).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ settings: data });
});

// ---- SEO ----
router.patch("/admin/seo", async (req, res) => {
  const allowed = ["seo_title", "meta_description", "keywords", "og_title", "og_description", "og_image_url", "site_name"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("seo_settings").update(updates).eq("id", 1).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ seo: data });
});

module.exports = router;
