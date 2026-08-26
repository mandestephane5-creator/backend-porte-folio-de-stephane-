/**
 * Script a executer UNE SEULE FOIS pour creer votre compte admin.
 * Ne fait pas partie du serveur — pas de route publique d'inscription,
 * pour eviter que n'importe qui puisse creer un compte admin.
 *
 * Utilisation :
 *   node scripts/create-admin.js votre@email.com VotreMotDePasse123
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const supabase = require("../src/config/supabase");

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error("Usage : node scripts/create-admin.js <email> <mot_de_passe>");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Le mot de passe doit faire au moins 8 caracteres.");
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from("admin_users")
    .insert({ email, password_hash })
    .select()
    .single();

  if (error) {
    console.error("Erreur lors de la creation du compte :", error.message);
    process.exit(1);
  }

  console.log(`Compte admin cree avec succes pour ${data.email}.`);
  console.log("Vous pouvez maintenant vous connecter au dashboard avec cet email et ce mot de passe.");
}

main();
