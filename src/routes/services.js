const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/services", async (req, res) => {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ services: data });
});

router.use("/admin/services", requireAuth);

router.get("/admin/services", async (req, res) => {
  const { data, error } = await supabase.from("services").select("*").order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ services: data });
});

router.post("/admin/services", async (req, res) => {
  const { title, description, icon, active, sortOrder } = req.body;
  if (!title) return res.status(400).json({ error: "Le titre est obligatoire." });

  const { data, error } = await supabase
    .from("services")
    .insert({ title, description: description || null, icon: icon || null, active: active !== false, sort_order: sortOrder || 0 })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.status(201).json({ service: data });
});

router.patch("/admin/services/:id", async (req, res) => {
  const allowed = ["title", "description", "icon", "active", "sort_order"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const { data, error } = await supabase.from("services").update(updates).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Service introuvable." });
  return res.json({ service: data });
});

router.delete("/admin/services/:id", async (req, res) => {
  const { error } = await supabase.from("services").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

module.exports = router;
