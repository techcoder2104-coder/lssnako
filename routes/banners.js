import express from 'express'
import Banner from '../models/Banner.js'

const router = express.Router()

// Helper function to build full image URL
const buildImageUrl = (banner, req) => {
  if (banner.image.startsWith('http')) {
    // External URL - return as is
    return banner.image
  } else {
    // Local file - return as is
    return banner.image
  }
}

// Get all active banners
router.get('/', async (req, res) => {
  try {
    const { type } = req.query
    let query = { active: true }

    if (type) {
      query.type = type
    }

    const banners = await Banner.find(query).sort({ order: 1 })
    
    // Convert image paths to full URLs
    const bannersWithUrls = banners.map(banner => ({
      ...banner.toObject(),
      image: buildImageUrl(banner, req)
    }))

    res.json(bannersWithUrls)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single banner
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id)
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' })
    }
    
    const bannerWithUrl = {
      ...banner.toObject(),
      image: buildImageUrl(banner, req)
    }
    
    res.json(bannerWithUrl)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create banner (admin)
router.post('/', async (req, res) => {
  try {
    const { title, type, order, imageUrl } = req.body

    if (!title || !type || !imageUrl) {
      return res.status(400).json({ error: 'Title, type, and image URL are required' })
    }

    const banner = new Banner({
      title,
      image: imageUrl,
      type,
      order: parseInt(order) || 0
    })

    await banner.save()
    res.status(201).json(banner)
  } catch (error) {
    console.error('Banner creation error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update banner (admin)
router.put('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id)
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' })
    }

    // Update fields
    if (req.body.title) banner.title = req.body.title
    if (req.body.type) banner.type = req.body.type
    if (req.body.order) banner.order = parseInt(req.body.order)
    if (req.body.active !== undefined) banner.active = req.body.active === 'true' || req.body.active === true

    // Handle image URL update
    if (req.body.imageUrl) {
      banner.image = req.body.imageUrl
    }

    await banner.save()
    res.json(banner)
  } catch (error) {
    console.error('Banner update error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete banner (admin)
router.delete('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id)
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' })
    }

    // Delete image file if it's local
    if (banner.image && banner.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '../' + banner.image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    res.json({ message: 'Banner deleted successfully', id: req.params.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
