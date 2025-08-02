import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { Line } from "rc-progress";
import Footer from "../../components/student/Footer";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import Loading from "../../components/student/Loading";

const MyEnrollments = () => {
  const location = useLocation();

  const {
    enrolledCourses,
    calculateCourseDuration,
    navigate,
    userData,
    fetchUserEnrolledCourses,
    backendUrl,
    getToken,
    calculateNoOfLeactures,
  } = useContext(AppContext);

  const [progressArray, setProgressArray] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCourseProgress = async () => {
    try {
      const token = await getToken();

      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          const { data } = await axios.post(
            `${backendUrl}/api/user/get-course-progress`,
            { courseId: course._id },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          let totalLectures = calculateNoOfLeactures(course);
          const lectureCompleted = data.progress
            ? data.progress.lectureCompleted.length
            : 0;

          return { totalLectures, lectureCompleted };
        })
      );

      setProgressArray(tempProgressArray);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?._id) {
      fetchUserEnrolledCourses();
    }
  }, [userData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
    getCourseProgress();
  } else {
    setLoading(false); // ✅ Stop loading even if there are no courses
  }
  }, [enrolledCourses, location]);

  const getProgressPercent = (index) => {
    const progress = progressArray[index];
    if (!progress) return 0;
    return (progress.lectureCompleted * 100) / progress.totalLectures;
  };

  const getStatus = (index) => {
    const progress = progressArray[index];
    if (!progress) return "Loading";
    return progress.lectureCompleted / progress.totalLectures === 1
      ? "Completed"
      : "On Going";
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="md:px-36 px-8 pt-10">
        <h1 className="text-2xl font-semibold">My Enrollments</h1>
        {enrolledCourses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-gray-700">
              You haven't enrolled in any courses yet.
            </p>
          </div>
        ) : (
          <table className="md:table-auto table-fixed w-full overflow-hidden border mt-10">
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">Course</th>
                <th className="px-4 py-3 font-semibold truncate">Duration</th>
                <th className="px-4 py-3 font-semibold truncate">Completed</th>
                <th className="px-4 py-3 font-semibold truncate">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {enrolledCourses.map((course, index) => (
                <tr key={index} className="border-b border-gray-500/20">
                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3">
                    <img
                      src={course.courseThumbnail}
                      alt="thumbnail"
                      className="w-14 sm:w-24 md:w-28"
                    />
                    <div className="flex-1">
                      <p className="mb-1 max-sm:text-sm">
                        {course.courseTitle}
                      </p>
                      <Line
                        strokeWidth={2}
                        percent={getProgressPercent(index)}
                        className="bg-gray-300 rounded-full"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 max-sm:hidden">
                    {calculateCourseDuration(course)}
                  </td>
                  <td className="px-4 py-3 max-sm:hidden">
                    {progressArray[index] &&
                      `${progressArray[index].lectureCompleted} / ${progressArray[index].totalLectures}`}{" "}
                    <span>Lectures</span>
                  </td>
                  <td className="px-4 py-3 max-sm:text-right">
                    <button
                      className="px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 max-sm:text-xs text-white"
                      onClick={() => navigate("/player/" + course._id)}
                    >
                      {getStatus(index)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyEnrollments;
