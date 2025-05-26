const express = require('express');
const path = require('path');
const fs = require('fs');
const NodeCache = require('node-cache');
const helmet = require('helmet');

const app = express();
app.use(helmet());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
});

const PROD_IMAGE_DIR = process.env.PROD_IMAGE_DIR || path.join(__dirname, 'images');

const imageCache = new NodeCache({ stdTTL: 86400 });

function padId(id) {
    return id.toString().padStart(8, '0');
}

function getImagePathFromCache(id, counter) {
    const paddedId = padId(id);
    const firstDir = paddedId.slice(0, 3);
    const secondDir = paddedId.slice(3, 6);
    const baseFilename = paddedId;
    const imageExtensions = ['jpg', 'png', 'jpeg'];
    const cacheKey = `${paddedId}_${counter !== null ? counter : 'largest'}`;

    if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

    const imageDir = path.join(PROD_IMAGE_DIR, firstDir, secondDir);
    if (!fs.existsSync(imageDir)) return null;

    let imagePath = null;
    if (counter === 0) {
        for (const ext of imageExtensions) {
            const p = path.join(imageDir, `${baseFilename}.${ext}`);
            if (fs.existsSync(p)) { imagePath = p; break; }
        }
    } else if (counter > 0) {
        for (const ext of imageExtensions) {
            const p = path.join(imageDir, `${baseFilename}_${counter}.${ext}`);
            if (fs.existsSync(p)) { imagePath = p; break; }
        }
    } else if (counter === null) {
        imagePath = getImageWithLargestCounter(imageDir, baseFilename, imageExtensions);
    }

    if (imagePath) imageCache.set(cacheKey, imagePath);
    return imagePath;
}

function getImageWithLargestCounter(directory, baseFilename, extensions) {
    let largestCounter = -1;
    let bestFilePath = null;

    for (const ext of extensions) {
        const files = fs.readdirSync(directory).filter(file =>
            file.startsWith(baseFilename) && file.endsWith(ext)
        );

        files.forEach(file => {
            const match = file.match(new RegExp(`${baseFilename}_(\\d+)\\.${ext}$`));
            const counter = match ? parseInt(match[1], 10) : 0;
            if (counter > largestCounter) {
                largestCounter = counter;
                bestFilePath = path.join(directory, file);
            }
        });
    }

    return bestFilePath;
}

function isValidFilePath(filePath) {
    return filePath && fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
}

// Instead of optional parameter, create two separate routes
app.get('/image/:id', handler);
app.get('/image/:id/:counter', handler);

function handler(req, res) {
    const imageId = req.params.id;
    const counter = req.params.counter !== undefined ? parseInt(req.params.counter) : null;

    if (!/^\d+$/.test(imageId)) return res.status(404).json({ message: 'Invalid id.' });
    if (counter !== null && isNaN(counter)) return res.status(404).json({ message: 'Invalid image counter.' });

    const imagePath = getImagePathFromCache(imageId, counter);

    if (isValidFilePath(imagePath)) {
        console.log(`[+] Serving image: ${imagePath}`);
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ message: 'Image not found.' });
    }
}

app.get('/', (req, res) => {
    res.json({ message: '🚀 Server is up and running!' });
});

module.exports = app;
