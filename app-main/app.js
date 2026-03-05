const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.json()); // بديل body-parser
app.use(express.static('views')); // لو عندك frontend HTML داخل مجلد views

// Connect to MongoDB
mongoose.connect('mongodb://mongo:27017/nomcomboDB')
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("MongoDB connection error:", error));

// Schema and Model
const ComboSchema = new mongoose.Schema({
    username: String,
    length: Number,
    count: Number,
    combinations: [String]
});

const Combo = mongoose.model('Combo', ComboSchema);

// Generate random combinations
function generateRandomCombos(length, count) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const combos = [];

    for (let i = 0; i < count; i++) {
        let str = '';
        for (let j = 0; j < length; j++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        combos.push(str);
    }

    return combos;
}

// API endpoint to generate or update combinations for a user
app.post('/generate', async (req, res) => {
    const { username, length, count } = req.body;

    if (!username || !length || !count) {
        return res.status(400).json({ message: "username, length, and count are required" });
    }

    const newCombinations = generateRandomCombos(length, count);

    try {
        let userCombo = await Combo.findOne({ username });

        if (userCombo) {
            // Update existing user
            await Combo.updateOne(
                { username },
                { 
                    $push: { combinations: { $each: newCombinations } },
                    $set: { length, count }
                }
            );
            res.json({ message: "Combinations updated successfully!" });
        } else {
            // Create new user
            const newCombo = new Combo({ username, length, count, combinations: newCombinations });
            await newCombo.save();
            res.json({ message: "Combinations generated and saved successfully!" });
        }
    } catch (error) {
        console.error("Error saving combinations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route to test server is running
app.get('/', (req, res) => {
    res.send("NomCombo API is running");
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));