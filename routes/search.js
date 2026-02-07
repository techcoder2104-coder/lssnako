import express from 'express'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Search from '../models/Search.js'

const router = express.Router()

// Get trending searches
router.get('/trending', async (req, res) => {
  try {
    const limit = req.query.limit || 6

    // Get top searches from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const trending = await Search.find({
      updatedAt: { $gte: thirtyDaysAgo }
    })
      .sort({ count: -1 })
      .limit(parseInt(limit))

    res.json(trending)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get recommended brands
router.get('/brands', async (req, res) => {
  try {
    const limit = req.query.limit || 6

    // Get all unique brands from products
    const brands = await Product.distinct('brand')
      .limit(parseInt(limit))

    // Format response
    const formattedBrands = brands
      .filter(b => b && b.trim())
      .slice(0, limit)
      .map(name => ({ name }))

    res.json(formattedBrands)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Track search and return results
router.post('/track', async (req, res) => {
  try {
    const { query } = req.body

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' })
    }

    const lowerQuery = query.toLowerCase().trim()

    // Update or create search record
    await Search.findOneAndUpdate(
      { term: lowerQuery },
      {
        $inc: { count: 1 },
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
