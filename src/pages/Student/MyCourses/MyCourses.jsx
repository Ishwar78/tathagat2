import React, { useState, useEffect } from "react";
import StudentSidebar from "../../../components/StudentSidebar/StudentSidebar";
import StudentTopbar from "../../../components/StudentTopbar/StudentTopbar";
import axios from "axios";
import "./MyCourses.css";
import MyCoursePic from "../../../images/ourBlogTwo.png";

const MyCourses = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDetails, setUserDetails] = useState({});
  const [publishedCourses, setPublishedCourses] = useState([]);
  // const [selectedCourseId, setSelectedCourseId] = useState(null);
  // const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

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
            "⚠️ Failed to load user details - backend may be unavailable:",
            err.message,
          );
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("http://localhost:5000/api/courses/student/published-courses", {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success) setPublishedCourses(data.courses);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn(
            "⚠️ Failed to load published courses - backend may be unavailable:",
            err.message,
          );
        }
      });

    return () => controller.abort();
  }, []);

  const handleStartClick = async (courseId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("❌ Please login again!");
      return;
    }

    try {
      // ✅ 1️⃣ Check if already unlocked
      const checkRes = await axios.get(
        `http://localhost:5000/api/user/student/my-courses`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const alreadyUnlocked = checkRes.data.courses.some(
        (c) => c._id === courseId,
      );

      if (alreadyUnlocked) {
        alert("✅ You have already purchased/unlocked this course.");
        return;
      }

      // ✅ 2️⃣ Get course details to fetch actual price
      const courseRes = await axios.get(
        `http://localhost:5000/api/courses/${courseId}`,
      );

      const course = courseRes.data.course;
      if (!course) {
        alert("❌ Course not found");
        return;
      }

      const amountInPaise = course.price * 100; // Convert ₹ to paise

      // ✅ 3️⃣ Create order with dynamic price
      const orderRes = await axios.post(
        "http://localhost:5000/api/user/payment/create-order",
        { amount: amountInPaise },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const { order } = orderRes.data;

      const options = {
        key: "rzp_test_JLdFnx7r5NMiBS", // replace with your Razorpay key
        amount: order.amount,
        currency: "INR",
        name: "Tathagat Academy",
        description: course.name,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              "http://localhost:5000/api/user/payment/verify-and-unlock",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: courseId,
              },
              { headers: { Authorization: `Bearer ${token}` } },
            );

            if (verifyRes.data.success) {
              alert("✅ Payment verified & course unlocked!");
              // Refetch published courses
              fetch(
                "http://localhost:5000/api/courses/student/published-courses",
              )
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    setPublishedCourses(data.courses);
                  }
                })
                .catch((err) =>
                  console.error("Failed to reload published courses", err),
                );
            } else {
              alert("❌ Verification failed: " + verifyRes.data.message);
            }
          } catch (err) {
            console.error("❌ Verification error:", err);
            alert("❌ Verification failed");
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert("❌ Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Something went wrong");
    }
  };

  //  const confirmPurchase = async () => {
  //   const token = localStorage.getItem("authToken");
  //   if (!token) {
  //     alert("❌ Please login again!");
  //     return;
  //   }

  //   try {
  //     // 1️⃣ First Enroll
  //     await axios.post(
  //       `http://localhost:5000/api/user/student/enroll/${selectedCourseId}`,
  //       {},
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     // 2️⃣ Then Unlock
  //     await axios.put(
  //       `http://localhost:5000/api/user/student/unlock/${selectedCourseId}`,
  //       {},
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     alert("✅ Course purchased and unlocked!");
  //     setShowPurchaseDialog(false);
  //     window.location.reload();
  //   } catch (err) {
  //     console.error("❌ Unlock error:", err.response?.data || err.message);
  //     alert(err.response?.data?.message || "❌ Failed to unlock course.");
  //   }
  // };

  return (
    <div className="dashboard-layout">
      <StudentSidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <div className="dashboard-main-content">
        <StudentTopbar userDetails={userDetails} onMenuClick={toggleSidebar} />
        <div className="main-dashboard-body my-courses-container">
          <div className="course-block">
            <h2 className="course-title">Enrolled Courses</h2>
            <div className="filter-tags">
              <span className="tag selected">QUANT</span>
              <span className="tag">Verbal</span>
              <span className="tag">LRDI</span>
            </div>

            <div className="course-card-container">
              {publishedCourses.map((course) => (
                <div className="course-card" key={course._id}>
                  <img
                    src={`http://localhost:5000/uploads/${course.thumbnail}`}
                    alt={course.name}
                  />
                  <div className="course-card-content">
                    <h3>{course.name}</h3>
                    <div
                      className="course-description"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    ></div>
                    <div className="course-card-footer">
                      <span className="course-price">₹{course.price}</span>
                      <button
                        className="start-btn"
                        onClick={() => handleStartClick(course._id)}
                      >
                        Start Course
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="course-block">
            <h2 className="course-title">Free Courses</h2>
            <div className="filter-tags">
              <span className="tag selected">Workshop</span>
              <span className="tag">Mini Workshop</span>
              <span className="tag">Topper Batch</span>
            </div>

            <div className="course-card-container">
              <div className="course-card">
                <img src={MyCoursePic} alt="Course" />
                <h3>CAT Introduction</h3>
                <ul>
                  <li>✅ 4 Hr Workshop</li>
                  <li>✅ Basics of Quant & LRDI</li>
                  <li>✅ Free Test Access</li>
                </ul>
                <button className="start-btn">Play Video</button>
              </div>

              <div className="course-card">
                <img src={MyCoursePic} alt="Course" />
                <h3>Speed Calculation</h3>
                <ul>
                  <li>✅ Speed Tricks</li>
                  <li>✅ Mental Math Sessions</li>
                  <li>✅ PDF Notes Included</li>
                </ul>
                <button className="start-btn">Play Video</button>
              </div>
            </div>
          </div>
          <div className="course-block">
            <h2 className="course-title">Free Video</h2>
            <div className="filter-tags">
              <span className="tag selected">CAT</span>
              <span className="tag">XAT</span>
              <span className="tag">SNAP</span>
              <span className="tag">GMAT</span>
            </div>

            <div className="course-card-container">
              <div className="course-card">
                <img src={MyCoursePic} alt="Course" />
                <h3>Topper Interview</h3>
                <ul>
                  <li>✅ 98+ Percentiler</li>
                  <li>✅ Preparation Tips</li>
                  <li>✅ Motivation & Strategy</li>
                </ul>
                <button className="start-btn">Watch Now</button>
              </div>

              <div className="course-card">
                <img src={MyCoursePic} alt="Course" />
                <h3>LRDI Special</h3>
                <ul>
                  <li>✅ Logical Sets</li>
                  <li>✅ PYQs Solved</li>
                  <li>✅ Mindset Building</li>
                </ul>
                <button className="start-btn">Watch Now</button>
              </div>
            </div>
          </div>
          s
        </div>
      </div>

      {/* {showPurchaseDialog && (
        <div className="purchase-dialog-overlay">
          <div className="purchase-dialog">
            <h3>Do you want to purchase this course?</h3>
            <div className="dialog-actions">
              <button onClick={confirmPurchase}>Yes, Purchase</button>
              <button onClick={() => setShowPurchaseDialog(false)}>No, Cancel</button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default MyCourses;
