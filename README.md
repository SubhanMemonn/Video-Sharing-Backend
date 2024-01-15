# VideoShare Service Backend

Welcome to the backend repository for our VideoShare service! This platform allows users to log in, upload and share videos, like and comment on videos, as well as share short tweets and engage with others through likes. Below, you'll find essential information to get started with our backend.

## Technologies Used

- **Node.js:** Powering the server-side of our application.
- **Express.js:** Facilitating the development of robust APIs.
- **MongoDB:** Serving as the database to store user information, videos, and tweets.
- **Mongoose:** Enabling elegant MongoDB object modeling for Node.js.
- **Authentication:** Implementing secure user authentication for a personalized experience.

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.
- MongoDB installed and running.

## API Endpoints

### Authentication

- `POST /api/user/register`: Register a new user.
- `POST /api/user/login`: Log in with registered credentials.

### Videos

- `GET /api/all-videos"`: Retrieve all videos.
- `GET /api/video/:videoId`: Retrieve a specific video.
- `POST /api/video/upload`: Upload a new video.
- `PUT /api/video/like/:videoId`: Like a video.
- `POST /api/video/comment/:videoId`: Comment on a video.

### Tweets

- `GET /api/tweets/all`: Retrieve all tweets.
- `GET /api/tweets/:tweetId`: Retrieve a specific tweet.
- `POST /api/tweets/upload`: Post a new tweet.
- `PUT /api/tweets/like/:tweetId`: Like a tweet.
- `PUT /api/tweets/total-like/:tweetId`: Total likes a tweet.
