# Filesystem wallet storage

The filesystem backend stores wallet private keys and mnemonics as plaintext
JSON files. Protect the storage volume and backups, and restrict access to the
service account; file permissions are not encryption.

On POSIX systems, newly created storage directories use mode `0700` subject to
the process umask. Newly written and overwritten wallet files are set to mode
`0600`. Existing directories and existing files that are not rewritten are not
modified. Review and restrict their permissions separately during deployment.
If older files may have been exposed, follow the deployment's incident response
and key-rotation procedures.

The storage location is set by `WALLET_PATH` when provided; otherwise it defaults
to the `wallet_storage` directory under the storage module's runtime directory.
Windows and filesystems with different permission semantics require equivalent
access controls configured at the operating-system or volume level.
