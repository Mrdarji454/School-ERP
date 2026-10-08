import express from "express";
import protect from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { createStudent } from "../controllers/student/createStudent.js";
import { getAllStudent } from "../controllers/student/getAllStudent.js";
import { getStudentById } from "../controllers/student/getStudentById.js";
import { updateStudent } from "../controllers/student/updateStudent.js";
import { deleteStudent } from "../controllers/student/deleteStudent.js";
import { restoreStudent } from "../controllers/student/restoreStudent.js";
import { validate } from "../middleware/validate.js";
import { exportStudents } from "../controllers/student/exportStudent.js";
import { importStudents } from "../controllers/student/importStudents.js";
import { upload } from "../middleware/multer.js";
import createStudentValidator from "../validators/studentValidator.js";


const router = express.Router();

router.get("/export", protect, authorize("Admin"), exportStudents);
router.post("/import", protect, authorize("Admin"), upload.single("file"), importStudents);
router.get("/", protect, authorize("Admin", "Teacher"), getAllStudent);
// router.post("/", protect, authorize("Admin"), createStudentValidator, validate, createStudent);
router.post(
    "/",
    protect,
    authorize("Admin"),
    createStudentValidator,
    validate,
    createStudent
);
router.put("/:id", protect, authorize("Admin"), updateStudent);
router.delete("/:id", protect, authorize("Admin"), deleteStudent);
router.patch("/:id", protect, authorize("Admin"), restoreStudent);
router.get("/:id", protect, authorize("Admin", "Teacher"), getStudentById);

export default router;