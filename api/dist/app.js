"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const loadShopsData = () => {
    try {
        // Try Docker path first, then local development path
        let dataPath = path_1.default.join(__dirname, '../../database/shops.json');
        if (!fs_1.default.existsSync(dataPath)) {
            dataPath = path_1.default.join(__dirname, '../database/shops.json');
        }
        if (!fs_1.default.existsSync(dataPath)) {
            dataPath = path_1.default.join(process.cwd(), 'database/shops.json');
        }
        const rawData = fs_1.default.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
    }
    catch (error) {
        console.error('Error loading shops data:', error);
        return [];
    }
};
const loadUsersData = () => {
    try {
        // Try Docker path first, then local development path
        let dataPath = path_1.default.join(__dirname, '../../database/users.json');
        if (!fs_1.default.existsSync(dataPath)) {
            dataPath = path_1.default.join(__dirname, '../database/users.json');
        }
        if (!fs_1.default.existsSync(dataPath)) {
            dataPath = path_1.default.join(process.cwd(), 'database/users.json');
        }
        const rawData = fs_1.default.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
    }
    catch (error) {
        console.error('Error loading users data:', error);
        return [];
    }
};
const saveUsersData = (users) => {
    try {
        // Try Docker path first, then local development path
        let dataPath = path_1.default.join(__dirname, '../../database/users.json');
        if (!fs_1.default.existsSync(path_1.default.dirname(dataPath))) {
            dataPath = path_1.default.join(__dirname, '../database/users.json');
        }
        if (!fs_1.default.existsSync(path_1.default.dirname(dataPath))) {
            dataPath = path_1.default.join(process.cwd(), 'database/users.json');
        }
        fs_1.default.writeFileSync(dataPath, JSON.stringify(users, null, 2), 'utf8');
        return true;
    }
    catch (error) {
        console.error('Error saving users data:', error);
        return false;
    }
};
// User preference matching algorithm
const calculateMatchScore = (userPrefs, shopSpices) => {
    const spicinessDiff = Math.abs(userPrefs.spiciness - shopSpices.spiciness);
    const stimulationDiff = Math.abs(userPrefs.stimulation - shopSpices.stimulation);
    const aromaDiff = Math.abs(userPrefs.aroma - shopSpices.aroma);
    // Calculate weighted score (lower differences = higher score)
    const maxScore = 100;
    const spiceScore = (100 - spicinessDiff) * 0.35; // 35% weight
    const stimulationScore = (100 - stimulationDiff) * 0.35; // 35% weight
    const aromaScore = (100 - aromaDiff) * 0.30; // 30% weight
    return Math.round(spiceScore + stimulationScore + aromaScore);
};
// Shop endpoints
app.get('/api/shops', (req, res) => {
    try {
        const shops = loadShopsData();
        const { search, userId } = req.query;
        let filteredShops = shops;
        // Search functionality
        if (search && typeof search === 'string') {
            const searchTerm = search.toLowerCase();
            filteredShops = shops.filter(shop => shop.name.toLowerCase().includes(searchTerm) ||
                shop.address.toLowerCase().includes(searchTerm) ||
                shop.description?.toLowerCase().includes(searchTerm));
        }
        // Add match scores for user preferences
        if (userId && typeof userId === 'string') {
            const users = loadUsersData();
            const user = users.find(u => u.id === userId);
            if (user) {
                filteredShops = filteredShops.map(shop => ({
                    ...shop,
                    matchScore: calculateMatchScore(user.preferences.spiceParameters, shop.spiceParameters)
                })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
            }
        }
        res.json(filteredShops);
    }
    catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/shops/:id', (req, res) => {
    try {
        const shops = loadShopsData();
        const shop = shops.find(s => s.id === req.params.id);
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        res.json(shop);
    }
    catch (error) {
        console.error('Error fetching shop:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// User endpoints
app.get('/api/users', (req, res) => {
    try {
        const users = loadUsersData();
        // Only return public users and basic info
        const publicUsers = users
            .filter(user => user.isPublic)
            .map(user => ({
            id: user.id,
            displayName: user.displayName,
            bio: user.bio,
            preferences: user.preferences,
            createdAt: user.createdAt
        }));
        res.json(publicUsers);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/users/:id', (req, res) => {
    try {
        const users = loadUsersData();
        const user = users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.isPublic) {
            return res.status(403).json({ error: 'User profile is private' });
        }
        // Return public profile info only
        const publicProfile = {
            id: user.id,
            displayName: user.displayName,
            bio: user.bio,
            preferences: user.preferences,
            createdAt: user.createdAt
        };
        res.json(publicProfile);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/users/register', (req, res) => {
    try {
        const users = loadUsersData();
        const userData = req.body;
        // Validate input
        if (!userData.username || !userData.email || !userData.displayName || !userData.preferences) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if username or email already exists
        const existingUser = users.find(u => u.username.toLowerCase() === userData.username.toLowerCase() ||
            u.email.toLowerCase() === userData.email.toLowerCase());
        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }
        // Validate spice parameters
        const { spiceParameters } = userData.preferences;
        if (!spiceParameters ||
            spiceParameters.spiciness < 0 || spiceParameters.spiciness > 100 ||
            spiceParameters.stimulation < 0 || spiceParameters.stimulation > 100 ||
            spiceParameters.aroma < 0 || spiceParameters.aroma > 100) {
            return res.status(400).json({ error: 'Invalid spice parameters. Must be between 0-100.' });
        }
        // Create new user
        const newUser = {
            id: crypto_1.default.randomUUID(),
            username: userData.username,
            email: userData.email,
            displayName: userData.displayName,
            preferences: {
                spiceParameters: userData.preferences.spiceParameters,
                favoriteShops: userData.preferences.favoriteShops || [],
                dislikes: userData.preferences.dislikes || []
            },
            bio: userData.bio || '',
            createdAt: new Date().toISOString(),
            isPublic: true
        };
        users.push(newUser);
        if (saveUsersData(users)) {
            // Return user info without sensitive data
            const userResponse = {
                id: newUser.id,
                displayName: newUser.displayName,
                preferences: newUser.preferences,
                bio: newUser.bio,
                createdAt: newUser.createdAt
            };
            res.status(201).json(userResponse);
        }
        else {
            res.status(500).json({ error: 'Failed to save user data' });
        }
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/recommendations/:userId', (req, res) => {
    try {
        const users = loadUsersData();
        const shops = loadShopsData();
        const userId = req.params.userId;
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Calculate match scores for all shops
        const shopsWithScores = shops
            .map(shop => ({
            ...shop,
            matchScore: calculateMatchScore(user.preferences.spiceParameters, shop.spiceParameters)
        }))
            .filter(shop => !user.preferences.dislikes.includes(shop.id))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 10); // Top 10 recommendations
        res.json(shopsWithScores);
    }
    catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`🍛 Spice Curry API Server is running on port ${PORT}`);
});
