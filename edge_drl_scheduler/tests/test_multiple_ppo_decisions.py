import sys
from pathlib import Path

# Add project root to sys.path so running python tests/test_multiple_ppo_decisions.py resolves imports
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sb3_contrib import MaskablePPO
from environment.edge_scheduling_env import EdgeSchedulingEnv


def main():
    model_path = Path("models/ppo_edge_scheduler_selected.zip")
    if not model_path.exists():
        model_path = PROJECT_ROOT / "models" / "ppo_edge_scheduler_selected.zip"
    model = MaskablePPO.load(str(model_path), device="cpu")

    env = EdgeSchedulingEnv.from_config_files()

    seeds = [42, 43, 44, 45, 46, 47, 48, 49, 50, 51]
    server_counts = {1: 0, 2: 0, 3: 0, 4: 0}

    for seed in seeds:
        obs, info = env.reset(
            seed=seed,
            options={
                "workload_type": "normal",
                "network_scenario": "normal",
            },
        )

        action_mask = env.action_masks()

        action, _ = model.predict(
            obs,
            action_masks=action_mask,
            deterministic=True,
        )

        action_idx = int(action)
        selected_server_id = env.server_ids[action_idx]

        task_id = getattr(env._task, "task_id", None)
        server_counts[selected_server_id] = server_counts.get(selected_server_id, 0) + 1

        print(
            f"Seed: {seed} | Task ID: {task_id} | Action Index: {action_idx} | "
            f"Selected Server ID: {selected_server_id} | Action Mask: {action_mask}"
        )

    print("\nServer selection summary:")
    print(f"Server 1: {server_counts.get(1, 0)}")
    print(f"Server 2: {server_counts.get(2, 0)}")
    print(f"Server 3: {server_counts.get(3, 0)}")
    print(f"Server 4: {server_counts.get(4, 0)}")
    print(f"\nTotal decisions: {len(seeds)}")


if __name__ == "__main__":
    main()
