from getpass import getpass

from abb_rws_8.rws_client import RWSClient

robot = RWSClient(
    base_url=input("Controller HTTPS URL: "),
    username=input("Controller username: "),
    password=getpass("Controller password: "),
    verify=False
)

try:
    name, controller_type = robot.controller.get_identity()
    print(name, controller_type)
finally:
    try:
        robot.logout()
    finally:
        robot.close()
