import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/couldinary.js";
import mongoose, { isValidObjectId } from "mongoose";
import Like from "../models/like.model.js"
import Comment from "../models/comment.model.js";



let uploadVideo = asyncHandler(async (req, res) => {
    let { title, description, isPublished } = req.body;

    if (
        [title, description, isPublished].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }



    const videoLocalPath = req.files?.videoFile[0]?.path;

    let thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {

        throw new ApiError(400, "Video file are required")
    }
    if (!thumbnailLocalPath) {

        throw new ApiError(400, "tumbnail file are required")
    }

    let uploadVideo = await uploadOnCloudinary(videoLocalPath)
    if (!uploadVideo.url) {

        throw new ApiError(400, "Error while uploading video")
    }
    let thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail.url) {

        throw new ApiError(400, "Error while uploading thumbnail")
    }
    let video = await Video.create({
        owner: new mongoose.Types.ObjectId(req.user?._id),
        videoFile: uploadVideo.url,
        thumbnail: thumbnail.url,
        title,
        description,
        isPublished,
    })

    if (!video) {
        throw new ApiError(500, "Error while uploading video")
    }
    return res.status(201)
        .json(
            new ApiResponse(
                200, video, "Video uploaded"
            )
        )
})
let getVideo = asyncHandler(async (req, res) => {
    let { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Video id does not valid")
    }
    let video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")

    }
    return res.status(201)
        .json(
            new ApiResponse(
                200, video, "Video fatch successfully"
            )
        )


})
let removeVideo = asyncHandler(async (req, res) => {
    let { videoId } = req.params;
    let videoExtists = await Video.findById(videoId)

    if (!videoExtists) {
        throw new ApiError(404, "Video not found")

    }

    if (!videoExtists.owner.equals(req.user?._id)) {
        throw new ApiError(404, "Not authorized")


    }
    let video = await Video.findByIdAndDelete(videoId)

    if (!video) {
        throw new ApiError(500, "failed to delete")

    }
    return res.status(201)
        .json(
            new ApiResponse(
                200, video, "Video deleted"
            )
        )
})
let updateVideo = asyncHandler(async (req, res) => {
    let { videoId } = req.params;
    let { isPublished, title, description } = req.body;

    if (title?.trim() === "") {
        throw new ApiError(401, "Tittle are required")
    }

    let videoExists = await Video.findById(videoId)
    if (!videoExists) {
        throw new ApiError(404, "Video not found")
    }

    if (!videoExists.owner.equals(req.user?._id)) {
        throw new ApiError(404, "Unauthorized")

    }

    let video = await Video.findByIdAndUpdate(
        videoExists?._id,
        {
            $set: {
                isPublished,
                title,
                description
            },
        },
        { new: true }
    )
    return res.status(201)
        .json(
            new ApiResponse(
                200, video, "Video updateted"
            )
        )
})
const getAllVideos = asyncHandler(async (req, res) => {
    const { query, sortBy, sortType, userId } = req.query
    let page = Number(req.query.page) || 1;

    let limit = Number(process.env.PRODUCT_PER_PAGE) || 12;

    if (page < 0) {
        page = 1;
    }
    let baseQuery = {}
    if (userId && isValidObjectId(userId)) {
        baseQuery["$match"] = {
            owner: new mongoose.Types.ObjectId(userId)
        }
    };
    if (query) {
        baseQuery["$match"] = {
            title: { $regex: query, $options: "i" }
        }
    }
    if (userId && query) {
        baseQuery["$match"] = {
            $and: [
                { owner: new mongoose.Types.ObjectId(userId) },
                { title: { $regex: query, $options: "i" } }
            ]
        }
    }
    const sortStage = {}
    if (sortBy && sortType) {
        sortStage["$sort"] = {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    } else {
        sortStage["$sort"] = {
            createdAt: -1,
        }
    }

    const videos = await Video.aggregate([
        baseQuery,
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        }, {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "like"
            }
        }, {
            $limit: limit
        }, {
            $skip: (page - 1) * limit
        }, {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likes: {
                    $size: "$like"
                }
            }
        }
        , {
            $project: {

                like: 0,

            }
        }
    ])
    if (!videos.length) {
        throw new ApiError(404, "No videos");
    }
    return res.status(200)
        .json(
            new ApiResponse(
                200, videos, "filtered producted"
            )
        )
})

let views = asyncHandler(async (req, res) => {
    let { videoId } = req.params
    let views = await Video.findByIdAndUpdate({ _id: videoId }, {

        $inc: {
            views: 1
        }
    }
        , { new: true })

    return res.status(200)
        .json(
            new ApiResponse(
                200, views, "Views fatch successfully"
            )
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video Not Fpund")
    }

    if (!video.owner.equals(req.user?._id)) {
        throw new ApiError(400, "Not authorized")
    }
    const isPublished = await Video.findOne({
        $and: [{ _id: new mongoose.Types.ObjectId(video?._id) }, { isPublished: true }]
    })
    if (isPublished) {
        const isPublishedFalse = await Video.findByIdAndUpdate(isPublished?._id, {
            $set: {
                isPublished: false
            }
        },
            {
                new: true
            })
    } if (!isPublished) {
        const isPublishedTrue = await Video.findByIdAndUpdate(video?._id, {
            $set: {
                isPublished: true
            }
        },
            {
                new: true
            })
    }
    return res.status(201).json(
        new ApiResponse(200, isPublished, "Updated")
    )

})

let likeVideo = asyncHandler(async (req, res) => {
    let { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, " Video not found")
    }
    let likeExists = await Like.findOne({
        $and: [{
            likeby: new mongoose.Types.ObjectId(req.user?._id)
        }, { video: new mongoose.Types.ObjectId(videoId) }]
    })
    if (likeExists) {
        let removeLike = await Like.findByIdAndDelete(likeExists?._id)
        if (!removeLike) {
            throw new ApiError(500, "Failed to unlike try again")
        }
    }
    else {

        var like = await Like.create({
            likeby: new mongoose.Types.ObjectId(req.user?._id),
            video: new mongoose.Types.ObjectId(videoId)
        })
        if (!like) {
            throw new ApiError(500, "Failed to like video")
        }
    }

    return res.status(201)
        .json(
            new ApiResponse(
                201, like, "like successfully"
            )
        )
})

let getTotalVideolike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Id")
    }
    const totalVideoLike = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
                totalLike: { $size: "$likes" }
            }
        }, {
            $project: {
                totalLike: 1,
                _id: 0
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, totalVideoLike[0], "All like fatched"))
})

let commentVideo = asyncHandler(async (req, res) => {
    let { videoId } = req.params
    let { content } = req.body
    if (content.trim() === "") {
        throw new ApiError(401, "comment filed empty")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "video not found")
    }

    let newComment = await Comment.create({

        video: new mongoose.Types.ObjectId(videoId),
        owner: new mongoose.Types.ObjectId(req.user?._id),
        content,
    })
    if (!newComment) {
        throw new ApiError(500, "Comment does not uploaded")

    }
    return res.status(201)
        .json(
            new ApiResponse(
                201, newComment, "Comment uploaded"
            )
        )
})

let toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid Id")
    }
    const existsLikeOnComment = await Like.findOne({
        likeby: new mongoose.Types.ObjectId(req.user?._id),
        Comment: new mongoose.Types.ObjectId(commentId)
    })
    if (existsLikeOnComment) {
        await Like.findByIdAndDelete(existsLikeOnComment?._id)
    } else {

        var toggleCommentLike = await Like.create({
            likeby: new mongoose.Types.ObjectId(req.user?._id),
            Comment: new mongoose.Types.ObjectId(commentId)
        })
    }

    return res.status(200)
        .json(new ApiResponse(200, toggleCommentLike, "Update"))
})

let getTotalCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid Id")
    }
    const totalCommentLike = await Like.aggregate([
        {
            $match: { Comment: new mongoose.Types.ObjectId(commentId) }
        }, {
            $lookup: {
                from: "comments",
                localField: "Comment",
                foreignField: "_id",
                as: "likes"
            }
        }, {
            $addFields: {
                totalCommentLikes: {
                    $size: "$likes"
                }
            }
        }, {
            $project: {
                totalCommentLikes: 1,
                _id: 0
            }
        }
    ])
    if (!totalCommentLike.length) {
        throw new ApiError(400, "No like")
    }

    return res.status(200)
        .json(new ApiResponse(200, totalCommentLike[0], "Update"))
})

let removeCommentVideo = asyncHandler(async (req, res) => {
    let { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "video not found")
    }

    let commentExisted = await Comment.findOne({
        $and: [{
            video: new mongoose.Types.ObjectId(videoId)
        },
        { owner: new mongoose.Types.ObjectId(req.user?._id) }]
    })
    if (commentExisted) {
        var removeComment = await Comment.findByIdAndDelete(commentExisted?._id)
        if (!removeComment) {
            throw new ApiError(500, "Comment does not deleted")
        }
    }
    return res.status(201)
        .json(
            new ApiResponse(
                201, removeComment, "Comment deleted"
            )
        )
})

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const page = Number(req.query.page);
    const limit = 10;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Id")
    }
    const allComment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        }, {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "comments",
                pipeline: [
                    {
                        $project: {

                            fullName: 1,
                            username: 1,
                            avatar: 1,
                            content: 1
                        }
                    },
                ],
            }
        },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "Comment",
                as: "likeCount",

            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: "$likeCount"
                }
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$comments"
                }
            }
        },
        {
            $project: {
                owner: 1,
                likeCount: 1,
            }
        },
        { $skip: (page - 1) * limit },
        {
            $limit: limit
        }
    ]);
    if (!allComment.length) {
        throw new ApiError(400, "No comment`")
    }
    return res.status(200)
        .json(new ApiResponse(200, allComment, "All comment fetched"))

})
export {
    uploadVideo,
    removeVideo,
    updateVideo,
    getVideo,
    likeVideo,
    commentVideo,
    removeCommentVideo,
    views,
    togglePublishStatus,
    getAllVideos,
    getTotalVideolike,
    toggleCommentLike,
    getTotalCommentLike,
    getVideoComments,
}