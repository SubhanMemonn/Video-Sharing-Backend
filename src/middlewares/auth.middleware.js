import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import Jwt from "jsonwebtoken";
// accessToken, refreshToken
export let verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized Request")

        }
        let decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        let user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")

        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invaild Access Token")
    }
})