import { createContext } from 'react';

/** Which surface the content sits in. `calendar/` may read it; see the layering rules. */
export const SurfaceContext = createContext<{ isSheet: boolean } | null>(null);
