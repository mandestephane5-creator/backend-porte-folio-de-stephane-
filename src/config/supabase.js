const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent etre definis dans le fichier .env"
  );
}

// IMPORTANT : la service_role key a tous les droits sur la base de donnees.
// Elle ne doit JAMAIS etre exposee au frontend — elle vit uniquement ici,
// cote serveur, chargee depuis les variables d'environnement.
//
// Note technique : le client Supabase initialise en interne un client
// "Realtime" (meme si on ne l'utilise pas), qui exige un WebSocket natif
// disponible uniquement a partir de Node.js 22+. Sur des versions plus
// anciennes (ex: Node 20), on doit lui fournir explicitement une
// implementation de WebSocket via le package "ws", sinon la connexion
// plante des le demarrage.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: WebSocket,
    },
  }
);

module.exports = supabase;
