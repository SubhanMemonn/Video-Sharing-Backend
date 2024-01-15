import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
let commentSchema = new Schema({
    content: {
        type: String,
        required: true,
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },


}, { timestamps: true })

commentSchema.plugin(mongooseAggregatePaginate)

let Comment = mongoose.model("Comment", commentSchema)
export default Comment