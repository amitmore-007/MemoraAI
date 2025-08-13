import fetch from 'node-fetch'

const BACKEND_URL = 'https://memoraai-ans7.onrender.com'

const verifyDeployment = async () => {
  console.log('🚀 Verifying backend deployment...')
  
  try {
    // Test 1: Basic health check
    console.log('\n1️⃣ Testing basic health check...')
    const healthResponse = await fetch(`${BACKEND_URL}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health check:', healthResponse.status, healthData.status)

    // Test 2: Deployment verification
    console.log('\n2️⃣ Testing deployment verification...')
    const deployResponse = await fetch(`${BACKEND_URL}/api/deployment/check`)
    const deployData = await deployResponse.json()
    console.log('✅ Deployment check:', deployResponse.status, deployData.version)

    // Test 3: Video routes verification
    console.log('\n3️⃣ Testing video routes verification...')
    const videoResponse = await fetch(`${BACKEND_URL}/api/videos/deployment/verify`)
    const videoData = await videoResponse.json()
    console.log('✅ Video routes check:', videoResponse.status, videoData.version)

    // Test 4: Insights health check
    console.log('\n4️⃣ Testing insights health check...')
    const insightsResponse = await fetch(`${BACKEND_URL}/api/videos/health/insights`)
    const insightsData = await insightsResponse.json()
    console.log('✅ Insights health:', insightsResponse.status, insightsData.message)

    console.log('\n🎉 All deployment checks passed!')
    console.log('\n📋 Deployment Summary:')
    console.log(`   - Backend URL: ${BACKEND_URL}`)
    console.log(`   - Version: ${deployData.version || 'Unknown'}`)
    console.log(`   - Environment: ${healthData.environment || 'Unknown'}`)
    console.log(`   - Insights Feature: ${deployData.features?.insights ? '✅' : '❌'}`)

  } catch (error) {
    console.error('❌ Deployment verification failed:', error.message)
    console.log('\n🔧 Troubleshooting steps:')
    console.log('   1. Check if backend is deployed and running')
    console.log('   2. Verify latest code is pushed to repository')
    console.log('   3. Check Render deployment logs')
    console.log('   4. Manually trigger a redeploy on Render')
  }
}

verifyDeployment()
