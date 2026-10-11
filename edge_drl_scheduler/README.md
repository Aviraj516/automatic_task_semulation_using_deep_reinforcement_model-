# 🐍 Edge DRL Scheduler Backend Engine

This folder contains the core **Python Reinforcement Learning Environment**, **Model Training Pipeline**, **Evaluation Benchmarks**, and **FastAPI Server**.

---

## 📌 Architecture Overview

- **`environment/`**: Implements `EdgeSchedulingEnv`, a custom **Gymnasium** environment representing an edge cluster with dynamic server CPU workloads, network transfer delays, and task queues.
- **`models/`**: Pre-trained model checkpoints (e.g. `ppo_edge_scheduler_selected.zip` / `best_model.zip`) using Maskable PPO (`sb3_contrib`).
- **`api/main.py`**: A **FastAPI** application exposing REST endpoints to serve model predictions to web interfaces or external callers.
- **`training/`**: Scripts to train new agents (`train_ppo.py`, `train_ppo_bc.py`).
- **`experiments/`**: Benchmark evaluation comparing DRL against classical scheduling heuristics (`evaluate_agents.py`, `compare_heuristics.py`).

---

## 🚀 How to Run

1. **Activate Environment & Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the FastAPI Backend Server:**
   ```bash
   uvicorn api.main:app --reload --port 8000
   ```

3. **Run Unit & Environment Tests:**
   ```bash
   python test_drl_env.py
   python test_ect_scheduler.py
   ```

4. **Evaluate Agents vs Heuristics:**
   ```bash
   python experiments/evaluate_agents.py
   ```
