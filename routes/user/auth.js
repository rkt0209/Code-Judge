const express = require('express');
const { getUserURL } = require('../../config/getGoogleAuthUrl');
const { userRegisterLogin } = require("../../config/getGoogleAuthToken")
const router = express.Router({ mergeParams: true });

router.route('/').get((req, res) => {
    const url = getUserURL();
    res.redirect(url); // Redirects user to Google Login
})

router.route("/redirect").get(
    userRegisterLogin
)

module.exports = router;