/** One row of a component's API table. */
export interface PropDoc {
  name: string;
  /** The TypeScript type as a reader would write it. */
  type: string;
  default?: string;
  description: string;
}
