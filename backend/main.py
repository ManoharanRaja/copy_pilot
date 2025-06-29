from fastapi import FastAPI
from backend.app.api.jobs import router as jobs_router
from backend.app.api.runner import router as runner_router
from backend.app.api.datasources import router as datasources_router
from backend.app.api.global_variables import router as global_vars_router
from backend.app.api.local_variables import router as local_vars_router
from backend.app.api.scheduler import router as schedules_router
from backend.app.services.scheduler_runner import start_scheduler
from backend.app.services.global_variable_refresher import start_global_variable_refresher

app = FastAPI()
# Initialize the app with the router
app.include_router(jobs_router)
app.include_router(runner_router)
app.include_router(datasources_router)
app.include_router(global_vars_router)
app.include_router(local_vars_router)
app.include_router(schedules_router)

start_scheduler()
start_global_variable_refresher()


