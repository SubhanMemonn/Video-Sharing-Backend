import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Id")
    }
    let isSubscribed;
    isSubscribed = await Subscription.findOne({
        subscriber: new mongoose.Types.ObjectId(req.user?._id),
        channel: new mongoose.Types.ObjectId(channelId)
    })

    if (isSubscribed) {
        isSubscribed = await Subscription.findOneAndDelete({
            channel: channelId,
            subscriber: req.user?._id
        })
    } else {
        isSubscribed = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId,
        })
    }

    return res.status(201)
        .json(new ApiResponse(201, isSubscribed, "Subcribed Update"))
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(404, "Invalid Id")
    }
    const subscribedChannel = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(subscriberId)
            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            subscribed: 0,

                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "channel",
                            foreignField: "_id",
                            as: "subscribedChannel",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                            subscribed: { $concatArrays: "$subscribedChannel" }
                        }
                    },
                    {
                        $project: {
                            subscribed: 1
                        }
                    }
                ]
            }

        }, {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                subscribed: 1,
                // subscribedChannel: 0

            }
        }


    ])
    return res.status(200)
        .json(new ApiResponse(200, subscribedChannel[0], "Subscribed Channel Fatched"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Id")

    }
    const subscribedChannels = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                        }
                    },
                    {

                        $lookup: {
                            from: "users",
                            localField: "subscriber",
                            foreignField: "_id",
                            as: "user",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        fullName: 1,
                                    }
                                }
                            ]


                        },

                    },

                    {
                        $addFields: {
                            totalSubscriber: {
                                $concatArrays: "$user"
                            }

                        }
                    },
                    {
                        $project: {
                            user: 1,
                        }
                    },

                ]
            }
        },
        {
            $project: {
                email: 0,
                coverImage: 0,
                password: 0,
                watchHistory: 0,
                createdAt: 0,
                updatedAt: 0,
                __v: 0


            }
        },



    ])

    return res.status(200)
        .json(new ApiResponse(200, subscribedChannels[0], "which user has subscribed"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}