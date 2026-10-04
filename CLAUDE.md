# CLAUDE.md

Contexte pour les futures sessions sur ce dépôt. Lis ceci avant de modifier
quoi que ce soit.

## C'est quoi

Fork de [WPPConnect Server](https://github.com/wppconnect-team/wppconnect-server)
utilisé par `dayaxcash-monorepo` (repo séparé) : sessions WhatsApp et envoi de
messages pour le bot. `apps/bot` du monorepo l'appelle en interne
(`x-api-key` = `WPP_SECRET_KEY`), via le réseau Docker partagé
`dayaxcash_net` — le service ne publie aucun port vers l'hôte. La
documentation complète de la production (VPS, secrets partagés, historique)
est dans `CLAUDE.md` de `dayaxcash-monorepo`.

## Branches

- `main` suit le dépôt WPPConnect d'origine : jamais déployée, jamais de
  commit direct.
- `dev` : branche d'intégration. Chaque chantier se fait sur une branche
  dédiée créée depuis `dev` à jour, avec une PR vers `dev`.
- `preview` : branche **déployée en production**. Mettre en production =
  merger `dev` dans `preview` (PR). Jamais de push direct sur `preview` ni
  sur `main`.

**Ne pas modifier les fichiers venus du projet d'origine** (`build.yml`,
`Dockerfile`, `.dockerignore`, `src/`... sauf correctif volontaire), pour
garder les mises à jour depuis WPPConnect simples. Les fichiers propres à
ce fork : `.github/workflows/deploy.yml`, `docker-compose.yml`,
`deploy/vps-deploy.sh`, `deploy/prune-wpp-images.sh`, ce `CLAUDE.md`.

## Déploiement (`.github/workflows/deploy.yml` + `deploy/vps-deploy.sh`)

Déclenché par un push sur `preview` (ou `workflow_dispatch`), chaque job
limité à `preview`. Enchaînement :

1. `verify` : `yarn install --immutable`, `yarn build`, `yarn lint`.
2. `build-images` : construit l'image pour **`linux/arm64`** (la VPS Oracle
   Ampere est ARM) avec QEMU + buildx sur `ubuntu-latest` — le repo est
   privé, les runners ARM natifs gratuits sont réservés aux repos publics.
   Cache `type=gha`. Publie `ghcr.io/yacin-dev-100/wppconnect-server/wppconnect`
   (nom **en minuscules**, GHCR refuse les majuscules), tags `<sha>` (commit
   déployé) et `latest`, via le `GITHUB_TOKEN` (`packages: write`). Le
   `Dockerfile` d'origine est utilisé tel quel (node alpine + paquet
   `chromium` d'Alpine, disponible en aarch64 ; il tournait déjà en
   production sur cette même VPS ARM avant ce changement).
3. `deploy` : SSH (`appleboy/ssh-action`) sur la VPS, qui n'envoie que
   `DEPLOY_SHA=<sha>` ; les étapes sont exécutées par `deploy/vps-deploy.sh`
   (clé restreinte, voir ci-dessous) — `docker network
create dayaxcash_net || true`, `cd ~/wppconnect-server`, `git fetch
origin preview`, vérification que le commit déployé existe et appartient
   à l'historique de `origin/preview` (sinon arrêt **avant** de toucher aux
   conteneurs), `git checkout -f -B preview <sha>`, `export WPP_TAG=<sha>`,
   `docker compose pull`, `docker compose up -d --no-build`, nettoyage des
   anciennes images (ci-dessous), `docker image prune -f`, `docker compose
   ps`, puis `✅ wppconnect-server déployé : <sha court>` en dernière ligne
   du journal du job. Un seul déploiement à la fois côté VPS aussi (`flock`
   sur `~/.wpp-deploy.lock`, attente max 10 min). La VPS ne compile
   plus rien (elle saturait ses 2 cœurs, partagés avec dayaxcash-monorepo
   et Tailowl).

Secrets du repo (Settings > Secrets and variables > Actions) : `VPS_HOST`,
`VPS_USER` (`deploy`, jamais root), `VPS_SSH_KEY` (clé privée `wpp-ci`,
propre à ce dépôt).

**Clé SSH de la CD restreinte — les étapes vivent dans
`deploy/vps-deploy.sh` (depuis le 04/10/2026).** L'ancienne clé partagée
`github_actions` a été retirée des `authorized_keys` du VPS le 04/10/2026 ;
ce dépôt a sa propre clé `wpp-ci`, dont la ligne dans
`~/.ssh/authorized_keys` du compte `deploy` est préfixée par
`command="/home/deploy/bin/wpp-deploy.sh",no-port-forwarding,
no-X11-forwarding,no-agent-forwarding,no-pty`. Conséquences :
- Quoi que le workflow envoie, le VPS exécute **toujours**
  `~/bin/wpp-deploy.sh` : le `script:` de `deploy.yml` ne sert qu'à
  transmettre `DEPLOY_SHA=<sha>`, lu dans `SSH_ORIGINAL_COMMAND`. Une fuite
  de `VPS_SSH_KEY` ne donne ni shell ni tunnel, seulement le droit de
  redéployer un commit déjà présent dans `origin/preview`.
- Le script refuse tout ce qui n'est pas un SHA de 40 caractères hexa (code
  2, rien n'est lancé), puis un commit absent de l'historique de
  `origin/preview` (code 1, avant de toucher aux conteneurs).
- **Source versionnée : `deploy/vps-deploy.sh` ; copie exécutée :
  `~/bin/wpp-deploy.sh`**, hors du clone (un `git checkout` du déploiement
  ne modifie jamais le script en cours d'exécution). Première installation
  (avant que la clé restreinte ne soit active, quand le clone n'est pas
  encore sur la version qui contient le script) : `git -C
  ~/wppconnect-server fetch -q origin preview && mkdir -p ~/bin && git -C
  ~/wppconnect-server show origin/preview:deploy/vps-deploy.sh >
  ~/bin/wpp-deploy.sh && chmod 755 ~/bin/wpp-deploy.sh`.
- **Changer une étape du déploiement** = modifier `deploy/vps-deploy.sh`
  (jamais le `script:` du workflow, sans effet), mettre en production
  (`dev` → `preview`), puis réinstaller la copie sur le VPS, en tant que
  `deploy` : `install -m 755 ~/wppconnect-server/deploy/vps-deploy.sh
  ~/bin/wpp-deploy.sh` (le déploiement a déjà mis le clone sur le nouveau
  commit ; la copie n'est jamais mise à jour automatiquement).
- Ne jamais retirer le `command="..."` d'`authorized_keys` sans remettre
  les étapes dans le workflow : le `script:` seul ne déploie rien.

**Revenir à une version précédente** (sur la VPS, en tant que `deploy`) :
`~/bin/wpp-deploy.sh <sha>` (SHA complet de 40 caractères d'un commit de
`preview` déjà publié sur GHCR) — mêmes étapes et vérifications que la CD,
code ET image remis à ce commit, verrou partagé avec la CD. Le prochain
déploiement automatique (merge sur `preview`) remet la dernière version.
Équivalent manuel, dans `~/wppconnect-server` : `git checkout -f -B preview
<sha>`, puis `WPP_TAG=<sha> docker compose pull`, puis `WPP_TAG=<sha>
docker compose up -d --no-build`. Sans `WPP_TAG`, Compose prend `latest`.

**Nettoyage (`deploy/prune-wpp-images.sh 3`)** : `docker image prune -f` ne
supprime que les images sans étiquette, les images étiquetées par SHA
s'accumuleraient. Le script garde les 3 versions les plus récentes de
`ghcr.io/yacin-dev-100/wppconnect-server/wppconnect` uniquement — jamais
les images de dayaxcash-monorepo, Tailowl ou mongo —, ne supprime jamais
une image utilisée par un conteneur, n'utilise jamais `-f`, et n'échoue
jamais le déploiement (`|| true`). Même script que
`scripts/prune-dayax-images.sh` du monorepo, seule la liste d'images change.

## CRITIQUE — session WhatsApp

La session est stockée dans les volumes Docker
`wppconnect-server_wppconnect_tokens` et
`wppconnect-server_wppconnect_userdata`. Leurs noms viennent du nom du
projet Compose (`wppconnect-server`) et des clés de volumes. **Ne jamais
changer** : `name: wppconnect-server` (fixé explicitement dans
`docker-compose.yml`, identique au nom déduit autrefois du dossier), le nom
du service `wppconnect`, `container_name: wpp-server`, les clés
`wppconnect_tokens`/`wppconnect_userdata`. Sinon Docker crée des volumes
vides : session perdue, QR code à rescanner. Vérifier avec `docker compose
config` avant tout changement de `docker-compose.yml`.

## La VPS (Oracle Cloud Ampere, aarch64, 2 cœurs, 12 Go)

- Le clone est un **vrai dossier** `/home/deploy/wppconnect-server`
  (`~/wppconnect-server` de l'utilisateur `deploy`), à côté de
  `~/dayaxcash-monorepo`. **Plus de lien symbolique** : les deux dossiers ont
  été déplacés le 03/10/2026 depuis `/var/www/dayaxcash/`, qui n'existe
  plus.
- `deploy` : non-root, groupe `docker`. Accès lecture au repo par deploy key
  (`~/.ssh/gh_wpp`, alias SSH `github-wpp`).
- **Connexion à GHCR** : `docker login ghcr.io` fait une fois à la main par
  `deploy`, avec un **jeton classique GitHub de portée `read:packages`**
  uniquement. Aucun jeton dans le repo. Ce login (`~deploy/.docker/
config.json`) est **partagé avec dayaxcash-monorepo et Tailowl**. **Le
  jeton expire** : à l'expiration, `docker compose pull` échoue
  (`denied`/`unauthorized`) et le job `deploy` passe au rouge, les
  conteneurs déjà lancés continuant de tourner. Renouveler : nouveau PAT
  classic `read:packages`, puis en tant que `deploy` : `echo <jeton> |
docker login ghcr.io -u <compte-github> --password-stdin`.
- `.env` et `.env.save` (copie de sauvegarde) existent uniquement sur la VPS
  et contiennent des secrets : ne jamais les lire dans un rapport, les
  modifier ou les commiter.
- `startAllSession` (`src/config.ts`) doit rester actif : c'est ce qui
  reconnecte la session seule après chaque recréation du conteneur.
