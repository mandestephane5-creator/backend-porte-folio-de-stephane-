const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   PUBLIC
========================================================= */
router.get("/socials", async (req, res) => {
  const { data, error } = await supabase.from("social_links").select("*").eq("active", true).order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ socials: data });
});

router.get("/navigation", async (req, res) => {
  const { data, error } = await supabase.from("navigation_links").select("*").eq("visible", true).order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ navigation: data });
});

/* =========================================================
   ADMIN (protege)
========================================================= */
router.use("/admin/socials", requireAuth);
router.use("/admin/navigation", requireAuth);

// ---- Reseaux sociaux ----
router.get("/admin/socials", async (req, res) => {
  const { data, error } = await supabase.from("social_links").select("*").order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ socials: data });
});

router.post("/admin/socials", async (req, res) => {
  const { name, url, icon, active, sortOrder } = req.body;
  if (!name || !url) return res.status(400).json({ error: "Le nom et l'URL sont obligatoires." });

  const { data, error } = await supabase
    .from("social_links")
    .insert({ name, url, icon: icon || null, active: active !== false, sort_order: sortOrder || 0 })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.status(201).json({ social: data });
});

router.patch("/admin/socials/:id", async (req, res) => {
  const allowed = ["name", "url", "icon", "active", "sort_order"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const { data, error } = await supabase.from("social_links").update(updates).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Reseau introuvable." });
  return res.json({ social: data });
});

router.delete("/admin/socials/:id", async (req, res) => {
  const { error } = await supabase.from("social_links").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

// ---- Navigation ----
router.get("/admin/navigation", async (req, res) => {
  const { data, error } = await supabase.from("navigation_links").select("*").order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ navigation: data });
});

router.post("/admin/navigation", async (req, res) => {
  const { label, url, visible, sortOrder } = req.body;
  if (!label || !url) return res.status(400).json({ error: "Le libelle et l'URL sont obligatoires." });

  const { data, error } = await supabase
    .from("navigation_links")
    .insert({ label, url, visible: visible !== false, sort_order: sortOrder || 0 })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.status(201).json({ link: data });
});

router.patch("/admin/navigation/:id", async (req, res) => {
  const allowed = ["label", "url", "visible", "sort_order"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const { data, error } = await supabase.from("navigation_links").update(updates).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Lien introuvable." });
  return res.json({ link: data });
});

router.delete("/admin/navigation/:id", async (req, res) => {
  const { error } = await supabase.from("navigation_links").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

module.exports = router;
