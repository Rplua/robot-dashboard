from asyncio import CancelledError, create_task
from contextlib import contextmanager, suppress
from os import environ
from threading import Lock
from uuid import uuid4
from xml.etree import ElementTree as ET

import httpx

from anyio import CancelScope
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from websockets.exceptions import WebSocketException

from abb_rws_8.exceptions import RWS8Exception, RWSHTTPError, RWSTimeoutError
from abb_rws_8.rws_client import RWSClient
from app.schemas.schemas import (
    ControllerConnectionRequest,
    ControllerIdentityResponse,
    RapidExecutionResponse,
    RapidProgramPointerRequest,
    RapidProgramPointerResponse,
    RapidVariableResponse,
    RapidVariableWriteRequest,
    WriteAccessStatusResponse,
)

app = FastAPI()
app.state.robot = None
write_lock = Lock()

@app.exception_handler(RWS8Exception)
async def handle_rws_error(request: Request, error: RWS8Exception) -> JSONResponse:
    status = 502
    if isinstance(error, RWSHTTPError) and error.status_code in {400, 401, 403, 404, 409}:
        status = error.status_code
    elif isinstance(error, RWSTimeoutError):
        status = 504
    content = {"detail": str(error)}
    cause = error.__cause__
    if isinstance(error, RWSHTTPError) and isinstance(cause, httpx.HTTPStatusError):
        try:
            root = ET.fromstring(cause.response.content)
        except ET.ParseError:
            pass
        else:
            fields = {}
            for element in root.iter():
                if element.get("class") in {"code", "msg"}:
                    fields[element.get("class")] = "".join(element.itertext()).strip()

            code = fields.get("code")
            message = fields.get("msg")
            if code:
                content["controller_code"] = code
            if message:
                content["controller_message"] = message
                content["detail"] = f"{error}: {message}"

    return JSONResponse(status_code=status, content=content)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/controller/connect")
def controller_connect(request: ControllerConnectionRequest) -> ControllerIdentityResponse:
    with write_lock:
        if app.state.robot is not None:
            raise HTTPException(
                status_code=409,
                detail="Disconnect from the current controller first",
            )

        robot = RWSClient(
            base_url=request.base_url,
            username=request.username,
            password=request.password.get_secret_value(),
            verify=False
        )
        try:
            name, controller_type = robot.controller.get_identity()
            robot.control_station.register_remote(
                name="Robot Dashboard",
                station_id=f"{{{uuid4()}}}",
                pincode=environ.get("ABB_RWS_PIN", "1234"),
            )
        except Exception:
            robot.close()
            raise

        app.state.robot = robot
        return ControllerIdentityResponse(name=name, type=controller_type)


@app.post("/controller/disconnect", status_code=204)
def controller_disconnect() -> None:
    with write_lock:
        robot = app.state.robot
        if robot is None:
            return

        app.state.robot = None
        try:
            robot.logout()
        finally:
            robot.close()


@app.get("/controller/identity")
def controller_identity() -> ControllerIdentityResponse:
    robot = app.state.robot
    if robot is None:
        raise HTTPException(status_code=409, detail="Connect to a controller first")

    name, controller_type = robot.controller.get_identity()
    return ControllerIdentityResponse(name=name, type=controller_type)

@app.get("/controller/write-access")
def controller_write_access() -> WriteAccessStatusResponse:
    robot = app.state.robot
    if robot is None:
        raise HTTPException(status_code=409, detail="Connect to a controller first")

    holder = robot.control_station.get_write_access_holder()
    if holder is None:
        return WriteAccessStatusResponse(held=False)

    holder_id, holder_name = holder
    return WriteAccessStatusResponse(
        held=True,
        holder_id=holder_id,
        holder_name=holder_name,
    )


@app.get("/controller/rapid/execution")
def rapid_execution() -> RapidExecutionResponse:
    robot = app.state.robot
    if robot is None:
        raise HTTPException(status_code=409, detail="Connect to a controller first")

    state = robot.rapid.get_execution_state()
    return RapidExecutionResponse(state=state)

@app.get("/controller/rapid/tasks/{task}/program-pointer")
def rapid_program_pointer(task: str) -> RapidProgramPointerResponse:
    robot = app.state.robot
    if robot is None:
        raise HTTPException(status_code=409, detail="Connect to a controller first")

    module, routine, position = robot.rapid.get_program_pointer(task)
    return RapidProgramPointerResponse(
        module=module,
        routine=routine,
        position=position,
    )

@app.get("/controller/rapid/tasks/{task}/modules/{module}/variables/{variable}")
def rapid_read_variable(task: str, module: str, variable: str) -> RapidVariableResponse:
    robot = app.state.robot
    if robot is None:
        raise HTTPException(status_code=409, detail="Connect to a controller first")

    value = robot.rapid.read_variable(task, module, variable)
    return RapidVariableResponse(value=value)

@contextmanager
def rapid_write_access():
    with write_lock:
        robot = app.state.robot
        if robot is None:
            raise HTTPException(status_code=409, detail="Connect to a controller first")

        station = robot.control_station
        station.request_write_access()
        try:
            yield robot
        finally:
            station.release_write_access()


@app.put("/controller/rapid/tasks/{task}/modules/{module}/variables/{variable}", status_code=204)
def rapid_write_variable(
    task: str,
    module: str,
    variable: str,
    request: RapidVariableWriteRequest,
) -> None:
    with rapid_write_access() as robot:
        robot.rapid.write_variable(task, module, variable, request.value)


@app.put("/controller/rapid/tasks/{task}/program-pointer", status_code=204)
def rapid_set_program_pointer(task: str, request: RapidProgramPointerRequest) -> None:
    with rapid_write_access() as robot:
        robot.rapid.set_program_pointer(task, request.module, request.routine)


@app.post("/controller/rapid/execution/reset-pointer", status_code=204)
def rapid_reset_program_pointer() -> None:
    with rapid_write_access() as robot:
        robot.rapid.reset_program_pointer()


@app.post("/controller/rapid/execution/start", status_code=204)
def rapid_start() -> None:
    with rapid_write_access() as robot:
        robot.control_station.allow_motion_control(True)
        robot.rapid.start()


@app.post("/controller/rapid/execution/stop", status_code=204)
def rapid_stop() -> None:
    with rapid_write_access() as robot:
        robot.rapid.stop()


async def wait_for_browser_disconnect(websocket: WebSocket) -> None:
    async for _ in websocket.iter_text():
        pass


@app.websocket("/ws/rapid")
async def rapid_websocket(websocket: WebSocket) -> None:
    await websocket.accept()

    robot = app.state.robot
    if robot is None:
        await websocket.send_json({"error": "Connect to a controller first"})
        await websocket.close()
        return

    browser_disconnected = create_task(wait_for_browser_disconnect(websocket))
    abb_socket = None
    try:
        abb_socket = await run_in_threadpool(
            robot.subscription.subscribe_variable,
            "T_ROB1",
            "CoordinationData",
            "test_value",
        )
        while not browser_disconnected.done() and app.state.robot is robot:
            try:
                event = await run_in_threadpool(abb_socket.recv, timeout=1)
            except TimeoutError:
                continue

            if browser_disconnected.done() or app.state.robot is not robot:
                break

            try:
                root = ET.fromstring(event)
            except ET.ParseError:
                continue

            value = root.find(".//{http://www.w3.org/1999/xhtml}span[@class='value']")
            if value is not None:
                await websocket.send_json({"value": value.text})
    except (RWS8Exception, WebSocketException, OSError):
        if not browser_disconnected.done():
            with suppress(WebSocketDisconnect):
                await websocket.send_json({"error": "RAPID subscription ended"})
    except WebSocketDisconnect:
        pass
    finally:
        try:
            if abb_socket is not None:
                with CancelScope(shield=True):
                    await run_in_threadpool(abb_socket.close)
        finally:
            if not browser_disconnected.done():
                browser_disconnected.cancel()
                with suppress(CancelledError):
                    await browser_disconnected
                with suppress(WebSocketDisconnect):
                    await websocket.close()
