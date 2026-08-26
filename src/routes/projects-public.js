const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

/**
 * GET /api/projects
 * Public — liste UNIQUEMENT les projets publies, ordonnes selon sort_order.
 *
 * IMPORTANT : ce serveur utilise la cle service_role de Supabase, qui
 * contourne completement les policies RLS. Le filtre ci-dessous n'est
 * donc pas optionnel — sans lui, les brouillons et projets archives
 * seraient visibles publiquement.
 */
router.get("/projects", async (req, res) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("publish_status", "publie")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Erreur lecture projets :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }

  return res.json({ projects: data });
});

module.exports = router;
