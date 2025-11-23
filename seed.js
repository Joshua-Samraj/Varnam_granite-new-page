require('dotenv').config(); // 1. Read the password from .env
const mongoose = require('mongoose');

// --- CONFIGURATION ---
// 2. Collection Name: This forces the collection to be named 'products'
const COLLECTION_NAME = 'products'; 

// --- SCHEMA DEFINITION ---
// We redefine this here so the script runs independently of server.js
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
}, { collection: COLLECTION_NAME }); // <--- Force collection name here

const Product = mongoose.model('Product', productSchema);

// --- SAMPLE DATA (The Inventory) ---
const sampleProducts = [
    {
        id: 1,
        name: "Italian Carrara White",
        category: "marble",
        price: 12.50,
        stock: "In Stock",
        description: "Classic white marble with soft grey veins, sourced directly from the Carrara mountains. Perfect for luxury flooring and kitchen countertops.",
        origin: "Carrara, Italy",
        finish: "High Gloss Polish",
        images: [
            "https://images.unsplash.com/photo-1618221639263-381d62aa55d7?q=80&w=800",
            "https://images.unsplash.com/photo-1599695681064-9475c255f283?q=80&w=600",
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=600"
        ],
        reviews: [
            { user: "Sarah J.", rating: 5, text: "Absolutely beautiful stone." }
        ]
    },
    {
        id: 2,
        name: "Black Galaxy Granite",
        category: "granite",
        price: 18.00,
        stock: "In Stock",
        description: "Deep black granite with natural golden specks that resemble a starry night sky. Extremely durable and scratch-resistant.",
        origin: "Andhra Pradesh, India",
        finish: "Mirror Polish",
        images: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
            "https://images.unsplash.com/photo-1628003758836-84d3b64c015b?q=80&w=600",
            "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600"
        ],
        reviews: []
    },
    {
        id: 3,
        name: "Spanish Beige Crema",
        category: "marble",
        price: 10.50,
        stock: "Low Stock (120 sq.ft left)",
        description: "Warm, creamy beige tones that bring a cozy feel to living rooms. Known for its uniform texture.",
        origin: "Alicante, Spain",
        finish: "Satin / Honed",
        images: [
            "https://images.unsplash.com/photo-1604147495798-57beb5d6af73?q=80&w=800",
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=600"
        ],
        reviews: [
            { user: "Mike Ross", rating: 4, text: "Good quality, fast delivery." }
        ]
    },
    {
        id: 4,
        name: "Matte Grey Bathroom Tiles",
        category: "tiles",
        price: 4.50,
        stock: "In Stock",
        description: "Modern anti-skid ceramic tiles designed specifically for wet areas. Safety meets style.",
        origin: "Local Premium",
        finish: "Matte / Anti-Skid",
        images: [
            "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800",
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600"
        ],
        reviews: []
    }
];

// --- THE SEEDING FUNCTION ---
const seedDB = async () => {
    try {
        console.log("🌱 Connecting to MongoDB...");
        // 3. Database Name: It uses the name found in your .env MONGO_URI
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected!");

        console.log("🧹 Clearing old data...");
        await Product.deleteMany({}); // Deletes everything in the collection
        console.log("✅ Old data cleared.");

        console.log("📦 Inserting new sample data...");
        await Product.insertMany(sampleProducts);
        console.log("✅ Database Seeded Successfully!");

        // Close connection
        mongoose.connection.close();
        console.log("👋 Connection closed.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Seeding Error:", err);
        process.exit(1);
    }
};

// Run the function
seedDB();