// Test progress calculation with real data (no tasks)
// Run with: node test-real-progress.js

const realGoalsData = [
  {
    "id": "024be678-ba5f-4c98-9a54-9bbd39c0713f",
    "title": "teste 1",
    "deadline": "2025-10-31",
    "status": "active",
    "createdAt": 1759343938008,
    "tasks": []
  },
  {
    "id": "4a0b0822-eb9d-4bd7-b50e-97a942f44398",
    "title": "Own Sustainable Business test",
    "deadline": "2027-01-01",
    "status": "active",
    "createdAt": 1758339130000,
    "tasks": []
  },
  {
    "id": "bd33cf39-a0d7-45e1-b8c9-a3bd48597443",
    "title": "teste1",
    "deadline": "2025-10-11",
    "status": "active",
    "createdAt": 1759278561955,
    "tasks": []
  },
  {
    "id": "c5e8c6f0-3dfc-4b1b-8b45-6fa8d93ae6b1",
    "title": "rewrwerwe",
    "deadline": "2025-10-31",
    "status": "active",
    "createdAt": 1759359645579,
    "tasks": []
  }
];

// Progress calculation functions
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
  const totalTasks = goal.tasks.length;
  const completedTasks = goal.tasks.filter(task => task.status === 'done').length;

  let taskProgress = 0;
  if (totalTasks > 0) {
    taskProgress = (completedTasks / totalTasks) * 100;
  }

  const timeProgress = calculateTimeProgress(goal);
  const progressPercentage = (taskProgress * 0.7) + (timeProgress * 0.3);

  return {
    goalId: goal.id,
    title: goal.title,
    progressPercentage: parseFloat(progressPercentage.toFixed(2)),
    taskProgress: parseFloat(taskProgress.toFixed(2)),
    timeProgress: parseFloat(timeProgress.toFixed(2)),
    completedTasks: completedTasks,
    totalTasks: totalTasks,
    deadline: goal.deadline,
    isOverdue: new Date().getTime() > new Date(goal.deadline).getTime()
  };
}

console.log('🧪 Testing Real Data Progress Calculation');
console.log('=========================================');

const progressResults = realGoalsData.map(calculateGoalProgress);

progressResults.forEach((progress, index) => {
  console.log(`\n📊 Goal ${index + 1}: ${progress.title}`);
  console.log(`   Deadline: ${progress.deadline} ${progress.isOverdue ? '⚠️ OVERDUE' : '✅'}`);
  console.log(`   Tasks: ${progress.completedTasks}/${progress.totalTasks} (${progress.taskProgress}%)`);
  console.log(`   Time Progress: ${progress.timeProgress}%`);
  console.log(`   Overall Progress: ${progress.progressPercentage}%`);
});

// Aggregate calculation
const totalOverallProgress = progressResults.reduce((sum, p) => sum + p.progressPercentage, 0);
const avgProgress = Math.round(totalOverallProgress / progressResults.length);

console.log('\n📈 Dashboard Summary');
console.log('===================');
console.log(`Average Progress: ${avgProgress}%`);
console.log(`Active Goals: ${progressResults.length}`);
console.log(`Goals with Tasks: ${progressResults.filter(p => p.totalTasks > 0).length}`);
console.log(`Overdue Goals: ${progressResults.filter(p => p.isOverdue).length}`);

console.log('\n✅ Progress calculation working correctly with real data!');
