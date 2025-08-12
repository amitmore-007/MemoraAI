import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const validateEnv = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI'
  ]

  const optionalEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET',
    'OPENAI_API_KEY'
  ]

  const missingRequired = []
  const missingOptional = []

  // Check required variables
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingRequired.push(envVar)
    }
  })

  // Check optional variables
  optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingOptional.push(envVar)
    }
  })

  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingRequired.forEach(envVar => {
      console.error(`   - ${envVar}`)
    })
    process.exit(1)
  }

  if (missingOptional.length > 0) {
    console.warn('⚠️  Missing optional environment variables (some features may be disabled):')
    missingOptional.forEach(envVar => {
      console.warn(`   - ${envVar}`)
    })
  }

  console.log('✅ Environment variables validated')
  
  // Log configuration status
  console.log('\n📋 Configuration Status:')
  console.log(`   - Database: ${process.env.MONGODB_URI ? '✅' : '❌'}`)
  console.log(`   - JWT: ${process.env.JWT_SECRET ? '✅' : '❌'}`)
  console.log(`   - Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌'}`)
  console.log(`   - OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`)
}

export default validateEnv
