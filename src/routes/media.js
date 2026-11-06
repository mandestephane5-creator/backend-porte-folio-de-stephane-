const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use("/admin/media", requireAuth);

// Images stockees dans Supabase Storage, dans un bucket PUBLIC
// (les visiteurs du site doivent pouvoir les afficher).
// Le bucket est cree par sql/mise-a-jour-2026-11.sql.
const BUCKET = process.env.SUPABASE_BUCKET || "portfolio";
const TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo
// Pas de SVG : un SVG peut contenir du code execute par le navigateur.
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAILLE_MAX, files: 1 },
  fileFilter: (req, file, cb) => {
    if (TYPES[file.mimetype]) return cb(null, true);
    const err = new Error("Format non accepte. Envoyez une image JPG, PNG, WebP, GIF ou AVIF.");
    err.status = 415;
    cb(err);
  },
});

// Le contenu du fichier doit correspondre a une vraie image (on ne se fie
// pas seulement au type annonce par le navigateur).
function signatureValide(buf, mime) {
  const h = buf.subarray(0, 12);
  if (mime === "image/jpeg") return h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff;
  if (mime === "image/png") return h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/gif") return h.subarray(0, 4).toString("ascii") === "GIF8";
  if (mime === "image/webp") return h.subarray(0, 4).toString("ascii") === "RIFF" && h.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "image/avif") return h.subarray(4, 8).toString("ascii") === "ftyp";
  return false;
}

const nomPropre = (nom) => nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50) || "image";

/**
 * GET /api/admin/media
 * Liste toutes les images enregistrees, les plus recentes d'abord.
 */
router.get("/admin/media", async (req, res) => {
  const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ media: data });
});

/**
 * POST /api/admin/media/upload
 * Televerse une image (champ de formulaire "file") et renvoie son adresse publique.
 */
router.post("/admin/media/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "Image trop lourde : 5 Mo au maximum." });
    return res.status(err.status || 400).json({ error: err.message || "Envoi impossible." });
  });
}, async (req, res) => {
  const f = req.file;
  if (!f) return res.status(400).json({ error: "Aucune image recue." });
  if (!signatureValide(f.buffer, f.mimetype)) return res.status(415).json({ error: "Ce fichier n'est pas une image valide." });

  const d = new Date();
  const chemin = `uploads/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${crypto.randomBytes(6).toString("hex")}-${nomPropre(f.originalname)}.${TYPES[f.mimetype]}`;

  const { error: errStock } = await supabase.storage.from(BUCKET).upload(chemin, f.buffer, {
    contentType: f.mimetype,
    cacheControl: "31536000", // le nom est unique : le navigateur peut garder l'image en cache un an
    upsert: false,
  });
  if (errStock) {
    console.error("Erreur televersement :", errStock);
    return res.status(500).json({ error: "Le stockage a refuse l'image. Verifiez que le bucket existe (voir README)." });
  }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(chemin);

  const nom = (typeof req.body.name === "string" && req.body.name.trim()) || f.originalname;
  const { data, error } = await supabase
    .from("media")
    .insert({ name: nom.slice(0, 120), url: pub.publicUrl, type: f.mimetype, size_bytes: f.size, storage_path: chemin })
    .select()
    .single();
  if (error) {
    console.error("Erreur enregistrement media :", error);
    await supabase.storage.from(BUCKET).remove([chemin]);
    return res.status(500).json({ error: "Erreur serveur, image non enregistree." });
  }
  return res.status(201).json({ media: data });
});

/**
 * POST /api/admin/media
 * Enregistre une image deja hebergee ailleurs (adresse seulement).
 */
router.post("/admin/media", async (req, res) => {
  const { name, url, type, sizeBytes } = req.body;
  if (!name || !url) return res.status(400).json({ error: "Le nom et l'URL sont obligatoires." });
  if (!/^https:\/\//i.test(url)) return res.status(400).json({ error: "L'adresse doit commencer par https://" });

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
 * Refuse la suppression si l'image est encore utilisee sur le site,
 * puis retire aussi le fichier du stockage.
 */
router.delete("/admin/media/:id", async (req, res) => {
  const { data: mediaRow } = await supabase.from("media").select("*").eq("id", req.params.id).single();
  if (!mediaRow) return res.status(404).json({ error: "Media introuvable." });

  const usages = await Promise.all([
    supabase.from("projects").select("id").eq("main_image", mediaRow.url),
    supabase.from("articles").select("id").eq("image_url", mediaRow.url),
    supabase.from("about_content").select("id").eq("image_url", mediaRow.url),
    supabase.from("hero_content").select("id").eq("image_url", mediaRow.url),
    supabase.from("seo_settings").select("id").eq("og_image_url", mediaRow.url),
  ]);
  if (usages.some((u) => u.data && u.data.length)) {
    return res.status(409).json({ error: "Cette image est encore utilisee sur le site : retirez-la d'abord de la page concernee." });
  }

  const { error } = await supabase.from("media").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (mediaRow.storage_path) {
    const { error: errStock } = await supabase.storage.from(BUCKET).remove([mediaRow.storage_path]);
    if (errStock) console.error("Fichier non retire du stockage :", errStock);
  }
  return res.json({ success: true });
});

module.exports = router;
