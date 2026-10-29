# CI workflows

The active GitHub Actions workflows are:

- `ci.yml`: npm workspace install, API/web/mobile typechecks, API unit tests, API HTTP end-to-end tests, API production build and Next.js web production build.
- `quality-checks.yml`: independent API and web production build checks.

Native Android/iOS builds are intentionally deferred until the final mobile phase and are not claimed by these Ubuntu checks. Never expose secrets in workflow logs, and report success only from the actual run status.
