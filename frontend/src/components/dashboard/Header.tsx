import type {ControllerIdentityResponse} from '../../api/controller/controller.types'


interface HeaderProps {
    title: string
    identity: ControllerIdentityResponse | null
    onDisconnect: () => void
}

export default function Header({title, identity,  onDisconnect}: HeaderProps){
    return(
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
                    <h1 className="text-center text-xl font-semibold text-zinc-950">{title}</h1>
                    <button
                        type="button"
                        onClick={onDisconnect}
                        className="cursor-pointer transition duration-150 active:scale-95 disabled:cursor-wait disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 justify-self-end rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200"
                    >
                        Disconnect
                    </button>
                </div>
            </header>
    )
}