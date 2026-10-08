import expressAsyncHandler from "express-async-handler";
import { exportStudentsService } from "../../services/student/exportStudentsService.js";

export const exportStudents = expressAsyncHandler(async (req, res) => {

    const workbook = await exportStudentsService(req.query);

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
        "Content-Disposition",
        "attachment; filename=students.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();

});