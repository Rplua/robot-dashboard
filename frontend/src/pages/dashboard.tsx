import { getControllerIdentity, disconnectController } from '../api/controller/controller'
import { readRapidVariable, writeRapidVariable, getRapidExecution, startRapid, stopRapid, resetProgramPointer, setProgramPointer } from '../api/rapid/rapid'
import type { RapidExecutionResponse } from '../api/rapid/rapid.types'
import type { ControllerIdentityResponse } from '../api/controller/controller.types'
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import Header from '../components/dashboard/Header'
import LiveVariableCard from '../components/dashboard/LiveVariableCard'

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
    const [pendingCommand, setPendingCommand] = useState<string | null>(null)
    const [commandError, setCommandError] = useState('')
    const [commandStatus, setCommandStatus] = useState('')
    const [variableValue, setVariableValue] = useState<string | null>(null)
    const [newValue, setNewValue] = useState('')
    const [variableError, setVariableError] = useState('')
    const [variableStatus, setVariableStatus] = useState('')
    const [isWriting, setIsWriting] = useState(false)
    const [liveStatus, setLiveStatus] = useState('Connecting…')
    const navigate = useNavigate()


    const handleWriteVariable = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setVariableError('')
        setVariableStatus('')
        setIsWriting(true)
        try {
            await writeRapidVariable('T_ROB1', 'CoordinationData', 'test_value', newValue)
            const result = await readRapidVariable('T_ROB1', 'CoordinationData', 'test_value')
            setVariableValue(result.value)
            setVariableStatus(`Value read back: ${result.value}`)
        } catch (error) {
            setVariableError(error instanceof Error ? error.message : 'Variable write failed')
        } finally {
            setIsWriting(false)
        }
    }

    useEffect(() => {
        if (!variableStatus) return
        const timer = setTimeout(() => setVariableStatus(''), 2000)
        return () => clearTimeout(timer)
    }, [variableStatus])

    useEffect(() => {
        let active = true
        let receivedEvent = false
        const controller = new AbortController()
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const socket = new WebSocket(`${protocol}//${window.location.host}/ws/rapid`)

        socket.onopen = () => {
            if (active) setLiveStatus('Connected')
        }
        socket.onmessage = (event) => {
            if (!active) return
            try {
                const message = JSON.parse(event.data)
                if (typeof message.value === 'string') {
                    receivedEvent = true
                    setVariableValue(message.value)
                    setLiveStatus('Receiving updates')
                } else if (typeof message.error === 'string') {
                    setVariableError(message.error)
                    setLiveStatus('Subscription error')
                }
            } catch {
                setVariableError('Invalid subscription message')
            }
        }
        socket.onerror = () => {
            if (active) {
                setLiveStatus('Connection error')
                setVariableError('Could not connect to the live variable subscription')
            }
        }
        socket.onclose = () => {
            if (active) setLiveStatus('Disconnected')
        }
        readRapidVariable('T_ROB1', 'CoordinationData', 'test_value', controller.signal)
            .then((result) => {
                if (active && !receivedEvent) setVariableValue(result.value)
            })
            .catch((error: unknown) => {
                if (active) setVariableError(error instanceof Error ? error.message : 'Variable read failed')
            })

        return () => {
            active = false
            controller.abort()
            socket.close()
        }
    }, [])

    const handleDisconnect = async () => {
        try {
            await disconnectController()
            navigate("/")
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Connection failed')
        }
    }

    const handleCommand = async (command: () => Promise<void>, label: string) => {
        setCommandError('')
        setCommandStatus('')
        setPendingCommand(label)
        try {
            await command()
            setCommandStatus(`${label} accepted by the controller`)
            const response = await getRapidExecution()
            setExecutionState(response.state)
        } catch (error) {
            setCommandError(error instanceof Error ? error.message : 'RAPID command failed')
        } finally {
            setPendingCommand(null)
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
        if (!pointerStatus) return
        const timer = setTimeout(() => setPointerStatus(''), 2000)
        return () => clearTimeout(timer)
    }, [pointerStatus])

    useEffect(() => {
        if (!commandStatus) return
        const timer = setTimeout(() => setCommandStatus(''), 2000)
        return () => clearTimeout(timer)
    }, [commandStatus])

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
        let active = true
        let timer: ReturnType<typeof setTimeout>

        async function refreshExecution() {
            try {
                const response = await getRapidExecution()
                if (active) setExecutionState(response.state)
            } catch (error) {
                if (active) {
                    setCommandError(error instanceof Error ? error.message : 'Could not refresh RAPID state')
                }
            } finally {
                if (active) timer = setTimeout(refreshExecution, 1000)
            }
        }

        void refreshExecution()
        return () => {
            active = false
            clearTimeout(timer)
        }
    }, [])

    if (error) {
        return <p role="alert">{error}</p>
    }
    return (
        <div className="min-h-screen bg-zinc-100">
            <Header
                title="Dashboard"
                identity={identity}
                onDisconnect={handleDisconnect}
            />
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
                            disabled={isSettingPointer || pendingCommand !== null}
                            className="cursor-pointer transition duration-150 active:scale-95 disabled:cursor-wait disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200"
                        >
                            {isSettingPointer ? 'Setting pointer…' : 'Set pointer'}
                        </button>
                        {pointerError && <p role="alert" className="text-sm text-zinc-700">{pointerError}</p>}
                        {pointerStatus && <p role="status" className="text-sm text-zinc-700">{pointerStatus}</p>}
                    </form>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" className="cursor-pointer transition duration-150 active:scale-95 disabled:cursor-wait disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 active:bg-black" onClick={() => void handleCommand(startRapid, 'Start')}
                            disabled={pendingCommand !== null || isSettingPointer}>
                            {pendingCommand === 'Start' ? 'Starting…' : 'Start / Resume'}
                        </button>
                        <button type="button" onClick={() => void handleCommand(stopRapid, 'Stop')}
                            disabled={pendingCommand !== null || isSettingPointer}
                            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 transition duration-150 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 disabled:cursor-wait disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500">
                            {pendingCommand === 'Stop' ? 'Stopping…' : 'Stop'}
                        </button>
                        <button type="button" onClick={() => void handleCommand(resetProgramPointer, 'PP to Main')}
                            disabled={pendingCommand !== null || isSettingPointer}
                            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 transition duration-150 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 disabled:cursor-wait disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500">
                            {pendingCommand === 'PP to Main' ? 'Resetting…' : 'PP to Main'}
                        </button>
                    </div>
                    {commandError && <p role="alert" className="mt-3 text-sm text-zinc-700">{commandError}</p>}
                    {commandStatus && <p role="status" className="mt-3 text-sm text-zinc-700">{commandStatus}</p>}
                </section>
                <LiveVariableCard
                    title="Live variable"
                    dataUrl="T_ROB1 / CoordinationData / test_value"
                    rapidValue={variableValue}
                    newValue={newValue}
                    liveStatus={liveStatus}
                    onValueChange={setNewValue}
                    onSubmit={handleWriteVariable}
                    isWriting={isWriting}
                    disabled={isWriting || pendingCommand !== null || isSettingPointer}
                    error={variableError}
                    status={variableStatus}
                />
            </main>
        </div>
    )
}
