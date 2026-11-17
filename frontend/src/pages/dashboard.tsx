import { getControllerIdentity, disconnectController } from '../api/controller/controller'
import { getRapidExecution, startRapid, setProgramPointer } from '../api/rapid/rapid'
import type { RapidExecutionResponse } from '../api/rapid/rapid.types'
import type { ControllerIdentityResponse } from '../api/controller/controller.types'
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'

export default function Dashboard() {
    const [identity, setIdentity] = useState<ControllerIdentityResponse | null>(null)
    const [executionState, setExecutionState] = useState<RapidExecutionResponse['state'] | null>(null)
    const [error, setError] = useState("")
    const [task, setTask] = useState('')
    const [module, setModule] = useState('')
    const [pointerError, setPointerError] = useState('')
    const [pointerStatus, setPointerStatus] = useState('')
    const [isSettingPointer, setIsSettingPointer] = useState(false)
    const [selectedRoutine, setSelectedRoutine] = useState("UWU")
    const navigate = useNavigate()


    const handleDisconnect = async () => {
        try {
            await disconnectController()
            navigate("/")
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Connection failed')
        }
    }

    const handleStart = async () => {
        try {
            await startRapid()
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Connection failed')
        }
    }

    const handleSetPointer = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setPointerError('')
        setPointerStatus('')
        const taskName = task.trim()
        const moduleName = module.trim()
        if (!taskName || !moduleName) {
            setPointerError('Enter the task and module names')
            return
        }

        setIsSettingPointer(true)
        try {
            await setProgramPointer(taskName, {
                module: moduleName,
                routine: selectedRoutine,
            })
            setPointerStatus(`Pointer set to ${taskName}/${moduleName}/${selectedRoutine}`)
        } catch (error) {
            setPointerError(error instanceof Error ? error.message : 'Could not set program pointer')
        } finally {
            setIsSettingPointer(false)
        }
    }

    useEffect(() => {
        getControllerIdentity()
            .then((identity) => setIdentity(identity))
            .catch((error: unknown) => {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Could not load controller'
                )
            })
    }, [])

    useEffect(() => {
        getRapidExecution()
            .then((response) => setExecutionState(response.state))
            .catch((error: unknown) => {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Could not get controller state'
                )
            })
    }, [])

    if (error) {
        return <p role="alert">{error}</p>
    }
    return (
        <div className="min-h-screen bg-zinc-100">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto grid max-w-5xl items-center gap-3 px-4 py-4 md:grid-cols-3">
                    <div className="text-left text-sm text-zinc-700">
                        {identity ? (
                            <>
                                <p className="font-medium text-zinc-950"> Controller Name: {identity.name}</p>
                                <p>Controller type: {identity.type}</p>
                            </>
                        ) : (
                            <p>Loading controller…</p>
                        )}
                    </div>
                    <h1 className="text-center text-xl font-semibold text-zinc-950">Dashboard</h1>
                    <button
                        type="button"
                        onClick={handleDisconnect}
                        className="justify-self-end rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                    >
                        Disconnect
                    </button>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-8">
                <section className="rounded-xl border border-zinc-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-zinc-950">RAPID</h2>
                        <p
                            role="status"
                            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${executionState === 'running'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-zinc-100 text-zinc-700'
                                }`}
                        >
                            {executionState ?? 'Loading…'}
                        </p>
                    </div>
                    <form onSubmit={handleSetPointer} className="mt-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label htmlFor="task" className="block text-sm font-medium text-zinc-700">Task</label>
                                <input
                                    id="task"
                                    name="task"
                                    required
                                    placeholder="e.g. T_ROB1"
                                    value={task}
                                    onChange={(event) => setTask(event.target.value)}
                                    className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="module" className="block text-sm font-medium text-zinc-700">Module</label>
                                <input
                                    id="module"
                                    name="module"
                                    required
                                    placeholder="e.g. RwsPointerTest"
                                    value={module}
                                    onChange={(event) => setModule(event.target.value)}
                                    className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="routine" className="block text-sm font-medium text-zinc-700">Routine</label>
                                <select
                                    id="routine"
                                    value={selectedRoutine}
                                    onChange={(event) => setSelectedRoutine(event.target.value)}
                                    className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
                                >
                                    <option value="UWU">UWU</option>
                                    <option value="main">main</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSettingPointer}
                            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
                        >
                            {isSettingPointer ? 'Setting pointer…' : 'Set pointer'}
                        </button>
                        {pointerError && <p role="alert" className="text-sm text-zinc-700">{pointerError}</p>}
                        {pointerStatus && <p role="status" className="text-sm text-zinc-700">{pointerStatus}</p>}
                    </form>
                    <div className="mt-4 flex flex-wrap  gap-2">
                        <button type="button" className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white" onClick={handleStart}>
                            Start
                        </button>
                        <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900">
                            Stop
                        </button>
                        <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900">
                            PP to Main
                        </button>
                    </div>
                </section>
            </main>
        </div>
    )
}
