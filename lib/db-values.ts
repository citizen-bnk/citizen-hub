/** Database drivers can return Date objects; all application contracts use ISO text. */
export function normaliseDates<T>(value:T):T {
 if(value instanceof Date)return value.toISOString() as T;
 if(Array.isArray(value))return value.map(normaliseDates) as T;
 if(value!==null&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,normaliseDates(item)])) as T;
 return value;
}
