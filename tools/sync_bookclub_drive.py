#!/usr/bin/env python3
"""Synchronize Book Club PDFs from Google Drive into web-ready book covers.

The local ``images/book-covers/<level>/`` hierarchy is the source of truth for
the Book Club catalog in scripts/bookclub-data.json.

Usage:
    python3 -m pip install -r tools/requirements-bookclub-sync.txt
    python3 tools/sync_bookclub_drive.py --drive-folder-id FOLDER_ID \
        --credentials ~/Downloads/google-oauth-client.json

The first run opens a Google sign-in window and stores its refresh token locally
in tools/.bookclub-drive-token.json (ignored by the script's Git workflow).
"""

from __future__ import annotations

import argparse
import io
import json
import re
from pathlib import Path
from typing import Any

try:
    import pymupdf
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    from PIL import Image, ImageOps
except ImportError as error:
    DRIVE_DEPENDENCIES_ERROR = error
else:
    DRIVE_DEPENDENCIES_ERROR = None


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "scripts" / "bookclub-data.json"
COVERS_DIR = ROOT / "images" / "book-covers"
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
COVER_SIZE = (300, 400)
LEVEL_FOLDERS = {
    "book club storytime 2 4": "ages-2-5",
    "book club k to 2sd": "k-2",
    "book club k to 2nd": "k-2",
    "book club 3rd to 5th": "3-5",
    "6th to 8th middle": "middle-school",
    "9th to 12th high": "high-school",
}
LEVEL_LABELS = {
    "ages-2-5": "Ages 2–5",
    "k-2": "Kindergarten – 2nd Grade",
    "3-5": "3rd – 5th Grade",
    "middle-school": "6th – 8th Grade · Middle School",
    "high-school": "9th – 12th Grade · High School",
}


def normalized_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def filename_stem(value: str) -> str:
    stem = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return stem or "book"


def book_title_from_cover(cover_path: Path) -> str:
    name = re.sub(r"--[A-Za-z0-9_-]{8}$", "", cover_path.stem)
    return re.sub(r"\s+", " ", name.replace("-", " ")).strip().title()


def local_levels() -> dict[str, dict[str, Any]]:
    existing_levels = json.loads(DATA_PATH.read_text(encoding="utf-8")) if DATA_PATH.exists() else {}
    levels: dict[str, dict[str, Any]] = {}
    for level_key, label in LEVEL_LABELS.items():
        level_dir = COVERS_DIR / level_key
        covers = sorted(level_dir.glob("*.webp")) if level_dir.is_dir() else []
        existing_titles = {
            book["src"]: book["title"]
            for book in existing_levels.get(level_key, {}).get("books", [])
        }
        levels[level_key] = {
            "label": label,
            "books": [
                {
                    "title": existing_titles.get(
                        f"images/{level_key}/{cover.name}",
                        book_title_from_cover(cover),
                    ),
                    "src": f"images/{level_key}/{cover.name}",
                }
                for cover in covers
            ],
        }
    return levels


def get_drive_service(credentials_path: Path, token_path: Path):
    credentials: Credentials | None = None
    if token_path.exists():
        credentials = Credentials.from_authorized_user_file(token_path, SCOPES)
    if credentials and credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
    if not credentials or not credentials.valid:
        flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
        credentials = flow.run_local_server(port=0)
        token_path.write_text(credentials.to_json(), encoding="utf-8")
    return build("drive", "v3", credentials=credentials)


def list_children(service: Any, parent_id: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    page_token: str | None = None
    while True:
        response = service.files().list(
            q=f"'{parent_id}' in parents and trashed = false",
            spaces="drive",
            fields="nextPageToken,files(id,name,mimeType)",
            orderBy="name_natural",
            pageToken=page_token,
        ).execute()
        items.extend(response.get("files", []))
        page_token = response.get("nextPageToken")
        if not page_token:
            return items


def download_pdf(service: Any, file_id: str) -> bytes:
    request = service.files().get_media(fileId=file_id)
    output = io.BytesIO()
    downloader = MediaIoBaseDownload(output, request)
    finished = False
    while not finished:
        _, finished = downloader.next_chunk()
    return output.getvalue()


def save_cover(pdf_bytes: bytes, destination: Path) -> None:
    document = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    try:
        page = document.load_page(0)
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        cover = ImageOps.fit(image, COVER_SIZE, Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        cover.save(destination, "WEBP", quality=86, method=6)
    finally:
        document.close()


def update_page_data(levels: dict[str, dict[str, Any]]) -> None:
    DATA_PATH.write_text(json.dumps(levels, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync Google Drive Book Club PDFs into the Ninette website.")
    parser.add_argument("--drive-folder-id", help="ID of the Google Drive folder that contains the level folders.")
    parser.add_argument("--credentials", type=Path, help="OAuth desktop client JSON downloaded from Google Cloud.")
    parser.add_argument("--token", type=Path, default=ROOT / "tools" / ".bookclub-drive-token.json", help="Path for the local OAuth refresh token.")
    parser.add_argument("--refresh-data", action="store_true", help="Rebuild scripts/bookclub-data.json from existing images/book-covers/<level>/*.webp files only.")
    parser.add_argument("--dry-run", action="store_true", help="List source PDFs without writing covers or index.html.")
    args = parser.parse_args()

    if args.refresh_data:
        levels = local_levels()
        update_page_data(levels)
        print(f"Updated {DATA_PATH} from {sum(len(level['books']) for level in levels.values())} local covers.")
        return

    if not args.drive_folder_id or not args.credentials:
        parser.error("--drive-folder-id and --credentials are required unless --refresh-data is used.")
    if not args.credentials.is_file():
        parser.error(f"Credentials file does not exist: {args.credentials}")
    if DRIVE_DEPENDENCIES_ERROR:
        parser.error(
            "Google Drive synchronization requires the packages in "
            f"tools/requirements-bookclub-sync.txt: {DRIVE_DEPENDENCIES_ERROR}"
        )

    service = get_drive_service(args.credentials, args.token)
    folders = {
        LEVEL_FOLDERS[normalized_name(folder["name"])]: folder
        for folder in list_children(service, args.drive_folder_id)
        if folder["mimeType"] == "application/vnd.google-apps.folder"
        and normalized_name(folder["name"]) in LEVEL_FOLDERS
    }
    missing_folders = sorted(set(LEVEL_FOLDERS.values()) - set(folders))
    if missing_folders:
        print("No matching Drive folder for: " + ", ".join(missing_folders))

    for level_key, folder in folders.items():
        pdfs = [
            item for item in list_children(service, folder["id"])
            if item["mimeType"] == "application/pdf" or item["name"].lower().endswith(".pdf")
        ]
        for pdf in pdfs:
            output_name = f"{filename_stem(Path(pdf['name']).stem)}--{pdf['id'][:8]}.webp"
            print(f"{level_key}: {pdf['name']} -> {level_key}/{output_name}")
            if not args.dry_run:
                output_dir = COVERS_DIR / level_key
                output_dir.mkdir(parents=True, exist_ok=True)
                save_cover(download_pdf(service, pdf["id"]), output_dir / output_name)

    if args.dry_run:
        print("Dry run complete. No files were written.")
        return

    levels = local_levels()
    update_page_data(levels)
    print(f"Synced {sum(len(level['books']) for level in levels.values())} local covers to {DATA_PATH}.")


if __name__ == "__main__":
    main()