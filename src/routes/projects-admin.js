const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enleve les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * GET /api/admin/projects
 * Protegee — liste TOUS les projets (brouillons et archives inclus),
 * contrairement a GET /api/projects qui ne montre que les publies.
 */
router.get("/admin/projects", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Erreur liste projets (admin) :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
  return res.json({ projects: data });
});

/**
 * GET /api/admin/projects/:id
 * Protegee — un seul projet, pour pre-remplir le formulaire d'edition.
 */
router.get("/admin/projects/:id", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Projet introuvable." });
  }
  return res.json({ project: data });
});

/**
 * POST /api/admin/projects
 * Protegee — cree un nouveau projet.
 * Validation : titre et description obligatoires (voir prompt section 31).
 */
router.post("/admin/projects", requireAuth, async (req, res) => {
  const {
    title,
    tagline,
    description,
    mainImage,
    additionalImages,
    category,
    techStack,
    features,
    projectDate,
    completionStatus,
    publishStatus,
    githubUrl,
    liveUrl,
    videoUrl,
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre est obligatoire." });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ error: "La description est obligatoire." });
  }

  const validCompletion = ["termine", "en_developpement", "prototype"];
  const validPublish = ["brouillon", "publie", "archive"];
  if (completionStatus && !validCompletion.includes(completionStatus)) {
    return res.status(400).json({ error: "Statut d'avancement invalide." });
  }
  if (publishStatus && !validPublish.includes(publishStatus)) {
    return res.status(400).json({ error: "Statut de publication invalide." });
  }

  // Slug unique, genere depuis le titre
  let slug = slugify(title);
  const { data: existing } = await supabase.from("projects").select("id").eq("slug", slug);
  if (existing && existing.length > 0) {
    slug = `${slug}-${Date.now().toString().slice(-5)}`;
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: title.trim(),
      slug,
      tagline: tagline || null,
      description: description.trim(),
      main_image: mainImage || null,
      additional_images: additionalImages || [],
      category: category || null,
      tech_stack: techStack || [],
      features: features || [],
      project_date: projectDate || null,
      completion_status: completionStatus || "prototype",
      publish_status: publishStatus || "brouillon",
      github_url: githubUrl || null,
      live_url: liveUrl || null,
      video_url: videoUrl || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur creation projet :", error);
    return res.status(500).json({ error: "Erreur serveur, projet non cree." });
  }

  return res.status(201).json({ success: true, project: data });
});

/**
 * PATCH /api/admin/projects/:id
 * Protegee — modifie un projet existant (partiellement).
 * Utilisee aussi pour changer uniquement le statut (publier/depublier/archiver)
 * ou l'ordre d'affichage, en n'envoyant que le champ concerne.
 */
router.patch("/admin/projects/:id", requireAuth, async (req, res) => {
  const allowedFields = {
    title: "title",
    tagline: "tagline",
    description: "description",
    mainImage: "main_image",
    additionalImages: "additional_images",
    category: "category",
    techStack: "tech_stack",
    features: "features",
    projectDate: "project_date",
    completionStatus: "completion_status",
    publishStatus: "publish_status",
    githubUrl: "github_url",
    liveUrl: "live_url",
    videoUrl: "video_url",
    sortOrder: "sort_order",
  };

  const updates = {};
  for (const [bodyKey, dbKey] of Object.entries(allowedFields)) {
    if (req.body[bodyKey] !== undefined) {
      updates[dbKey] = req.body[bodyKey];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Aucun champ a mettre a jour." });
  }

  if (updates.title !== undefined && !updates.title.trim()) {
    return res.status(400).json({ error: "Le titre ne peut pas etre vide." });
  }
  if (updates.description !== undefined && !updates.description.trim()) {
    return res.status(400).json({ error: "La description ne peut pas etre vide." });
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error || !data) {
    console.error("Erreur modification projet :", error);
    return res.status(404).json({ error: "Projet introuvable ou erreur serveur." });
  }

  return res.json({ success: true, project: data });
});

/**
 * DELETE /api/admin/projects/:id
 * Protegee — suppression definitive.
 * La confirmation ("Etes-vous sur ?") est geree cote dashboard (frontend),
 * pas ici : cette route execute la suppression sans redemander.
 */
router.delete("/admin/projects/:id", requireAuth, async (req, res) => {
  const { error } = await supabase.from("projects").delete().eq("id", req.params.id);

  if (error) {
    console.error("Erreur suppression projet :", error);
    return res.status(500).json({ error: "Erreur serveur, suppression impossible." });
  }

  return res.json({ success: true });
});

module.exports = router;
