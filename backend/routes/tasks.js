const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Middleware: verify JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// CREATE a task (with optional image)
router.post("/", authenticate, upload.array("images", 5), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const imageUrls = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        imageUrls,
        userId: req.user.userId,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all tasks for logged-in user
router.get("/", authenticate, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE a task (edit title/description, or mark complete)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isCompleted } = req.body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(isCompleted !== undefined && { isCompleted }),
      },
    });

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a task
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ message: "Task not found" });
    }

    await prisma.task.delete({ where: { id } });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// ADD images to an existing task
router.post("/:id/images", authenticate, upload.array("images", 5), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ message: "Task not found" });
    }

    const newUrls = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
    const updatedUrls = [...existing.imageUrls, ...newUrls];

    const task = await prisma.task.update({
      where: { id },
      data: { imageUrls: updatedUrls },
    });

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// REMOVE a single image from a task
router.delete("/:id/images", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updatedUrls = existing.imageUrls.filter((url) => url !== imageUrl);

    const task = await prisma.task.update({
      where: { id },
      data: { imageUrls: updatedUrls },
    });

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;