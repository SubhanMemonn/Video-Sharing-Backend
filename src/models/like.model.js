import mongoose, { Schema } from "mongoose";

let likeSchema = new Schema({
    Comment: {
        type: Schema.Types.ObjectId,
        ref: "Comments"
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    likeby: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    }

}, { timestamps: true })

let Like = mongoose.model("Like", likeSchema)
export default Like