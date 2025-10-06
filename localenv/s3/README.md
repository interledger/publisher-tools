# Emulator for S3 using Cloudflare R2

- Act as a local AWS S3 / Cloudflare R2 public bucket, letting serve objects via GET requests.
- List objects via `GET /` request.
- S3 compatible API for `PutObject` via `PUT` requests - minus the authentication.
