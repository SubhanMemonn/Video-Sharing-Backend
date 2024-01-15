import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import Like from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const totalVideoViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
                _id: null, totalViews:
                    { $sum: "$views" }
            }
        },
        {
            $project: {
                _id: 0,
            }
        }
    ])
    if (!totalVideoViews.length) {
        throw new ApiError(400, "No viwes")
    }
    const totalSubscribers = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber"
            }
        },
        {
            $addFields: {
                totalSubscribers: {
                    $size: "$subscriber"
                }
            }
        }
    ]);
    if (!totalSubscribers.length) {
        throw new ApiError(400, "None subscriber")
    }
    const totalVideo = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "channel",
                foreignField: "owner",
                as: "videos",
            }
        }, {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                }
            }
        }
    ])
    if (!totalVideo.length) {
        throw new ApiError(400, "No video")
    }
    const totalLike = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        }, {
            $addFields: {
                totalLikes: {
                    $size: "$likes"
                }
            }
        }
    ])
    if (!totalLike.length) {
        throw new ApiError(400, "No like")
    }
    const totalViews = totalVideoViews[0].totalViews;
    const totalSubscriber = totalSubscribers[0].totalSubscribers
    const totalVideos = totalVideo[0].totalVideos
    const totalLikes = totalLike[0].totalLikes

    const stats = {
        totalViews,
        totalSubscriber,
        totalVideos,
        totalLikes
    }

    return res.status(200)
        .json(new ApiResponse(200, stats, "total views"))
})

const getChannelVideos = asyncHandler(async (req, res) => {

    const videos = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        }, {
            $lookup: {
                from: "videos",
                localField: "channel",
                foreignField: "owner",
                as: "owner",
                pipeline: [

                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "owner",
                            foreignField: "channel",
                            as: "videos",
                            pipeline: [
                                {
                                    $addFields: {
                                        videos: {
                                            $concatArrays: "$videos"
                                        }
                                    }
                                },

                            ]
                        }
                    }, {
                        $project: {
                            videos: 0,
                        }
                    }
                ]
            }
        },
        {
            $project: {
                subscriber: 0,
                createdAt: 0,
                updatedAt: 0,
                __v: 0,
                _id: 0,
                channel: 0
            }
        },
    ])

    return res.status(200)
        .json(
            new ApiResponse(200, videos[0].owner, "All video fatched")
        )
})

export {
    getChannelStats,
    getChannelVideos
}