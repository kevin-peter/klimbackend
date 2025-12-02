const { promisify } = require("util");
const jwt = require("jsonwebtoken");
//const { pool } = require('./db');
const pool = require("./../../../config/database");
const { AuthError, InputError } = require("./../common/errors");
const User = require("../user/user-modal");

const asyncJWTSign = promisify(jwt.sign, jwt);

const authenticateToken = async (req, res, next) => {
  // Gather the jwt access token from the request header
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null)
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });

    let user = [];
    jwt.verify(token, process.env.SHRI_JWT_SECRET, (err, user) => {
      if (err) {
        console.log(err);
        // return res.status(403).json({
        //   success: false,
        //   message: "Authentication failed",
        // });
      }
      req.user = user;

      //next();
    });

    /* custom code start */
    //console.log(req.user)
    const userId = req.user.id;
    // Check if the user has an active session
    const result = await pool.query(
      "SELECT * FROM users_sessions WHERE uid = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    if (!result || result.length === 0 || result[0].token !== token) {
      throw new AuthError("Invalid session");
      //throw new Error(); // Invalid session
    }

    /* custom code end */
    next();
  } catch (error) {
    throw new AuthError("Invalid session");
    //res.status(401).send({ error: "Please authenticate." });
  }
};

const authenticateAndCheckSession = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user = user;

    const userId = req.user.userId;

    // Check if there is an existing session for this user
    redisClient.get(userId, (err, sessionId) => {
      if (err) {
        return res.status(500).json({ message: "Internal Server Error" });
      }

      // If a session exists, invalidate it
      if (sessionId) {
        req.logout(); // Assuming you have a logout function
        redisClient.del(userId, () => {
          next();
        });
      } else {
        next();
      }
    });
  });
};

const authenticateIP = (req, res, next) => {
  // Gather the jwt access token from the request header
  var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  //var ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();

  console.log(ip);
  //var ips = ['::1','::ffff:68.183.92.225', '::ffff:43.241.195.142', '::ffff:13.200.57.33']
  var ips = [
    "::1",
    "::ffff:68.183.92.225",
    "::ffff:43.241.195.142",
    "::ffff:13.200.57.33",
    "::ffff:13.234.70.182",
  ];

  if (!ips.includes(ip)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized request.",
    });
  }
  req.ip = ip;
  next();
};

const getSignedToken = async (login) => {
  const token = await asyncJWTSign(
    {
      email: login[0].email,
      role: login[0].u_role,
      part: login[0].part,
      ip: login[0].ip,
      id: login[0].id,
    },
    process.env.SHRI_JWT_SECRET,
    { expiresIn: "1d" }
  );

  return token;
};

const parseJwt = (req) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch (e) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  authenticateIP,
  getSignedToken,
  parseJwt,
};
