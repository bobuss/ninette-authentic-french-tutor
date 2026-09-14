# Ninette

Site statique de Ninette Authentic French Tutor. Ouvrir `index.html` dans un navigateur pour consulter le site; servir le dossier par HTTP local lorsque le Book Club doit charger son catalogue JSON.

## Book Club

Le navigateur charge le catalogue dans `scripts/bookclub-data.json` et son code de rendu dans `scripts/bookclub.js`. Les couvertures WebP sont rangées dans `images/book-covers/<niveau>/`.

Les titres du JSON sont éditoriaux: la synchronisation conserve un titre existant lorsqu'elle retrouve le même chemin de couverture. Toute correction de titre doit donc être faite directement dans `scripts/bookclub-data.json`.

## Environnement Python

Créer puis activer l'environnement virtuel:

```sh
python3.11 -m venv venv
source venv/bin/activate
python3 -m pip install -r tools/requirements-bookclub-sync.txt
```

## Regénérer le catalogue JSON

Après avoir modifié localement les couvertures dans `images/book-covers/`, régénérer le catalogue sans contacter Google Drive:

```sh
python3 tools/sync_bookclub_drive.py --refresh-data
```

Cette commande met à jour `scripts/bookclub-data.json` à partir des fichiers `.webp` présents dans les sous-dossiers de `images/book-covers/`.

## Synchroniser depuis Google Drive

La commande suivante télécharge les PDF du dossier Google Drive, extrait leur première page en WebP dans `images/book-covers/`, puis régénère le catalogue JSON:

```sh
python3 tools/sync_bookclub_drive.py \
  --drive-folder-id "1G0hA69oyX0f7fEhHtjf_dlwqpCpOgOMS" \
  --credentials /Users/btornil/Downloads/client_secret_773686076765-onhni63du4nqi1542jor16eao0lr3m4d.apps.googleusercontent.com.json
```

Au premier lancement, une fenêtre Google demande l'autorisation. Le jeton de renouvellement est ensuite conservé dans `tools/.bookclub-drive-token.json`; il est ignoré par Git.

Pour vérifier les fichiers source sans les télécharger, ajouter `--dry-run` à la commande de synchronisation.
