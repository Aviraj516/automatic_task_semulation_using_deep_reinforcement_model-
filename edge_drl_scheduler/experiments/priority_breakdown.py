"""
experiments/priority_breakdown.py

Finishes the Phase 7 explanation-summary gap: "which server each priority
class goes to". Reuses the same policy-rollout logic as explain_policy.py but
groups action shares by TASK PRIORITY (high/medium/low) instead of only by
condition, and also cross-tabulates priority x condition so you can see
whether the policy treats priority differently under light vs heavy load.

    python -m experiments.priority_breakdown --model models/ppo_edge_scheduler_selected
    python -m experiments.priority_breakdown --model models/ppo_checkpoints/bc_s1/best_model --out results/priority_bc_s1

Caveats (same as explain_policy.py): only states the POLICY actually visits
are analysed, so an under-represented priority in a condition means few
decisions back that row's percentages.
"""
import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sb3_contrib import MaskablePPO

from environment.edge_scheduling_env import EdgeSchedulingEnv
from training.train_ppo import training_conditions

ROOT = Path(__file__).resolve().parents[1]
PRIORITY_COLS = ["task_prio_high", "task_prio_medium", "task_prio_low"]

ap = argparse.ArgumentParser()
ap.add_argument("--model", default=str(ROOT / "models" / "ppo_edge_scheduler_selected"))
ap.add_argument("--episodes-per-condition", type=int, default=3)
ap.add_argument("--seed-base", type=int, default=70_000)
ap.add_argument("--out", default=str(ROOT / "results" / "priority_breakdown"))
args = ap.parse_args()
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)

env = EdgeSchedulingEnv.from_config_files()
zip_path = args.model if args.model.endswith(".zip") else args.model + ".zip"
model = MaskablePPO.load(zip_path, device="cpu")
workloads, networks = training_conditions(env)
server_ids = list(env.server_ids)
names = list(env.feature_names)
prio_idx = {p: names.index(p) for p in PRIORITY_COLS if p in names}
if len(prio_idx) != 3:
    raise SystemExit(f"Expected {PRIORITY_COLS} in feature_names, found {list(prio_idx)}")

# ---------------- collect decision states, same protocol as explain_policy.py ----------------
O, A, W, C = [], [], [], []
for w in workloads:
    for n in networks:
        for i in range(args.episodes_per_condition):
            seed = args.seed_base + i
            obs, _ = env.reset(seed=seed, options={"workload_type": w, "network_scenario": n, "task_seed": seed})
            done = False
            while not done:
                mask = env.action_masks()
                a, _ = model.predict(obs, action_masks=mask, deterministic=True)
                a = int(np.asarray(a).reshape(-1)[0])
                O.append(obs.copy()); A.append(a); W.append(w); C.append(f"{w}_{n}")
                obs, _, term, trunc, _ = env.step(a)
                done = term or trunc
O = np.array(O); A = np.array(A); C = np.array(C)
print(f"Collected {len(O)} decision states from {len(set(C))} conditions.")

priority = np.array(["high" if O[i, prio_idx["task_prio_high"]] == 1
                      else "medium" if O[i, prio_idx["task_prio_medium"]] == 1
                      else "low" for i in range(len(O))])

# ---------------- 1. server share by priority, all conditions pooled ----------------
df = pd.DataFrame({"priority": priority, "server": [server_ids[a] for a in A], "condition": C})
by_priority = (pd.crosstab(df["priority"], df["server"], normalize="index")
               .reindex(index=["high", "medium", "low"], columns=server_ids, fill_value=0.0) * 100)
by_priority["n_decisions"] = df.groupby("priority").size().reindex(by_priority.index)
by_priority.round(1).to_csv(out / "server_share_by_priority.csv")
print("\n=== % of decisions sent to each server, by priority class (all conditions pooled) ===\n")
print(by_priority.round(1).to_string())

# ---------------- 2. priority x condition cross-tab (top server + its share) ----------------
rows = []
for cond, g in df.groupby("condition"):
    for prio, gg in g.groupby("priority"):
        counts = gg["server"].value_counts(normalize=True) * 100
        top_server = counts.idxmax()
        rows.append({"condition": cond, "priority": prio, "n": len(gg),
                     "top_server": top_server, "top_share_%": round(counts.max(), 1)})
detail = pd.DataFrame(rows).sort_values(["condition", "priority"])
detail.to_csv(out / "server_share_by_priority_and_condition.csv", index=False)
print("\n=== Most-used server per (condition, priority), for reference ===\n")
print(detail.to_string(index=False))
print(f"\nWrote CSVs to {out}")
