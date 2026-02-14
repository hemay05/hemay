# Category CSV Import Guide

## How to Import Categories

1. Navigate to **Site Admin > Categories**
2. Click the **Upload File** icon (📤) in the toolbar
3. Select your CSV file
4. Wait for the import to complete

## CSV Format

Your CSV file must include the following columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| name | Yes | Category name | Electronics |
| slug | Yes | URL-friendly identifier | electronics |
| description | No | Category description | Electronic devices and accessories |
| image_url | No | Image URL or path | /uploads/electronics.jpg |
| status | No | Active status (true/false) | true |
| parent_category | No | Parent category name (for subcategories) | Electronics |
| is_featured | No | Featured status (true/false) | true |
| sort_order | No | Display order (number) | 1 |
| meta_title | No | SEO meta title | Electronics - Shop Now |
| meta_description | No | SEO meta description | Buy the latest electronics |

## Important Notes

1. **Parent Categories First**: Parent categories must be listed before their subcategories in the CSV
2. **Parent Category Reference**: Use the exact category name in the `parent_category` column
3. **Boolean Values**: Use `true` or `1` for true, anything else for false
4. **Slug Uniqueness**: Each slug must be unique across all categories

## Sample CSV

See `category-import-template.csv` for a working example.

## Installation

Before using the CSV import feature, install the required dependency:

```bash
cd backend/auth-service
npm install csv-parser
```

Then restart your backend server.
