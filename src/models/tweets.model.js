import mongoose, { Schema } from "mongoose";

let tweetSchema = new Schema({
    Content: {
        type: String,
        require: true
    },
    image: {
        type: String,

    },
    video: {
        type: String,

    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },


}, { timestamps: true })

let Tweet = mongoose.model("Tweet", tweetSchema)
export default Tweet