const express = require("express");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

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

// Middleware: require superuser role
function requireSuperuser(req, res, next) {
  if (req.user.role !== "SUPERUSER") {
    return res.status(403).json({ message: "Access denied: superuser only" });
  }
  next();
}

// GET all pending users
router.get("/pending", authenticate, requireSuperuser, async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: "PENDING", isVerified: true },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    });
    res.json(pendingUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all users (for management)
router.get("/users", authenticate, requireSuperuser, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// APPROVE a user
router.post("/approve/:id", authenticate, requireSuperuser, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    console.log(`Approved: ${user.email}`);
    res.json({ message: "User approved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// REJECT a user
router.post("/reject/:id", authenticate, requireSuperuser, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    console.log(`Rejected: ${user.email}`);
    res.json({ message: "User rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// DELETE a user (and their tasks)
router.delete("/users/:id", authenticate, requireSuperuser, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    // Delete their tasks first (foreign key constraint)
    await prisma.task.deleteMany({ where: { userId: id } });

    // Then delete the user
    await prisma.user.delete({ where: { id } });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;