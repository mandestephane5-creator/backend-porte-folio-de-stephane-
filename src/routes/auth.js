const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const supabase = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Anti brute-force : max 10 tentatives de connexion par 15 minutes par IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives de connexion. Reessayez plus tard." },
});

const COOKIE_NAME = "sm_session";
const COOKIE_OPTS = {
  httpOnly: true, // inaccessible en JavaScript cote frontend (protege contre le vol de session)
  // Dashboard et backend sont sur deux domaines differents (vercel.app / onrender.com) :
  // un cookie "cross-site" exige sameSite:"none" + secure:true, sinon le navigateur
  // le rejette silencieusement (connexion qui semble reussir puis se defait aussitot).
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

/**
 * POST /api/auth/login
 * Verifie l'email + mot de passe, pose un cookie de session si valide.
 */
router.post("/auth/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .single();

  // Message volontairement generique (ne pas reveler si l'email existe ou non)
  if (error || !admin) {
    return res.status(401).json({ error: "Identifiants incorrects." });
  }

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Identifiants incorrects." });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  return res.json({ success: true, email: admin.email });
});

/**
 * POST /api/auth/logout
 * Supprime le cookie de session.
 */
router.post("/auth/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: COOKIE_OPTS.httpOnly,
    secure: COOKIE_OPTS.secure,
    sameSite: COOKIE_OPTS.sameSite,
  });
  return res.json({ success: true });
});

/**
 * GET /api/auth/me
 * Utilisee par le dashboard au chargement pour verifier si la
 * session est active. Si non connecte -> 401 (requireAuth le gere).
 */
router.get("/auth/me", requireAuth, (req, res) => {
  return res.json({ id: req.admin.id, email: req.admin.email });
});

module.exports = router;