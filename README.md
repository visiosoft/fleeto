# Fleet Management Application

A comprehensive fleet management system that helps businesses track and manage their vehicles, drivers, maintenance, and related operations.

## Features

- Vehicle Management
- Driver Management
- Maintenance Tracking
- Fuel Management
- Expense Management
- Contract Management
- Reports and Analytics
- Compliance Tracking

## Setup and Installation

### Frontend Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

### Backend API Setup

The application requires a backend API server to connect to MongoDB. The backend code is located in the `fleet-api` directory.

1. Go to the API directory:
   ```
   cd fleet-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your MongoDB connection string:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   DB_NAME=fleet-management
   ```

4. Start the API server:
   ```
   npm start
   ```

## Running the Complete Application

1. Start the backend API server (from the `fleet-api` directory):
   ```
   npm start
   ```

2. In a separate terminal, start the frontend application (from the `fleet-management` directory):
   ```
   npm start
   ```

3. Access the application at http://localhost:3000

## Database Testing

The application includes a Database Test page that allows you to test the connection to MongoDB and verify that the API endpoints are working correctly. You can access this page at http://localhost:3000/database-test.

## Technologies Used

- React
- TypeScript
- Material UI
- Node.js
- Express
- MongoDB

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
