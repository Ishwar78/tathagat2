// File: StudentDashboard.jsx

import React, { useState, useEffect } from "react";
import StudentSidebar from "../../components/StudentSidebar/StudentSidebar";
import StudentTopbar from "../../components/StudentTopbar/StudentTopbar";
import "./Dashboard.css";

const StudentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDetails, setUserDetails] = useState({});
  const [unlockedCourses, setUnlockedCourses] = useState([]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/user-details", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setUserDetails(data))
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn(
            "⚠️ Error fetching user details - backend may be unavailable:",
            err.message,
          );
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("authToken");

    fetch("http://localhost:5000/api/user/student/my-courses", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setUnlockedCourses(data.courses);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn(
            "⚠️ Error fetching user courses - backend may be unavailable:",
            err.message,
          );
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="dashboard-layout">
      <div className="sidebar-fixed">
        <StudentSidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      </div>

      <div className="dashboard-main-content">
        <StudentTopbar userDetails={userDetails} onMenuClick={toggleSidebar} />

        <div className="main-dashboard-body">
          <div className="dashboard-header">
            <h2>
              Welcome back, {userDetails.name?.split(" ")[0] || "Student"} 👋
            </h2>
            <p className="subheading">
              Here’s what’s happening with your learning today.
            </p>
          </div>

          <div className="dashboard-stats">
            <div className="stat-box">
              <h3>3</h3>
              <p>Active Courses</p>
            </div>
            <div className="stat-box">
              <h3>12</h3>
              <p>Lessons Completed</p>
            </div>
            <div className="stat-box">
              <h3>5</h3>
              <p>Upcoming Tests</p>
            </div>
          </div>

          <div className="enrolled-course-section">
            <h3>Your Enrolled Courses</h3>
            {unlockedCourses.length === 0 ? (
              <p className="text-muted">No unlocked courses yet.</p>
            ) : (
              <div className="course-card-container">
                {unlockedCourses.map((course) => (
                  <div key={course._id} className="course-card">
                    <img
                      src={`http://localhost:5000/uploads/${course.thumbnail}`}
                      alt={course.name}
                    />
                    <h4>{course.name}</h4>
                    <p
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    ></p>
                    <p className="course-price">₹{course.price}</p>
                    <button className="start-btn">Continue</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
