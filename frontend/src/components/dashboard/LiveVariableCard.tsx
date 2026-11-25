import type { FormEvent } from 'react'

interface LiveVariableCardProps {
    title: string
    dataUrl: string
    rapidValue: string | null
    newValue: string
    liveStatus: string
    onValueChange: (value: string) => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
    isWriting: boolean
    disabled: boolean
    error: string
    status: string
}

export default function LiveVariableCard({
    title,
    dataUrl,
    rapidValue,
    newValue,
    liveStatus,
    onValueChange,
    onSubmit,
    isWriting,
    disabled,
    error,
    status,
}: LiveVariableCardProps) {
    return (
        <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
                <span role="status" className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">{liveStatus}</span>
            </div>
            <p className="mt-3 break-all font-mono text-xs text-zinc-500">{dataUrl}</p>
            <p aria-live="polite" className="mt-2 break-all font-mono text-4xl font-semibold text-zinc-950">{rapidValue ?? 'Loading…'}</p>
            <form onSubmit={onSubmit} className="mt-5">
                <label htmlFor="variable-value" className="block text-sm font-medium text-zinc-700">New RAPID value</label>
                <div className="mt-2 flex flex-wrap gap-2">
                    <input
                        id="variable-value"
                        required
                        value={newValue}
                        onChange={(event) => onValueChange(event.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
                    />
                    <button
                        type="submit"
                        disabled={disabled}
                        className="cursor-pointer rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-95 disabled:cursor-wait disabled:opacity-50"
                    >
                        {isWriting ? 'Writing…' : 'Write'}
                    </button>
                </div>
            </form>
            {error && <p role="alert" className="mt-3 text-sm text-zinc-700">{error}</p>}
            {status && <p role="status" className="mt-3 text-sm text-zinc-700">{status}</p>}
        </section>
    )
}
