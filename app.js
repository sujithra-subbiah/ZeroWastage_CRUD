const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Item = require('./models/Item');

const app = express();

// --- MONGODB CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/zeroWasteDB')
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// --- MULTER CONFIG ---
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- MIDDLEWARE & SETTINGS ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'zerowastage-secret', 
    resave: false, 
    saveUninitialized: true 
}));

// --- TEMPORARY USERS ---
let users = []; 

// --- ROUTES ---

// 1. LOGIN PAGE (Landing)
app.get('/', (req, res) => {
    res.render('login', { error: null });
});

// 2. SIGN-UP LOGIC
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    const existingUser = users.find(u => u.username === username);
    
    if (existingUser) {
        return res.render('login', { error: "Username already taken!" });
    }

    users.push({ username, email, password });
    console.log(`New User Registered: ${username}`);
    res.render('login', { error: "Account created! Please Login." });
});

// 3. LOGIN LOGIC (Fixed & Debugged)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === "Guest") {
        req.session.user = "Guest";
        return res.redirect('/marketplace');
    }

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.user = user.username;
        console.log("Session User Set:", req.session.user); // Terminal-la check panna
        res.redirect('/marketplace');
    } else {
        res.render('login', { error: "Invalid details. Sign up first!" });
    }
});

// 4. MARKETPLACE (With Search & Category Filter)
app.get('/marketplace', async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/');

        const search = req.query.search || ""; 
        const category = req.query.category || "";

        let queryObj = {};

        if (search !== "") {
            queryObj.title = { $regex: search, $options: 'i' };
        }

        if (category !== "") {
            queryObj.category = category;
        }

        const items = await Item.find(queryObj);
        
        res.render('index', { 
            items: items, 
            user: req.session.user,
            query: search 
        });

    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).send("Marketplace page-la search work aagala!");
    }
});

// 5. ADD ITEM PAGE
app.get('/add', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.render('add-item');
});

// 6. SAVE ITEM TO DB (Direct-ah session user-ai edukkira logic)
app.post('/add', upload.single('image'), async (req, res) => {
    try {
        const newItem = new Item({
            title: req.body.title,
            // Direct-ah login panna user name-ai poduvom
            sellerName: req.session.user || "Verified Seller", 
            price: req.body.price,
            description: req.body.description,
            category: req.body.category,
            image: req.file ? req.file.filename : 'default.jpg',
            address: `${req.body.address}, ${req.body.city}` 
        });
        await newItem.save(); 
        console.log("Item saved by:", newItem.sellerName); // Terminal check
        res.redirect('/marketplace');
    } catch (err) {
        console.error(err);
        res.send("Error saving product");
    }
});

// 7. PRODUCT DETAILS PAGE
app.get('/details/:id', async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/');
        const item = await Item.findById(req.params.id); 
        if (!item) return res.redirect('/marketplace');
        res.render('details', { item: item }); 
    } catch (err) {
        res.status(500).send("Details page load aagala.");
    }
});

// 8. BUY NOW / CHECKOUT PAGE
app.get('/buy/:id', async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/');
        const item = await Item.findById(req.params.id);
        if (!item) return res.redirect('/marketplace');
        res.render('checkout', { item: item, user: req.session.user });
    } catch (err) {
        res.status(500).send("Checkout page load aagala!");
    }
});

// 9. HANDLE PURCHASE
app.post('/confirm-purchase', async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/');
        const { customerName, phone } = req.body;

        res.send(`
            <div style="text-align: center; padding: 50px; font-family: sans-serif;">
                <h1 style="color: #10b981;">🎉 Order Placed Successfully!</h1>
                <p>Thank you <b>${customerName}</b>, the seller will call you at <b>${phone}</b>.</p>
                <a href="/marketplace" style="color: blue; text-decoration: none;">Back to Marketplace</a>
            </div>
        `);
    } catch (err) {
        res.status(500).send("Order process aagala.");
    }
});

// 10. DELETE ITEM
app.get('/delete/:id', async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.redirect('/marketplace');
    } catch (err) {
        res.send("Error deleting item");
    }
});

// 11. LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --- SERVER START ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`Authorized ZeroWastage Live: http://localhost:${PORT}`);
    console.log(`-------------------------------------------`);
});
