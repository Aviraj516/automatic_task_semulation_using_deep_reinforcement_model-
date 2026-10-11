import sys
from pathlib import Path

# Add project root to sys.path so environment imports resolve cleanly
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sb3_contrib import MaskablePPO

from environment.edge_scheduling_env import EdgeSchedulingEnv
from environment.task_generator import Task, SLACK_RANGES

# 1. Initialize FastAPI application
app = FastAPI(title="Edge DRL Scheduler API")

# 16. Add CORS middleware for React Vite frontend on localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load the trained MaskablePPO model on CPU
model_path = PROJECT_ROOT / "models" / "ppo_edge_scheduler_selected.zip"
if not model_path.exists():
    model_path = PROJECT_ROOT / "models" / "ppo_checkpoints" / "focused_s3" / "best_model.zip"

model = MaskablePPO.load(str(model_path), device="cpu")

# 3. Create persistent environment
env = EdgeSchedulingEnv.from_config_files()


def _interactive_advance_to_next_decision(at_least_once: bool = True) -> bool:
    """
    In an interactive API session, advance simulation time by 1 tick (10.0 ms)
    per scheduling decision so in-flight network transfers advance, servers execute
    work, and completed/failed tasks resolve naturally.
    """
    env.sim.advance_time()
    env._ticks += 1
    return False


def _init_env():
    """Reset the environment for interactive external task injection."""
    obs, info = env.reset(
        seed=42,
        options={
            "workload_type": "normal",
            "network_scenario": "normal",
        },
    )
    # Clear synthetic background tasks so only API-submitted tasks populate the queue
    env.sim.tasks.clear()
    env.sim.pending_queue.clear()
    env._task = None
    env._advance_to_next_decision = _interactive_advance_to_next_decision


# 4. Reset the environment once when the API starts
_init_env()

# Global task ID generator counter
_task_counter = 1000


# 5. Pydantic request model
class TaskScheduleRequest(BaseModel):
    cpu_requirement: float
    ram_requirement: float
    data_size_mb: float
    execution_time_ms: float
    priority: str


# 15. Health endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": True,
    }


# 6. Scheduling endpoint
@app.post("/api/schedule")
def schedule_task(request: TaskScheduleRequest):
    global _task_counter
    _task_counter += 1
    task_id = _task_counter

    # Auto-recover if the environment ever flagged _needs_reset
    if env._needs_reset:
        _init_env()

    # 7. Construct Task object using project's existing priority/slack convention
    arrival_time_ms = float(env.sim.current_time_ms)
    prio = request.priority.lower()

    # Use midpoint of SLACK_RANGES for the requested priority (defaults to medium if unknown)
    slack_min, slack_max = SLACK_RANGES.get(prio, SLACK_RANGES["medium"])
    slack_factor = (slack_min + slack_max) / 2.0
    deadline_ms = arrival_time_ms + request.execution_time_ms * slack_factor

    task = Task(
        task_id=task_id,
        user_id=0,
        cpu_requirement=request.cpu_requirement,
        ram_requirement=request.ram_requirement,
        data_size_mb=request.data_size_mb,
        execution_time_ms=request.execution_time_ms,
        deadline_ms=deadline_ms,
        priority=prio,
        arrival_time_ms=arrival_time_ms,
    )

    # 8. Inject the task into the environment structures
    env.sim.task_lookup[task.task_id] = task
    env.sim.pending_queue.append(task)
    env._task = task
    env._mask, env._mask_level = env.state_builder.action_mask(
        env.sim,
        task,
    )

    # 9. Build observation using existing StateBuilder
    obs_vector = env.state_builder.build(env.sim, task)

    # 10. Get action mask using env.action_masks()
    action_mask = env.action_masks()

    # 11. Run prediction with deterministic=True
    action, _ = model.predict(
        obs_vector,
        action_masks=action_mask,
        deterministic=True,
    )

    # 12. Convert action to int and map to server ID
    action_idx = int(action)
    selected_server_id = int(env.server_ids[action_idx])

    # 13. Execute step in the environment
    next_obs, reward, terminated, truncated, step_info = env.step(action_idx)

    accepted = bool(step_info.get("accepted", False))
    # If accepted, server_assigned is the destination server; if rejected, server_assigned is None
    server_assigned = int(step_info.get("server_id", selected_server_id)) if accepted else None

    # 14. Return response JSON
    return {
        "task_id": task_id,
        "selected_server_id": selected_server_id,
        "action_index": action_idx,
        "action_mask": [bool(m) for m in action_mask],
        "accepted": accepted,
        "reward": float(reward),
        "server_assigned": server_assigned,
    }
