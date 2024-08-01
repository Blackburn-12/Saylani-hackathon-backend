const Admin = require("../models/admin.model.js");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

exports.registerAdmin = async (request, response) => {
  const { name, email } = request.body;
  // Generate a 6-digit OTP
  const otpPassword = Math.floor(100000 + Math.random() * 900000).toString();

  // Create a new Admin instance
  const newAdmin = new Admin({
    name,
    email,
    otpPassword,
  });

  try {
    // Save the admin to the database
    await newAdmin.save();

    // Setup the email transport
    const transporter = nodemailer.createTransport({
      service: "Gmail", // You can use any email service
      auth: {
        user: process.env.user,
        pass: process.env.pass,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.user,
      to: email,
      subject: "Your OTP for Admin Registration",
      html: `
         <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
           <h2 style="color: #333;">Welcome to Our Platform!</h2>
           <p style="color: #555;">Dear ${name},</p>
           <p style="color: #555;">Thank you for registering. Use the following OTP to complete your registration process:</p>
           <h3 style="color: #333; background-color: #f9f9f9; padding: 10px; display: inline-block; border-radius: 5px;">${otpPassword}</h3>
           <p style="color: #555;">If you did not request this, please ignore this email.</p>
           <p style="color: #555;">Best regards,<br/>Blackburn</p>
         </div>
       `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    response
      .status(201)
      .json({ message: "Admin registered successfully, OTP sent to email." });
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

exports.loginAdmin = async (request, response) => {
  const { otpPassword } = request.body;

  try {
    // Find the admin with the provided OTP
    const admin = await Admin.findOne({ otpPassword });

    if (!admin) {
      return response.status(401).json({ message: "Invalid OTP." });
    }

    // OTP is correct, proceed to the next page (return a success response or token)
    const token = jwt.sign(
      { id: admin._id, email: admin.email, name: admin.name },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );
    response.cookie("token", token).status(200).json({
      message: "Login successful.",
      token,
      adminId: admin._id,
    });
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

exports.logoutAdmin = async (request, response) => {
  try {
    response.clearCookie("token");
    response.status(200).json({
      message: "Logout successful",
      status: true,
    });
  } catch (error) {
    console.log("error", error);
  }
};
