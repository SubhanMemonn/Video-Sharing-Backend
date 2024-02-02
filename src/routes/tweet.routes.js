import Router from "express";
import {
    uploadTweet,
    removeTweet,
    updateTweet,
    likeTweet,
    getTweet,
    totalTweetLike,
    getAllTweet
} from "../controllers/tweet.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

let router = Router()


router.route("/upload").post(verifyJWT, upload.single("post"), uploadTweet)
router.route("/update/:tweetId").patch(verifyJWT, updateTweet)
router.route("/all").get(verifyJWT, getAllTweet)
router.route("/:tweetId").get(verifyJWT, getTweet)
router.route("/deleted/:tweetId").delete(verifyJWT, removeTweet)
router.route("/like/:tweetId").get(verifyJWT, likeTweet)
router.route("/total-like/:tweetId").get(verifyJWT, totalTweetLike)
























export default router