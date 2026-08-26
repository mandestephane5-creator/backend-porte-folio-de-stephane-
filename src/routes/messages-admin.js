const express = require("express");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use("/admin/messages", requireAuth);

/**
 * GET /api/admin/messages
 * Filtres optionnels : ?status=nouveau|lu|traite|archive  ?type=contact|projet  ?q=recherche
 */
router.get("/admin/messages", async (req, res) => {
  let query = supabase.from("messages").select("*").order("created_at", { ascending: false });

  if (req.query.status) query = query.eq("status", req.query.status);
  if (req.query.type) query = query.eq("type", req.query.type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Erreur serveur." });

  let results = data;
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    results = results.filter((m) =>
      (m.first_name || "").toLowerCase().includes(q) ||
      (m.last_name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.message || "").toLowerCase().includes(q)
    );
  }

  return res.json({ messages: results });
});

/**
 * PATCH /api/admin/messages/:id
 * Change le statut : nouveau / lu / traite / archive
 */
router.patch("/admin/messages/:id", async (req, res) => {
  const { status } = req.body;
  const allowed = ["nouveau", "lu", "traite", "archive"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Statut invalide." });
  }

  const { data, error } = await supabase
    .from("messages")
    .update({ status })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Erreur serveur." });
  if (!data) return res.status(404).json({ error: "Message introuvable." });
  return res.json({ message: data });
});

/**
 * DELETE /api/admin/messages/:id
 */
router.delete("/admin/messages/:id", async (req, res) => {
  const { error } = await supabase.from("messages").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Erreur serveur." });
  return res.json({ success: true });
});

module.exports = router;
