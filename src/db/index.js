import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
let connectDB = async () => {
    try {
        let connectionDB = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`/n MongoDB connect with DB host ${connectionDB.connection.host}`);
    } catch (error) {
        console.log("Err while connect with DB " + error)
        process.exit(1)
    }
}
export default connectDB