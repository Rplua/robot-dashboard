# Robot Dashboard

A FastAPI and React dashboard for an ABB RobotWare 8 controller using the
[ABB RWS Python driver](https://github.com/Rplua/Driver-RWS.8).

Tested with a RobotStudio virtual controller. Physical controller validation
is pending.

## Current features

- Connect to a controller using its HTTPS URL, username and password.
- Display controller identity and disconnect the backend session.
- Read RAPID execution state once per second and after execution commands.
- Enter a task and module, choose the demo routine main or UWU, and set its
  program pointer.
- Start or resume one cycle, stop execution, and reset program pointers to main.
- Read and write T_ROB1 / CoordinationData / test_value and read back writes.
- Receive that variable's updates through a WebSocket from ABB through FastAPI.
- Display command errors, subscription connection status and confirmations.
  Successful command confirmations disappear after two seconds.

Routine choices and the live variable are fixed for this demo. Dynamic routine
discovery and subscriptions to multiple variables are planned for a later version.

## Run the backend

Requires Python 3.13 or later and uv. The backend currently installs the driver
from a local checkout through tool.uv.sources in backend/pyproject.toml.
Adjust that path to the directory containing the driver's pyproject.toml.

From the repository root:

```bash
cd backend
uv sync --locked
export ABB_RWS_PIN='<remote-station-pin>'
uv run uvicorn app.main:app --reload
```

The lab defaults to PIN 1234 when ABB_RWS_PIN is unset. The backend currently
uses verify=False for the virtual controller's TLS certificate.

Interactive HTTP documentation is at http://127.0.0.1:8000/docs.
Run one backend worker for the demo. The controller session is shared in memory
and must be reconnected after a backend restart.

## Run the frontend

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite. Its development proxy forwards /controller HTTP
requests and /ws WebSocket connections to the backend on port 8000.
The frontend and backend must both be running.

Enter the controller URL using the format https://<vm-ip>:8001 when using the
Windows port proxy from the Parallels lab. Port 8001 forwards to the virtual
controller's HTTPS listener at 127.0.0.1:80 inside Windows.

## RobotStudio demo

Create PERS num test_value := 0; in the CoordinationData module in T_ROB1.
Load this program module into the same task:

```rapid
MODULE RwsPointerTest
    PROC main()
        WaitTime 1;
    ENDPROC

    PROC UWU()
        WaitTime 8;
        test_value := test_value + 1;
    ENDPROC
ENDMODULE
```

Release RobotStudio's write access before issuing dashboard commands. The
backend registers a remote station, requests write access for each operation,
and releases it afterwards. Start also enables motion control for that station.

1. Connect from the frontend.
2. Enter task T_ROB1 and module RwsPointerTest, select UWU and press Set pointer.
3. Press Start / Resume, observe Running, and press Stop during WaitTime.
4. Press Start / Resume again. The live counter should increase once when the
   routine finishes and the execution indicator should return to Stopped.
5. Enter a value in Live variable and press Write. The card reads back the
   value after writing.
6. Change test_value in RobotStudio to verify WebSocket delivery independently.
7. Disconnect to end the controller session.

The live card performs an initial GET, then consumes JSON events with a value
field over /ws/rapid. Leaving the dashboard closes the browser socket and the
backend closes its ABB subscription connection. If the live connection ends,
reload the dashboard to reconnect it.

## Project organization

| Directory | Responsibility |
| --- | --- |
| backend/app | FastAPI endpoints, controller session, schemas and WebSocket forwarding. |
| frontend/src/api | Typed HTTP functions and response/request types. |
| frontend/src/pages | Connection page and dashboard. |
| frontend/src/components | Planned home for dashboard panels. |
| frontend/src/hooks | Planned home for reusable React state and WebSocket logic. |

## Checks and next phase

```bash
cd frontend
npm run build
npm run lint
```

The next phase is to refactor the dashboard into components and hooks while
preserving the current behavior. The newly integrated live card still needs
end-to-end validation against the virtual controller in the browser.
