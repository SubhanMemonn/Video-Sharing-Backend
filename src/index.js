import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js";
import { PORT } from "./constants.js";

dotenv.config({ path: "./env" });

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server Ready At Port " + PORT)
    })
}).catch((error) => {
    console.log("Err while connect with server" + error)
})