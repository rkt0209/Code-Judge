const express = require("express");
const router = express.Router();
const {
  checkAuthorizationHeaders,
  authenticateAdmin
} = require("../../middlewares/authenticate");

const {
  createContest,
  addQuestionsToContest,
  getAllContests,
  getContestById,
  updateContest,
  deleteContest
} = require("../../controllers/admin/contest");

// Create new contest
router.post(
  "/create",
  checkAuthorizationHeaders,
  authenticateAdmin,
  createContest
);

// Get all contests (admin view)
router.get(
  "/",
  checkAuthorizationHeaders,
  authenticateAdmin,
  getAllContests
);

// Get contest by ID
router.get(
  "/:contest_id",
  checkAuthorizationHeaders,
  authenticateAdmin,
  getContestById
);

// Add questions to contest
router.post(
  "/:contest_id/questions",
  checkAuthorizationHeaders,
  authenticateAdmin,
  addQuestionsToContest
);

// Update contest
router.patch(
  "/:contest_id",
  checkAuthorizationHeaders,
  authenticateAdmin,
  updateContest
);

// Delete contest
router.delete(
  "/:contest_id",
  checkAuthorizationHeaders,
  authenticateAdmin,
  deleteContest
);

module.exports = router;
