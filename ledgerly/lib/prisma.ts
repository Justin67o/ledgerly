// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Create a single PrismaClient instance
// This is what your app and test scripts will import
export const prisma = new PrismaClient();