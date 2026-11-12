"""Offline backup/restore utility. Restore always creates a new directory."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
from contextlib import closing


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def private_copy(source, target):
    if source.is_symlink() or not source.is_file():
        raise ValueError('Only regular files may be backed up or restored.')
    target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    shutil.copyfile(source, target)
    os.chmod(target, 0o600)


def create_backup(database, uploads, destination, users=None):
    database, uploads, destination = map(Path, (database, uploads, destination))
    if not database.is_file() or database.is_symlink():
        raise ValueError('A regular source database is required.')
    if destination.exists():
        raise ValueError('Backup destination must not exist.')
    if uploads.resolve() == destination.resolve() or uploads.resolve() in destination.resolve().parents:
        raise ValueError('Backup destination must be outside uploads.')
    destination.mkdir(parents=True, mode=0o700)
    with closing(sqlite3.connect(f'file:{database.resolve()}?mode=ro', uri=True)) as source, closing(sqlite3.connect(destination / 'echo.db')) as target:
        source.backup(target)
        if target.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Database integrity check failed.')
    os.chmod(destination / 'echo.db', 0o600)
    if uploads.exists():
        for source in uploads.rglob('*'):
            if source.is_symlink():
                raise ValueError('Upload symlinks are not supported.')
            if source.is_file():
                private_copy(source, destination / 'uploads' / source.relative_to(uploads))
    if users:
        private_copy(Path(users), destination / 'users.json')
    files = {str(p.relative_to(destination)): digest(p) for p in destination.rglob('*') if p.is_file()}
    manifest = destination / 'manifest.json'
    manifest.write_text(json.dumps({'version': 1, 'files': files}, indent=2))
    os.chmod(manifest, 0o600)
    return destination


def restore_backup(backup, destination):
    backup, destination = Path(backup), Path(destination)
    if destination.exists():
        raise ValueError('Restore destination must not exist; existing data is never overwritten.')
    manifest = json.loads((backup / 'manifest.json').read_text())
    if manifest.get('version') != 1 or 'echo.db' not in manifest.get('files', {}):
        raise ValueError('Unsupported or incomplete backup manifest.')
    sources = []
    for name, expected in manifest['files'].items():
        relative = Path(name)
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('Invalid backup path.')
        source = backup / relative
        if source.is_symlink() or not source.is_file() or backup.resolve() not in source.resolve().parents or digest(source) != expected:
            raise ValueError('Backup file integrity check failed: ' + name)
        sources.append((source, relative))
    with closing(sqlite3.connect(f'file:{(backup / "echo.db").resolve()}?mode=ro', uri=True)) as db:
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Backup database integrity check failed.')
    destination.mkdir(parents=True, mode=0o700)
    for source, relative in sources:
        private_copy(source, destination / relative)
    (destination / 'uploads').mkdir(exist_ok=True, mode=0o700)
    return destination


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    backup = commands.add_parser('backup')
    for name in ('database', 'uploads', 'destination'):
        backup.add_argument('--' + name, required=True)
    backup.add_argument('--users')
    restore = commands.add_parser('restore')
    restore.add_argument('--backup', required=True)
    restore.add_argument('--destination', required=True)
    args = vars(parser.parse_args())
    command = args.pop('command')
    result = create_backup(**args) if command == 'backup' else restore_backup(**args)
    print('Completed:', result)
