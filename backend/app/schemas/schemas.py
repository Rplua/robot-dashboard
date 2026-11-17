from pydantic import BaseModel, SecretStr


class ControllerConnectionRequest(BaseModel):
    base_url: str
    username: str
    password: SecretStr

class RapidVariableResponse(BaseModel):
    value: str


class RapidProgramPointerResponse(BaseModel):
    module: str
    routine: str
    position: str


class ControllerIdentityResponse(BaseModel):
    name: str
    type: str


class RapidExecutionResponse(BaseModel):
    state: str

class RapidVariableWriteRequest(BaseModel):
    value: str


class WriteAccessStatusResponse(BaseModel):
    held: bool
    holder_id: str | None = None
    holder_name: str | None = None


class RapidProgramPointerRequest(BaseModel):
    module: str
    routine: str
