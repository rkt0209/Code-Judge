const express = require("express");
const { submitCode, getMySubmissions } = require("../../controllers/user/submission");
const { checkAuthorizationHeaders, authenticateUser } = require("../../middlewares/authenticate");

const router = express.Router();

router.route("/")
    .post(checkAuthorizationHeaders, authenticateUser, submitCode) // Submit Code
    .get(checkAuthorizationHeaders, authenticateUser, getMySubmissions); // View History

module.exports = router;