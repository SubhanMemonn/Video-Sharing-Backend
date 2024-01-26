import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

let videoSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        videoFile: {
            type: String,
            required: true,

        },
        thumbnail: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,

        },
        description: {
            type: String,
        },
        duration: {
            type: Number,
            required: true,
        },
        views:
        {
            type: Number,
            default: 0,
        }
        ,
        isPublished: {
            type: Boolean,
            required: true,
            default: true,

        },

    }, { timestamps: true }
)

videoSchema.plugin(mongooseAggregatePaginate)
export let Video = mongoose.model("Video", videoSchema)