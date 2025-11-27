import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Check if token is valid (not 'null' or 'undefined' string)
      if (!token || token === "null" || token === "undefined") {
        return res.status(401).json({ message: "Not authorized, no token" });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log(
        "OptionalAuth - Token received:",
        token?.substring(0, 20) + "..."
      );
      // Only verify if token exists and is not empty
      if (token && token !== "null" && token !== "undefined") {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        console.log("OptionalAuth - User found:", req.user?._id);
      } else {
        console.log("OptionalAuth - Invalid token string");
        req.user = null;
      }
    } catch (error) {
      // Continue without user - silently handle any token errors
      console.log("Optional auth token error:", error.message);
      req.user = null;
    }
  } else {
    console.log("OptionalAuth - No authorization header");
    req.user = null;
  }
  next();
};
