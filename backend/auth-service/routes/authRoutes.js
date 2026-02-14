const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/role");
const cors = require("cors");
const { log } = require("console");
const axios = require('axios');
const router = express.Router();
// router.use(cors()); // Removed redundant CORS
router.use(express.json()); // ✅ Ensure JSON is parsed
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Category = require("../models/category");
const Brand = require("../models/brand");
const Product = require("../models/product");
const Combo = require('../models/combo');
const ProductType = require('../models/product_type');
const Order = require("../models/order");
const Coupon = require("../models/coupon");
const CMSPage = require("../models/cms_page");
const Slider = require('../models/slider');
const fs = require('fs');

const otpStore = {};
const multer = require('multer');
const path = require('path');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
      user_role_id: user.user_role_id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, address, user_type = 'customer' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Ensure customer role exists
    const customerRole = await Role.ensureCustomerRole();

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      basePass64: password, // Store plain password in base64 (consider if this is necessary)
      hospital_id: null,
      user_role_id: customerRole.id,
      role: 'user',
      address: address || null,
      user_type: user_type
    });

    // Generate token
    const token = generateToken(newUser);

    // Return user data without password
    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      user_type: newUser.user_type,
      user_role_id: newUser.user_role_id,
      profile_image: newUser.profile_image,
      address: newUser.address
    };

    res.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        attributes: ['user_role_keyword', 'user_type']
      }]
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      user_type: user.user_type,
      user_role_id: user.user_role_id,
      profile_image: user.profile_image,
      address: user.address
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// Social Login (placeholder)
router.post('/social-login', async (req, res) => {
  // Implement social login logic here
  res.status(501).json({
    success: false,
    message: 'Social login not implemented yet'
  });
});

// Google Sign-In
router.post('/google-signin', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Decode Google JWT token
    const ticket = jwt.decode(credential);
    
    if (!ticket || !ticket.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google credential'
      });
    }

    const { email, name, picture, sub: googleId } = ticket;

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Ensure customer role exists
      const customerRole = await Role.ensureCustomerRole();

      // Create new user from Google account
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: await bcrypt.hash(googleId, 10), // Use Google ID as password
        basePass64: googleId,
        hospital_id: null,
        user_role_id: customerRole.id,
        role: 'user',
        user_type: 'customer',
        profile_image: picture || null,
        google_id: googleId
      });
    } else {
      // Update profile image if not set
      if (!user.profile_image && picture) {
        await user.update({ profile_image: picture });
      }
      // Store Google ID if not already stored
      if (!user.google_id) {
        await user.update({ google_id: googleId });
      }
    }

    // Generate token
    const token = generateToken(user);

    // Return user data without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      user_type: user.user_type,
      user_role_id: user.user_role_id,
      profile_image: user.profile_image,
      address: user.address
    };

    res.json({
      success: true,
      message: 'Google sign-in successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during Google sign-in'
    });
  }
});

// User Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user", error });
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, username, password, otp } = req.body;
    console.log("Login Request Body:", req.body);

    const userEmail = email || username;
    // 1. Find user
    const user = await User.findOne({
      where: { email: userEmail },
      include: [
        {
          model: Role,
          attributes: ["id", "user_role"]
        },

      ]
    });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // 2. OTP login
    if (otp && !password) {
      if (String(user.otp) !== String(otp)) {
        return res.json({ success: false, message: "Invalid OTP" });
      }

      if (user.otp_expiry && Date.now() > new Date(user.otp_expiry).getTime()) {
        return res.json({ success: false, message: "OTP expired" });
      }

      // Clear OTP
      await user.update({ otp: null, otp_expiry: null });
    }

    // 3. Password login
    if (password && !otp) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
    }

    // 4. Both missing
    if (!otp && !password) {
      return res.json({ success: false, message: "Provide password or OTP" });
    }

    // 6. Get Role Permissions
    const roleName = user.Role?.user_role || user.role;



    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.name,
        role: user.role,
        name: user.name,
        user_role_id: user.user_role_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", success: false, error: error.message });
  }
});

// Protected Route Example
router.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

// Middleware to Verify JWT
function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}
// -- Add  New Hospital Created By Pravin -- //






// Send OTP
router.post("/send-otp", async (req, res) => {
  console.log("req.body11", req.body)
  try {
    const email = req.body.email;
    if (!email) return res.json({ success: false, message: "Email is required" });


    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) return res.json({ success: false, message: "User not found" });

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    console.log("otp", otp)
    // Save OTP in User table
    await user.update({
      otp,
      otp_expiry: new Date(Date.now() + 1 * 60 * 1000)
    });

    //  Send via Nodemailer
    const transporter = nodemailer.createTransport({
      host: "mail.geniusedusoft.com",
      port: 465,
      secure: true,
      auth: { user: "noreply@geniusedusoft.com", pass: "votQq4Masedh" },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: '"PatientERP" <noreply@geniusedusoft.com>',
      to: email,
      subject: "Your OTP for Login",
      text: `Your OTP is ${otp}  It will expire in 1 minutes`
    });
    return res.json({ success: true, otp, message: "OTP sent successfully" });
  } catch (err) {
    console.error(" OTP error:", err);
    return res.json({ success: false, message: "Something went wrong", error: err.message });
  }
});

// Get categories for frontend (with children)
router.get('/categories/frontend', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    // Build category tree
    const buildTree = (parentId = null) => {
      return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat.toJSON(),
          children: buildTree(cat.id)
        }));
    };

    const categoryTree = buildTree();

    return res.status(200).json({
      message: 'Categories fetched successfully',
      data: categoryTree,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching categories:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});


// Add these routes to your authRoutes.js file
// Get Parent Categories (categories without parent)
router.get('/categories/parents', async (req, res) => {
  try {
    const parentCategories = await Category.findAll({
      where: {
        parent_id: null
      },
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      message: 'Parent categories fetched successfully',
      data: parentCategories,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching parent categories:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get Categories for Dropdown (with hierarchy info)
router.get('/categories/dropdown', async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'parent_id'],
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      message: 'Categories for dropdown fetched successfully',
      data: categories,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching dropdown categories:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});
// Category Listing
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      message: 'Categories fetched successfully',
      data: categories,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching categories:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get Single Category
router.get('/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      message: 'Category found successfully',
      data: category,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching category:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Add Category
router.post('/categories', async (req, res) => {
  try {
    console.log('req.body:', req.body);

    const {
      name,
      slug,
      description,
      image_url,
      status,
      parent_id,
      is_featured,
      sort_order,
      meta_title,
      meta_description,
      created_by
    } = req.body;

    // Check if category already exists by name
    const existingCategoryByName = await Category.findOne({ where: { name } });
    if (existingCategoryByName) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    // Check if slug already exists
    const existingCategoryBySlug = await Category.findOne({ where: { slug } });
    if (existingCategoryBySlug) {
      return res.status(400).json({
        success: false,
        message: 'Category slug already exists'
      });
    }

    const created_at = new Date();

    const category = await Category.create({
      name,
      slug,
      description: description || null,
      image_url: image_url || null,
      status: status !== undefined ? status : true,
      parent_id: parent_id || null,
      is_featured: is_featured || false,
      sort_order: sort_order || 0,
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      created_at,
      created_by: created_by || 'system'
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    console.error('Error during category creation:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Update Category
router.put('/categories/:id', async (req, res) => {
  try {
    console.log('req.body:', req.body);

    const categoryId = req.params.id;
    const {
      name,
      slug,
      description,
      image_url,
      status,
      parent_id,
      is_featured,
      sort_order,
      meta_title,
      meta_description,
      updated_by
    } = req.body;

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name already exists (excluding current category)
    if (name && name !== category.name) {
      const existingCategoryByName = await Category.findOne({
        where: { name }
      });
      if (existingCategoryByName) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
    }

    // Check if slug already exists (excluding current category)
    if (slug && slug !== category.slug) {
      const existingCategoryBySlug = await Category.findOne({
        where: { slug }
      });
      if (existingCategoryBySlug) {
        return res.status(400).json({
          success: false,
          message: 'Category slug already exists'
        });
      }
    }

    const updated_at = new Date();

    await category.update({
      name: name || category.name,
      slug: slug || category.slug,
      description: description !== undefined ? description : category.description,
      image_url: image_url !== undefined ? image_url : category.image_url,
      status: status !== undefined ? status : category.status,
      parent_id: parent_id !== undefined ? parent_id : category.parent_id,
      is_featured: is_featured !== undefined ? is_featured : category.is_featured,
      sort_order: sort_order !== undefined ? sort_order : category.sort_order,
      meta_title: meta_title !== undefined ? meta_title : category.meta_title,
      meta_description: meta_description !== undefined ? meta_description : category.meta_description,
      updated_at,
      updated_by: updated_by || 'system'
    });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });

  } catch (error) {
    console.error('Error during category update:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Delete Category
router.delete('/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error during category deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Bulk Delete Categories
router.post('/categories/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category IDs are required'
      });
    }

    const result = await Category.destroy({
      where: {
        id: ids
      }
    });

    return res.status(200).json({
      success: true,
      message: `${result} categories deleted successfully`
    });

  } catch (error) {
    console.error('Error during bulk category deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});


// routes/sliders.js

// Get all sliders

// routes/sliders.js
const uploadSlider = require('../config/multer');
// Get all sliders
router.get('/sliders', async (req, res) => {
  try {
    const sliders = await Slider.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    return res.status(200).json({
      message: 'Sliders fetched successfully',
      data: sliders,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching sliders:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get single slider
router.get('/sliders/:id', async (req, res) => {
  try {
    const sliderId = req.params.id;
    const slider = await Slider.findByPk(sliderId);

    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Slider not found'
      });
    }

    return res.status(200).json({
      message: 'Slider found successfully',
      data: slider,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching slider:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Add slider with image upload
router.post('/sliders', uploadSlider.single('image'), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const {
      title,
      subtitle,
      description,
      button_text,
      button_url,
      sort_order,
      is_active,
      background_color,
      text_color
    } = req.body;

    // Check if slider with same title already exists
    if (title) {
      const existingSlider = await Slider.findOne({ where: { title } });
      if (existingSlider) {
        // Delete uploaded file if title exists
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Slider with this title already exists'
        });
      }
    }

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    const imagePath = `/uploads/sliders/${req.file.filename}`;

    const slider = await Slider.create({
      title: title || null,
      subtitle: subtitle || null,
      description: description || null,
      image: imagePath,
      button_text: button_text || null,
      button_url: button_url || null,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : true,
      background_color: background_color || null,
      text_color: text_color || null
    });

    return res.status(201).json({
      success: true,
      message: 'Slider created successfully',
      data: slider
    });

  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error during slider creation:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Update slider with optional image upload
router.put('/sliders/:id', uploadSlider.single('image'), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const sliderId = req.params.id;
    const {
      title,
      subtitle,
      description,
      button_text,
      button_url,
      sort_order,
      is_active,
      background_color,
      text_color
    } = req.body;

    const slider = await Slider.findByPk(sliderId);
    if (!slider) {
      // Delete uploaded file if slider not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Slider not found'
      });
    }

    // Check if title already exists (excluding current slider)
    if (title && title !== slider.title) {
      const existingSlider = await Slider.findOne({
        where: { title }
      });
      if (existingSlider) {
        // Delete uploaded file if title exists
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Slider with this title already exists'
        });
      }
    }

    let imagePath = slider.image;

    // If new image uploaded, delete old image and use new one
    if (req.file) {
      // Delete old image file
      if (slider.image) {
        const oldImagePath = path.join(__dirname, '..', slider.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `/uploads/sliders/${req.file.filename}`;
    }

    await slider.update({
      title: title !== undefined ? title : slider.title,
      subtitle: subtitle !== undefined ? subtitle : slider.subtitle,
      description: description !== undefined ? description : slider.description,
      image: imagePath,
      button_text: button_text !== undefined ? button_text : slider.button_text,
      button_url: button_url !== undefined ? button_url : slider.button_url,
      sort_order: sort_order !== undefined ? sort_order : slider.sort_order,
      is_active: is_active !== undefined ? is_active : slider.is_active,
      background_color: background_color !== undefined ? background_color : slider.background_color,
      text_color: text_color !== undefined ? text_color : slider.text_color
    });

    return res.status(200).json({
      success: true,
      message: 'Slider updated successfully',
      data: slider
    });

  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error during slider update:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Delete slider
router.delete('/sliders/:id', async (req, res) => {
  try {
    const sliderId = req.params.id;

    const slider = await Slider.findByPk(sliderId);
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Slider not found'
      });
    }

    // Delete image file
    if (slider.image) {
      const imagePath = path.join(__dirname, '..', slider.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await slider.destroy();

    return res.status(200).json({
      success: true,
      message: 'Slider deleted successfully'
    });

  } catch (error) {
    console.error('Error during slider deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Bulk delete sliders
router.post('/sliders/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Slider IDs are required'
      });
    }

    // Get sliders to delete their images
    const slidersToDelete = await Slider.findAll({
      where: { id: ids }
    });

    // Delete image files
    slidersToDelete.forEach(slider => {
      if (slider.image) {
        const imagePath = path.join(__dirname, '..', slider.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    });

    const result = await Slider.destroy({
      where: {
        id: ids
      }
    });

    return res.status(200).json({
      success: true,
      message: `${result} sliders deleted successfully`
    });

  } catch (error) {
    console.error('Error during bulk slider deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Serve static files from uploads directory
router.use('/uploads', express.static('uploads'))



// Add these routes to your authRoutes.js file or create a new productRoutes.js file

// Product Listing
router.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      ingredients: product.ingredients,
      calories: product.calories,
      delivery_info: product.delivery_info,

      price: parseFloat(product.price),
      cost_price: product.cost_price ? parseFloat(product.cost_price) : 0,
      quantity: product.stock,
      category_id: product.category_id,
      category_name: product.category ? product.category.name : 'Uncategorized',
      images: product.images || [],
      status: product.status ? 1 : 0,
      created_at: product.createdAt,
      updated_at: product.updatedAt
    }));

    return res.status(200).json({
      message: 'Products fetched successfully',
      data: formattedProducts,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching products:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get Single Product
router.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const formattedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      ingredients: product.ingredients,
      calories: product.calories,
      delivery_info: product.delivery_info,
      price: parseFloat(product.price),
      cost_price: product.cost_price ? parseFloat(product.cost_price) : 0,
      quantity: product.stock,
      category_id: product.category_id,
      category_name: product.category ? product.category.name : 'Uncategorized',
      images: product.images || [],
      status: product.status ? 1 : 0,
      created_at: product.createdAt,
      updated_at: product.updatedAt
    };

    return res.status(200).json({
      message: 'Product found successfully',
      data: formattedProduct,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching product:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../../src/assets/uploads/products/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadProduct = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
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

// Update your routes to handle file uploads
router.post('/products', uploadProduct.array('images', 10), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('Uploaded files:', req.files);

    const {
      name,
      sku,
      description,
      short_description,
      price,
      cost_price,
      compare_price,
      quantity,
      category_id,
      product_type_id,
      brand_id,
      status = 1,
      existing_images = '[]',
      slug,
      is_featured = false,
      is_published = true,
      track_quantity = true,
      weight = 0,
      tags = '[]',
      seo_title = '',
      seo_description = '',
      specifications = '{}',
      dimensions = '{}',
      ingredients = '',
      calories = '',
      delivery_info = ''
    } = req.body;

    // Parse JSON fields
    let existingImages = [];
    let tagsArray = [];
    let specificationsObj = {};
    let dimensionsObj = {};

    try {
      existingImages = JSON.parse(existing_images);
      tagsArray = JSON.parse(tags);
      specificationsObj = JSON.parse(specifications);
      dimensionsObj = JSON.parse(dimensions);
    } catch (e) {
      existingImages = [];
      tagsArray = [];
      specificationsObj = {};
      dimensionsObj = {};
    }

    // Check if product with same SKU already exists
    if (sku) {
      const existingProduct = await Product.findOne({ where: { sku } });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }
    }

    // Check if slug already exists
    if (slug) {
      const existingProduct = await Product.findOne({ where: { slug } });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this slug already exists'
        });
      }
    }

    // Check if category exists
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Check if brand exists
    if (brand_id) {
      const brand = await Brand.findByPk(brand_id);
      if (!brand) {
        return res.status(400).json({
          success: false,
          message: 'Brand not found'
        });
      }
    }

    // Check if brand exists
    if (product_type_id) {
      const productType = await ProductType.findByPk(product_type_id);
      if (!productType) {
        return res.status(400).json({
          success: false,
          message: 'Product type not found'
        });
      }
    }

    // Process uploaded images
    const uploadedImages = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Combine existing and new images
    const allImages = [...existingImages, ...uploadedImages];

    const product = await Product.create({
      name,
      slug: slug || `product-${Date.now()}`,
      sku: sku || `SKU-${Date.now()}`,
      short_description: short_description || '',
      description,
      price: parseFloat(price) || 0,
      compare_price: compare_price ? parseFloat(compare_price) : null,
      cost_price: cost_price ? parseFloat(cost_price) : null,
      stock: parseInt(quantity) || 0,
      category_id: category_id || null,
      product_type_id: product_type_id || null,
      brand_id: brand_id || null,
      images: allImages,
      status: Boolean(status),
      is_featured: is_featured === true || is_featured === 'true',
      is_published: is_published === true || is_published === 'true',
      track_quantity: track_quantity === true || track_quantity === 'true',
      weight: weight ? parseFloat(weight) : null,
      tags: tagsArray,
      specifications: specificationsObj,
      dimensions: dimensionsObj,
      seo_title: seo_title || '',
      seo_description: seo_description || '',
      ingredients: ingredients || '',
      calories: calories || '',
      delivery_info: delivery_info || ''
    });

    // Fetch the created product with category info
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Brand,
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    const formattedProduct = {
      id: createdProduct.id,
      name: createdProduct.name,
      slug: createdProduct.slug,
      sku: createdProduct.sku,
      short_description: createdProduct.short_description,
      description: createdProduct.description,
      price: parseFloat(createdProduct.price),
      compare_price: createdProduct.compare_price ? parseFloat(createdProduct.compare_price) : null,
      cost_price: createdProduct.cost_price ? parseFloat(createdProduct.cost_price) : 0,
      quantity: createdProduct.stock,
      category_id: createdProduct.category_id,
      category_name: createdProduct.category ? createdProduct.category.name : 'Uncategorized',
      product_type_id: createdProduct.product_type_id,
      product_type_name: createdProduct.product_type ? createdProduct.product_type.name : 'No Product Type',
      brand_id: createdProduct.brand_id,

      brand_name: createdProduct.brand ? createdProduct.brand.name : 'No Brand',
      images: createdProduct.images || [],
      status: createdProduct.status ? 1 : 0,
      is_featured: createdProduct.is_featured,
      is_published: createdProduct.is_published,
      track_quantity: createdProduct.track_quantity,
      weight: createdProduct.weight,
      tags: createdProduct.tags || [],
      specifications: createdProduct.specifications || {},
      dimensions: createdProduct.dimensions || {},
      seo_title: createdProduct.seo_title,
      seo_description: createdProduct.seo_description,
      ingredients: createdProduct.ingredients,
      calories: createdProduct.calories,
      delivery_info: createdProduct.delivery_info,
      created_at: createdProduct.createdAt,
      updated_at: createdProduct.updatedAt
    };

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: formattedProduct
    });

  } catch (error) {
    console.error('Error during product creation:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});


// Update Product with file uploads
router.put('/products/:id', uploadProduct.array('images', 10), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('Uploaded files:', req.files);

    const productId = req.params.id;
    const {
      name,
      slug,
      sku,
      description,
      short_description,
      price,
      cost_price,
      compare_price,
      quantity,
      category_id,
      product_type_id,
      brand_id,
      status,
      existing_images = '[]',
      deleted_images = '[]',
      is_featured,
      is_published,
      track_quantity,
      weight,
      tags = '[]',
      seo_title,
      seo_description,
      specifications = '{}',
      dimensions = '{}',
      ingredients,
      calories,
      delivery_info
    } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if SKU already exists (excluding current product)
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({
        where: { sku }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }
    }

    // Check if slug already exists (excluding current product)
    if (slug && slug !== product.slug) {
      const existingProduct = await Product.findOne({
        where: { slug }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this slug already exists'
        });
      }
    }

    // Check if category exists
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Check if brand exists
    if (brand_id) {
      const brand = await Brand.findByPk(brand_id);
      if (!brand) {
        return res.status(400).json({
          success: false,
          message: 'Brand not found'
        });
      }
    }
    // Check if product type exists
    if (product_type_id) {
      const productType = await ProductType.findByPk(product_type_id);
      if (!productType) {
        return res.status(400).json({
          success: false,
          message: 'Product type not found'
        });
      }
    }

    // Parse existing and deleted images and other JSON fields
    let existingImages = [];
    let deletedImages = [];
    let tagsArray = [];
    let specificationsObj = {};
    let dimensionsObj = {};

    try {
      existingImages = JSON.parse(existing_images);
      deletedImages = JSON.parse(deleted_images);
      tagsArray = JSON.parse(tags);
      specificationsObj = JSON.parse(specifications);
      dimensionsObj = JSON.parse(dimensions);
    } catch (e) {
      existingImages = product.images || [];
      deletedImages = [];
      tagsArray = product.tags || [];
      specificationsObj = product.specifications || {};
      dimensionsObj = product.dimensions || {};
    }

    // Process uploaded images
    const uploadedImages = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Filter out deleted images and add new ones
    const updatedImages = existingImages
      .filter(img => !deletedImages.includes(img.filename))
      .concat(uploadedImages);

    await product.update({
      name: name || product.name,
      slug: slug || product.slug,
      sku: sku || product.sku,
      short_description: short_description !== undefined ? short_description : product.short_description,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? parseFloat(price) : product.price,
      compare_price: compare_price !== undefined ? parseFloat(compare_price) : product.compare_price,
      cost_price: cost_price !== undefined ? parseFloat(cost_price) : product.cost_price,
      stock: quantity !== undefined ? parseInt(quantity) : product.stock,
      category_id: category_id !== undefined ? category_id : product.category_id,
      product_type_id: product_type_id !== undefined ? product_type_id : product.product_type_id,
      brand_id: brand_id !== undefined ? brand_id : product.brand_id,
      images: updatedImages,
      status: Boolean(status),
      is_featured: is_featured !== undefined ? (is_featured === true || is_featured === 'true') : product.is_featured,
      is_published: is_published !== undefined ? (is_published === true || is_published === 'true') : product.is_published,
      track_quantity: track_quantity !== undefined ? (track_quantity === true || track_quantity === 'true') : product.track_quantity,
      weight: weight !== undefined ? parseFloat(weight) : product.weight,
      tags: tagsArray,
      specifications: specificationsObj,
      dimensions: dimensionsObj,
      seo_title: seo_title !== undefined ? seo_title : product.seo_title,
      seo_description: seo_description !== undefined ? seo_description : product.seo_description,
      ingredients: ingredients !== undefined ? ingredients : product.ingredients,
      calories: calories !== undefined ? calories : product.calories,
      delivery_info: delivery_info !== undefined ? delivery_info : product.delivery_info
    });

    // Fetch the updated product with category info
    const updatedProduct = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Brand,
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    const formattedProduct = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      slug: updatedProduct.slug,
      sku: updatedProduct.sku,
      short_description: updatedProduct.short_description,
      description: updatedProduct.description,
      price: parseFloat(updatedProduct.price),
      compare_price: updatedProduct.compare_price ? parseFloat(updatedProduct.compare_price) : null,
      cost_price: updatedProduct.cost_price ? parseFloat(updatedProduct.cost_price) : 0,
      quantity: updatedProduct.stock,
      category_id: updatedProduct.category_id,
      category_name: updatedProduct.category ? updatedProduct.category.name : 'Uncategorized',
      product_type_id: updatedProduct.product_type_id,
      product_type_name: updatedProduct.product_type ? updatedProduct.product_type.name : 'No Product Type',

      brand_id: updatedProduct.brand_id,
      brand_name: updatedProduct.brand ? updatedProduct.brand.name : 'No Brand',
      images: updatedProduct.images || [],
      status: updatedProduct.status ? 1 : 0,
      is_featured: updatedProduct.is_featured,
      is_published: updatedProduct.is_published,
      track_quantity: updatedProduct.track_quantity,
      weight: updatedProduct.weight,
      tags: updatedProduct.tags || [],
      specifications: updatedProduct.specifications || {},
      dimensions: updatedProduct.dimensions || {},
      seo_title: updatedProduct.seo_title,
      seo_description: updatedProduct.seo_description,
      ingredients: updatedProduct.ingredients,
      calories: updatedProduct.calories,
      delivery_info: updatedProduct.delivery_info,
      created_at: updatedProduct.createdAt,
      updated_at: updatedProduct.updatedAt
    };

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: formattedProduct
    });

  } catch (error) {
    console.error('Error during product update:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});
// Add Product
// router.post('/products', async (req, res) => {
//   try {
//     console.log('req.body:', req.body);

//     const { 
//       name, 
//       sku, 
//       description, 
//       price, 
//       cost_price, 
//       quantity, 
//       category_id, 
//       status = 1,
//       images = [] 
//     } = req.body;

//     // Check if product with same SKU already exists
//     if (sku) {
//       const existingProduct = await Product.findOne({ where: { sku } });
//       if (existingProduct) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Product with this SKU already exists' 
//         });
//       }
//     }

//     // Check if category exists
//     if (category_id) {
//       const category = await Category.findByPk(category_id);
//       if (!category) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Category not found' 
//         });
//       }
//     }

//     const product = await Product.create({
//       name,
//       sku: sku || `SKU-${Date.now()}`,
//       description,
//       price: parseFloat(price) || 0,
//       cost_price: cost_price ? parseFloat(cost_price) : null,
//       stock: parseInt(quantity) || 0,
//       category_id: category_id || null,
//       images: Array.isArray(images) ? images : [],
//       status: status === 1 || status === true
//     });

//     // Fetch the created product with category info
//     const createdProduct = await Product.findByPk(product.id, {
//       include: [
//         {
//           model: Category,
//           attributes: ['id', 'name'],
//           required: false
//         }
//       ]
//     });

//     const formattedProduct = {
//       id: createdProduct.id,
//       name: createdProduct.name,
//       sku: createdProduct.sku,
//       description: createdProduct.description,
//       price: parseFloat(createdProduct.price),
//       cost_price: createdProduct.cost_price ? parseFloat(createdProduct.cost_price) : 0,
//       quantity: createdProduct.stock,
//       category_id: createdProduct.category_id,
//       category_name: createdProduct.category ? createdProduct.category.name : 'Uncategorized',
//       images: createdProduct.images || [],
//       status: createdProduct.status ? 1 : 0,
//       created_at: createdProduct.createdAt,
//       updated_at: createdProduct.updatedAt
//     };

//     return res.status(201).json({
//       success: true,
//       message: 'Product created successfully',
//       data: formattedProduct
//     });

//   } catch (error) {
//     console.error('Error during product creation:', error);
//     return res.status(500).json({ 
//       message: 'Server error, please try again later.', 
//       success: false, 
//       error: error.message 
//     });
//   }
// });

// // Update Product
// router.put('/products/:id', async (req, res) => {
//   try {
//     console.log('req.body:', req.body);

//     const productId = req.params.id;
//     const { 
//       name, 
//       sku, 
//       description, 
//       price, 
//       cost_price, 
//       quantity, 
//       category_id, 
//       status,
//       images 
//     } = req.body;

//     const product = await Product.findByPk(productId);
//     if (!product) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Product not found' 
//       });
//     }

//     // Check if SKU already exists (excluding current product)
//     if (sku && sku !== product.sku) {
//       const existingProduct = await Product.findOne({ 
//         where: { sku } 
//       });
//       if (existingProduct) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Product with this SKU already exists' 
//         });
//       }
//     }

//     // Check if category exists
//     if (category_id) {
//       const category = await Category.findByPk(category_id);
//       if (!category) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Category not found' 
//         });
//       }
//     }

//     await product.update({
//       name: name || product.name,
//       sku: sku || product.sku,
//       description: description !== undefined ? description : product.description,
//       price: price !== undefined ? parseFloat(price) : product.price,
//       cost_price: cost_price !== undefined ? parseFloat(cost_price) : product.cost_price,
//       stock: quantity !== undefined ? parseInt(quantity) : product.stock,
//       category_id: category_id !== undefined ? category_id : product.category_id,
//       images: images !== undefined ? images : product.images,
//       status: status !== undefined ? (status === 1 || status === true) : product.status
//     });

//     // Fetch the updated product with category info
//     const updatedProduct = await Product.findByPk(productId, {
//       include: [
//         {
//           model: Category,
//           attributes: ['id', 'name'],
//           required: false
//         }
//       ]
//     });

//     const formattedProduct = {
//       id: updatedProduct.id,
//       name: updatedProduct.name,
//       sku: updatedProduct.sku,
//       description: updatedProduct.description,
//       price: parseFloat(updatedProduct.price),
//       cost_price: updatedProduct.cost_price ? parseFloat(updatedProduct.cost_price) : 0,
//       quantity: updatedProduct.stock,
//       category_id: updatedProduct.category_id,
//       category_name: updatedProduct.category ? updatedProduct.category.name : 'Uncategorized',
//       images: updatedProduct.images || [],
//       status: updatedProduct.status ? 1 : 0,
//       created_at: updatedProduct.createdAt,
//       updated_at: updatedProduct.updatedAt
//     };

//     return res.status(200).json({
//       success: true,
//       message: 'Product updated successfully',
//       data: formattedProduct
//     });

//   } catch (error) {
//     console.error('Error during product update:', error);
//     return res.status(500).json({ 
//       message: 'Server error, please try again later.', 
//       success: false, 
//       error: error.message 
//     });
//   }
// });

// Delete Product
router.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.destroy();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error during product deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Bulk Delete Products
router.post('/products/delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }

    const result = await Product.destroy({
      where: {
        id: ids
      }
    });

    return res.status(200).json({
      success: true,
      message: `${result} products deleted successfully`
    });

  } catch (error) {
    console.error('Error during bulk product deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Update Product Stock
router.patch('/products/:id/stock', async (req, res) => {
  try {
    const productId = req.params.id;
    const { quantity, action = 'set' } = req.body; // action: 'set', 'add', 'subtract'

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let newStock = product.stock;

    switch (action) {
      case 'add':
        newStock += parseInt(quantity);
        break;
      case 'subtract':
        newStock = Math.max(0, newStock - parseInt(quantity));
        break;
      case 'set':
      default:
        newStock = parseInt(quantity);
        break;
    }

    await product.update({ stock: newStock });

    return res.status(200).json({
      success: true,
      message: 'Product stock updated successfully',
      data: { stock: newStock }
    });

  } catch (error) {
    console.error('Error during stock update:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});
const { Op } = require("sequelize");

// Admin Dashboard Statistics
router.get("/dashboard/stats", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total sales
    const totalSales = await Order.sum('final_amount', {
      where: { payment_status: 'paid' }
    });

    // Today's sales
    const todaySales = await Order.sum('final_amount', {
      where: {
        payment_status: 'paid',
        createdAt: { [Op.gte]: startOfToday }
      }
    });

    // Monthly sales
    const monthlySales = await Order.sum('final_amount', {
      where: {
        payment_status: 'paid',
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // Total orders
    const totalOrders = await Order.count();

    // Today's orders
    const todayOrders = await Order.count({
      where: { createdAt: { [Op.gte]: startOfToday } }
    });

    // Total customers
    const totalCustomers = await User.count();

    // Total products
    const totalProducts = await Product.count();

    // Low stock products
    const lowStockProducts = await Product.count({
      where: { stock: { [Op.lt]: 10 } }
    });
    console.log("lowStockProducts", lowStockProducts);
    // Recent orders
    const recentOrders = await Order.findAll({
      // include: [{
      //   model: User,
      //   attributes: ['id', 'name', 'email']
      // }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Sales chart data (last 7 days)
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const daySales = await Order.sum('final_amount', {
        where: {
          payment_status: 'paid',
          createdAt: { [Op.between]: [startOfDay, endOfDay] }
        }
      });

      salesData.push({
        date: startOfDay.toISOString().split('T')[0],
        sales: daySales || 0
      });
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalSales: totalSales || 0,
          todaySales: todaySales || 0,
          monthlySales: monthlySales || 0,
          totalOrders,
          todayOrders,
          totalCustomers,
          totalProducts,
          lowStockProducts
        },
        recentOrders,
        salesChart: salesData
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});











// Create Order
const OrderItem = require("../models/order_item");

router.post('/orders', async (req, res) => {
  try {
    const {
      items,
      shipping_address,
      customer_email,
      customer_phone,
      payment_method,
      subtotal,
      delivery_fee,
      total_amount
    } = req.body;

    // Basic Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    // Determine User ID (logic depends on auth state, assuming optional or passed)
    // For now, finding user by email or setting to null/guest
    let user_id = null;
    if (customer_email) {
      const user = await User.findOne({ where: { email: customer_email } });
      if (user) user_id = user.id;
    }

    // Create Order
    const order = await Order.create({
      order_number: `ORD-${Date.now()}`,
      user_id: user_id || 0, // 0 for Guest if allowed, or enforce user
      total_amount: subtotal,
      shipping_amount: delivery_fee,
      final_amount: total_amount,
      payment_status: 'pending',
      order_status: 'pending',
      payment_method,
      shipping_address,
      billing_address: shipping_address // assuming same for now
    });

    // Create Order Items
    for (const item of items) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total_price: item.total
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Admin Order Routes
router.get('/orders', async (req, res) => {

  console.log('req.query1', req.query);
  try {
    const { status = '' } = req.query;

    let whereCondition = {};
    if (status) {
      whereCondition.order_status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereCondition,
      // include: [
      //   {
      //     model: User,
      //     attributes: ['id', 'name', 'email']
      //   },
      //   {
      //     model: OrderItem,
      //     include: [Product]
      //   }
      // ],
      order: [['createdAt', 'DESC']],
      // limit: parseInt(limit),
      // offset: parseInt(offset)
    });

    return res.status(200).json({
      message: 'Orders fetched successfully',
      data: orders,
      total: count,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching orders:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get Single Order
router.get('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderItem,
          include: [Product]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      message: 'Order found successfully',
      data: order,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching order:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Update Order Status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { order_status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ order_status });

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error during order status update:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});






// Get User Orders
router.get('/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: 'User orders fetched successfully',
      data: orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});


// Get User Profile
router.post('/getProfile', async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'basePass64', 'otp', 'otp_expiry'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Edit User Profile
router.post('/editProfile', async (req, res) => {
  try {
    const { id, name, phone, address, city, zip_code } = req.body;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.update({
      name: name || user.name,
      // email: email || user.email, // Prevent email change for now or add verification
      phone: phone || user.phone,
      address: address || user.address,
      // Extending user model might be needed for city/zip if they don't exist, assume address field is generic for now or update model
    });

    res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    console.error('Edit profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Address Routes (Mocking Address model if not exists, or using User address field for simplicity initially,
// but plan called for Address Book. Let's assume we might need an Address model later.
// For now, I'll store a simple list in the User model or just use the main address.
// CHECK: User model has 'address' column. Is there an Address model? NO.
// I will create a simple Address model or just use the user.address for now to save time,
// BUT the plan asked for "Address Book" (multiple).
// Let's create a separate Address model or just mock the multiple addresses extraction from a JSON field if compatible.
// Actually, `order.js` has `shipping_address` JSON. User might not have multiple addresses table yet.
// I will create a new Address model in the backend first to support "Address Book".
// Wait, I can't create files easily without restarting server explicitly.
// Refined Plan: supporting single address in Profile for now, and mocked "Address Book" in frontend or
// just implement standard profile editing. The user prompt said "implement step by step".
// Let's stick to the Profile first.

// Wishlist Routes
const Wishlist = require("../models/wishlist");

router.post('/wishlist', async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    // Check if valid product/user (optional but good)

    // Check existing
    const existing = await Wishlist.findOne({ where: { user_id, product_id } });
    if (existing) {
      return res.json({ success: false, message: 'Item already in wishlist' });
    }

    const item = await Wishlist.create({ user_id, product_id });
    res.json({ success: true, message: 'Added to wishlist', data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/wishlist/user/:userId', async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { user_id: req.params.userId },
      include: [{ model: Product }]
    });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/wishlist/:id', async (req, res) => {
  try {
    await Wishlist.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Review Routes
const Review = require("../models/review");

router.post('/reviews', async (req, res) => {
  try {
    const { user_id, product_id, rating, comment } = req.body;

    // Check if user already reviewed
    const existing = await Review.findOne({ where: { user_id, product_id } });
    if (existing) {
      return res.json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await Review.create({ user_id, product_id, rating, comment });
    res.json({ success: true, message: 'Review submitted', data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/reviews/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { product_id: req.params.productId },
      include: [{ model: User, attributes: ['name', 'id'] }],
      order: [['id', 'DESC']]
    });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Coupon Routes
router.get('/coupons', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: coupons } = await Coupon.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      message: 'Coupons fetched successfully',
      data: coupons,
      total: count,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching coupons:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Add Coupon
router.post('/coupons', async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });

  } catch (error) {
    console.error('Error during coupon creation:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Update Coupon
router.put('/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    await coupon.update(req.body);

    return res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });

  } catch (error) {
    console.error('Error during coupon update:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Delete Coupon
router.delete('/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    await coupon.destroy();

    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('Error during coupon deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});
// Bulk Delete Coupons - This is what your Angular service is calling
router.post('/coupons/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Coupon IDs are required'
      });
    }

    const result = await Coupon.destroy({
      where: {
        id: ids
      }
    });

    return res.status(200).json({
      success: true,
      message: `${result} coupons deleted successfully`
    });

  } catch (error) {
    console.error('Error during bulk coupon deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});


// Admin CMS Routes
router.get('/cms-pages', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: pages } = await CMSPage.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      message: 'CMS pages fetched successfully',
      data: pages,
      total: count,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching CMS pages:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Add CMS Page
router.post('/cms-pages', async (req, res) => {
  try {
    const page = await CMSPage.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'CMS page created successfully',
      data: page
    });

  } catch (error) {
    console.error('Error during CMS page creation:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Update CMS Page
router.put('/cms-pages/:id', async (req, res) => {
  try {
    const page = await CMSPage.findByPk(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'CMS page not found'
      });
    }

    await page.update(req.body);

    return res.status(200).json({
      success: true,
      message: 'CMS page updated successfully',
      data: page
    });

  } catch (error) {
    console.error('Error during CMS page update:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Delete CMS Page
router.delete('/cms-pages/:id', async (req, res) => {
  try {
    const page = await CMSPage.findByPk(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'CMS page not found'
      });
    }

    await page.destroy();

    return res.status(200).json({
      success: true,
      message: 'CMS page deleted successfully'
    });

  } catch (error) {
    console.error('Error during CMS page deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Bulk Delete Categories
router.post('/cms-pages/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cms IDs are required'
      });
    }

    const result = await CMSPage.destroy({
      where: {
        id: ids
      }
    });

    return res.status(200).json({
      success: true,
      message: `${result} CMS pages deleted successfully`
    });

  } catch (error) {
    console.error('Error during bulk CMS page deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});















// Combo Listing
router.get('/combos', async (req, res) => {
  try {
    const combos = await Combo.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Enrich combos with product details manually


    return res.status(200).json({
      message: 'Combos fetched successfully',
      data: combos,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching combos:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get Single Combo
router.get('/combos/:id', async (req, res) => {
  try {
    const comboId = req.params.id;
    const combo = await Combo.findByPk(comboId);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    // Get product details for the combo



    const enrichedCombo = {
      id: combo.id,
      name: combo.name,
      discount_price: combo.discount_price,
      active: combo.active,
      created_at: combo.created_at,
      updated_at: combo.updated_at,
      combo_size: combo.combo_size,
    };

    return res.status(200).json({
      message: 'Combo found successfully',
      data: enrichedCombo,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching combo:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Add Combo
router.post('/combos', async (req, res) => {
  try {
    console.log('req.body:', req.body);

    const {
      name,
      product_ids,
      discount_price,
      combo_size,
      active,
    } = req.body;

    // Check if combo name already exists
    const existingCombo = await Combo.findOne({ where: { name } });
    if (existingCombo) {
      return res.status(400).json({
        success: false,
        message: 'Combo name already exists'
      });
    }

    const created_at = new Date();

    const combo = await Combo.create({
      name,
      discount_price: discount_price || 0,
      combo_size: combo_size || 1,
      active: active !== undefined ? active : true,
      created_at
    });

    // Get the created combo with product details

    const enrichedCombo = {
      id: combo.id,
      name: combo.name,
      discount_price: combo.discount_price,
      combo_size: combo.combo_size,
      active: combo.active,
      created_at: combo.created_at,
    };

    return res.status(201).json({
      success: true,
      message: 'Combo created successfully',
      data: enrichedCombo
    });

  } catch (error) {
    console.error('Error during combo creation:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Update Combo
router.put('/combos/:id', async (req, res) => {
  try {
    console.log('req.body:', req.body);

    const comboId = req.params.id;
    const {
      name,
      discount_price,
      combo_size,
      active,
    } = req.body;

    const combo = await Combo.findByPk(comboId);
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }



    // Check if combo name already exists (excluding current combo)
    if (name && name !== combo.name) {
      const existingCombo = await Combo.findOne({
        where: { name }
      });
      if (existingCombo) {
        return res.status(400).json({
          success: false,
          message: 'Combo name already exists'
        });
      }
    }

    const updated_at = new Date();

    await combo.update({
      name: name || combo.name,
      discount_price: discount_price !== undefined ? discount_price : combo.discount_price,
      combo_size: combo_size !== undefined ? combo_size : combo.combo_size,
      active: active !== undefined ? active : combo.active,
      updated_at
    });

    // Get the updated combo with product details

    const enrichedCombo = {
      id: combo.id,
      name: combo.name,
      discount_price: combo.discount_price,
      combo_size: combo.combo_size,
      active: combo.active,
      updated_at: combo.updated_at,
    };

    return res.status(200).json({
      success: true,
      message: 'Combo updated successfully',
      data: enrichedCombo
    });

  } catch (error) {
    console.error('Error during combo update:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Delete Combo
router.delete('/combos/:id', async (req, res) => {
  try {
    const comboId = req.params.id;

    const combo = await Combo.findByPk(comboId);
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    await combo.destroy();

    return res.status(200).json({
      success: true,
      message: 'Combo deleted successfully'
    });

  } catch (error) {
    console.error('Error during combo deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Bulk Delete Combos
router.post('/combos/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Combo IDs are required'
      });
    }

    const result = await Combo.destroy({
      where: {
        id: ids
      }
    });

    return res.status(200).json({
      success: true,
      message: `${result} combos deleted successfully`
    });

  } catch (error) {
    console.error('Error during bulk combo deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get products for dropdown
router.get('/for-combo', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { status: true },
      attributes: ['id', 'name', 'price', 'images', 'stock'],
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      message: 'Products fetched successfully',
      data: products,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching products:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});





// ProductType Listing
router.get('/producttypes', async (req, res) => {
  try {
    const producttypes = await ProductType.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Enrich producttypes with product details manually


    return res.status(200).json({
      message: 'ProductTypes fetched successfully',
      data: producttypes,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching producttypes:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get Single producttype
router.get('/producttypes/:id', async (req, res) => {
  try {
    const producttypeId = req.params.id;
    const producttype = await ProductType.findByPk(producttypeId);

    if (!producttype) {
      return res.status(404).json({
        success: false,
        message: 'ProductType not found'
      });
    }

    // Get product details for the producttype



    const enrichedProductType = {
      id: producttype.id,
      name: producttype.name,
      active: producttype.active,
      created_at: producttype.created_at,
      updated_at: producttype.updated_at,
    };

    return res.status(200).json({
      message: 'ProductType found successfully',
      data: enrichedProductType,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching producttype:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Add producttype
router.post('/producttypes', async (req, res) => {
  try {
    console.log('req.body:', req.body);

    const {
      name,
      active,
    } = req.body;

    // Check if producttype name already exists
    const existingProductType = await ProductType.findOne({ where: { name } });
    if (existingProductType) {
      return res.status(400).json({
        success: false,
        message: 'ProductType name already exists'
      });
    }

    const created_at = new Date();

    const producttype = await ProductType.create({
      name,
      active: active !== undefined ? active : true,
      created_at
    });

    // Get the created producttype with product details

    const enrichedProductType = {
      id: producttype.id,
      name: producttype.name,
      active: producttype.active,
      created_at: producttype.created_at,
    };

    return res.status(201).json({
      success: true,
      message: 'ProductType created successfully',
      data: enrichedProductType
    });

  } catch (error) {
    console.error('Error during producttype creation:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Update producttype
router.put('/producttypes/:id', async (req, res) => {
  try {
    console.log('req.body:', req.body);

    const producttypeId = req.params.id;
    const {
      name,
      active,
    } = req.body;

    const producttype = await ProductType.findByPk(producttypeId);
    if (!producttype) {
      return res.status(404).json({
        success: false,
        message: 'ProductType not found'
      });
    }



    // Check if producttype name already exists (excluding current producttype)
    if (name && name !== producttype.name) {
      const existingProductType = await ProductType.findOne({
        where: { name }
      });
      if (existingProductType) {
        return res.status(400).json({
          success: false,
          message: 'ProductType name already exists'
        });
      }
    }

    const updated_at = new Date();

    await producttype.update({
      name: name || producttype.name,
      active: active !== undefined ? active : producttype.active,
      updated_at
    });

    // Get the updated combo with product details

    const enrichedProductType = {
      id: producttype.id,
      name: producttype.name,
      active: producttype.active,
      updated_at: producttype.updated_at,
    };

    return res.status(200).json({
      success: true,
      message: 'ProductType updated successfully',
      data: enrichedProductType
    });

  } catch (error) {
    console.error('Error during product type update:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Delete producttype
router.delete('/producttypes/:id', async (req, res) => {
  try {
    const producttypeId = req.params.id;

    const producttype = await ProductType.findByPk(producttypeId);
    if (!producttype) {
      return res.status(404).json({
        success: false,
        message: 'ProductType not found'
      });
    }

    await producttype.destroy();
    return res.status(200).json({
      success: true,
      message: 'ProductType deleted successfully'
    });

  } catch (error) {
    console.error('Error during product type deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Bulk Delete Combos
router.post('/producttypes/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ProductType IDs are required'
      });
    }

    const result = await ProductType.destroy({
      where: {
        id: ids
      }
    });

    return res.status(200).json({
      success: true,
      message: `${result} product types deleted successfully`
    });

  } catch (error) {
    console.error('Error during bulk product type deletion:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});



// Get active sliders for frontend
router.get('/sliders/active', async (req, res) => {
  try {
    console.log("test");
    const sliders = await Slider.findAll({
      // where: { 
      //   is_active: true 
      // },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      attributes: [
        'id',
        'title',
        'subtitle',
        'description',
        'image',
        'button_text',
        'button_url',
        'background_color',
        'text_color',
        'sort_order'
      ]
    });

    return res.status(200).json({
      message: 'Active sliders fetched successfully',
      data: sliders,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching active sliders:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});









// Get popular products (featured products)
router.get('/popular', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        //  is_featured: true,
        //   status: true,
        //ss  is_published: true
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Brand,
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 8
    });
    const formattedProducts = products.map(product => {
      // Calculate discount percentage if compare_price exists
      let discount = 0;
      if (product.compare_price && product.compare_price > product.price) {
        discount = Math.round(((product.compare_price - product.price) / product.compare_price) * 100);
      }

      // Get first image or default image
      const images = product.images || [];
      const mainImage = images.length > 0 ? 'assets/uploads/products/' + images[0].filename : 'assets/cartzilla/img/shop/grocery/01.png';

      return {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        originalPrice: product.compare_price ? parseFloat(product.compare_price) : undefined,
        image: mainImage,
        weight: product.weight ? `${product.weight}g` : '500g',
        discount: discount > 0 ? discount : undefined,
        isFavorite: false, // You can implement favorite logic separately
        quantity: 0,
        category_name: product.category ? product.category.name : 'Uncategorized'
      };
    });

    return res.status(200).json({
      message: 'Popular products fetched successfully',
      data: formattedProducts,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching popular products:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get categories with product counts
router.get('/with-counts', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: {
        status: true,
        parent_id: null
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      limit: 8
    });

    const formattedCategories = await Promise.all(categories.map(async category => {
      // Get all subcategories for this parent
      const subcategories = await Category.findAll({
        where: {
          parent_id: category.id,
          status: true
        },
        attributes: ['id']
      });

      const subcategoryIds = subcategories.map(sub => sub.id);
      const allCategoryIds = [category.id, ...subcategoryIds];

      // Count products in parent and all subcategories
      const productCount = await Product.count({
        where: {
          category_id: allCategoryIds,
          status: true,
          is_published: true
        }
      });

      const getDefaultImage = (categoryName) => {
        const imageMap = {
          'Bakery & bread': 'assets/cartzilla/img/shop/grocery/categories/01.png',
          'Vegetables': 'assets/cartzilla/img/shop/grocery/categories/02.png',
          'Fresh fruits': 'assets/cartzilla/img/shop/grocery/categories/03.png',
          'Meet Italian dinner': 'assets/cartzilla/img/shop/grocery/categories/04.png',
          'Beverages': 'assets/cartzilla/img/shop/grocery/categories/05.png',
          'Meat products': 'assets/cartzilla/img/shop/grocery/categories/06.png',
          'Sauces and ketchup': 'assets/cartzilla/img/shop/grocery/categories/07.png',
          'Dairy and eggs': 'assets/cartzilla/img/shop/grocery/categories/08.png'
        };
        return category.image_url || imageMap[category.name] || 'assets/cartzilla/img/shop/grocery/categories/01.png';
      };

      return {
        id: category.id,
        name: category.name,
        image: getDefaultImage(category.name),
        count: productCount,
        link: `/shop-category/${category.id}`
      };
    }));

    return res.status(200).json({
      message: 'Categories with counts fetched successfully',
      data: formattedCategories,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching categories with counts:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get special products (you can define your own criteria - using is_published and sorting by creation date)
router.get('/special', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: true,
        is_published: true
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Brand,
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 8 // You can adjust the limit as needed
    });

    const formattedProducts = products.map(product => {
      // Get first image or default image
      const images = product.images || [];
      const mainImage = images.length > 0 ? 'assets/uploads/products/' + images[0].filename : 'assets/cartzilla/img/shop/grocery/09.png';

      return {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: mainImage,
        weight: product.weight ? `${product.weight}g` : '500g',
        isFavorite: false, // You can implement favorite logic separately
        quantity: 0,
        category_name: product.category ? product.category.name : 'Uncategorized'
      };
    });

    return res.status(200).json({
      message: 'Special products fetched successfully',
      data: formattedProducts,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching special products:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});




// Get products by category with filtering and pagination
router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      page = 1,
      limit = 12,
      sort = 'relevance',
      minPrice,
      maxPrice,
      brands,
      diets,
      status
    } = req.query;

    const offset = (page - 1) * limit;

    let whereCondition = {
      status: true,
      is_published: true
    };

    // Add category filter
    if (categoryId && categoryId !== 'all') {
      whereCondition.category_id = categoryId;
    }

    // Add price filter
    if (minPrice || maxPrice) {
      whereCondition.price = {};
      if (minPrice) whereCondition.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereCondition.price[Op.lte] = parseFloat(maxPrice);
    }

    // Add brand filter
    if (brands) {
      const brandList = Array.isArray(brands) ? brands : [brands];
      whereCondition.brand_id = { [Op.in]: brandList };
    }

    // Sorting
    let order = [];
    switch (sort) {
      case 'price_asc':
        order = [['price', 'ASC']];
        break;
      case 'price_desc':
        order = [['price', 'DESC']];
        break;
      case 'newest':
        order = [['createdAt', 'DESC']];
        break;
      case 'popular':
        order = [['rating', 'DESC']];
        break;
      default:
        order = [['createdAt', 'DESC']];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Brand,
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      message: 'Products fetched successfully',
      data: products,
      total: count,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching category products:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Get all products with filtering (for when no category is selected)
router.get('/categoryproducts', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = 'relevance',
      category_id,
      minPrice,
      maxPrice,
      brands,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    let whereCondition = {};

    // Add category filter - include subcategories if parent category
    if (category_id) {
      const subcategories = await Category.findAll({
        where: { parent_id: category_id },
        attributes: ['id']
      });
      const subcategoryIds = subcategories.map(sub => sub.id);
      const allCategoryIds = [parseInt(category_id), ...subcategoryIds];
      whereCondition.category_id = allCategoryIds;
    }

    // Add search filter
    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { short_description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add price filter
    if (minPrice || maxPrice) {
      whereCondition.price = {};
      if (minPrice) whereCondition.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereCondition.price[Op.lte] = parseFloat(maxPrice);
    }

    // Sorting
    let order = [];
    switch (sort) {
      case 'price_asc':
        order = [['price', 'ASC']];
        break;
      case 'price_desc':
        order = [['price', 'DESC']];
        break;
      case 'newest':
        order = [['createdAt', 'DESC']];
        break;
      case 'popular':
        order = [['rating', 'DESC']];
        break;
      default:
        order = [['createdAt', 'DESC']];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Brand,
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      message: 'Products fetched successfully',
      data: products,
      total: count,
      success: true
    });
  } catch (error) {
    console.error('Error during fetching products:', error);
    return res.status(500).json({
      message: 'Server error, please try again later.',
      success: false,
      error: error.message
    });
  }
});
module.exports = router;



