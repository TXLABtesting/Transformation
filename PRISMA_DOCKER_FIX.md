# Prisma Docker OpenSSL Fix

The Dockerfile now uses `node:22-bookworm-slim` instead of `node:22-alpine`.

Reason: Prisma 5.x can fail on newer Alpine/musl images with OpenSSL detection errors during `prisma migrate deploy`, producing:

```text
Prisma failed to detect the libssl/openssl version
Error: Could not parse schema engine response
```

The Debian slim image provides a more reliable glibc/OpenSSL environment for Prisma engines. The image installs:

```bash
openssl ca-certificates
```

in deps, builder, and runner stages.

After applying this change, rebuild with `--no-cache` and deploy a new image tag.
