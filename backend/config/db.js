import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Remove deprecated options - not needed in MongoDB Driver 4.0+
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
