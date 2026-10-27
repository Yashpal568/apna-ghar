# Security and Privacy

- Clerk handles authentication; backend enforces authorization.
- Never commit .env files or API secrets.
- Validate all requests and rate-limit login, posting, reports and upload URL issuance.
- Restrict uploads by signature, MIME type, size, count and video duration.
- Use short-lived signed uploads and object storage.
- Sanitize user-generated content on web; protect against injection and XSS.
- Check ownership on all listing/media changes.
- Audit admin role changes, moderation, plan edits and exports.
- Offer privacy policy, terms, deletion process and retention rules.
- Let sellers choose whether to show precise address/location.
- Review applicable Indian privacy and consumer obligations with qualified counsel before launch.
