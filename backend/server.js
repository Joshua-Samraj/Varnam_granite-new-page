require('dotenv').config(); // Load secrets from .env
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(cors()); // Allow frontend to talk to backend
app.use(bodyParser.json()); // Parse JSON bodies

// --- DATABASE CONNECTION ---
// This optimized function works for both Local testing and Vercel
const connectDB = async () => {
    try {
        // If already connected, do nothing (saves resources)
        if (mongoose.connection.readyState === 1) {
            return;
        }
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully");
        
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
    }
};

// --- SCHEMA DEFINITION ---
const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    category: String,
    price: Number,
    stock: String,
    description: String,
    origin: String,
    finish: String,
    images: [String],
    reviews: Array
}, { collection: 'products' }); // <--- Forces collection name to be 'products'

const Product = mongoose.model('Product', productSchema);

// --- API ROUTES ---

// 1. GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
    await connectDB(); // Ensure DB is connected
    try {
        const products = await Product.find();
        console.log(`📡 Fetched ${products.length} products`);
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 2. ADD PRODUCT
app.post('/api/products', async (req, res) => {
    await connectDB();
    try {
        const newProduct = new Product({
            ...req.body,
            id: Date.now(), // Auto-generate simple ID
            reviews: []
        });
        await newProduct.save();
        console.log(`✨ Product Added: ${newProduct.name}`);
        res.json(newProduct);
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ error: "Failed to add product" });
    }
});

// 3. UPDATE PRODUCT
app.put('/api/products/:id', async (req, res) => {
    await connectDB();
    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { id: req.params.id }, // Find by custom ID
            req.body,
            { new: true } // Return the updated document
        );
        console.log(`📝 Product Updated: ID ${req.params.id}`);
        res.json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
});

// 4. DELETE PRODUCT
app.delete('/api/products/:id', async (req, res) => {
    await connectDB();
    try {
        await Product.findOneAndDelete({ id: req.params.id });
        console.log(`🗑️  Product Deleted: ID ${req.params.id}`);
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
});
// login route
app.post('/api/login',(req, res) =>{
    const {username , password} = req.body;
    if(username == process.env.ADMIN_USER && password == process.env.ADMIN_PASS){
        res.json({ success: true , token : 'Varnam-granites-tokens-123'});
        
    }
    else {
        res.status(401).json({success : false , massage: 'Invali Credentials'});
    }

});

// --- NEW: ADD REVIEW ROUTE ---
app.post('/api/products/:id/reviews', async (req, res) => {
    await connectDB();
    const { user, rating, text } = req.body;
    const productId = req.params.id;

    // Validate input
    if (!user || !rating || !text) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Use MongoDB $push to add to the reviews array
        const updatedProduct = await Product.findOneAndUpdate(
            { id: productId },
            { 
                $push: { 
                    reviews: { 
                        user, 
                        rating: parseInt(rating), 
                        text, 
                        date: new Date() 
                    } 
                } 
            },
            { new: true } // Return the updated product
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

// Health Check Route
app.get('/', (req, res) => {
    res.send("Varnam granites Backend is Live & Running!");
});

// --- SERVER START ---
// This condition prevents Vercel from trying to start the server twice
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`👉 Test here: http://localhost:${PORT}/api/products`);
    });
}

// Export app for Vercel
module.exports = app;