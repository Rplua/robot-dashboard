# Robot Dashboard

A dashboard for an ABB RobotWare 8 virtual controller in RobotStudio.

| Directory | Purpose |
| --- | --- |
| `backend/` | FastAPI application that will use the [ABB RobotWare 8 driver](https://github.com/Rplua/Driver-RWS.8) to communicate with the controller. |
| `frontend/` | React application that will display controller state and send commands through FastAPI. |

## First demo

The dashboard will connect to one virtual controller and show its RAPID
execution state, program pointer and test counter. The demo will start a RAPID
test routine, stop it, display where it stopped, and resume it. The backend
will keep controller credentials on the server and forward counter changes
to the browser.

This repository currently contains the initial directory structure.
