const Course = require("../models/Course");
const Resource = require("../models/Resource");



exports.uploadResource = async (req, res) => {
  try {
    // 1️⃣ Get logged-in user (from auth middleware)
    const user = req.user; // { id, role }

    

    // 2️⃣ Get form data
    const { courseCode, courseTitle, level, resourceType } = req.body;

    if (!courseCode || !resourceType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 3️⃣ Check file
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 4️⃣ Normalize course code
    const normalizedCourseCode = courseCode.toUpperCase();

    // 5️⃣ Find or create course
    let course = await Course.findOne({ courseCode: normalizedCourseCode });

    if (!course) {
      course = await 

({
        courseCode: normalizedCourseCode,
        courseTitle: courseTitle || normalizedCourseCode,
        level: level || null,
        createdBy: user.id,
      });
    }

    // 6️⃣ Save resource record
    const resource = await Resource.create({
      courseId: course._id,
      resourceType, // material | summary | past_questions
      fileUrl: req.file.path, // from cloud storage
      uploadedBy: user.id,
    });

    // 7️⃣ Success response
    res.status(201).json({
      message: "Resource uploaded successfully",
      resource,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
