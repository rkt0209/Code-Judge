const User = require("../models/User");
const Admin = require("../models/Admin");
const generateJwtToken = require("./generateJWT");
const ErrorResponse = require("../utils/ErrorResponse");
const axios = require("axios");
const asyncHandler = require("../middlewares/asyncHandler");
require("dotenv").config();

exports.adminRegisterLogin = asyncHandler(async (req, res) => {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code: req.query.code,
    client_id: process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.ADMIN_AUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  };

  const qs = new URLSearchParams(values);
  
  // Exchange code for token
  const { id_token, access_token } = await axios.post(url, qs.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).then((res) => res.data);

  // Get User Info
  const googleUser = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      { headers: { Authorization: `Bearer ${id_token}` } }
    ).then((res) => res.data);

  let admin = await Admin.findOne({ email: googleUser.email });

  if (!admin) {
     // For this project, we auto-create admins. In real life, you might restrict this.
     admin = await Admin.create({
        name: googleUser.name,
        email: googleUser.email,
        handle: googleUser.given_name ? googleUser.given_name + Date.now() : "admin" + Date.now()
     });
  }

  const token = generateJwtToken({ id: admin._id });
  res.json({ message: "Admin Logged in", token });
});

exports.userRegisterLogin = asyncHandler(async (req, res) => {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code: req.query.code,
    client_id: process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.USER_AUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  };

  const qs = new URLSearchParams(values);

  const { id_token, access_token } = await axios.post(url, qs.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).then((res) => res.data);

  const googleUser = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      { headers: { Authorization: `Bearer ${id_token}` } }
    ).then((res) => res.data);

  let user = await User.findOne({ email: googleUser.email });

  if (!user) {
    user = await User.create({
      name: googleUser.name,
      email: googleUser.email,
      handle: googleUser.given_name ? googleUser.given_name + Date.now() : "user" + Date.now()
    });
  }

  const token = generateJwtToken({ id: user._id });
  res.json({ message: "User Logged in", token });
});