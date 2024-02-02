import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/couldinary.js";
import mongoose, { isValidObjectId } from "mongoose";
import Like from "../models/like.model.js"
import Tweet from "../models/tweets.model.js";

let uploadTweet = asyncHandler(async (req, res) => {
    let { content } = req.body
    if (!content && content.trim() === "") {
        throw new ApiError(400, "tweet filed are required")
    }
    let postLocalPath = req.file?.path
    if (postLocalPath) {
        let post = await uploadOnCloudinary(postLocalPath)
        if (!post?.url) {
            throw new ApiError(400, "Error while uploading post")
        } else {

            postLocalPath = post
        }

    }


    let tweet = await Tweet.create({
        content,
        post: postLocalPath?.url || "",
        owner: new mongoose.Types.ObjectId(req.user?._id)
    })
    if (!tweet) {
        throw new ApiError(
            500, "Tweet does not upload"
        )
    }
    return res.status(201)
        .json(
            new ApiResponse(
                201, tweet, "Tweet uploaded"
            )
        )
})

let removeTweet = asyncHandler(async (req, res) => {
    let { tweetId } = req.params;

    let tweetExists = await Tweet.findById(tweetId)

    if (!tweetExists) {
        throw new ApiError(
            404, "Tweet not found"
        )
    }

    if (!tweetExists?.owner.equals(req.user?._id)) {
        throw new ApiError(
            400, "Not authorizated"
        )

    }
    let removeTweet = await Tweet.findByIdAndDelete(tweetExists?._id)

    if (!removeTweet) {
        throw new ApiError(
            500, "Failed to delete"
        )
    }
    return res.status(201).json(
        new ApiResponse(
            201, removeTweet, "Removed successfully"
        ))
})
let getTweet = asyncHandler(async (req, res) => {
    let { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Tweet id not found")
    }
    let tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")

    }

    return res.status(201)
        .json(
            new ApiResponse(
                201, tweet, "tweet fatched"
            )
        )
})
let updateTweet = asyncHandler(async (req, res) => {
    let { tweetId } = req.params
    let { content } = req.body;

    if (content.trim() === "") {

        throw new ApiError(
            400, "content filed empty"
        )
    }

    let existsTweet = await Tweet.findById(tweetId)
    if (!existsTweet) {
        throw new ApiError(
            404, "tweet not found"
        )
    }
    if (!existsTweet?.owner.equals(req.user?._id)) {
        throw new ApiError(
            404, "not authoriazed"
        )

    }

    let newTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {
                content,
            }
        }, {
        new: true
    })
    if (!newTweet) {
        throw new ApiError(
            500, "Tweet does not update"
        )
    }

    return res.status(201)
        .json(
            new ApiResponse(201,
                newTweet, "tweet updated"
            )
        )
})
let getAllTweet = asyncHandler(async (req, res) => {
    const allTweets = await Tweet.find({})
    if (!allTweets) {
        throw new ApiError(500, "Something went wrong")
    }
    return res.status(200)
        .json(new ApiResponse(200, allTweets, "All tweet fetached"))
})
let likeTweet = asyncHandler(async (req, res) => {
    let { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "video not found")
    }
    let likeExists = await Like.findOne({

        likeby: new mongoose.Types.ObjectId(req.user?._id),
        tweet: new mongoose.Types.ObjectId(tweetId)


    })
    if (likeExists) {
        let removeLike = await Like.findByIdAndDelete(likeExists?._id)
        if (!removeLike) {
            throw new ApiError(500, "failed to remove like")

        }
        return res.status(201)
            .json(
                new ApiResponse(
                    201, like, "like removing successfully"
                )
            )
    } else {

        var like = await Like.create(
            {
                likeby: new mongoose.Types.ObjectId(req.user?._id),
                tweet: new mongoose.Types.ObjectId(tweetId)
            }
        )
        if (!like) {
            throw new ApiError(500, "failed to like")

        }
        return res.status(201)
            .json(
                new ApiResponse(
                    201, {}, "like successfully"
                )
            )
    }

})
let totalTweetLike = asyncHandler(async (req, res) => {
    let { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Tweet id not found")
    }
    const totalLike = await Tweet.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$likes"
                }
            }
        }, {
            $project: {
                totalLikes: 1,
                _id: 0
            }
        }
    ])

    if (!totalLike.length) {
        throw new ApiError(400, "No like")
    }

    return res.status(200)
        .json(new ApiResponse(200, totalLike[0], "Total like fetched"))
})

export {
    uploadTweet,
    removeTweet,
    updateTweet,
    likeTweet,
    getTweet,
    totalTweetLike,
    getAllTweet
}