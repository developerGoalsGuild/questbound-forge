// Test progress bar color gradient
// Run with: node test-progress-colors.js

// Mock the color functions (simplified versions)
function getTaskProgressBarColor(percentage) {
  if (percentage >= 90) return 'bg-green-500';      // 90-100%: Green
  if (percentage >= 75) return 'bg-lime-500';       // 75-89%: Lime green
  if (percentage >= 60) return 'bg-yellow-500';     // 60-74%: Yellow
  if (percentage >= 40) return 'bg-orange-500';     // 40-59%: Orange
  if (percentage >= 20) return 'bg-red-400';        // 20-39%: Light red
  return 'bg-red-500';                              // 0-19%: Red
}

console.log('🎨 Testing Progress Bar Color Gradient (Red → Green)');
console.log('====================================================');

const testPercentages = [0, 10, 25, 35, 45, 55, 65, 75, 85, 95, 100];

testPercentages.forEach(percentage => {
  const color = getTaskProgressBarColor(percentage);
  const colorName = color.replace('bg-', '').replace('-500', '').replace('-400', '');
  console.log(`${percentage.toString().padStart(3)}% → ${color.padEnd(15)} (${colorName})`);
});

console.log('\n✅ Color gradient: Red (0%) → Orange → Yellow → Lime → Green (100%)');
console.log('🎯 Low progress = Red (urgent/needs attention)');
console.log('🎯 High progress = Green (good/on track)');
