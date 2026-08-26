const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   PUBLIC
========================================================= */

// GET /api/domains — domaines actifs + leurs solutions, pour la page Services
router.get("/domains", async (req, res) => {
  const { data: domains, error } = await supabase
    .from("domains")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Erreur lecture domaines :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }

  const { data: solutions, error: solError } = await supabase
    .from("solutions")
    .select("*")
    .order("sort_order", { ascending: true });

  if (solError) {
    console.error("Erreur lecture solutions :", solError);
    return res.status(500).json({ error: "Erreur serveur." });
  }

  const withSolutions = domains.map((d) => ({
    ...d,
    solutions: solutions.filter((s) => s.domain_id === d.id),
  }));

  return res.json({ domains: withSolutions });
});

/* =========================================================
   ADMIN (protege)
========================================================= */
router.use("/admin/domains", requireAuth);
router.use("/admin/solutions", requireAuth);

router.get("/admin/domains", async (req, res) => {
  const { data, error } = await supabase.from("domains").select("*").order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ domains: data });
});

router.post("/admin/domains", async (req, res) => {
  const { name, description, icon, active, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom du domaine est obligatoire." });

  const { data, error } = await supabase
    .from("domains")
    .insert({ name, description: description || null, icon: icon || null, active: active !== false, sort_order: sortOrder || 0 })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.status(201).json({ domain: data });
});

router.patch("/admin/domains/:id", async (req, res) => {
  const allowed = ["name", "description", "icon", "image_url", "active", "sort_order"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("domains").update(updates).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Domaine introuvable." });
  return res.json({ domain: data });
});

router.delete("/admin/domains/:id", async (req, res) => {
  const { error } = await supabase.from("domains").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

// ---- Solutions (imbriquees dans un domaine) ----
router.get("/admin/solutions", async (req, res) => {
  const { data, error } = await supabase.from("solutions").select("*").order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ solutions: data });
});

router.post("/admin/solutions", async (req, res) => {
  const { domainId, title, description, icon, sortOrder } = req.body;
  if (!domainId || !title) return res.status(400).json({ error: "domainId et titre obligatoires." });

  const { data, error } = await supabase
    .from("solutions")
    .insert({ domain_id: domainId, title, description: description || null, icon: icon || null, sort_order: sortOrder || 0 })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.status(201).json({ solution: data });
});

router.patch("/admin/solutions/:id", async (req, res) => {
  const allowed = ["title", "description", "icon", "sort_order"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const { data, error } = await supabase.from("solutions").update(updates).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Solution introuvable." });
  return res.json({ solution: data });
});

router.delete("/admin/solutions/:id", async (req, res) => {
  const { error } = await supabase.from("solutions").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

module.exports = router;
