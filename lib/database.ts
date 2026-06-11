import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

const connectToDatabase = async () => {
  if (!MONGODB_URI) {
    console.log("No MONGODB_URI provided. Skipping database connection.");
    return;
  }
  const connectionState = mongoose.connection.readyState;

  if (connectionState === 1) {
    console.log("Database connection has already been established.");
    return;
  } 

  if (connectionState === 2) {
    console.log("Establishing database connection...");
    return;
  }

  try {
    mongoose.connect(MONGODB_URI!, {
      dbName: "portfolio",
      bufferCommands: true,
    });
    console.log("Database connection established successfully.");
  } catch (err: any) {
    console.log("Error: ", "Connection to database failed");
    throw new Error("Error: ", err);
  }
};

export default connectToDatabase;
 