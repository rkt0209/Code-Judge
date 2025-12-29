const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const executeCpp = (filepath, inputPath) => {
  // 1. Determine Output Filename
  // Windows needs .exe, Mac/Linux doesn't. We'll stick to .exe for safety or just no extension.
  // path.basename removes folders, split removes extension.
  const jobId = path.basename(filepath).split(".")[0];
  const outPath = path.join(outputPath, `${jobId}.exe`);

  // 2. The Command
  // "g++ code.cpp -o output.exe && output.exe < input.txt"
  // We use quotes around paths to handle spaces in folder names.
  const command = `g++ "${filepath}" -o "${outPath}" && "${outPath}" < "${inputPath}"`;

  // 3. Execute
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      // Logic: Cleanup executables later if needed
      
      if (error) {
        reject({ error, stderr });
      }
      if (stderr) {
        reject(stderr);
      }
      resolve(stdout);
    });
  });
};

module.exports = { executeCpp };