#!/usr/bin/env python3
"""
Download mods from Modrinth based on mrpack index.
Usage: python download-mods.py <mrpack_dir> <output_dir>
"""

import json
import sys
import os
import urllib.request
import hashlib
from pathlib import Path


def download_file(url: str, dest: Path, expected_hash: str = None) -> bool:
    """Download a file from URL to destination."""
    try:
        print(f"  Downloading: {dest.name}")
        urllib.request.urlretrieve(url, dest)

        if expected_hash:
            with open(dest, 'rb') as f:
                file_hash = hashlib.sha512(f.read()).hexdigest()
            if file_hash != expected_hash:
                print(f"    Hash mismatch for {dest.name}")
                return False

        return True
    except Exception as e:
        print(f"    Failed to download {url}: {e}")
        return False


def main():
    if len(sys.argv) < 3:
        print("Usage: python download-mods.py <mrpack_dir> <output_dir>")
        sys.exit(1)

    mrpack_dir = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])

    output_dir.mkdir(parents=True, exist_ok=True)

    # Read modrinth index
    index_path = mrpack_dir / "modrinth.index.json"
    if not index_path.exists():
        print(f"Index not found: {index_path}")
        sys.exit(1)

    with open(index_path) as f:
        index = json.load(f)

    print(f"Downloading {len(index.get('files', []))} mods...")

    downloaded = 0
    failed = 0

    for file_info in index.get('files', []):
        file_path = file_info.get('path', '')
        downloads = file_info.get('downloads', [])
        hashes = file_info.get('hashes', {})

        if not file_path.startswith('mods/'):
            continue

        filename = Path(file_path).name
        dest = output_dir / filename

        if dest.exists():
            print(f"  Skipping (exists): {filename}")
            downloaded += 1
            continue

        success = False
        for url in downloads:
            if download_file(url, dest, hashes.get('sha512')):
                success = True
                downloaded += 1
                break

        if not success:
            failed += 1

    print(f"\nDownloaded: {downloaded}, Failed: {failed}")

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
