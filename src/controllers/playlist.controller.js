import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "All field required")
    };

    const playlist = await Playlist.create({
        name,
        description,
        owner: new mongoose.Types.ObjectId(req.user?._id),
    });
    if (!playlist) {
        throw new ApiError(500, "Fail to create")
    }

    return res.status(201)
        .json(
            new ApiResponse(201, playlist, "Create Playlist")
        )
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "Invalid Id")
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(500, "Somethin went wrong While fetching playist")
    }

    return res.status(200)
        .json(new ApiResponse(200, playlist, "Fetched successfully "))
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Id")
    }
    const findPlaylist = await Playlist.findById(playlistId);
    if (!findPlaylist) {
        throw new ApiError(404, "PlayList Not Found")
    }
    if (!findPlaylist?.owner.equals(req.user?._id)) {
        throw new ApiError(401, "Not authorized")
    }

    const existed = await Playlist.findOne({
        $and: [{ owner: new mongoose.Types.ObjectId(req.user?._id) }, { videos: new mongoose.Types.ObjectId(videoId) }]
    })
    if (existed) {
        throw new ApiError(401, "Already added")

    }

    const playList = await Playlist.findByIdAndUpdate(findPlaylist?._id, {
        $push: {
            videos: new mongoose.Types.ObjectId(videoId)
        }
    },
        { new: true }
    )

    if (!playList) {
        throw new ApiError(500, "Something went wrong while updated")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, playList, "Added")
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Id")

    }
    const findPlaylist = await Playlist.findById(playlistId)
    if (!findPlaylist) {
        throw new ApiError(404, "Playlist not found")
    }
    if (!findPlaylist.owner.equals(req.user?._id)) {
        throw new ApiError(401, "Not authorized")

    }
    const playlist = await Playlist.findByIdAndUpdate(findPlaylist?._id, {
        $pull: {
            videos: new mongoose.Types.ObjectId(videoId),
        }
    })

    if (!playlist) {
        throw new ApiError(500, "Something Went Wrong While Removing")

    }

    return res.status(200)
        .json(new ApiResponse(200, playlist, "Removed Video Successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    const findPlaylist = await Playlist.findById(playlistId)
    if (!findPlaylist) {
        throw new ApiError(404, "Playlist not found")
    }
    if (!findPlaylist.owner.equals(req.user?._id)) {
        throw new ApiError(401, "Not authorized")

    }
    const playlist = await Playlist.findByIdAndDelete(findPlaylist?._id)
    if (!playlist) {
        throw new ApiError(500, "Something Went Wrong While Delete")

    }
    return res.status(200)
        .json(new ApiResponse(200, playlist, "Delected Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!name || !description) {
        throw new ApiError(400, "All field are required")
    }
    const findPlaylist = await Playlist.findById(playlistId)
    if (!findPlaylist) {
        throw new ApiError(404, "Playlist not found")
    }
    if (!findPlaylist.owner.equals(req.user?._id)) {
        throw new ApiError(401, "Not authorized")

    }
    const playlist = await Playlist.findByIdAndUpdate(findPlaylist?._id, {
        $set: {
            name,
            description
        }
    },
        { new: true })
    if (!playlist) {
        throw new ApiError(500, "Something Went Wrong While Update")

    }
    return res.status(200)
        .json(new ApiResponse(200, playlist, "Updated Successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}