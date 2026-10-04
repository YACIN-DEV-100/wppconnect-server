#!/usr/bin/env bash
# Déploiement wppconnect-server sur le VPS (compte deploy) — commande FORCÉE de la clé SSH de la CD
# (command="…" dans ~/.ssh/authorized_keys). Source : deploy/vps-deploy.sh ; copie installée hors du dépôt :
#   install -m 755 ~/wppconnect-server/deploy/vps-deploy.sh ~/bin/wpp-deploy.sh
#
# Le workflow (.github/workflows/deploy.yml, appleboy/ssh-action) n'envoie que « DEPLOY_SHA=<sha> » :
# avec la clé restreinte, rien d'autre ne peut s'exécuter. Les étapes sont ici.
#
# À la main (test, ou retour en arrière) : ~/bin/wpp-deploy.sh <sha>
set -euo pipefail

# Vrai dossier (pas un lien). Ne jamais le renommer : voir `name:` dans docker-compose.yml
# (volumes de la session WhatsApp).
DIR="$HOME/wppconnect-server"

if [[ -n "${1:-}" ]]; then REQ="$1"
elif [[ "${SSH_ORIGINAL_COMMAND:-}" =~ DEPLOY_SHA=([0-9a-f]{40}) ]]; then REQ="${BASH_REMATCH[1]}"
else REQ=""; fi
if [[ ! "$REQ" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Commit invalide ou absent (DEPLOY_SHA de 40 caractères attendu)" >&2
  exit 2
fi

# Un seul déploiement à la fois
exec 9>"$HOME/.wpp-deploy.lock"
flock -w 600 9 || { echo "Un autre déploiement est en cours" >&2; exit 1; }

docker network create dayaxcash_net >/dev/null 2>&1 || true
cd "$DIR"
echo "▶ Récupération du code"
git fetch --quiet origin preview
if ! git cat-file -e "${REQ}^{commit}" 2>/dev/null; then echo "Commit $REQ introuvable après git fetch origin preview" >&2; exit 1; fi
if ! git merge-base --is-ancestor "$REQ" origin/preview; then echo "Commit $REQ absent de l'historique de origin/preview" >&2; exit 1; fi
git checkout --quiet -f -B preview "$REQ"
echo "  version $(git log -1 --format='%h — %s')"

# Image de CE commit (taguée par SHA par la CD)
export WPP_TAG="$REQ"
echo "▶ Téléchargement de l'image"
docker compose pull
echo "▶ Redémarrage de ce qui a changé"
docker compose up -d --no-build
bash deploy/prune-wpp-images.sh 3 || true
docker image prune -f >/dev/null 2>&1 || true
docker compose ps --format 'table {{.Service}}\t{{.Status}}'
echo "✅ wppconnect-server déployé : $(git log -1 --format='%h')"
