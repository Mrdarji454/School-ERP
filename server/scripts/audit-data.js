// Read-only deployment preflight. Prints counts, never credentials or student records.
import "dotenv/config";
import mongoose from "mongoose";
try {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  const db = mongoose.connection.db;
  const checks = [
    ["users", { email: "$email" }],
    ["students", { admissionNo: "$admissionNo" }],
    ["studentfees", { student: "$student", feeStructure: "$feeStructure" }],
    ["teachersalaries", { teacher: "$teacher", month: "$month", year: "$year" }],
    ["attendances", { teacherAssignment: "$teacherAssignment", attendanceDate: "$attendanceDate", period: "$period" }],
  ];
  for (const [name, keys] of checks) {
    const result = await db.collection(name).aggregate([{ $group: { _id: keys, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }, { $count: "groups" }]).toArray();
    console.log(`${name}: ${result[0]?.groups || 0} duplicate key groups`);
  }
  console.log("Current academic years:", await db.collection("academicyears").countDocuments({ isCurrent: true }));
  console.log("Legacy period numbers needing review:", await db.collection("periods").countDocuments({ periodNumber: { $type: "objectId" } }));
  console.log("Legacy student parent-name fields needing review:", await db.collection("students").countDocuments({ $or: [{ fathername: { $exists: true } }, { mothername: { $exists: true } }] }));
  for (const [collection, total] of [["studentfees", "totalAmount"], ["teachersalaries", "netSalary"]]) {
    console.log(`${collection}: inconsistent balances`, await db.collection(collection).countDocuments({ $expr: { $ne: [{ $round: [{ $multiply: [{ $subtract: [`$${total}`, "$paidAmount"] }, 100] }, 0] }, { $round: [{ $multiply: ["$remainingAmount", 100] }, 0] }] } }));
  }
} catch { console.error("Audit failed; verify database connectivity and read permissions"); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
