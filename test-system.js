const mongoose = require("mongoose");
const Question = require("./models/Question");
const dotenv = require("dotenv");

dotenv.config();

// 🟢 STEP 1: PASTE YOUR TOKEN HERE
const MY_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTIyYmJkOTllMDIxYTk1NWI2ODk3YSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY2OTkyODI5LCJleHAiOjE3Njk1ODQ4Mjl9.exSV8x9k3RdwIHEC2gyL-QI5G-AfAqM-wQz9lQfv26s"; 

const API_URL = "http://localhost:5000/api/user/submission";
const MONGO_URL = process.env.MONGO_URL;

const runTest = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("✅ DB Connected");

        // 1. Find Question
        let question = await Question.findOne({ title: "Test Question" });
        if (!question) {
            console.log("⚠️ Test Question not found. Please run the seed script.");
            return;
        }
        console.log("✅ Question Found ID:", question._id);

        // 2. The Code to Submit
        const code = `
        #include <iostream>
        using namespace std;
        int main() {
            int a, b;
            cin >> a >> b;
            cout << a + b;
            return 0;
        }
        `;

        // 3. Create a FORM DATA Request (Mimic File Upload)
        const formData = new FormData();
        
        // Add the fields
        formData.append("question_id", question._id.toString());
        formData.append("language", "cpp");
        
        // Create a 'virtual' file from the string
        const fileBlob = new Blob([code], { type: 'text/plain' });
        formData.append("submission_file", fileBlob, "solution.cpp");

        console.log("🚀 Submitting Code as File Upload...");
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                // NOTE: Do NOT set Content-Type here. 
                // Fetch sets it automatically for FormData (multipart/form-data boundary)
                "Authorization": `Bearer ${MY_TOKEN}`
            },
            body: formData
        });

        const data = await response.json();
        console.log("📡 API Response:", data);

        if (data.success || data.message === "Submitted Successfully") {
            console.log("🎉 SUCCESS! Job Submitted.");
            console.log("👉 NOW LOOK AT TERMINAL 2 (Worker) - Is it processing?");
        } else {
            console.log("❌ FAILED:", data);
        }

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();