import { sendResponse } from "../../utils/apiResponse.js";
import AcademicYear from "../../models/AcademicYear.js"
export const createAcademicYearService = async (body) => {
    const {
        name,
        startDate,
        endDate
    } = body;

    const exists = await AcademicYear.findOne({ name });

    if (exists) {
        throw Object.assign(new Error("Academic year exists"), { status: 409 });

    };

    const academicYear = await AcademicYear.create({
        name,
        startDate,
        endDate
    });
    return academicYear;
}
