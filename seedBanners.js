import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Banner from './models/Banner.js'

dotenv.config()

const seedBanners = async () => {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing banners
    await Banner.deleteMany({})
    console.log('🗑️  Cleared existing banners')

    // Sample banners with real image URLs
    const sampleBanners = [
      {
        title: 'Main Banner - Fresh Groceries',
        image: 'https://images.unsplash.com/photo-1488459716781-6f3ee3009e7d?w=1200&h=400&auto=format&fit=crop&q=80',
        type: 'main',
        order: 0,
        active: true
      },
      {
        title: 'Electronics Sale',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=300&auto=format&fit=crop&q=80',
        type: 'category',
        order: 0,
        active: true
      },
      {
        title: 'Fashion Week',
        image: 'https://images.unsplash.com/photo-1441984904556-0ac8675ecd4a?w=600&h=300&auto=format&fit=crop&q=80',
        type: 'category',
        order: 1,
        active: true
      },
      {
        title: 'Home & Living',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=300&auto=format&fit=crop&q=80',
        type: 'category',
        order: 2,
        active: true
      }
    ]

    // Insert banners
    const inserted = await Banner.insertMany(sampleBanners)
    console.log(`✅ Inserted ${inserted.length} sample banners`)

    // Display inserted banners
    const allBanners = await Banner.find()
    console.log('\n📊 All Banners:')
    allBanners.forEach((banner, idx) => {
      console.log(`${idx + 1}. ${banner.title} (${banner.type})`)
      console.log(`   Image: ${banner.image.substring(0, 50)}...`)
    })

    console.log('\n✅ Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding banners:', error)
    process.exit(1)
  }
}

seedBanners()
