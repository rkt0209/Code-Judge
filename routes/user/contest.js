const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const upload = require("../../config/multerUpload");
const User = require("../../models/User");
const {
  checkAuthorizationHeaders,
  authenticateUser
} = require("../../middlewares/authenticate");
const { validateRequestBody } = require("../../middlewares/validateRequestBody");

const {
  getAllContests,
  joinContest,
  getMyActiveContest,
  getContestDetails,
  submitInContest,
  getLeaderboard
} = require("../../controllers/user/contest");

// BUG FIX: optionalAuth decodes the JWT manually without using the
// express-validator chain (checkAuthorizationHeaders is an array of
// validators, not a plain function, so it can't be called directly).
//
// If a valid token + user is found  → req.auth_user is set, then next().
// If no token / invalid token       → req.auth_user stays undefined, next().
// This lets getContestDetails serve both authed and unauthed users.
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // no token — continue as unauthenticated
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return next();

    const user_doc = await User.findOne({ _id: decoded.id }, { _id: 1, name: 1 });
    if (user_doc) {
      req.auth_user = {
        static_id: user_doc._id,
        name: user_doc.name,
      };
    }
  } catch (_err) {
    // expired / malformed token — treat as unauthenticated, don't crash
  }
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// Get all contests (public)
router.get(
  "/",
  getAllContests
);

// Get my active contest (auth required)
router.get(
  "/active",
  checkAuthorizationHeaders,
  validateRequestBody,
  authenticateUser,
  getMyActiveContest
);

// Submit solution in contest
// NOTE: must be declared before /:contest_id to avoid route param clash
router.post(
  "/submit",
  checkAuthorizationHeaders,
  validateRequestBody,
  authenticateUser,
  upload.fields([{ name: "submission_file", maxCount: 1 }]),
  submitInContest
);

// Get contest details
// BUG FIX: optionalAuth instead of hard authenticateUser so unauthenticated
// visitors can still load the page and see the Join / Register button
router.get(
  "/:contest_id",
  optionalAuth,
  getContestDetails
);

// Join contest (auth required)
router.post(
  "/:contest_id/join",
  checkAuthorizationHeaders,
  validateRequestBody,
  authenticateUser,
  joinContest
);

// Get leaderboard (public)
router.get(
  "/:contest_id/leaderboard",
  getLeaderboard
);

module.exports = router;