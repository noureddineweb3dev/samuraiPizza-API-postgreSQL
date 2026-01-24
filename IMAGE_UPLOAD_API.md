# Image Upload API Documentation

This document explains how to upload images for menu items from the admin dashboard.

## Overview

The menu API endpoints (`POST /api/menu` and `PATCH /api/menu/:id`) now support image uploads. When creating or updating a menu item, you can optionally include an image file that will be uploaded to Cloudinary and stored in the database.

## Endpoints

### 1. Create Menu Item with Image

**Endpoint:** `POST /api/menu`  
**Authentication:** Required (JWT token)  
**Content-Type:** `multipart/form-data`

#### Request Format

```javascript
const formData = new FormData();

// Required fields
formData.append('name', 'Katana Margherita');
formData.append('unitPrice', '8.5');
formData.append('ingredients', JSON.stringify(['Tomato sauce', 'Mozzarella', 'Basil']));

// Optional fields
formData.append('soldOut', 'false');
formData.append('image', imageFile); // File object from input[type="file"]

// Send request
const response = await fetch('https://your-api.com/api/menu', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    // DO NOT set Content-Type header - browser will set it automatically with boundary
  },
  body: formData,
});

const data = await response.json();
```

#### Response (Success - 201)

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Katana Margherita",
    "unit_price": 8.5,
    "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/menu-items/abc123.jpg",
    "ingredients": ["Tomato sauce", "Mozzarella", "Basil"],
    "sold_out": false,
    "created_at": "2026-01-24T02:22:31.000Z"
  }
}
```

#### Response (Error - 400)

```json
{
  "status": "error",
  "message": "Only image files are allowed!"
}
```

---

### 2. Update Menu Item with Image

**Endpoint:** `PATCH /api/menu/:id`  
**Authentication:** Required (JWT token)  
**Content-Type:** `multipart/form-data`

#### Request Format

```javascript
const formData = new FormData();

// Only include fields you want to update
formData.append('name', 'Updated Pizza Name');
formData.append('unitPrice', '9.5');
formData.append('image', newImageFile); // Optional: new image to replace old one

const response = await fetch(`https://your-api.com/api/menu/${menuItemId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const data = await response.json();
```

#### Response (Success - 200)

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Updated Pizza Name",
    "unit_price": 9.5,
    "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/menu-items/xyz789.jpg",
    "ingredients": ["Tomato sauce", "Mozzarella", "Basil"],
    "sold_out": false,
    "created_at": "2026-01-24T02:22:31.000Z"
  }
}
```

---

## Frontend Implementation Example

### React Component Example

```jsx
import { useState } from 'react';

function MenuItemForm() {
  const [formData, setFormData] = useState({
    name: '',
    unitPrice: '',
    ingredients: '',
    soldOut: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('unitPrice', formData.unitPrice);
    data.append('ingredients', JSON.stringify(formData.ingredients.split(',')));
    data.append('soldOut', formData.soldOut);
    
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      const response = await fetch('https://your-api.com/api/menu', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: data,
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        alert('Menu item created successfully!');
        console.log('Image URL:', result.data.image_url);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Pizza Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={formData.unitPrice}
        onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
        required
      />
      
      <input
        type="text"
        placeholder="Ingredients (comma-separated)"
        value={formData.ingredients}
        onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
      />
      
      <label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        Upload Image
      </label>
      
      {preview && <img src={preview} alt="Preview" style={{ width: 200 }} />}
      
      <button type="submit">Create Menu Item</button>
    </form>
  );
}
```

---

## Image Upload Specifications

- **Accepted formats:** JPG, JPEG, PNG, WebP
- **Max file size:** 5MB
- **Storage:** Cloudinary cloud storage
- **Folder:** `menu-items/`
- **Auto-resize:** Images larger than 800x800px will be resized
- **URL format:** `https://res.cloudinary.com/[cloud-name]/image/upload/v[version]/menu-items/[filename]`

---

## Error Handling

### Common Errors

| Error | Status | Cause |
|-------|--------|-------|
| "Only image files are allowed!" | 400 | File is not an image (wrong MIME type) |
| "File too large" | 400 | Image exceeds 5MB limit |
| "Couldn't find menu item #X" | 404 | Menu item doesn't exist (for PATCH) |
| "Unauthorized" | 401 | Missing or invalid JWT token |

### Error Response Format

```json
{
  "status": "error",
  "message": "Error description here"
}
```

---

## Notes

- Image upload is **optional** - you can create/update menu items without images
- If no image is uploaded, you can still provide an `imageUrl` field with an external URL
- When updating, if no new image is provided, the existing image URL is preserved
- Images are automatically optimized and served via Cloudinary CDN for fast loading
