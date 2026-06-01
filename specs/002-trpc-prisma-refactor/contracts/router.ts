// Type-only contract — the source of truth for the tRPC API surface.
// The frontend imports AppRouter as a type-only import:
//   import type { AppRouter } from '@backend/trpc/router'
//
// This file re-exports it for documentation purposes only.
// The actual implementation lives in backend/src/trpc/router.ts.

import type { AppRouter } from '../../../backend/src/trpc/router';
export type { AppRouter };
