import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";
import OTP from "@/models/OTP";
import User from "@/models/User";

import { connectToDatabase } from "@/lib/db";


// Forgot password functionality removed.
