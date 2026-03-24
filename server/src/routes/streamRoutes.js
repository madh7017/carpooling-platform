const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id");
    if (!user) return res.status(401).end();

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("event: connected\ndata: {}\n\n");

    const stream = req.app.get("stream");
    stream.addClient(user._id.toString(), res);

    req.on("close", () => {
      stream.removeClient(user._id.toString(), res);
    });
  } catch (err) {
    return res.status(401).end();
  }
});

module.exports = router;
