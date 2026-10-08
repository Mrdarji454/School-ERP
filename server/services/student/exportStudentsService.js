import ExcelJS from "exceljs";
import Student from "../../models/Student.js";
import User from "../../models/User.js";

export const exportStudentsService = async (query) => {

    const {
        search,
        schoolClass,
        section,
        status,
    } = query;

    const filter = {};

    if (status !== undefined && status !== "") {
        filter.isActive = status === "true";
    }

    if (schoolClass) {
        filter.schoolClass = schoolClass;
    }

    if (section) {
        filter.section = section;
    }

    if (search) {

        const users = await User.find({
            fullname: {
                $regex: search,
                $options: "i",
            },
        }).select("_id");

        filter.user = {
            $in: users.map(user => user._id),
        };

    }

    const students = await Student.find(filter)
        .populate("user")
        .populate("schoolClass")
        .populate("section");

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Students");

    sheet.columns = [
        { header: "Admission No", key: "admissionNo", width: 18 },
        { header: "Name", key: "name", width: 30 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "Class", key: "class", width: 15 },
        { header: "Section", key: "section", width: 15 },
        { header: "Status", key: "status", width: 15 },
    ];

    students.forEach(student => {

        sheet.addRow({

            admissionNo: student.admissionNo,

            name: student.user?.fullname,

            email: student.user?.email,

            phone: student.user?.phone,

            class: student.schoolClass?.name,

            section: student.section?.name,

            status: student.isActive ? "Active" : "Inactive",

        });

    });

    return workbook;

};