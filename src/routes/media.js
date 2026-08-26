const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use("/admin/media", requireAuth);

/**
 * GET /api/admin/media
 * Liste toutes les images enregistrees.
 *
 * IMPORTANT — limite actuelle : cette route gere uniquement des
 * ENTREES (nom + URL), pas un vrai televersement de fichier.
 * Pour un televersement reel, il faudrait brancher Supabase Storage
 * (ou un service equivalent) — non fait dans cette tranche pour
 * rester dans un delai raisonnable. En attendant, on enregistre des
 * URLs d'images deja hebergees ailleurs (ou par Supabase Storage
 * televerse manuellement).
 */
router.get("/admin/media", async (req, res) => {
  const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ media: data });
});

router.post("/admin/media", async (req, res) => {
  const { name, url, type, sizeBytes } = req.body;
  if (!name || !url) return res.status(400).json({ error: "Le nom et l'URL sont obligatoires." });

  const { data, error } = await supabase
    .from("media")
    .insert({ name, url, type: type || null, size_bytes: sizeBytes || null })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.status(201).json({ media: data });
});

/**
 * DELETE /api/admin/media/:id
 * Empeche la suppression si l'image est encore utilisee par un
 * projet ou un article (verification simple sur les URLs).
 */
router.delete("/admin/media/:id", async (req, res) => {
  const { data: mediaRow } = await supabase.from("media").select("url").eq("id", req.params.id).single();
  if (!mediaRow) return res.status(404).json({ error: "Media introuvable." });

  const { data: usedInProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("main_image", mediaRow.url);
  const { data: usedInArticles } = await supabase
    .from("articles")
    .select("id")
    .eq("image_url", mediaRow.url);

  if ((usedInProjects && usedInProjects.length) || (usedInArticles && usedInArticles.length)) {
    return res.status(409).json({ error: "Cette image est encore utilisee ailleurs sur le site et ne peut pas etre supprimee." });
  }

  const { error } = await supabase.from("media").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

module.exports = router;
