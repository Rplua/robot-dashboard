from fastapi import FastAPI, HTTPException
from app.schemas.schemas import (
    ControllerConnectionRequest,
    ControllerIdentityResponse,
    RapidExecutionResponse,
    RapidProgramPointerResponse,
    RapidVariableResponse,
)
from abb_rws_8.rws_client import RWSClient
app = FastAPI()
app.state.robot = None

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/controller/connect")
def controller_connect(request: ControllerConnectionRequest) -> ControllerIdentityResponse:
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
    except Exception:
        robot.close()
        raise

    app.state.robot = robot
    return ControllerIdentityResponse(name=name, type=controller_type)


@app.post("/controller/disconnect", status_code=204)
def controller_disconnect() -> None:
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
