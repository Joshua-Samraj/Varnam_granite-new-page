require('dotenv').config(); // Load secrets from .env
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
    }
};
const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    category: String,
    price: Number,
    stock: String,
    description: String,
    origin: String,
    finish: String,
    images: [String], // Product images
    reviews: [{
        user: String,
        rating: Number,
        text: String,
        images: [String], // <--- MUST BE AN ARRAY like this
        date: { type: Date, default: Date.now }
    }]
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);
// --- API ROUTES ---

// 1. GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
    await connectDB();
    try {
        const products = await Product.find();
        console.log(`📡 Fetched ${products.length} products`);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 2. ADD PRODUCT
app.post('/api/products', async (req, res) => {
    await connectDB();
    try {
        const newProduct = new Product({
            ...req.body,
            id: Date.now(),
            reviews: []
        });
        await newProduct.save();
        console.log(`✨ Product Added: ${newProduct.name}`);
        res.json(newProduct);
    } catch (error) {
        res.status(500).json({ error: "Failed to add product" });
    }
});

// 3. UPDATE PRODUCT
app.put('/api/products/:id', async (req, res) => {
    await connectDB();
    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        console.log(`📝 Product Updated: ID ${req.params.id}`);
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// 4. DELETE PRODUCT
app.delete('/api/products/:id', async (req, res) => {
    await connectDB();
    try {
        await Product.findOneAndDelete({ id: req.params.id });
        console.log(`🗑️ Product Deleted: ID ${req.params.id}`);
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

// 5. LOGIN ROUTE (Fixed Typos)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Check against .env variables
    if (username == process.env.ADMIN_USER && password == process.env.ADMIN_PASS) {
        res.json({ success: true, token: 'Varnam-granites-tokens-123' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
});
// 2. UPDATE REVIEW ROUTE (Handle the array)
app.post('/api/products/:id/reviews', async (req, res) => {
    await connectDB();
    // We expect 'images' (plural) from the frontend
    const { user, rating, text, images } = req.body; 
    const productId = req.params.id;

    if (!user || !rating || !text) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { id: productId },
            { 
                $push: { 
                    reviews: { 
                        user, 
                        rating: parseInt(rating), 
                        text, 
                        images: images || [], // <--- Save the array directly
                        date: new Date() 
                    } 
                } 
            },
            { new: true }
        );

        if (updatedProduct) {
            res.json({ success: true, reviews: updatedProduct.reviews });
        } else {
            res.status(404).json({ error: "Product not found" });
        }
    } catch (error) {
        console.error("Review Error:", error);
        res.status(500).json({ error: "Failed to add review" });
    }
});
// Root Route
app.get('/', (req, res) => {
    res.send("Varnam Granites Backend is Live!");
});

// --- SERVER START ---
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`👉 Test here: http://localhost:${PORT}/api/products`);
    });
}

module.exports = app;