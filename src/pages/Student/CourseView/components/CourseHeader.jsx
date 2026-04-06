import React from 'react';

const CourseHeader = ({ courseData, progress }) => {
  return (
    <div className="course-header">
      <h1>{courseData?.title}</h1>
      <p>{courseData?.description}</p>
      <div className="course-meta">
        <span>Instructor: {courseData?.instructor}</span>
        <span>Progress: {progress}%</span>
      </div>
    </div>
  );
};

export default CourseHeader;
