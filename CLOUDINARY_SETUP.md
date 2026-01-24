# ⚠️ IMPORTANT: Environment Variables Required

Before testing the image upload functionality, you need to add Cloudinary credentials to your `.env` file.

## Steps to Complete:

### 1. Create a Cloudinary Account
- Go to https://cloudinary.com
- Sign up for a free account (no credit card required)
- Free tier includes: 25GB storage + 25GB bandwidth/month

### 2. Get Your Credentials
- After signing up, go to your **Dashboard**
- Look for the **Account Details** section
- You'll see three values:
  - **Cloud Name**
  - **API Key**
  - **API Secret**

### 3. Add to Your `.env` File
Open your `.env` file in `samurai-pizza-backend` and add these three lines:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Replace** `your_cloud_name_here`, `your_api_key_here`, and `your_api_secret_here` with the actual values from your Cloudinary dashboard.

### 4. Restart Your Server
After adding the credentials, restart your backend server:

```bash
npm run dev
```

---

## Example `.env` File

Your complete `.env` file should look something like this:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Cloudinary (NEW)
CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456

# Server
PORT=3000
```

---

## Security Note

⚠️ **Never commit your `.env` file to Git!**

Your `.env` file should already be in `.gitignore`. These credentials are sensitive and should remain private.

---

## Testing After Setup

Once you've added the credentials and restarted the server, you can test the image upload:

1. Use Postman or Thunder Client
2. Send a POST request to `http://localhost:3000/api/menu`
3. Set Content-Type to `multipart/form-data`
4. Add your authentication token
5. Add form fields: `name`, `unitPrice`, `ingredients`, and `image` (file)
6. Send the request

If everything is configured correctly, you should get back a response with an `image_url` from Cloudinary!
