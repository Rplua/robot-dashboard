import type { RapidExecutionResponse, RapidProgramPointerRequest, RapidVariableResponse } from './rapid.types'

export async function getRapidExecution(): Promise<RapidExecutionResponse> {
    const response = await fetch("/controller/rapid/execution")

    if (!response.ok) {
        const error = await response.json().catch(() => null)
        const detail = error?.detail
        throw new Error(
            typeof detail === 'string'
                ? detail
                : `Could not get controller execution state (${response.status})`,
        )
    }

    return response.json()
}

export async function startRapid(): Promise<void> {
    const response = await fetch("/controller/rapid/execution/start", {
        method: 'POST'
    })

    if (!response.ok) {
        const error = await response.json().catch(() => null)
        const detail = error?.detail
        throw new Error(
            typeof detail === 'string'
                ? detail
                : `Could not start  (${response.status})`,
        )
    }
}

export async function setProgramPointer(task: string, data: RapidProgramPointerRequest): Promise<void> {
    const response = await fetch(`/controller/rapid/tasks/${task}/program-pointer`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),

    })

    if (!response.ok) {
        const error = await response.json().catch(() => null)
        const detail = error?.detail
        throw new Error(
            typeof detail === 'string'
                ? detail
                : `Could not move the program pointer (${response.status})`,
        )
    }

}

export async function stopRapid(): Promise<void> {
    const response = await fetch('/controller/rapid/execution/stop', {
        method: 'POST',
    })
    if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(
            typeof error?.detail === 'string'
                ? error.detail
                : `Could not stop RAPID (${response.status})`,
        )
    }
}


export async function resetProgramPointer(): Promise<void> {
    const response = await fetch('/controller/rapid/execution/reset-pointer', {
        method: 'POST',
    })
    if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(
            typeof error?.detail === 'string'
                ? error.detail
                : `Could not reset the program pointer (${response.status})`,
        )
    }
}


export async function readRapidVariable(
    task: string, module: string, variable: string, signal?: AbortSignal,
): Promise<RapidVariableResponse> {
    const path = [task, module, variable].map(encodeURIComponent)
    const response = await fetch(
        `/controller/rapid/tasks/${path[0]}/modules/${path[1]}/variables/${path[2]}`,
        { signal },
    )
    if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(typeof error?.detail === 'string' ? error.detail : 'Could not read RAPID variable')
    }
    return response.json()
}

export async function writeRapidVariable(
    task: string, module: string, variable: string, value: string,
): Promise<void> {
    const path = [task, module, variable].map(encodeURIComponent)
    const response = await fetch(
        `/controller/rapid/tasks/${path[0]}/modules/${path[1]}/variables/${path[2]}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
        },
    )
    if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(typeof error?.detail === 'string' ? error.detail : 'Could not write RAPID variable')
    }
}
