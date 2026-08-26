const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* =========================================================
   PUBLIC
========================================================= */

// GET /api/articles — uniquement les articles publies
router.get("/articles", async (req, res) => {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "publie")
    .order("published_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ articles: data });
});

// GET /api/articles/:slug — un article publie par son slug
router.get("/articles/:slug", async (req, res) => {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", req.params.slug)
    .eq("status", "publie")
    .single();
  if (error || !data) return res.status(404).json({ error: "Article introuvable." });
  return res.json({ article: data });
});

/* =========================================================
   ADMIN (protege)
========================================================= */
router.use("/admin/articles", requireAuth);

router.get("/admin/articles", async (req, res) => {
  let query = supabase.from("articles").select("*").order("created_at", { ascending: false });
  if (req.query.status) query = query.eq("status", req.query.status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ articles: data });
});

router.post("/admin/articles", async (req, res) => {
  const { title, excerpt, content, imageUrl, category, tags, status } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Le titre et le contenu sont obligatoires." });

  const slug = slugify(title);
  const finalStatus = status || "brouillon";

  const { data, error } = await supabase
    .from("articles")
    .insert({
      title, slug, excerpt: excerpt || null, content,
      image_url: imageUrl || null, category: category || null, tags: tags || [],
      status: finalStatus,
      published_at: finalStatus === "publie" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Un article avec un titre tres proche existe deja." });
    return res.status(500).json({ error: "Erreur serveur." });
  }
  return res.status(201).json({ article: data });
});

router.patch("/admin/articles/:id", async (req, res) => {
  const allowed = ["title", "excerpt", "content", "image_url", "category", "tags", "status"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  updates.updated_at = new Date().toISOString();

  // Si on publie pour la premiere fois, on horodate la publication.
  if (updates.status === "publie") {
    const { data: existing } = await supabase.from("articles").select("published_at").eq("id", req.params.id).single();
    if (existing && !existing.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase.from("articles").update(updates).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Article introuvable." });
  return res.json({ article: data });
});

router.delete("/admin/articles/:id", async (req, res) => {
  const { error } = await supabase.from("articles").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

module.exports = router;
