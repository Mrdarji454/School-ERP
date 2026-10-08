import StudentFee from "../../models/StudentFee.js";

export const getPendingFees = async () => {

    return await StudentFee.find({
        paymentStatus: {
            $ne: "Paid",
        },
        isActive: true,
    })
        .populate({
            path: "student",
            populate: {
                path: "user",
                select: "fullname",
            },
        })
        .populate("feeStructure", "semester amount")
        .limit(5);

};