import Attendance from "../../models/Attendance.js";

export const getAttendanceSummary = async () => {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);

    const attendance = await Attendance.find({
        attendanceDate: {
            $gte: today,
            $lt: tomorrow,
        },
    });

    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;

    attendance.forEach((record) => {
        record.students.forEach((student) => {
            switch (student.status) {
                case "Present":
                    present++;
                    break;

                case "Absent":
                    absent++;
                    break;

                case "Leave":
                    leave++;
                    break;

                case "Late":
                    late++;
                    break;
            }
        });
    });

    const total = present + absent + leave + late;

    return {
        total,
        present,
        absent,
        leave,
        late,
        attendancePercentage:
            total === 0
                ? 0
                : Number(((present / total) * 100).toFixed(2)),
    };
};