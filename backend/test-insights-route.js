// Simple test script to verify insights route
console.log('Testing insights route...')

// You can run this to test if your route structure is correct
const testRoutes = {
  'GET /api/videos': 'Should work',
  'GET /api/videos/:id': 'Should work', 
  'GET /api/videos/:id/insights': 'Should work - this is our target',
  'GET /api/videos/search': 'Should work',
  'GET /api/videos/stats': 'Should work'
}

console.log('Expected routes:')
Object.entries(testRoutes).forEach(([route, status]) => {
  console.log(`  ${route} - ${status}`)
})

console.log('\nIf insights route still fails:')
console.log('1. Check route order in videos.js')
console.log('2. Verify server restart')
console.log('3. Check browser network tab for exact URL')
console.log('4. Test insights-test route first')
