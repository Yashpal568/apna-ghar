# Shared configuration package

This package is reserved for shared repository tooling configuration. The current applications each have an explicit TypeScript configuration, while root npm scripts coordinate typechecks, tests and builds.

Do not claim shared lint/format configuration is implemented until the corresponding configs and dependencies are added and adopted by the workspaces. Do not put secrets or environment-specific credentials in this package. Native mobile build configuration remains deferred to the final mobile phase.
