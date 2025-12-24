const asyncHandler = require("./asyncHandler");
const { validationResult } = require('express-validator');
const ErrorResponse = require('../utils/ErrorResponse');

exports.validateRequestBody = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = errors.array().map(err => err.msg).join(', ');
        throw new ErrorResponse(errorMsg, 400);
    }
    next();
});