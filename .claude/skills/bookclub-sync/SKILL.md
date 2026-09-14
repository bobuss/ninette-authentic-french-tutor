---
name: bookclub-sync
description: "Synchronize the Ninette French Book Club from Google Drive and editorially correct titles in scripts/bookclub-data.json. Use when asked to refresh Book Club covers, run the Drive sync, regenerate the JSON catalog, or review French book titles, accents, spelling, punctuation, and capitalization."
argument-hint: "Synchronize the Book Club and review the French titles"
user-invocable: true
disable-model-invocation: false
---

# Ninette Book Club Synchronization

Synchronize Book Club PDFs from Google Drive, generate their WebP covers, and maintain accurate French display titles in the catalogue.

## Project Files

- `tools/sync_bookclub_drive.py`: imports PDFs from Google Drive, produces covers, and regenerates catalogue entries.
- `tools/requirements-bookclub-sync.txt`: Python dependencies for Drive synchronization.
- `scripts/bookclub-data.json`: canonical Book Club metadata used by the website.
- `images/book-covers/<level>/`: generated cover images grouped by reading level.
- `tools/.bookclub-drive-token.json`: local OAuth token. It is ignored by Git; never print, stage, or commit it.

## Procedure

1. Work from the repository root.
2. Ensure the project virtual environment is active:

   ```sh
   source venv/bin/activate
   ```

   If `venv/` does not exist, create it and install the requirements:

   ```sh
   python3.11 -m venv venv
   source venv/bin/activate
   python3 -m pip install -r tools/requirements-bookclub-sync.txt
   ```

3. For a full Google Drive refresh, first run a dry run to inspect the PDFs without writing files:

   ```sh
   python3 tools/sync_bookclub_drive.py \
     --drive-folder-id "1G0hA69oyX0f7fEhHtjf_dlwqpCpOgOMS" \
     --credentials /Users/btornil/Downloads/client_secret_773686076765-onhni63du4nqi1542jor16eao0lr3m4d.apps.googleusercontent.com.json \
     --dry-run
   ```

4. Run the same command without `--dry-run` to download new or updated PDFs, generate first-page `300 x 400` WebP covers, and update the catalogue:

   ```sh
   python3 tools/sync_bookclub_drive.py \
     --drive-folder-id "1G0hA69oyX0f7fEhHtjf_dlwqpCpOgOMS" \
     --credentials /Users/btornil/Downloads/client_secret_773686076765-onhni63du4nqi1542jor16eao0lr3m4d.apps.googleusercontent.com.json
   ```

   The initial run opens Google OAuth authorization. Do not expose the OAuth token or credentials contents.

5. Review every newly created or fallback-generated title in `scripts/bookclub-data.json` before declaring the work complete. Correct French titles directly in the JSON:
   - restore accents and ligatures when appropriate: `É`, `è`, `ê`, `à`, `ç`, `œ`;
   - restore apostrophes and punctuation: `L'Appel de la forêt`, `C'est moi le plus fort`;
   - use normal French title capitalization: capitalize the first word and proper nouns only, unless the book cover clearly establishes a stylized title;
   - fix obvious misspellings caused by ASCII filename slugs;
   - retain an exact human-reviewed title when its `src` has not changed;
   - do not invent a title when the cover or source filename is too ambiguous. Flag it for the user instead.

6. For a metadata-only rebuild after local cover changes, use:

   ```sh
   python3 tools/sync_bookclub_drive.py --refresh-data
   ```

   This preserves existing JSON titles using each book's `src` as its stable key. It creates fallback titles only for new cover paths; review those fallback titles as in step 5.

7. Validate the result:

   ```sh
   python3 -m json.tool scripts/bookclub-data.json >/dev/null
   python3 tools/sync_bookclub_drive.py --refresh-data
   git diff --check
   ```

   Confirm every JSON `src` maps to a present file at `images/book-covers/<src without images/>`. Do not remove legacy covers or unrelated assets unless explicitly asked.

## Completion Report

State:

- whether Drive synchronization or only `--refresh-data` ran;
- how many catalogue entries are present;
- which titles were editorially corrected;
- validation results;
- whether files remain uncommitted. Do not commit or push unless explicitly requested.
