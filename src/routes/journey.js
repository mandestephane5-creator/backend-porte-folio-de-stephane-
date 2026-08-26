const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   PUBLIC
========================================================= */

// GET /api/journey — formation + parcours autodidacte
router.get("/journey", async (req, res) => {
  const { data, error } = await supabase.from("journey_entries").select("*").order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ journey: data });
});

// GET /api/hero — contenu du Hero (ligne unique)
router.get("/hero", async (req, res) => {
  const { data, error } = await supabase.from("hero_content").select("*").eq("id", 1).single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ hero: data });
});

// GET /api/about — contenu de la section A propos (ligne unique)
router.get("/about", async (req, res) => {
  const { data, error } = await supabase.from("about_content").select("*").eq("id", 1).single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ about: data });
});

/* =========================================================
   ADMIN (protege)
========================================================= */
router.use("/admin/journey", requireAuth);
router.use("/admin/hero", requireAuth);
router.use("/admin/about", requireAuth);

// ---- Parcours ----
router.get("/admin/journey", async (req, res) => {
  const { data, error } = await supabase.from("journey_entries").select("*").order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ journey: data });
});

router.post("/admin/journey", async (req, res) => {
  const { type, period, title, institution, description, technology, attestationUrl, sortOrder } = req.body;
  if (!type || !title) return res.status(400).json({ error: "Le type et le titre sont obligatoires." });
  if (!["formation", "autodidacte"].includes(type)) {
    return res.status(400).json({ error: "Type invalide (formation ou autodidacte)." });
  }

  const { data, error } = await supabase
    .from("journey_entries")
    .insert({
      type, period: period || null, title, institution: institution || null,
      description: description || null, technology: technology || null,
      attestation_url: attestationUrl || null, sort_order: sortOrder || 0,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.status(201).json({ entry: data });
});

router.patch("/admin/journey/:id", async (req, res) => {
  const allowed = ["type", "period", "title", "institution", "description", "technology", "attestation_url", "sort_order"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const { data, error } = await supabase.from("journey_entries").update(updates).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Entree introuvable." });
  return res.json({ entry: data });
});

router.delete("/admin/journey/:id", async (req, res) => {
  const { error } = await supabase.from("journey_entries").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

// ---- Hero (ligne unique, PATCH uniquement) ----
router.patch("/admin/hero", async (req, res) => {
  const allowed = ["eyebrow", "title", "description", "primary_btn_text", "primary_btn_link", "secondary_btn_text", "secondary_btn_link", "image_url"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("hero_content").update(updates).eq("id", 1).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ hero: data });
});

// ---- A propos (ligne unique, PATCH uniquement) ----
router.patch("/admin/about", async (req, res) => {
  const allowed = ["title", "description", "image_url"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("about_content").update(updates).eq("id", 1).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ about: data });
});

module.exports = router;
