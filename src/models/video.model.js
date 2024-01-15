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
            require: true,

        },
        thumbnail: {
            type: String,
            require: true,
        },
        title: {
            type: String,
            require: true,

        },
        description: {
            type: String,
        },
        duration: {
            type: Number,
            require: true,
        },
        views:
        {
            type: Number,
            default: 0,
        }
        ,
        isPublished: {
            type: Boolean,
            require: true,
            default: true,

        },

    }, { timestamps: true }
)

videoSchema.plugin(mongooseAggregatePaginate)
export let Video = mongoose.model("Video", videoSchema)