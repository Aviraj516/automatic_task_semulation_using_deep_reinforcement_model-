import sys
from pathlib import Path

# Add project root to sys.path so running python tests/test_single_ppo_decision.py resolves imports
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sb3_contrib import MaskablePPO
from environment.edge_scheduling_env import EdgeSchedulingEnv


def main():
    # 4. Load the trained model
    model_path = Path("models/ppo_edge_scheduler_selected.zip")
    if not model_path.exists():
        model_path = PROJECT_ROOT / "models" / "ppo_edge_scheduler_selected.zip"
    model = MaskablePPO.load(str(model_path), device="cpu")

    # 5. Create the environment
    env = EdgeSchedulingEnv.from_config_files()

    # 6. Reset the environment
    obs, info = env.reset(
        seed=42,
        options={
            "workload_type": "normal",
            "network_scenario": "normal",
        },
    )

    # 7. Get the action mask
    action_mask = env.action_masks()

    # 8. Print observation shape and action mask
    print(f"Observation shape: {obs.shape}")
    print(f"Action mask: {action_mask}")

    # 9. Predict using the trained MaskablePPO model
    action, _ = model.predict(
        obs,
        action_masks=action_mask,
        deterministic=True,
    )

    # 10. Convert action to int
    action_idx = int(action)

    # 11. Get the selected server
    selected_server_id = env.server_ids[action_idx]

    # 12. Print Action Index, Selected Server ID, Current Task ID if available
    current_task_id = getattr(env._task, "task_id", None)
    print(f"Action Index: {action_idx}")
    print(f"Selected Server ID: {selected_server_id}")
    print(f"Current Task ID: {current_task_id}")

    # 13. Execute one step
    next_obs, reward, terminated, truncated, step_info = env.step(action_idx)

    # 14. Print Accepted, Reward, Server Assigned, Task ID
    print(f"Accepted: {step_info.get('accepted')}")
    print(f"Reward: {reward}")
    print(f"Server Assigned: {step_info.get('server_id')}")
    print(f"Task ID: {step_info.get('task_id')}")


if __name__ == "__main__":
    main()
