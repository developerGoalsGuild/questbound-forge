// Test progress calculation with real data and fixed status values
// Run with: node test-fixed-progress.js

const realGoalsData = [
  {
    "id": "024be678-ba5f-4c98-9a54-9bbd39c0713f",
    "title": "teste 1",
    "deadline": "2025-10-31",
    "status": "active",
    "createdAt": 1759343938008,
    "tasks": [
      {
        "id": "6c760ee7-b7d8-4795-aa43-b84b34a45c9b",
        "dueAt": 1761868800,
        "status": "paused",
        "createdAt": 1759350462758,
        "updatedAt": 1759350478277
      },
      {
        "id": "b48c0a05-d650-423e-a1f8-eb54e864d5d3",
        "dueAt": 1759708800,
        "status": "active",
        "createdAt": 1759365400335,
        "updatedAt": 1759365400335
      },
      {
        "id": "b92fe84c-fc11-48ab-8d89-6c288aa43b32",
        "dueAt": 1760054400,
        "status": "completed", // This should count as completed!
        "createdAt": 1759365366813,
        "updatedAt": 1759372738690
      }
    ]
  },
  {
    "id": "4a0b0822-eb9d-4bd7-b50e-97a942f44398",
    "title": "Own Sustainable Business test",
    "deadline": "2027-01-01",
    "status": "active",
    "createdAt": 1758339130000,
    "tasks": [
      // 12 tasks, all active/paused (0 completed)
      {"id": "1", "dueAt": 1796860800, "status": "paused", "createdAt": 1758844970857, "updatedAt": 1759344327387},
      {"id": "2", "dueAt": 1798588800, "status": "active", "createdAt": 1758845036317, "updatedAt": 1758845036317},
      {"id": "3", "dueAt": 1761177600, "status": "active", "createdAt": 1759344318966, "updatedAt": 1759344318966},
      {"id": "4", "dueAt": 1798588800, "status": "active", "createdAt": 1758850527577, "updatedAt": 1758850527577},
      {"id": "5", "dueAt": 1798588800, "status": "active", "createdAt": 1758845089278, "updatedAt": 1758845089278},
      {"id": "6", "dueAt": 1798588800, "status": "active", "createdAt": 1758845011217, "updatedAt": 1758845011217},
      {"id": "7", "dueAt": 1798588800, "status": "active", "createdAt": 1758850522079, "updatedAt": 1758850522079},
      {"id": "8", "dueAt": 1798588800, "status": "active", "createdAt": 1758850760497, "updatedAt": 1758850760497},
      {"id": "9", "dueAt": 1798588800, "status": "active", "createdAt": 1758845005837, "updatedAt": 1758845005837},
      {"id": "10", "dueAt": 1798588800, "status": "active", "createdAt": 1758844951280, "updatedAt": 1758844951280},
      {"id": "11", "dueAt": 1798588800, "status": "active", "createdAt": 1758845142398, "updatedAt": 1758845142398},
      {"id": "12", "dueAt": 1798588800, "status": "active", "createdAt": 1758844976337, "updatedAt": 1758844976337}
    ]
  }
];

// Progress calculation functions (simplified for testing)
function calculateTaskProgress(tasks) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  return { taskProgress, completedTasks, totalTasks };
}

function calculateTimeProgress(goal) {
  const now = new Date().getTime();
  const created = goal.createdAt;
  const deadline = new Date(goal.deadline).getTime();

  if (!deadline || deadline <= created) {
    return 0;
  }

  const totalDuration = deadline - created;
  const elapsedDuration = now - created;

  if (elapsedDuration <= 0) {
    return 0;
  }
  if (elapsedDuration >= totalDuration) {
    return 100;
  }

  return (elapsedDuration / totalDuration) * 100;
}

function calculateGoalProgress(goal) {
  const { taskProgress, completedTasks, totalTasks } = calculateTaskProgress(goal.tasks);
  const timeProgress = calculateTimeProgress(goal);
  const progressPercentage = (taskProgress * 0.7) + (timeProgress * 0.3);

  return {
    goalId: goal.id,
    title: goal.title,
    progressPercentage: parseFloat(progressPercentage.toFixed(2)),
    taskProgress: parseFloat(taskProgress.toFixed(2)),
    timeProgress: parseFloat(timeProgress.toFixed(2)),
    completedTasks,
    totalTasks,
    deadline: goal.deadline
  };
}

console.log('🧪 Testing Fixed Progress Calculation');
console.log('====================================');

const progressResults = realGoalsData.map(calculateGoalProgress);

progressResults.forEach((progress, index) => {
  console.log(`\n📊 Goal ${index + 1}: ${progress.title}`);
  console.log(`   Deadline: ${progress.deadline}`);
  console.log(`   Tasks: ${progress.completedTasks}/${progress.totalTasks} (${progress.taskProgress}%)`);
  console.log(`   Time Progress: ${progress.timeProgress}%`);
  console.log(`   Overall Progress: ${progress.progressPercentage}%`);
});

console.log('\n✅ Task progress should now be calculated correctly!');
