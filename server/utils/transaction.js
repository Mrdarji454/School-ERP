import mongoose from "mongoose";
export async function transaction(work) {
  const session = await mongoose.startSession();
  try { return await session.withTransaction(() => work(session)); }
  catch (error) {
    if (error.code === 20 || /Transaction numbers are only allowed/.test(error.message)) {
      throw Object.assign(new Error("This operation requires MongoDB configured as a replica set"), { status: 503 });
    }
    throw error;
  } finally { await session.endSession(); }
}
