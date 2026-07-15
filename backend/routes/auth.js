const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { sendOtpEmail } = require("../utils");

const router = express.Router();
const prisma = new PrismaClient();
// Middleware: verify JWT (for profile routes)
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

// Temporary in-memory OTP store
const otpStore = {};

// Helper: generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth, city, phone } = req.body;

    if (!firstName || !lastName || !email || !password || !dateOfBirth || !city || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Age check: must be 18+
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      return res.status(400).json({ message: "You must be at least 18 years old to register" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        dateOfBirth: dob,
        city,
        phone,
        role: "USER",
        status: "PENDING",
        isVerified: false,
      },
    });

    const otp = generateOtp();
    otpStore[email] = otp;

    await sendOtpEmail(email, otp);
    console.log(`OTP sent to ${email}`);

    res.status(201).json({
      message: "Registered successfully. OTP sent to your email.",
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (otpStore[email] !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    delete otpStore[email];

    res.json({ message: "Email verified successfully. Awaiting superuser approval." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email with OTP first" });
    }

    if (user.status === "PENDING") {
      return res.status(403).json({ message: "Your account is awaiting superuser approval" });
    }

    if (user.status === "REJECTED") {
      return res.status(403).json({ message: "Your registration was rejected" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// FORGOT PASSWORD - request OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = generateOtp();
    otpStore[email] = otp;

    await sendOtpEmail(email, otp);
    console.log(`Password reset OTP sent to ${email}`);

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD - verify OTP + set new password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (otpStore[email] !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    delete otpStore[email];

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// GET my profile
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        city: true,
        phone: true,
        role: true,
        status: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE my profile
router.put("/me", authenticate, async (req, res) => {
  try {
    const { firstName, lastName, city, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(city !== undefined && { city }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        city: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// GOOGLE SIGN-IN
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const email = payload.email;
    const firstName = payload.given_name || "Google";
    const lastName = payload.family_name || "User";

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // New Google user - create account, still requires superuser approval
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash: "GOOGLE_ACCOUNT", // placeholder, no password login for this account
          dateOfBirth: new Date("2000-01-01"), // placeholder, Google doesn't give DOB
          city: "Unknown",
          phone: "Unknown",
          role: "USER",
          status: "PENDING",
          isVerified: true, // Google already verified their email
        },
      });
    }

    if (user.status === "PENDING") {
      return res.status(403).json({ message: "Your account is awaiting superuser approval" });
    }

    if (user.status === "REJECTED") {
      return res.status(403).json({ message: "Your registration was rejected" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Google sign-in failed" });
  }
});
module.exports = router;
