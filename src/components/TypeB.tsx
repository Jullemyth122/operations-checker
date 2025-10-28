import React, { useState } from 'react'
import { Pattern, type PatternKey } from '../typesStructure/typeB'

type s = string;
type b = boolean;

const TypeB: React.FC = () => {

    const [input, setInput] = useState<s>('')
    const [selected, setSelected] = useState<PatternKey>('VarNum')
    const [result, setResult] = useState<b | null>(null);

    // const handleTest = () => {

    //     if (selected === 'Var1' || selected === 'VarNum') {
    //         const fn = Pattern[selected] as (v: string) => boolean;
    //         const res = fn(input);
    //         setResult(res);
    //         return;
    //     }


    //     const n = Number(input);
    //     if (Number.isNaN(n)) {
    //         setResult(null);
    //         return;
    //     }
    //     const fn = Pattern[selected];
    //     const res = fn(n);
    //     setResult(res);
    // }
    const handleTest = () => {
        const fn = Pattern[selected] as (v: string) => boolean;
        const res = fn(input);
        setResult(res);
    };



    return (
        <div
            className="min-h-screen flex items-center justify-center bg-slate-50 p-6"
            style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto' }}
        >
            <div className="w-full max-w-md bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-6 text-sm text-slate-800">
                <header className="mb-4">
                    <h3 className="text-sm font-semibold">Pattern tester</h3>
                    <p className="text-xs text-slate-500">Enter a number (e.g. <span className="font-mono">8</span> or <span className="font-mono">1e3</span>) and choose a check.</p>
                </header>

                <label htmlFor="pattern-input" className="block text-xs text-slate-700 mb-3">
                    <span className="block mb-1">Number</span>
                    <input
                        id="pattern-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g. 8 or 1e3"
                        className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder-slate-400 bg-white text-sm"
                    />
                </label>

                <label htmlFor="pattern-select" className="block text-xs text-slate-700 mb-4">
                    <span className="block mb-1">Check type</span>
                    <select
                        id="pattern-select"
                        value={selected}
                        onChange={(e) => setSelected(e.target.value as PatternKey)}
                        className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm"
                    >
                        {(Object.keys(Pattern) as PatternKey[]).map((k) => (
                            <option key={k} value={k}>
                                {k}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={handleTest}
                        disabled={input.trim() === ''}
                        className="flex-1 text-xs font-medium py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Test
                    </button>

                    <button
                        onClick={() => {
                            setInput('')
                            setResult(null)
                        }}
                        className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white"
                    >
                        Clear
                    </button>
                </div>

                <div className="rounded-md p-3 bg-slate-50 border border-slate-100">
                    {result === null ? (
                        <p className="text-xs text-slate-500">Enter a valid number and press Test.</p>
                    ) : result ? (
                        <p className="text-xs text-green-700 font-medium">Result: <span className="font-semibold">true</span> ✅</p>
                    ) : (
                        <p className="text-xs text-red-600 font-medium">Result: <span className="font-semibold">false</span> ❌</p>
                    )}
                </div>

            </div>
        </div>
    );

}

export default TypeB