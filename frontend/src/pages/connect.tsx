import { useState } from 'react'
import type { FormEvent } from 'react'
import {useNavigate} from 'react-router'
import { connectController } from '../api/controller/controller'
import type { ControllerConnectionRequest } from '../api/controller/controller.types'

export default function Connect() {
    const [error, setError] = useState('')
    const [isConnecting, setIsConnecting] = useState(false)
    const [controllerName, setControllerName] = useState('')
    const navigate = useNavigate();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setControllerName('')

        const form = event.currentTarget
        const formData = new FormData(form)
        const baseUrl = formData.get('base_url')
        const username = formData.get('username')
        const password = formData.get('password')

        if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
            setError('Please enter the controller URL')
            return
        }
        if (typeof username !== 'string' || !username.trim()) {
            setError('Please enter the username')
            return
        }
        if (typeof password !== 'string' || !password) {
            setError('Please enter the password')
            return
        }

        const data: ControllerConnectionRequest = {
            base_url: baseUrl.trim(),
            username: username.trim(),
            password,
        }

        setIsConnecting(true)
        try {
            await connectController(data)
            navigate("/dashboard")
            form.reset()
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Connection failed')
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4">
            <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <h1 className="text-xl font-semibold text-zinc-100">Connect to controller</h1>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-200" htmlFor="controller-url">Controller URL</label>
                        <input type="url" name="base_url" required placeholder="https://<robot-ip>:port" id="controller-url" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300" />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-200" htmlFor="controller-user">Username</label>
                        <input type="text" name="username" required placeholder="admin" id="controller-user" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-200" htmlFor="controller-password">Password</label>
                        <input type="password" name="password" required id="controller-password" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300" />
                    </div>

                    {error && <p role="alert" className="text-sm text-zinc-200">{error}</p>}
                    <button type="submit" disabled={isConnecting} className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60">
                        {isConnecting ? 'Connecting…' : 'Connect'}
                    </button>
                    {controllerName && (
                        <p role="status" className="text-sm text-zinc-200">Connected to {controllerName}</p>
                    )}
                </form>
            </div>
        </div>
    )
}
