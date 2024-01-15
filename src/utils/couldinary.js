import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

let uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // Upload File On Cloudinary
        let response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        // File has been uploads successfull
        // console.log("file is upload on cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null

    }

}

export { uploadOnCloudinary }