const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const { Op } = require("sequelize");
const Category = require("../models/category");
const router = express.Router();

const upload = multer({ dest: "uploads/" });

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["sort_order", "ASC"], ["createdAt", "DESC"]],
    });
    return res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
});

// Get parent categories only
router.get("/parents", async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { parent_id: null },
      order: [["name", "ASC"]],
    });
    return res.status(200).json({
      message: "Parent categories fetched successfully",
      data: categories,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
});

// Get categories for dropdown
router.get("/dropdown", async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["name", "ASC"]],
    });
    return res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
});

// Get single category
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    return res.status(200).json({
      message: "Category found successfully",
      data: category,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
});

// Add category
router.post("/", async (req, res) => {
  try {
    const category = await Category.create(req.body);
    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
});

// Update category
router.put("/:id", async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    await category.update(req.body);
    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
});

// Bulk delete categories
router.post("/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Category IDs are required" });
    }
    const result = await Category.destroy({ where: { id: ids } });
    return res.status(200).json({
      success: true,
      message: `${result} categories deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
});

// CSV Import
router.post("/import-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const results = [];
    const errors = [];
    const categoryMap = new Map();

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          // First pass: Create parent categories
          for (const row of results) {
            if (!row.parent_category) {
              try {
                const category = await Category.create({
                  name: row.name,
                  slug: row.slug,
                  description: row.description || null,
                  image_url: row.image_url || null,
                  status: row.status === "true" || row.status === "1",
                  is_featured: row.is_featured === "true" || row.is_featured === "1",
                  sort_order: parseInt(row.sort_order) || 0,
                  meta_title: row.meta_title || null,
                  meta_description: row.meta_description || null,
                });
                categoryMap.set(row.name, category.id);
              } catch (error) {
                errors.push({ row: row.name, error: error.message });
              }
            }
          }

          // Second pass: Create subcategories
          for (const row of results) {
            if (row.parent_category) {
              try {
                const parentId = categoryMap.get(row.parent_category);
                if (!parentId) {
                  const parent = await Category.findOne({ where: { name: row.parent_category } });
                  if (parent) {
                    categoryMap.set(row.parent_category, parent.id);
                  }
                }

                await Category.create({
                  name: row.name,
                  slug: row.slug,
                  description: row.description || null,
                  image_url: row.image_url || null,
                  status: row.status === "true" || row.status === "1",
                  parent_id: categoryMap.get(row.parent_category) || null,
                  is_featured: row.is_featured === "true" || row.is_featured === "1",
                  sort_order: parseInt(row.sort_order) || 0,
                  meta_title: row.meta_title || null,
                  meta_description: row.meta_description || null,
                });
              } catch (error) {
                errors.push({ row: row.name, error: error.message });
              }
            }
          }

          fs.unlinkSync(req.file.path);

          return res.status(200).json({
            success: true,
            message: `Imported ${results.length - errors.length} categories successfully`,
            errors: errors.length > 0 ? errors : undefined,
          });
        } catch (error) {
          fs.unlinkSync(req.file.path);
          return res.status(500).json({
            message: "Error processing CSV",
            success: false,
            error: error.message,
          });
        }
      });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
