// typesStructure/typeB.ts
// --- tokenizer, shunting-yard, AST builder and detectors for expressions

export type Token =
    | { type: 'number'; value: number; raw: string }
    | { type: 'ident'; value: string }
    | { type: 'op'; value: string }
    | { type: 'paren'; value: '(' | ')' }

function isUnarySign(s: string, idx: number): boolean {
    let k = idx - 1;
    while (k >= 0 && /\s/.test(s[k])) k--;
    if (k < 0) return true;
    const prev = s[k];
    return /[+\-*/^=,(]/.test(prev);
}

export function tokenize(input: string): Token[] {
    const s = input.trim();
    const tokens: Token[] = [];
    let i = 0;
    const n = s.length;

    while (i < n) {
        const ch = s[i];
        if (/\s/.test(ch)) { i++; continue; }

        if (ch === '(' || ch === ')') {
            tokens.push({ type: 'paren', value: ch as '(' | ')' }); i++; continue;
        }

        // treat '×' as multiplication operator (removed 'x' for disambiguation)
        if (/[+\-*/^×]/.test(ch)) {
            tokens.push({ type: 'op', value: ch }); i++; continue;
        }

        // Special handling for 'x' to disambiguate between operator and identifier
        if (ch === 'x') {
            // Check for left operand
            let prevIdx = i - 1;
            while (prevIdx >= 0 && /\s/.test(s[prevIdx])) prevIdx--;
            const hasLeftOperand = prevIdx >= 0 && (/[0-9\)]/.test(s[prevIdx]) || /[A-Za-z0-9_]/.test(s[prevIdx]));

            // Check for right operand
            let nextIdx = i + 1;
            while (nextIdx < n && /\s/.test(s[nextIdx])) nextIdx++;
            const hasRightOperand = nextIdx < n && (/[0-9\(]/.test(s[nextIdx]) || /[A-Za-z_]/.test(s[nextIdx]));

            if (hasLeftOperand && hasRightOperand) {
                // Treat as multiplication operator
                tokens.push({ type: 'op', value: 'x' });
                i++;
                continue;
            } else {
                // Treat as identifier
                let j = i + 1; while (j < n && /[A-Za-z0-9_]/.test(s[j])) j++;
                tokens.push({ type: 'ident', value: s.slice(i, j) }); i = j; continue;
            }
        }

        if (/[A-Za-z_]/.test(ch)) {
            let j = i + 1; while (j < n && /[A-Za-z0-9_]/.test(s[j])) j++;
            tokens.push({ type: 'ident', value: s.slice(i, j) }); i = j; continue;
        }

        // number (support leading +/- as unary sign, decimals, exponent)
        if (/[0-9.]/.test(ch) || ((ch === '+' || ch === '-') && i + 1 < n && /[0-9.]/.test(s[i + 1]) && isUnarySign(s, i))) {
            let j = i;
            if ((s[j] === '+' || s[j] === '-') && j + 1 < n && /[0-9.]/.test(s[j + 1]) && isUnarySign(s, j)) j++;
            while (j < n && /[0-9]/.test(s[j])) j++;
            if (j < n && s[j] === '.') { j++; while (j < n && /[0-9]/.test(s[j])) j++; }
            if (j < n && /[eE]/.test(s[j])) { j++; if (j < n && /[+\-]/.test(s[j])) j++; while (j < n && /[0-9]/.test(s[j])) j++; }
            const raw = s.slice(i, j);
            const v = Number(raw);
            if (!Number.isNaN(v)) { tokens.push({ type: 'number', value: v, raw }); i = j; continue; }
            // fallback to ident
            let k = i + 1; while (k < n && /[^\s()+\-*\/\^×x]/.test(s[k])) k++;
            tokens.push({ type: 'ident', value: s.slice(i, k) }); i = k; continue;
        }

        tokens.push({ type: 'op', value: ch });
        i++;
    }

    // insert implicit multiplication when appropriate:
    const out: Token[] = [];
    for (let t = 0; t < tokens.length; t++) {
        const cur = tokens[t];
        out.push(cur);
        const next = tokens[t + 1];
        if (!next) continue;
        const leftIs = (cur.type === 'number' || cur.type === 'ident' || (cur.type === 'paren' && cur.value === ')'));
        const rightIs = (next.type === 'number' || next.type === 'ident' || (next.type === 'paren' && next.value === '('));
        if (leftIs && rightIs) out.push({ type: 'op', value: '*' });
    }

    return out;
}

// --- AST building via shunting-yard -> RPN -> AST
type ASTNode =
    | { type: 'number'; value: number }
    | { type: 'ident'; name: string }
    | { type: 'unary'; op: string; arg: ASTNode }
    | { type: 'binary'; op: string; left: ASTNode; right: ASTNode }

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
const RIGHT_ASSOC = new Set(['^']);

export function toRPN(tokens: Token[]): (Token | { type: 'op'; value: string })[] {
    const out: (Token | { type: 'op'; value: string })[] = [];
    const ops: { type: 'op'; value: string }[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.type === 'number' || t.type === 'ident') { out.push(t); continue; }
        if (t.type === 'op') {
            const op = (t.value === 'x' || t.value === '×') ? '*' : t.value;
            const prev = tokens[i - 1];
            const isUnary = (op === '+' || op === '-') && (!prev || prev.type === 'op' || (prev.type === 'paren' && prev.value === '('));
            if (isUnary) { ops.push({ type: 'op', value: op === '+' ? 'u+' : 'u-' }); continue; }
            while (ops.length > 0) {
                const top = ops[ops.length - 1].value;
                if (top === '(') break;
                const topPrec = PRECEDENCE[top.replace(/^u/, '')] ?? 0;
                const curPrec = PRECEDENCE[op] ?? 0;
                if ((RIGHT_ASSOC.has(op) && curPrec < topPrec) || (!RIGHT_ASSOC.has(op) && curPrec <= topPrec)) out.push(ops.pop()!);
                else break;
            }
            ops.push({ type: 'op', value: op });
            continue;
        }
        if (t.type === 'paren') {
            if (t.value === '(') ops.push({ type: 'op', value: '(' });
            else {
                while (ops.length > 0 && ops[ops.length - 1].value !== '(') out.push(ops.pop()!);
                if (ops.length) ops.pop();
            }
        }
    }
    while (ops.length) out.push(ops.pop()!);
    return out;
}

export function rpnToAst(rpn: (Token | { type: 'op'; value: string })[]): ASTNode | null {
    const stack: ASTNode[] = [];
    for (const t of rpn) {
        if ((t as Token).type === 'number') { stack.push({ type: 'number', value: (t as any).value }); continue; }
        if ((t as Token).type === 'ident') { stack.push({ type: 'ident', name: (t as any).value }); continue; }
        const op = (t as any).value;
        if (op === 'u+' || op === 'u-') {
            const arg = stack.pop(); if (!arg) return null;
            stack.push({ type: 'unary', op, arg }); continue;
        }
        const right = stack.pop(); const left = stack.pop(); if (!left || !right) return null;
        stack.push({ type: 'binary', op, left, right });
    }
    return stack.length === 1 ? stack[0] : null;
}

// AST utilities
export function containsBinaryOp(ast: ASTNode | null, op: string): boolean {
    if (!ast) return false;
    if (ast.type === 'binary') {
        if (ast.op === op) return true;
        return containsBinaryOp(ast.left, op) || containsBinaryOp(ast.right, op);
    }
    if (ast.type === 'unary') return containsBinaryOp(ast.arg, op);
    return false;
}
export function flattenMultiplication(ast: ASTNode | null): ASTNode[] {
    if (!ast) return [];
    if (ast.type === 'binary' && ast.op === '*') return [...flattenMultiplication(ast.left), ...flattenMultiplication(ast.right)];
    return [ast];
}
export function evaluateIfNumeric(ast: ASTNode | null): number | null {
    if (!ast) return null;
    switch (ast.type) {
        case 'number': return ast.value;
        case 'ident': return null;
        case 'unary': {
            const v = evaluateIfNumeric(ast.arg); if (v === null) return null;
            return ast.op === 'u-' ? -v : v;
        }
        case 'binary': {
            const L = evaluateIfNumeric(ast.left); const R = evaluateIfNumeric(ast.right);
            if (L === null || R === null) return null;
            switch (ast.op) {
                case '+': return L + R;
                case '-': return L - R;
                case '*': return L * R;
                case '/': return R === 0 ? NaN : L / R;
                case '^': return Math.pow(L, R);
                default: return null;
            }
        }
    }
}

// -----------------------------
// detectors
// -----------------------------

export function isAddInput(raw: string): boolean {
    const tokens = tokenize(raw);
    const ast = rpnToAst(toRPN(tokens));
    if (containsBinaryOp(ast, '+')) return true;
    const val = evaluateIfNumeric(ast);
    if (val !== null && Number.isFinite(val) && Number.isInteger(val)) return (val % 2 === 0); // preserve original evenness behavior for pure numbers
    return false;
}

export function isSubInput(raw: string): boolean {
    const tokens = tokenize(raw);
    const ast = rpnToAst(toRPN(tokens));
    if (containsBinaryOp(ast, '-')) return true;
    const val = evaluateIfNumeric(ast);
    if (val !== null && Number.isFinite(val)) return (val < 0);
    return false;
}

export function isExpInput(raw: string): boolean {
    const tokens = tokenize(raw);
    const ast = rpnToAst(toRPN(tokens));
    if (!ast) return false;
    if (containsBinaryOp(ast, '^')) return true;
    // repeated identical multiplicative factor check (3*3*3 or x*x*x)
    if (ast.type === 'binary' && ast.op === '*') {
        const factors = flattenMultiplication(ast);
        if (factors.length >= 2) {
            const repr = (node: ASTNode) => {
                if (node.type === 'number') return `#${node.value}`;
                if (node.type === 'ident') return `@${node.name}`;
                return JSON.stringify(node);
            }
            const map = new Map<string, number>();
            for (const f of factors) {
                const key = repr(f); map.set(key, (map.get(key) ?? 0) + 1);
            }
            for (const v of map.values()) if (v >= 2) return true;
        }
    }
    // fallback: if fully numeric, keep original integer-power check
    const val = evaluateIfNumeric(ast);
    if (val !== null && Number.isFinite(val) && Number.isInteger(val)) {
        const x = val;
        if (x < 1) return false;
        if (x === 1) return true;
        const limit = Math.floor(Math.sqrt(x));
        for (let base = 2; base <= limit; base++) {
            let v = x;
            while (v % base === 0) {
                v = v / base;
                if (v === 1) return true;
            }
        }
    }
    return false;
}

export function isVariable(s: string): boolean {
    const t = s.trim(); if (!t) return false;
    if (!Number.isNaN(Number(t))) return false;
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(t);
}


/** Walk AST and return counts of numeric & identifier occurrences. */
function countNumAndId(ast: ASTNode | null) {
    let numCount = 0;
    let idCount = 0;

    function walk(node: ASTNode | null) {
        if (!node) return;
        if (node.type === 'number') { numCount++; return; }
        if (node.type === 'ident') { idCount++; return; }
        if (node.type === 'unary') { walk(node.arg); return; }
        if (node.type === 'binary') { walk(node.left); walk(node.right); return; }
    }

    walk(ast);
    return { numCount, idCount };
}

/** AST-aware Var+Num detector */
export function isVarAndisNum(s: string): boolean {
    const trimmed = s.trim();
    if (!trimmed) return false;

    // build AST using your existing helpers
    const tokens = tokenize(trimmed);
    const rpn = toRPN(tokens);
    const ast = rpnToAst(rpn);
    if (!ast) return false;

    // count occurrences anywhere in AST
    const { numCount, idCount } = countNumAndId(ast);
    return numCount > 0 && idCount > 0;
}



// Pattern map: each function takes raw string
export const Pattern = {
    Add1: isAddInput,
    Sub1: isSubInput,
    Exp1: isExpInput,
    Var1: isVariable,
    VarNum: isVarAndisNum,
} as const;

export type PatternKey = keyof typeof Pattern;
export type PatternFn = (typeof Pattern)[PatternKey];
export type PatternReturn = ReturnType<(typeof Pattern)[PatternKey]>;