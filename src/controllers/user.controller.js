import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/couldinary.js"
import { User } from "../models/user.model.js"
import { cookieOptions } from "../constants.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"




let generateAccessAndRefereshTokens = async (userId) => {
    try {
        let user = await User.findById(userId)
        let accessToken = user.generateAccessToken()
        let refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })


        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refreshToken")
    }
}

let registerUser = asyncHandler(async (req, res) => {
    // Get User Detail For Frontend

    let { fullName, username, email, password } = req.body;
    // Validation - not empty
    if (
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All Information are required")
    }
    // Check if user already exists: username, email
    let existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "This username or Email is already exists")

    }
    // Check for img, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is Required")

    }
    // Uploads them on cloudinary,avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required!")
    }
    //Create user object - create entry in db

    let user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""

    })
    // remove pass or refresh token field from response 
    let { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user?._id)

    let createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")

    }

    // return res
    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, { createdUser, accessToken, refreshAccessToken }, "User register successfully")
        )

})
let loginUser = asyncHandler(async (req, res) => {

    // req body -> data

    let { username, email, password } = req.body;

    // username or email
    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required")
    }

    // Find The User

    let user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "User does not exist")

    }

    //Check Password

    let isPasswordVaild = await user.isPassCorr(password)
    if (!isPasswordVaild) {
        throw new ApiError(401, "Password is not Correct")

    }

    //access and referesh token

    let { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    let loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    //send cookie

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, { loggedInUser, accessToken, refreshToken },
                "User SuccessFully Login"
            )
        )
})
let logoutUser = asyncHandler(async (req, res) => {
    let user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User Logged Out"))
})
let refreshAccessToken = asyncHandler(async (req, res) => {

    let inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!inComingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")

    }

    try {
        let decodedToken = jwt.verify(inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        let user = await User.findById(decodedToken?._id)

        if (!user) {

            throw new ApiError(401, "Invalid Refresh Token")
        }
        if (inComingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
        let { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(200,
                    { accessToken, refreshToken },
                    "Access Token Refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})
let changeCurrentPassword = asyncHandler(async (req, res) => {
    let { oldPassword, newPassword } = req.body;
    let user = await User.findById(req.user?._id)
    let isPasswordCorrect = await user.isPassCorr(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")

    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200,
            {},
            "Password change successfully"))
})

let getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new ApiResponse(200, req.user, "User Fetched Successfully"))
})
let updateAccountDetails = asyncHandler(async (req, res) => {
    let { fullName, email } = req.body;
    if (!fullName || email) {
        throw new ApiError(400, "All fields are required ")

    }

    let user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(200, user, "Account details update successfully")
        )
})

let updateUserAvatar = asyncHandler(async (req, res) => {
    let avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(
            400, "Avatar file is missing"
        )
    }
    let avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log(avatar);
    if (!avatar?.url) {
        throw new ApiError(
            400, "Error while uploading on avatar"
        )

    }

    let user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        }, { new: true }
    ).select("-password")
    return res.status(200)
        .json(
            new ApiResponse(200, user, "Avatar update Successfully")
        )
})
let updateUserCoverImage = asyncHandler(async (req, res) => {
    let coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(
            400, "coverImage file is missing"
        )
    }
    let coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(
            400, "Error while uploading on coverImage"
        )

    }

    let user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        }, { new: true }
    ).select("-password")
    return res.status(200)
        .json(
            new ApiResponse(200, user, "coverImage update Successfully")
        )
})

let getUserChannelProfile = asyncHandler(async (req, res) => {
    let { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(
            400, "Username is missing"
        )
    }

    let channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscriberTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                isSubscribed: 1,
                channelSubscribedToCount: 1,
                subscribersCount: 1,
                createdAt: 1

            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )
})
let getWatchHistory = asyncHandler(async (req, res) => {
    let user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        fullName: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200)
        .json(200,
            new ApiResponse(
                200, user, "Watch history fatched successfully"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,

}