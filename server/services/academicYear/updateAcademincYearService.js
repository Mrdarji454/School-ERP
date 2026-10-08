import AcademicYear from "../../models/AcademicYear.js";

export const upadateAcademicYearService = async (id, body) => {
    const academicYear = await AcademicYear.findById(id);

    // Fixed: Throw a structured error instead of using an undefined 'res'
    if (!academicYear) {
        const error = new Error("academicYear Not found");
        error.statusCode = 404;
        throw error;
    }

    const { name, startDate, endDate } = body;

    if (name && name !== academicYear.name) {
        const existing = await AcademicYear.findOne({ name });
        if (existing) {
            const error = new Error("academic year already exists");
            error.statusCode = 400; // Bad Request
            throw error;
        }
    }

    academicYear.name = name ?? academicYear.name;
    academicYear.startDate = startDate ?? academicYear.startDate;
    academicYear.endDate = endDate ?? academicYear.endDate;

    await academicYear.save();
    return academicYear;
};
