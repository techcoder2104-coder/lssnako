import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import Banner from './models/Banner.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const checkBanners = async () => {
  try {
    console.log('🔍 Checking banners...\n')

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected\n')

    // Get all banners from DB
    const banners = await Banner.find()
    console.log(`📊 Found ${banners.length} banners in database:\n`)

    banners.forEach((banner, idx) => {
      console.log(`${idx + 1}. ${banner.title}`)
      console.log(`   ID: ${banner._id}`)
      console.log(`   Type: ${banner.type}`)
      console.log(`   Image Path: ${banner.image}`)

      // Check if it's a local file
      if (banner.image.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, banner.image)
        const exists = fs.existsSync(filePath)
        console.log(`   File exists: ${exists ? '✅ YES' : '❌ NO'}`)
        if (exists) {
          const stats = fs.statSync(filePath)
          console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`)
        }
      } else {
        console.log(`   Type: External URL`)
        console.log(`   Accessible: Check if URL is valid`)
      }
      console.log()
    })

    // Check upload directory
    const uploadsDir = path.join(__dirname, 'uploads/banners')
    console.log(`📁 Checking upload directory: ${uploadsDir}`)
    console.log(`   Exists: ${fs.existsSync(uploadsDir) ? '✅ YES' : '❌ NO'}`)

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir)
      console.log(`   Files: ${files.length}`)
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file)
        const stats = fs.statSync(filePath)
        console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`)
      })
    }

    console.log('\n✅ Check completed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkBanners()
