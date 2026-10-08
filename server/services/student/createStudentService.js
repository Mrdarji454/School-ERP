import mongoose from "mongoose";
import User from "../../models/User.js";
import Student from "../../models/Student.js";
import { sendResponse } from "../../utils/apiResponse.js";
export const createStudentService = async (studentData) => {

    const {
        fullname,
        email,
        password,
        rollNumber,
        schoolClass,
        section,
        fathername,
        mothername,
        dob,
        gender,
        phone,
        address,
        bloodGroup,
    } = studentData;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        // await session.abortTransaction();
        // session.endSession();

        throw new Error("User already exists");
    }
    const count = await Student.countDocuments();
    const admissionNo = "ADM" + new Date().getFullYear() + String(count + 1).padStart(4, 0);

    //create user

    const user = await User.create(
        [
            {
                fullname,
                email,
                password,
                role: "Student",
            },
        ]
        //, { session }
    );

    const student = await Student.create(
        [
            {
                user: user[0]._id,
                admissionNo,
                rollNumber,
                schoolClass,
                section,
                fathername,
                mothername,
                dob,
                gender,
                phone,
                address,
                bloodGroup,
            },
        ]
        // ,{ session }
    );
    // await session.commitTransaction();
    // session.endSession();

    const createdStudent = await Student.findById(student[0]._id)
        .populate("schoolClass", "name")
        .populate("section", "name")
        .populate("user", "fullname email");

    return createdStudent;
}