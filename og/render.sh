#!/bin/sh
# Rend les cartes de partage (og:image) en PNG 1200 × 630 avec Chrome sans
# interface. Usage : sh og/render.sh   (depuis la racine du dépôt ou ailleurs)
set -e
ICI="$(cd "$(dirname "$0")" && pwd)"
SORTIE="$ICI/../site/assets/og"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$SORTIE"
for nom in accueil webinaire; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --window-size=1200,630 \
    --virtual-time-budget=8000 \
    --screenshot="$SORTIE/$nom.png" "file://$ICI/$nom.html" >/dev/null 2>&1
  echo "$nom.png"
done
