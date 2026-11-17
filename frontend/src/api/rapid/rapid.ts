import type { RapidExecutionResponse, RapidProgramPointerRequest } from './rapid.types'

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