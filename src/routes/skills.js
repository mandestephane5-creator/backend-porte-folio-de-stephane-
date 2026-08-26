const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   PUBLIC
========================================================= */

// GET /api/skills — categories + competences actives, regroupees
router.get("/skills", async (req, res) => {
  const { data: categories, error: catError } = await supabase
    .from("skill_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (catError) return res.status(500).json({ error: "Erreur serveur." });

  const { data: skills, error: skillError } = await supabase
    .from("skills")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (skillError) return res.status(500).json({ error: "Erreur serveur." });

  const grouped = categories.map((cat) => ({
    ...cat,
    skills: skills.filter((s) => s.category_id === cat.id),
  }));

  return res.json({ categories: grouped });
});

/* =========================================================
   ADMIN (protege)
========================================================= */
router.use("/admin/skill-categories", requireAuth);
router.use("/admin/skills", requireAuth);

// ---- Categories ----
router.get("/admin/skill-categories", async (req, res) => {
  const { data, error } = await supabase.from("skill_categories").select("*").order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ categories: data });
});

router.post("/admin/skill-categories", async (req, res) => {
  const { name, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom de la categorie est obligatoire." });

  const { data, error } = await supabase
    .from("skill_categories")
    .insert({ name, sort_order: sortOrder || 0 })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.status(201).json({ category: data });
});

router.patch("/admin/skill-categories/:id", async (req, res) => {
  const allowed = ["name", "sort_order"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const { data, error } = await supabase.from("skill_categories").update(updates).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Categorie introuvable." });
  return res.json({ category: data });
});

router.delete("/admin/skill-categories/:id", async (req, res) => {
  const { error } = await supabase.from("skill_categories").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

// ---- Competences ----
router.get("/admin/skills", async (req, res) => {
  const { data, error } = await supabase.from("skills").select("*").order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ skills: data });
});

router.post("/admin/skills", async (req, res) => {
  const { categoryId, name, icon, level, active, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom de la competence est obligatoire." });

  const { data, error } = await supabase
    .from("skills")
    .insert({
      category_id: categoryId || null,
      name,
      icon: icon || null,
      level: level || null, // facultatif, jamais impose
      active: active !== false,
      sort_order: sortOrder || 0,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.status(201).json({ skill: data });
});

router.patch("/admin/skills/:id", async (req, res) => {
  const allowed = ["category_id", "name", "icon", "level", "active", "sort_order"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const { data, error } = await supabase.from("skills").update(updates).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Competence introuvable." });
  return res.json({ skill: data });
});

router.delete("/admin/skills/:id", async (req, res) => {
  const { error } = await supabase.from("skills").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

module.exports = router;
