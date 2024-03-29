import mongoose, { Schema } from "mongoose";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

let userSchema = new Schema(
    {
        username: {
            type: String,
            unique: true,
            require: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            unique: true,
            require: true,
            lowercase: true,
            trim: true,

        },
        fullName: {
            type: String,
            require: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            require: true,

        },
        coverImage: {
            type: String,
        },
        password: {
            type: String,
            require: [true, "Enter Your Password"]
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        refreshToken: {
            type: String,
        },

    }, { timestamps: true }
)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})
userSchema.methods.isPassCorr = async function (password) {
    return await bcrypt.compare(password, this.password)

}
userSchema.methods.generateAccessToken = function () {
    return Jwt.sign({
        _id: this._id,
        fullName: this.fullName,
        username: this.username,
        email: this.email,
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
}
userSchema.methods.generateRefreshToken = function () {
    return Jwt.sign({
        _id: this.id
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })
}
export let User = mongoose.model("User", userSchema)