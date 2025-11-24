require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) return;
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) { console.error("❌ DB Error:", error); }
};

// --- SCHEMA (Ensuring reviewTokens is initialized) ---
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
    reviewTokens: { type: [String], default: [] }, // <--- Forced Array Default
    reviews: [{
        user: String,
        rating: Number,
        text: String,
        images: [String],
        date: { type: Date, default: Date.now }
    }]
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

// --- ROUTES ---

app.get('/api/products', async (req, res) => {
    await connectDB();
    const products = await Product.find();
    res.json(products);
});

// --- 1. GENERATE TOKEN ROUTE (Fixed) ---
app.post('/api/products/:id/generate-token', async (req, res) => {
    await connectDB();
    const productId = parseInt(req.params.id); // Ensure Number
    console.log(`🔑 Generating token for Product ID: ${productId}`);

    try {
        const token = crypto.randomBytes(16).toString('hex');

        // Update query using custom 'id' field
        const product = await Product.findOneAndUpdate(
            { id: productId },
            { $push: { reviewTokens: token } },
            { new: true }
        );

        if (product) {
            console.log(`✅ Token saved: ${token}`);
            res.json({ success: true, token: token });
        } else {
            console.log("❌ Product not found during token generation");
            res.status(404).json({ error: "Product not found" });
        }
    } catch (error) {
        console.error("❌ Generate Token Error:", error);
        res.status(500).json({ error: "Server error generating token" });
    }
});

// --- 2. SUBMIT REVIEW ROUTE (Fixed) ---
app.post('/api/products/:id/reviews', async (req, res) => {
    await connectDB();
    const { user, rating, text, images, token } = req.body;
    const productId = parseInt(req.params.id); // Ensure Number

    console.log(`📩 Receiving Review for ID: ${productId}`);
    console.log(`Ticket Token: ${token}`);

    if (!token) {
        console.log("❌ Error: Missing Token");
        return res.status(400).json({ error: "Missing Token" });
    }

    try {
        // 1. Check if token exists in the DB for this product
        const productCheck = await Product.findOne({
            id: productId,
            reviewTokens: token // Does this array contain this string?
        });

        if (!productCheck) {
            console.log("⛔ Invalid or Expired Token");
            return res.status(403).json({ error: "This link has expired or is invalid." });
        }

        console.log("✅ Token is Valid. Saving review...");

        // 2. Save Review & Delete Token
        const updatedProduct = await Product.findOneAndUpdate(
            { id: productId },
            {
                $push: {
                    reviews: {
                        user,
                        rating: parseInt(rating),
                        text,
                        images: images || [],
                        date: new Date()
                    }
                },
                $pull: { reviewTokens: token } // Remove used token
            },
            { new: true }
        );

        console.log("🎉 Review Saved Successfully");
        res.json({ success: true });

    } catch (error) {
        console.error("❌ Save Review Error:", error);
        res.status(500).json({ error: "Failed to save review" });
    }
});

// ... (Keep other routes like Add/Delete/Update/Login/AI) ...
// COPY THE AI, LOGIN, and CRUD ROUTES FROM THE PREVIOUS COMPLETE CODE HERE

// AI Route
app.post('/api/enhance-description', async (req, res) => {
    try {
        const { name, category, currentText } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Server missing API Key" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // The Prompt Engineering
        const prompt = `You are a professional copywriter for a luxury stone showroom called 'varnam Granites'. 
        Write a sophisticated, selling product description (max 2 sentences) for a product named "${name}" which is a "${category}". 
        Base it on these rough notes: "${currentText}". 
        Focus on durability, elegance, and premium quality. Do not use markdown or * symbols.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const enhancedText = response.text();

        res.json({ success: true, text: enhancedText });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to generate text" });
    }
});
// CRUD Routes
app.post('/api/products', async (req, res) => {
    await connectDB();
    try {
        const newProduct = new Product({ ...req.body, id: Date.now(), reviews: [], reviewTokens: [] });
        await newProduct.save();
        res.json(newProduct);
    } catch (e) { res.status(500).json({ error: "Err" }); }
});
app.put('/api/products/:id', async (req, res) => {
    await connectDB();
    const p = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(p);
});
app.delete('/api/products/:id', async (req, res) => {
    await connectDB();
    await Product.findOneAndDelete({ id: req.params.id });
    res.json({ msg: "Deleted" });
});
app.post('/api/login', (req, res) => {
    if (req.body.username == process.env.ADMIN_USER && req.body.password == process.env.ADMIN_PASS) res.json({ success: true, token: 'admin' });
    else res.status(401).json({ success: false });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;