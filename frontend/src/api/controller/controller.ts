
import type {
    ControllerConnectionRequest,
    ControllerIdentityResponse,
} from './controller.types'

export async function connectController(
    data: ControllerConnectionRequest,
): Promise<ControllerIdentityResponse> {
    const response = await fetch('/controller/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json().catch(() => null)
        const detail = error?.detail
        throw new Error(
            typeof detail === 'string'
                ? detail
                : `Connection failed (${response.status})`,
        )
    }

    return response.json()
}

export async function getControllerIdentity(): Promise<ControllerIdentityResponse> {
    const response = await fetch('/controller/identity')

    if (!response.ok) {
        const error = await response.json().catch(() => null)
        const detail = error?.detail
        throw new Error(
            typeof detail === 'string'
                ? detail
                : `Could not get controller identity  (${response.status})`,
        )
    }

    return response.json()

}

export async function disconnectController(): Promise<void> {
    const response = await fetch('/controller/disconnect', {
        method: 'POST'

    })

    if (!response.ok) {
        const error = await response.json().catch(() => null)
        const detail = error?.detail
        throw new Error(
            typeof detail === 'string'
                ? detail
                : `Failed to disconnet Controller (${response.status})`,
        )
    }
}