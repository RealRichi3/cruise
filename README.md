# CRUISE Ride-Hailing API    `still in development`
The Ride-Hailing API is a backend service that allows users to book and pay for rides using a mobile app. 
This API was built using 
- Node.js
- Express.js 
- MongoDB
- Socket.io for realtime location updates and inapp phone calls

## Key Features

- Ride Booking: Users can easily book rides through the app, specifying their pick-up and drop-off locations, and the type of ride they need.
- Driver Matching: The app uses location tracking to find nearby drivers and match them with riders who need a ride.
- Real-time Location Tracking: The app tracks the real-time location of the rider and driver during the ride, allowing users to see the exact location of their driver and the estimated time of arrival.
- In-app Payments: The app allows users to pay for their rides directly through the app, using a variety of payment methods.
- Ratings and Reviews: Users can rate their drivers and leave reviews, helping to maintain high-quality service and ensuring the safety of all users.
- Customer Support: The app provides a variety of customer support options, such as in-app chat or phone support, to address any issues or concerns users may have.
- Driver Management: The app provides a dashboard for drivers to manage their rides and earnings, as well as access to features like navigation and turn-by-turn directions.
- Trip History: The app allows users to view their ride history and receipts, providing an easy way to keep track of expenses and past trips.

## Todo
- Web page to show realtime location tracking
- Customer support feature
- Implement Google Map API to accurately calculate distance between rider and enduser
- Estimated rider arrival time
- Detailed project documentation


## Requirements

- Node.js v14.0.0 or higher
- NPM v6.0.0 or higher
- MongoDB v4.0.0 or higher
- A valid Google Maps API key

## Installation and Setup

1. Clone the repository:
```
git clone https://github.com/your-username/ride-hailing-api.git
```

2. Install the dependencies
```
cd cruise
npm install
```

3. Create a `.env.dev` file in the `/src` directory with the following contents
```makefile
# Database
MONGO_URI_DEV = mongodb://localhost:27017/mydatabase   # Your MongoDB connection string if you run `npm run dev`
MONGO_URI = mongodb://localhost:27017/mydatabase  # Your MongoDB connection string if your run `npm start`

# Server
PORT = 5000   # The port number your server will run on

# JWT
JWT_SECRET = your_jwt_secret_key    # The secret key used to sign JWTs
JWT_COOKIE_EXPIRES = 1    # The time in days until JWT cookies expire
JWT_ACCESS_SECRET = your_jwt_access_secret_key    # The secret key used to sign access JWTs
JWT_ACCESS_EXP = 1h    # The time until access JWTs expire
JWT_REFRESH_SECRET = your_jwt_refresh_secret_key    # The secret key used to sign refresh JWTs
JWT_REFRESH_EXP = 1d    # The time until refresh JWTs expire
JWT_PASSWORDRESET_SECRET = your_jwt_passwordreset_secret_key    # The secret key used to sign password reset JWTs
```
This is just a short sample of what the `.env` file should look like, for the detailed sample check teh sample file in [`/src/.env.sample`](./src/.env.sample)


4. Start the server using the command
```
npm run dev
```

## Usage
These are some of the endpints provided by the API
<table>
  <thead>
    <tr>
      <th>HTTP Method</th>
      <th>Route</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="color: green">GET</td>
      <td>/ride/data/:id</td>
      <td>Get ride data, this includes the rider, the destination, the cost and vehicle</td>
    </tr>
    <tr>
      <td style="color: orange">POST</td>
      <td>/ride/request/init</td>
      <td>Initiates a ride request</td>
    </tr>
    <tr>
      <td style="color: orange">POST</td>
      <td>/ride/request/complete</td>
      <td>Confirms that the ride request is valid</td>
    </tr>
    <tr>
      <td style="color: orange">POST</td>
      <td>/ride/request/cancel</td>
      <td>Cancel ride request</td>
    </tr>
    <tr>
      <td style="color: orange">POST</td>
      <td>/ride/start</td>
      <td>Allows rider to start the ride</td>
    </tr>
    <tr>
      <td style="color: orange">POST</td>
      <td>/ride/complete</td>
      <td>Updates ride status to completed</td>
    </tr>
    <tr>
      <td style="color: orange">POST</td>
      <td>/ride/pay</td>
      <td>User pays for ride</td>
    </tr>
  </tbody>
</table>

## API Documentation
The full API documentation can be found [here](https://documenter.getpostman.com/view/20633788/2s93JwPhRx)


## Author
- Author: Richie Moluno
- Twitter: [@MolunoRichie](https://twitter.com/MolunoRichie)
- Email: molunorichie@gmail.com
