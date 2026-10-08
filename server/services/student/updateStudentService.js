import Student from "../../models/Student.js";
import { sendResponse } from "../../utils/apiResponse.js";
import User from "../../models/User.js";
export const updateStudentServices = async (id, body) => {
    const student = await Student.findById(id);

    if (!student) {
        sendResponse(res, 404, "Student not found");
    }

    const {
        fullname,
        email,
        rollNumber,
        className,
        section,
        fathername,
        mothername,
        dob,
        gender,
        phone,
        address,
        bloodGroup
    } = body;

    // Find linked user
    const user = await User.findById(student.user);

    if (!user) {
        sendResponse(res, 404, "User not found");
    }

    // Check email uniqueness
    if (email && email !== user.email) {

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        user.email = email;
    }

    if (fullname) user.fullname = fullname;

    await user.save();

    // Update Student
    student.rollNumber = rollNumber ?? student.rollNumber;
    student.className = className ?? student.className;
    student.section = section ?? student.section;
    student.fathername = fathername ?? student.fathername;
    student.mothername = mothername ?? student.mothername;
    student.dob = dob ?? student.dob;
    student.gender = gender ?? student.gender;
    student.phone = phone ?? student.phone;
    student.address = address ?? student.address;
    student.bloodGroup = bloodGroup ?? student.bloodGroup;

    await student.save();

    const updatedStudent = await Student.findById(id).populate({
        path: "user",
        select: "-password"
    });
    return student;

}