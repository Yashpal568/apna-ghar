# Framework Decision Record

Decision approved:
- Mobile: React Native Community CLI.
- Backend: NestJS + TypeScript modular monolith.
- Public web and dedicated admin: Next.js.
- Authentication: Clerk, with OTP excluded unless explicitly requested.
- Database: MongoDB.

Do not run another framework comparison or scaffold Expo. Use docs/12-m1-implementation-checklist.md. Native libraries for maps, media and ads must be checked for current React Native Community CLI compatibility before adding them. ShadCN Studio remains a web/admin design resource; implement mobile UI with native-compatible components and shared tokens.
