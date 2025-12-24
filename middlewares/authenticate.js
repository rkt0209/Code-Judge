const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require("./asyncHandler");
require("dotenv").config();

exports.checkAuthorizationHeaders = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.access_token = decoded;
        next();
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
};

exports.authenticateAdmin = asyncHandler(async (req, res, next) => {
    const admin = await Admin.findById(req.access_token.id);
    if (!admin) {
        return next(new ErrorResponse('Admin not found', 404));
    }
    req.auth_user = admin;
    next();
});

exports.authenticateUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.access_token.id);
    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }
    req.auth_user = user;
    next();
});