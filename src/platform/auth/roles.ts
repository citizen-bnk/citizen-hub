/** Role names as the backend stores and enforces them. `customer` is banking only and has no Hub access. */
export const ROLES = {
  investor: ["investor", "shareholder"],
  board: ["board_member"],
  office: ["back_office", "back_office_staff", "staff"],
  admin: ["admin"],
} as const;

export const SUPER_ADMIN = "super_admin";

const list = <K extends keyof typeof ROLES>(...keys: K[]): string[] => keys.flatMap((k) => [...ROLES[k]]);

/** Handy groups for features to declare who may use them. super_admin is always allowed on top of these. */
export const WHO = {
  investors: list("investor"),
  board: list("board"),
  office: list("office"),
  admins: list("admin"),
  investorsAndBoard: list("investor", "board"),
  boardAndOffice: list("board", "office"),
  staff: list("office", "admin"),
  everyone: list("investor", "board", "office", "admin"),
} as const;

/** Whether `roles` includes any of `allowed`. super_admin may do everything; unknown role names grant nothing. */
export function allowed(roles: readonly string[], allowedRoles: readonly string[]): boolean {
  return roles.includes(SUPER_ADMIN) || roles.some((r) => allowedRoles.includes(r));
}
