const { generateFile } = require('./utils/generateFile');
const { executeCpp } = require('./utils/executeCpp');
const path = require('path');

// 1. Dummy Code (C++)
const code = `#include <iostream>\nusing namespace std;\nint main() { int a; cin>>a; cout<<"Value is: "<<a; return 0; }`;

// 2. Dummy Input File (You need to create this manually if you don't use the API)
// Let's assume you have 'uploads/input.txt' with the number 10 inside.
const inputPath = path.join(__dirname, 'uploads', 'input.txt'); 

async function run() {
    try {
        // A. Create the C++ file
        const filepath = await generateFile('cpp', code);
        console.log("File generated at:", filepath);

        // B. Run it
        // Make sure you actually have an input.txt in uploads!
        const output = await executeCpp(filepath, inputPath);
        console.log("Output from C++:", output);

    } catch (err) {
        console.error("Error:", err);
    }
}

run();