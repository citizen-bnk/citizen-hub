import { useQuery } from "@tanstack/react-query";
import { getPrefs, getProfile, getTodoFeed } from "./api";
import { buildTodo } from "./logic";

/** `silent`: a person who has not registered yet has no profile (404); the screen shows the setup form instead of an error. */
export const useProfile = () => useQuery({ queryKey: ["account", "profile"], queryFn: getProfile, meta: { silent: true }, retry: false });
export const usePrefs = () => useQuery({ queryKey: ["account", "prefs"], queryFn: getPrefs });
export const useTodo = () => useQuery({ queryKey: ["account", "todo"], queryFn: getTodoFeed, staleTime: 60_000, select: buildTodo });
