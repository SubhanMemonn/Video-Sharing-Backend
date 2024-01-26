import Router from "express";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    removeVideo,
    updateVideo,
    uploadVideo,
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
    getVideoComments
} from "../controllers/video.controller.js";

let router = Router();


router.route("/upload").post(verifyJWT, upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    },
]), uploadVideo)


router.route("/remove/:videoId").delete(verifyJWT, removeVideo)

router.route("/update/:videoId").patch(verifyJWT, updateVideo)

router.route("/like/:videoId").post(verifyJWT, likeVideo)

router.route("/comment/:videoId").post(verifyJWT, commentVideo)
router.route("/comment-like/:commentId").post(verifyJWT, toggleCommentLike)

router.route("/remove-comment/:videoId").delete(verifyJWT, removeCommentVideo)

router.route("/views/:videoId").post(verifyJWT, views)

router.route("/total-like/:videoId").get(verifyJWT, getTotalVideolike)

router.route("/total-comment-like/:commentId").get(verifyJWT, getTotalCommentLike)

router.route("/all-videos").get(verifyJWT, getAllVideos)

router.route("/all-comment/:videoId").get(verifyJWT, getVideoComments)

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus)


router.route("/:videoId").get(verifyJWT, getVideo)












export default router