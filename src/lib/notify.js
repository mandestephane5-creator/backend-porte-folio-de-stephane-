/**
 * Alerte par e-mail a chaque nouveau message recu depuis le site.
 *
 * Pourquoi un service d'envoi par API (Resend) et pas SMTP/Gmail ?
 * L'offre gratuite de Render bloque les ports SMTP (25, 465, 587) :
 * un envoi SMTP y echouerait sans bruit. Resend s'utilise en HTTPS,
 * qui lui n'est pas bloque.
 *
 * Configuration (fichier .env ou variables Render) :
 *   RESEND_API_KEY   cle creee sur resend.com (API Keys)
 *   ALERT_EMAIL_TO   adresse qui recoit les alertes
 *   ALERT_EMAIL_FROM facultatif. Sans domaine verifie chez Resend,
 *                    laissez la valeur par defaut : l'envoi n'est alors
 *                    possible que vers l'adresse du compte Resend.
 *   ADMIN_URL        facultatif, lien vers la page d'administration
 *
 * Sans RESEND_API_KEY, rien n'est envoye et le message est quand meme
 * enregistre : l'alerte ne bloque jamais le formulaire.
 */

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function contenu(m) {
  const nom = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email;
  const lignes = [
    ["Type", m.type === "projet" ? "Demande de projet" : "Message de contact"],
    ["Nom", nom],
    ["E-mail", m.email],
    ["Téléphone", m.phone],
    ["Projet", m.project_type],
    ["Budget", m.budget],
  ].filter(([, v]) => v);
  const admin = process.env.ADMIN_URL;

  const texte = lignes.map(([k, v]) => `${k} : ${v}`).join("\n") + `\n\n${m.message}\n` + (admin ? `\nRépondre depuis l'administration : ${admin}#messages\n` : "");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#14101f;line-height:1.5">
<p style="margin:0 0 12px">Nouveau message reçu sur votre portfolio.</p>
<table style="border-collapse:collapse;margin-bottom:14px">${lignes.map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#6b6780">${esc(k)}</td><td style="padding:3px 0">${esc(v)}</td></tr>`).join("")}</table>
<div style="white-space:pre-wrap;background:#f4f3f8;border-radius:8px;padding:14px">${esc(m.message)}</div>
${admin ? `<p style="margin:16px 0 0"><a href="${esc(admin)}#messages" style="color:#6a49f2">Ouvrir l'administration</a></p>` : ""}
</div>`;
  return { sujet: `Nouveau message de ${nom}`, texte, html };
}

async function alerterNouveauMessage(message) {
  const cle = process.env.RESEND_API_KEY, dest = process.env.ALERT_EMAIL_TO;
  if (!cle || !dest) return { envoye: false, raison: "non configure" };
  const { sujet, texte, html } = contenu(message);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ALERT_EMAIL_FROM || "Portfolio <onboarding@resend.dev>",
        to: dest.split(",").map((s) => s.trim()).filter(Boolean),
        reply_to: message.email || undefined,
        subject: sujet,
        text: texte,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error("Alerte e-mail refusee par Resend :", r.status, await r.text().catch(() => ""));
      return { envoye: false, raison: "refuse" };
    }
    return { envoye: true };
  } catch (err) {
    console.error("Alerte e-mail impossible :", err.message);
    return { envoye: false, raison: "erreur" };
  }
}

module.exports = { alerterNouveauMessage, contenu };
