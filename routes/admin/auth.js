const express = require('express');
const { getAdminURL } = require('../../config/getGoogleAuthUrl');
const { adminRegisterLogin } = require("../../config/getGoogleAuthToken")
const router = express.Router({ mergeParams: true });

router.route('/').get((req, res) => {
    const url = getAdminURL();
    res.redirect(url);
})

router.route("/redirect").get(
    adminRegisterLogin
)

module.exports = router;