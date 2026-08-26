const jwt = require("jsonwebtoken");

/**
 * Protege une route : verifie que le visiteur possede un token
 * de session admin valide (envoye en cookie httpOnly par /api/auth/login).
 * Si absent ou invalide -> 401, la route protegee n'est jamais executee.
 */
function requireAuth(req, res, next) {
  const token = req.cookies?.sm_session;

  if (!token) {
    return res.status(401).json({ error: "Non authentifie." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session invalide ou expiree." });
  }
}

module.exports = { requireAuth };
