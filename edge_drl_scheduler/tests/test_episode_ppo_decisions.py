import sys
from pathlib import Path

# Add project root to sys.path so running python tests/test_episode_ppo_decisions.py resolves imports
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Ensure stdout supports UTF-8 on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from sb3_contrib import MaskablePPO
from environment.edge_scheduling_env import EdgeSchedulingEnv


def main():
    # 1. Load the trained model
    model_path = Path("models/ppo_edge_scheduler_selected.zip")
    if not model_path.exists():
        model_path = PROJECT_ROOT / "models" / "ppo_edge_scheduler_selected.zip"
    model = MaskablePPO.load(str(model_path), device="cpu")

    # 2. Create the environment
    env = EdgeSchedulingEnv.from_config_files()

    # 3. Reset once
    obs, info = env.reset(
        seed=42,
        options={
            "workload_type": "normal",
            "network_scenario": "normal",
        },
    )

    # 4. Run one continuous episode up to 10 decisions or termination
    server_counts = {1: 0, 2: 0, 3: 0, 4: 0}
    tasks_scheduled = 0
    max_tasks = 10

    while tasks_scheduled < max_tasks:
        if env._task is None:
            break

        task_id = getattr(env._task, "task_id", None)
        action_mask = env.action_masks()

        action, _ = model.predict(
            obs,
            action_masks=action_mask,
            deterministic=True,
        )

        action_idx = int(action)
        selected_server_id = env.server_ids[action_idx]
        server_counts[selected_server_id] += 1
        tasks_scheduled += 1

        obs, reward, terminated, truncated, step_info = env.step(action_idx)

        # Retrieve server metrics
        queue_str = " ".join(f"S{sid}:{env.sim.servers[sid].queue_length()}" for sid in env.server_ids)
        cpu_str = " ".join(f"S{sid}:{env.sim.servers[sid].cpu_utilization() * 100:.1f}%" for sid in env.server_ids)

        print(f"Task {task_id} -> Server {selected_server_id} | Reward {reward:.2f} | Queue {queue_str}")
        print(f"  CPU Utilization: {cpu_str}")
        print(f"  Queue length:    {queue_str}")

        if terminated or truncated:
            break

    print("\nServer selection summary:")
    print(f"Server 1: {server_counts.get(1, 0)}")
    print(f"Server 2: {server_counts.get(2, 0)}")
    print(f"Server 3: {server_counts.get(3, 0)}")
    print(f"Server 4: {server_counts.get(4, 0)}")

    print(f"\nTotal scheduled tasks: {tasks_scheduled}")


if __name__ == "__main__":
    main()
