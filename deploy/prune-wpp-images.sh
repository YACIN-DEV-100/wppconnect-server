#!/usr/bin/env bash
# Nettoyage des anciennes images GHCR de wppconnect-server sur la VPS.
#
# Appelé par .github/workflows/deploy.yml après `docker compose up -d`.
# `docker image prune -f` ne supprime que les images sans étiquette : les
# images étiquetées par SHA (une par déploiement) s'accumuleraient sinon
# indéfiniment.
#
# Règles :
#   - ne touche QU'AU dépôt listé dans REPOS (jamais aux images d'autres
#     applications de la VPS : dayaxcash-monorepo, Tailowl, mongo...) ;
#   - garde les KEEP versions les plus récentes (une « version » = un
#     identifiant d'image, qui peut porter plusieurs étiquettes, ex. <sha> et
#     latest) ;
#   - ne supprime jamais une image utilisée par un conteneur (même arrêté) ;
#   - retire les étiquettes une par une (`docker image rm dépôt:tag`, jamais
#     -f) : Docker ne supprime réellement l'image qu'une fois sa dernière
#     étiquette retirée. Un échec n'interrompt pas le déploiement.
#
# Même script que scripts/prune-dayax-images.sh dans dayaxcash-monorepo,
# seule la liste REPOS change.
#
# Usage : prune-wpp-images.sh [KEEP]   (défaut 3)
set -u

KEEP="${1:-3}"
REPOS=(
  ghcr.io/yacin-dev-100/wppconnect-server/wppconnect
)

# Identifiants complets (sha256:...) des images utilisées par un conteneur.
IN_USE="$(docker ps -aq | xargs -r docker inspect --format '{{.Image}}' | sort -u)"

for repo in "${REPOS[@]}"; do
  # Une ligne par étiquette : date de création, identifiant, référence.
  listing="$(docker image ls "$repo" --no-trunc \
    --format '{{.CreatedAt}}|{{.ID}}|{{.Repository}}:{{.Tag}}')"
  [ -z "$listing" ] && continue

  # Identifiants distincts, du plus récent au plus ancien, au-delà des KEEP premiers.
  old_ids="$(printf '%s\n' "$listing" | sort -r | awk -F'|' '!seen[$2]++ {print $2}' \
    | tail -n +"$((KEEP + 1))")"

  for id in $old_ids; do
    if printf '%s\n' "$IN_USE" | grep -qxF "$id"; then
      echo "Conservée (utilisée par un conteneur) : $repo $id"
      continue
    fi
    printf '%s\n' "$listing" | awk -F'|' -v id="$id" '$2 == id {print $3}' \
      | while read -r ref; do
          # Étiquette absente (<none>) : on ne peut viser que l'identifiant.
          case "$ref" in *:\<none\>) ref="$id" ;; esac
          echo "Suppression : $ref"
          docker image rm "$ref" >/dev/null || echo "  échec ignoré : $ref"
        done
  done
done
