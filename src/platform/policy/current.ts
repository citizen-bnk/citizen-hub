import { DEFAULT_POLICY, type PolicyKey, type PolicyValues, type Snapshot } from "./defaults";

/**
 * The latest resolved policy, for code that is not a React component (money formatting). The hook in ./index.ts keeps it
 * current. It is never empty: until the backend answers it holds the defaults.
 */
let current: Snapshot = DEFAULT_POLICY;
export const setCurrentPolicy = (s: Snapshot) => { current = s; };
export const currentPolicy = () => current;

/** `policy("legal.footer")`: one value, typed by its key. */
export const policy = <K extends PolicyKey>(key: K): PolicyValues[K] => current.policies[key];
