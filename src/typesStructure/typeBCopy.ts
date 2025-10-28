export function isAdd(x: number) { return x % 2 === 0; }
export function isSub(x: number) { return x < 0; }
export function isExp(x: number) {
    if (!Number.isInteger(x) || x < 1) return false;
    if (x === 1) return true; // 1 = 1^k
    const limit = Math.floor(Math.sqrt(x));
    for (let base = 2; base <= limit; base++) {
        let v = x;
        while (v % base === 0) {
            v = v / base;
            if (v === 1) return true;
        }
    }
    return false;
}

export function isVariable(s: string): boolean {
    const t = s.trim();
    if (!t) return false;
    if (!Number.isNaN(Number(t))) return false; // numeric literal => not a variable
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(t);
}

/**
 * Return true when the input contains BOTH:
 *  - at least one numeric literal (integer, float, or scientific notation)
 *  - and at least one identifier (JS-style: starts with letter/_ then alnum/_)
 *
 * Examples that return true:
 *   "x + 1", "2x + 1", "2*x", "-1.2e3var + y", "3.14*(x-1)"
 *
 * Examples that return false:
 *   "x2" (single identifier), "123" (number only), "foo+bar" (identifiers only)
 */
export function isVarAndisNum(s: string): boolean {
    const str = s.trim();
    if (!str) return false;

    let i = 0;
    const n = str.length;
    let hasNum = false;
    let hasIdent = false;

    while (i < n) {
        const ch = str[i];

        // skip whitespace
        if (/\s/.test(ch)) { i++; continue; }

        // identifier: starts with letter or underscore
        if (/[A-Za-z_]/.test(ch)) {
            let j = i + 1;
            while (j < n && /[A-Za-z0-9_]/.test(str[j])) j++;
            hasIdent = true;
            i = j;
            if (hasNum && hasIdent) return true;
            continue;
        }

        // number: digit or dot (allow numbers next to identifiers: e.g. "2x" -> number '2' then 'x')
        if (/\d|\./.test(ch) || ((ch === '+' || ch === '-') && i + 1 < n && /[\d.]/.test(str[i + 1]) && isUnarySign(str, i))) {
            // parse optional sign (if it's a unary sign recognized by isUnarySign)
            let j = i;
            if ((str[j] === '+' || str[j] === '-') && j + 1 < n && /[\d.]/.test(str[j + 1]) && isUnarySign(str, j)) {
                j++;
            }

            // digits before dot
            while (j < n && /\d/.test(str[j])) j++;
            // optional decimal part
            if (j < n && str[j] === '.') {
                j++;
                while (j < n && /\d/.test(str[j])) j++;
            }
            // optional exponent
            if (j < n && /[eE]/.test(str[j])) {
                j++;
                if (j < n && /[+-]/.test(str[j])) j++;
                const expStart = j;
                while (j < n && /\d/.test(str[j])) j++;
                // if there's no digits after E, we still accept the digits before E as number
                if (j === expStart) {
                    // malformed exponent — still continue with what we have
                }
            }

            // We stop number parsing when encountering a letter — that letter will be tokenized later as identifier.
            hasNum = true;
            i = j;
            if (hasNum && hasIdent) return true;
            continue;
        }

        // otherwise operator / punctuation / parentheses; skip one char
        i++;
    }

    return hasNum && hasIdent;
}

// helper: check whether a sign char at position `idx` is a unary sign for a number
function isUnarySign(s: string, idx: number): boolean {
    // sign is unary if it's at string start or previous non-space char is an operator or '('
    let k = idx - 1;
    while (k >= 0 && /\s/.test(s[k])) k--;
    if (k < 0) return true;
    const prev = s[k];
    return /[+\-*/^=,(]/.test(prev);
}




export let Pattern = {
    Add1: isAdd,
    Sub1: isSub,
    Exp1: isExp,
    Var1: isVariable,
    VarNum: isVarAndisNum
    // Add1:"additional",
    // Sub1:"subtractional",
    // Exp1:"exponential"
} as const

// export type Pattern = typeof Pattern[keyof typeof Pattern];

export type PatternKey = keyof typeof Pattern;

// Type: union of the function types
export type PatternFn = (typeof Pattern)[PatternKey];
// PatternFn => ((x: number) => boolean) | ((x: number) => boolean) | ...

// If you want the union of *return types*:
export type PatternReturn = ReturnType<(typeof Pattern)[PatternKey]>;
// PatternReturn => boolean