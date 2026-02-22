const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const asyncHandler = require("../middlewares/asyncHandler");

// Helper to get Google User Data
const getGoogleUser = async ({ code, redirect_uri }) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const { data } = await google.oauth2("v2").userinfo.get({ auth: oauth2Client });
  return data; // contains email, name, picture
};

// 1. User Login/Register
exports.userRegisterLogin = asyncHandler(async (req, res) => {
  const code = req.query.code;
  const googleUser = await getGoogleUser({ 
      code, 
      redirect_uri: process.env.USER_REDIRECT_URI 
  });

  let user = await User.findOne({ email: googleUser.email });

  if (!user) {
    // THIS FIXES YOUR ERROR: Auto-generate a handle
    const randomHandle = googleUser.given_name.replace(/\s/g, "") + Math.floor(Math.random() * 10000);
    
    user = await User.create({
      name: googleUser.name,
      email: googleUser.email,
      profile_pic: googleUser.picture,
      handle: randomHandle, // <--- Required field now exists!
      rating: 100,
    });
  }

  // Create Token
  const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  // Redirect to Frontend Callback with token and user data
  const frontendCallbackUrl = new URL('http://localhost:3030/auth/callback');
  frontendCallbackUrl.searchParams.append('token', token);
  frontendCallbackUrl.searchParams.append('role', 'user');
  frontendCallbackUrl.searchParams.append('user', JSON.stringify({
    _id: user._id,
    name: user.name,
    email: user.email,
    handle: user.handle,
    profile_pic: user.profile_pic
  }));
  
  res.redirect(frontendCallbackUrl.toString());
});

// 2. Admin Login/Register
exports.adminRegisterLogin = asyncHandler(async (req, res) => {
  const code = req.query.code;
  const googleUser = await getGoogleUser({ 
      code, 
      redirect_uri: process.env.ADMIN_REDIRECT_URI 
  });

  let admin = await Admin.findOne({ email: googleUser.email });

  if (!admin) {
     const randomHandle = "admin_" + Math.floor(Math.random() * 10000);
     admin = await Admin.create({
      name: googleUser.name,
      email: googleUser.email,
      handle: randomHandle,
    });
  }

  const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  // Redirect to Frontend Callback with token and admin data
  const frontendCallbackUrl = new URL('http://localhost:3030/auth/callback');
  frontendCallbackUrl.searchParams.append('token', token);
  frontendCallbackUrl.searchParams.append('role', 'admin');
  frontendCallbackUrl.searchParams.append('user', JSON.stringify({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    handle: admin.handle
  }));
  
  res.redirect(frontendCallbackUrl.toString());
});