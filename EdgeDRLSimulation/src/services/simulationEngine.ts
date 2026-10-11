import type { EdgeTask, EdgeServer, SimpleExplanation } from '../types/simulation';

interface PPOScheduleResponse {
  task_id: number;
  selected_server_id: number;
  action_index: number;
  action_mask: boolean[];
  accepted: boolean;
  reward: number;
  server_assigned: number;
}

export async function runMultiTaskSimulation(
  tasks: EdgeTask[],
  setTasks: React.Dispatch<React.SetStateAction<EdgeTask[]>>,
  _servers: EdgeServer[],
  setServers: React.Dispatch<React.SetStateAction<EdgeServer[]>>,
  setPpoMessage: (msg: string | null) => void,
  setTargetServerId: (id: number | null) => void,
  onCompleteAll: () => void
) {
  const waitingTasks = tasks.filter((t) => t.status === 'WAITING' || t.status === 'COMPLETED');
  if (waitingTasks.length === 0) return;

  // Reset task statuses to WAITING for new run
  setTasks((prev) =>
    prev.map((t) => ({ ...t, status: 'WAITING', assignedServerId: undefined, progress: 0 }))
  );

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  await delay(100);

  // Define the complete lifecycle for a single task
  const runTaskLifecycle = async (task: EdgeTask) => {
    // STEP 1: ROUTING_ROUTER
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'ROUTING_ROUTER' } : t))
    );
    await delay(500);

    // STEP 2: ROUTING_SWITCH
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'ROUTING_SWITCH' } : t))
    );
    await delay(500);

    // STEP 3: SCHEDULING (PPO Decision)
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'SCHEDULING' } : t))
    );
    setPpoMessage(`Evaluating ${task.id}...`);
    await delay(350);

    let chosenServerId: number;
    let simpleExplanation: SimpleExplanation;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpu_requirement: task.cpuRequirement,
          ram_requirement: 4,
          data_size_mb: task.dataSize,
          execution_time_ms: task.executionTime,
          deadline_ms: task.deadline,
          priority: task.priority,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const ppoResult: PPOScheduleResponse = await response.json();
      chosenServerId = ppoResult.selected_server_id;

      const validServers = ppoResult.action_mask
        .map((isValid, idx) => (isValid ? `Server ${idx + 1}` : null))
        .filter(Boolean);
      const maskedServers = ppoResult.action_mask
        .map((isValid, idx) => (!isValid ? `Server ${idx + 1}` : null))
        .filter(Boolean);

      const maskExplanation = maskedServers.length > 0
        ? `Eligible: ${validServers.join(', ')} | Excluded (Masked): ${maskedServers.join(', ')}`
        : `All 4 Servers Eligible (Mask: [${ppoResult.action_mask.join(', ')}])`;

      simpleExplanation = {
        delay: `Action Index ${ppoResult.action_index} (Server ${chosenServerId})`,
        queue: maskExplanation,
        cpu: `PPO Step Reward: ${ppoResult.reward >= 0 ? '+' : ''}${ppoResult.reward.toFixed(2)}`,
        priority: `${task.priority} Priority • ${task.deadline}ms SLA • ${task.cpuRequirement} Cores (${task.dataSize}MB)`,
        summary: `Maskable PPO selected Server ${chosenServerId} as the optimal target based on current CPU capacity, network transfer overhead, and ${task.priority} priority SLA deadline (${task.deadline}ms).`,
      };
    } catch (error) {
      console.error(`Failed to schedule task ${task.id} via PPO backend:`, error);
      setPpoMessage(`PPO Error on ${task.id}`);
      return;
    }

    setTargetServerId(chosenServerId);
    setPpoMessage(`PPO → Server ${chosenServerId} (${task.id})`);
    await delay(500);

    // STEP 4: LAND IN SERVER (PROCESSING)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: 'PROCESSING',
              assignedServerId: chosenServerId,
              progress: 0,
              explanation: simpleExplanation,
            }
          : t
      )
    );

    // Add task into chosen Server's processing list
    setServers((prevServers) =>
      prevServers.map((srv) => {
        if (srv.id === chosenServerId) {
          const newTaskItem: EdgeTask = {
            ...task,
            status: 'PROCESSING',
            assignedServerId: chosenServerId,
            progress: 0,
            explanation: simpleExplanation,
          };
          const updatedProcessing: EdgeTask[] = [...srv.processingTasks, newTaskItem];
          const totalCpu = Math.min(
            95,
            srv.baseCpu + updatedProcessing.reduce((sum, t) => sum + t.cpuRequirement, 0)
          );
          return {
            ...srv,
            processingTasks: updatedProcessing,
            currentCpu: totalCpu,
            queueCount: srv.queueCount + 1,
            status: totalCpu > 80 ? 'BUSY' : 'AVAILABLE',
          };
        }
        return srv;
      })
    );

    // Step 4b: Simulate processing duration for this task
    const steps = 10;
    const stepDelay = 250;
    for (let s = 1; s <= steps; s++) {
      await delay(stepDelay);
      const currentProgress = s * 10;

      // Update task progress in task list
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, progress: currentProgress } : t))
      );

      // Update task progress inside ServerBox
      setServers((prevServers) =>
        prevServers.map((srv) => {
          if (srv.id === chosenServerId) {
            return {
              ...srv,
              processingTasks: srv.processingTasks.map((pt) =>
                pt.id === task.id ? { ...pt, progress: currentProgress } : pt
              ),
            };
          }
          return srv;
        })
      );
    }

    // STEP 5: TASK COMPLETED
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'COMPLETED', progress: 100 } : t))
    );

    // Remove task from ServerBox processing list
    setServers((prevServers) =>
      prevServers.map((srv) => {
        if (srv.id === chosenServerId) {
          const remainingProcessing = srv.processingTasks.filter((pt) => pt.id !== task.id);
          const totalCpu = Math.max(
            srv.baseCpu,
            srv.baseCpu + remainingProcessing.reduce((sum, t) => sum + t.cpuRequirement, 0)
          );
          return {
            ...srv,
            processingTasks: remainingProcessing,
            currentCpu: totalCpu,
            queueCount: Math.max(0, srv.queueCount - 1),
            status: totalCpu > 80 ? 'BUSY' : 'AVAILABLE',
          };
        }
        return srv;
      })
    );
  };

  // Launch each task lifecycle with a staggered entry interval
  // This allows multiple tasks to be in flight and in processing concurrently!
  const taskPromises: Promise<void>[] = [];
  for (let i = 0; i < waitingTasks.length; i++) {
    taskPromises.push(runTaskLifecycle(waitingTasks[i]));
    if (i < waitingTasks.length - 1) {
      await delay(600);
    }
  }

  // Wait for all concurrent task lifecycles to complete
  await Promise.all(taskPromises);

  // Clear PPO highlight banner after all tasks finish
  await delay(600);
  setPpoMessage(null);
  setTargetServerId(null);
  onCompleteAll();
}
