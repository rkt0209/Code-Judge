const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid'); // We need to install this package

const dirCodes = path.join(__dirname, '..', 'codes');

// Ensure the folder exists
if (!fs.existsSync(dirCodes)) {
    fs.mkdirSync(dirCodes, { recursive: true });
}

const generateFile = async (format, content) => {
    const jobId = uuid(); // Unique ID for every run
    const filename = `${jobId}.${format}`;
    const filepath = path.join(dirCodes, filename);
    
    await fs.writeFileSync(filepath, content);
    return filepath;
};

module.exports = { generateFile };