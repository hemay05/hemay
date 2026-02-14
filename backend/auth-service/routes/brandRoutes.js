const express = require("express");
const multer = require("multer");
const path = require("path");
const { Op } = require("sequelize"); // 🆕 Import Sequelize operators
const Brand = require("../models/brand");
const router = express.Router();

// Configure multer for brand logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../../src/assets/uploads/brands/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'brand-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all brands
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.findAll({
      order: [['sort_order', 'ASC'], ['createdAt', 'DESC']]
    });

    return res.status(200).json({
      message: 'Brands fetched successfully',
      data: brands,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching brands:', error);
    return res.status(500).json({ 
      message: 'Server error, please try again later.', 
      success: false, 
      error: error.message 
    });
  }
});

// Get featured brands
router.get('/featured', async (req, res) => {
  try {
    const brands = await Brand.findAll({
      where: { is_featured: true, is_active: true },
      order: [['sort_order', 'ASC']]
    });

    return res.status(200).json({
      message: 'Featured brands fetched successfully',
      data: brands,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching featured brands:', error);
    return res.status(500).json({ 
      message: 'Server error, please try again later.', 
      success: false, 
      error: error.message 
    });
  }
});

// Get single brand
router.get('/:id', async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await Brand.findByPk(brandId);

    if (!brand) {
      return res.status(404).json({ 
        success: false, 
        message: 'Brand not found' 
      });
    }

    return res.status(200).json({
      message: 'Brand found successfully',
      data: brand,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching brand:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Add brand with logo upload
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('Uploaded file:', req.files);
    
    const { 
      name, 
      slug, 
      description, 
      is_featured, 
      is_active, 
      sort_order,
      meta_title,
      meta_description
    } = req.body;

    console.log("name:", name);

    // 🆕 FIX: Use Sequelize operators instead of MongoDB operators
    // Check if brand with same name or slug already exists
    const existingBrand = await Brand.findOne({ 
      where: { 
        [Op.or]: [ // 🆕 Use [Op.or] instead of $or
          { name },
          { slug }
        ]
      } 
    });
    
    if (existingBrand) {
      return res.status(400).json({ 
        success: false, 
        message: 'Brand with this name or slug already exists' 
      });
    }

    const brand = await Brand.create({
      name,
      slug,
      description: description || null,
      logo: req.file ? req.file.filename : null,
      is_featured: is_featured === 'true' || is_featured === true,
      is_active: is_active === 'true' || is_active === true,
      sort_order: parseInt(sort_order) || 0,
      meta_title: meta_title || null,
      meta_description: meta_description || null
    });

    return res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand
    });

  } catch (error) {
    console.error('Error during brand creation:', error);
    return res.status(500).json({ 
      message: 'Server error, please try again later.', 
      success: false, 
      error: error.message 
    });
  }
});

// Update brand with logo upload
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('Uploaded file:', req.files);
    
    const brandId = req.params.id;
    const { 
      name, 
      slug, 
      description, 
      is_featured, 
      is_active, 
      sort_order,
      meta_title,
      meta_description
    } = req.body;

    const brand = await Brand.findByPk(brandId);
    if (!brand) {
      return res.status(404).json({ 
        success: false, 
        message: 'Brand not found' 
      });
    }

    // 🆕 FIX: Use Sequelize operators instead of MongoDB operators
    // Check if brand with same name or slug already exists (excluding current brand)
    if (name || slug) {
      const existingBrand = await Brand.findOne({ 
        where: { 
          [Op.or]: [ // 🆕 Use [Op.or] instead of $or
            { name: name || brand.name },
            { slug: slug || brand.slug }
          ],
          id: { [Op.ne]: brandId } // 🆕 Use [Op.ne] instead of $ne
        } 
      });
      
      if (existingBrand) {
        return res.status(400).json({ 
          success: false, 
          message: 'Brand with this name or slug already exists' 
        });
      }
    }

    const updateData = {
      name: name || brand.name,
      slug: slug || brand.slug,
      description: description !== undefined ? description : brand.description,
      is_featured: is_featured !== undefined ? (is_featured === 'true' || is_featured === true) : brand.is_featured,
      is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : brand.is_active,
      sort_order: sort_order !== undefined ? parseInt(sort_order) : brand.sort_order,
      meta_title: meta_title !== undefined ? meta_title : brand.meta_title,
      meta_description: meta_description !== undefined ? meta_description : brand.meta_description
    };

    // Update logo if new file uploaded
    if (req.file) {
      updateData.logo = req.file.filename;
    }

    await brand.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      data: brand
    });

  } catch (error) {
    console.error('Error during brand update:', error);
    return res.status(500).json({ 
      message: 'Server error, please try again later.', 
      success: false, 
      error: error.message 
    });
  }
});

// Delete brand
router.delete('/:id', async (req, res) => {
  try {
    const brandId = req.params.id;
    
    const brand = await Brand.findByPk(brandId);
    if (!brand) {
      return res.status(404).json({ 
        success: false, 
        message: 'Brand not found' 
      });
    }

    await brand.destroy();

    return res.status(200).json({
      success: true,
      message: 'Brand deleted successfully'
    });

  } catch (error) {
    console.error('Error during brand deletion:', error);
    return res.status(500).json({ 
      message: 'Server error, please try again later.', 
      success: false, 
      error: error.message 
    });
  }
});

// Bulk delete brands
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Brand IDs are required' 
      });
    }

    const result = await Brand.destroy({
      where: {
        id: ids
      }
    });

    return res.status(200).json({
      success: true,
      message: `${result} brands deleted successfully`
    });

  } catch (error) {
    console.error('Error during bulk brand deletion:', error);
    return res.status(500).json({ 
      message: 'Server error, please try again later.', 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;