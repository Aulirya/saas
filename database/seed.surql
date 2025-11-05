-- Seed data for Aulirya SaaS
-- This script populates the database with test data

USE NS Aulirya;
USE DB saas;

-- ------------------------------
-- CLEAR EXISTING DATA
-- ------------------------------

DELETE courses_progess;
DELETE lessons;
DELETE subjects;
DELETE classes;
DELETE users;

-- ------------------------------
-- USERS (with specific record IDs from Clerk)
-- ------------------------------

CREATE users:user_353UyKo0yGYVRwzFjWRZzg8DaYr CONTENT {
    email: "sophie.x.gillard@gmail.com",
    first_name: "Sophie",
    last_name: "Gillard",
    role: "teacher",
    schools: []
};

CREATE users:user_353ScLkTjg7WIPeEfUZ7xC76M23 CONTENT {
    email: "vincent.devilers@gmail.com",
    first_name: "Vincent",
    last_name: "Devilers",
    role: "teacher",
    schools: []
};

-- ------------------------------
-- CLASSES - Sophie's Classes
-- ------------------------------

LET $sophie_class_1 = CREATE classes CONTENT {
    name: "10A Mathematics",
    level: "Year 10",
    school: "Riverside High School",
    students_count: 28
};

LET $sophie_class_2 = CREATE classes CONTENT {
    name: "11B Advanced Math",
    level: "Year 11",
    school: "Riverside High School",
    students_count: 22
};

LET $sophie_class_3 = CREATE classes CONTENT {
    name: "12A Calculus",
    level: "Year 12",
    school: "Riverside High School",
    students_count: 18
};

LET $sophie_class_4 = CREATE classes CONTENT {
    name: "9C Mathematics",
    level: "Year 9",
    school: "Riverside High School",
    students_count: 30
};

LET $sophie_class_5 = CREATE classes CONTENT {
    name: "10B Statistics",
    level: "Year 10",
    school: "Riverside High School",
    students_count: 25
};

-- ------------------------------
-- CLASSES - Vincent's Classes
-- ------------------------------

LET $vincent_class_1 = CREATE classes CONTENT {
    name: "11A Computer Science",
    level: "Year 11",
    school: "Oakwood Academy",
    students_count: 24
};

LET $vincent_class_2 = CREATE classes CONTENT {
    name: "12B Web Development",
    level: "Year 12",
    school: "Oakwood Academy",
    students_count: 20
};

LET $vincent_class_3 = CREATE classes CONTENT {
    name: "10A Programming Basics",
    level: "Year 10",
    school: "Oakwood Academy",
    students_count: 26
};

LET $vincent_class_4 = CREATE classes CONTENT {
    name: "11C Data Science",
    level: "Year 11",
    school: "Oakwood Academy",
    students_count: 19
};

LET $vincent_class_5 = CREATE classes CONTENT {
    name: "12A Software Engineering",
    level: "Year 12",
    school: "Oakwood Academy",
    students_count: 21
};

-- ------------------------------
-- SUBJECTS - Sophie's Subjects
-- ------------------------------

LET $sophie_subject_1 = CREATE subjects CONTENT {
    name: "Algebra II",
    description: "Advanced algebra covering quadratic equations, polynomials, and functions",
    type: "Mathematics",
    total_hours: 60,
    hours_per_week: 4,
    user_id: users:user_353UyKo0yGYVRwzFjWRZzg8DaYr
};

LET $sophie_subject_2 = CREATE subjects CONTENT {
    name: "Calculus I",
    description: "Introduction to differential and integral calculus",
    type: "Mathematics",
    total_hours: 75,
    hours_per_week: 5,
    user_id: users:user_353UyKo0yGYVRwzFjWRZzg8DaYr
};

LET $sophie_subject_3 = CREATE subjects CONTENT {
    name: "Statistics & Probability",
    description: "Statistical analysis and probability theory",
    type: "Mathematics",
    total_hours: 45,
    hours_per_week: 3,
    user_id: users:user_353UyKo0yGYVRwzFjWRZzg8DaYr
};

LET $sophie_subject_4 = CREATE subjects CONTENT {
    name: "Geometry",
    description: "Euclidean geometry and spatial reasoning",
    type: "Mathematics",
    total_hours: 50,
    hours_per_week: 3,
    user_id: users:user_353UyKo0yGYVRwzFjWRZzg8DaYr
};

LET $sophie_subject_5 = CREATE subjects CONTENT {
    name: "Trigonometry",
    description: "Study of triangles, angles, and periodic functions",
    type: "Mathematics",
    total_hours: 40,
    hours_per_week: 3,
    user_id: users:user_353UyKo0yGYVRwzFjWRZzg8DaYr
};

-- ------------------------------
-- SUBJECTS - Vincent's Subjects
-- ------------------------------

LET $vincent_subject_1 = CREATE subjects CONTENT {
    name: "Python Programming",
    description: "Fundamentals of Python programming language",
    type: "Computer Science",
    total_hours: 80,
    hours_per_week: 5,
    user_id: users:user_353ScLkTjg7WIPeEfUZ7xC76M23
};

LET $vincent_subject_2 = CREATE subjects CONTENT {
    name: "Web Development",
    description: "HTML, CSS, JavaScript and modern web frameworks",
    type: "Computer Science",
    total_hours: 90,
    hours_per_week: 6,
    user_id: users:user_353ScLkTjg7WIPeEfUZ7xC76M23
};

LET $vincent_subject_3 = CREATE subjects CONTENT {
    name: "Database Systems",
    description: "SQL, NoSQL, and database design principles",
    type: "Computer Science",
    total_hours: 60,
    hours_per_week: 4,
    user_id: users:user_353ScLkTjg7WIPeEfUZ7xC76M23
};

LET $vincent_subject_4 = CREATE subjects CONTENT {
    name: "Data Structures & Algorithms",
    description: "Core computer science concepts and problem solving",
    type: "Computer Science",
    total_hours: 70,
    hours_per_week: 4,
    user_id: users:user_353ScLkTjg7WIPeEfUZ7xC76M23
};

LET $vincent_subject_5 = CREATE subjects CONTENT {
    name: "Software Engineering Principles",
    description: "Design patterns, testing, and software development lifecycle",
    type: "Computer Science",
    total_hours: 65,
    hours_per_week: 4,
    user_id: users:user_353ScLkTjg7WIPeEfUZ7xC76M23
};

-- ------------------------------
-- LESSONS - Sophie's Lessons
-- ------------------------------

CREATE lessons CONTENT {
    title: "Quadratic Equations - Introduction",
    date: time::now() - 7d,
    duration_minutes: 60,
    average_duration: 60,
    status: "done",
    class_id: $sophie_class_1[0].id,
    subject_id: $sophie_subject_1[0].id
};

CREATE lessons CONTENT {
    title: "Derivatives and Limits",
    date: time::now() - 3d,
    duration_minutes: 75,
    average_duration: 75,
    status: "done",
    class_id: $sophie_class_3[0].id,
    subject_id: $sophie_subject_2[0].id
};

CREATE lessons CONTENT {
    title: "Probability Distributions",
    date: time::now(),
    duration_minutes: 50,
    average_duration: 50,
    status: "in progress",
    class_id: $sophie_class_5[0].id,
    subject_id: $sophie_subject_3[0].id
};

CREATE lessons CONTENT {
    title: "Triangle Properties and Proofs",
    date: time::now() + 2d,
    duration_minutes: 60,
    average_duration: 60,
    status: "planned",
    class_id: $sophie_class_4[0].id,
    subject_id: $sophie_subject_4[0].id
};

CREATE lessons CONTENT {
    title: "Sine and Cosine Functions",
    date: time::now() + 5d,
    duration_minutes: 55,
    average_duration: 55,
    status: "planned",
    class_id: $sophie_class_2[0].id,
    subject_id: $sophie_subject_5[0].id
};

-- ------------------------------
-- LESSONS - Vincent's Lessons
-- ------------------------------

CREATE lessons CONTENT {
    title: "Python Basics - Variables and Data Types",
    date: time::now() - 5d,
    duration_minutes: 90,
    average_duration: 90,
    status: "done",
    class_id: $vincent_class_3[0].id,
    subject_id: $vincent_subject_1[0].id
};

CREATE lessons CONTENT {
    title: "React Components and Props",
    date: time::now() - 2d,
    duration_minutes: 120,
    average_duration: 120,
    status: "done",
    class_id: $vincent_class_2[0].id,
    subject_id: $vincent_subject_2[0].id
};

CREATE lessons CONTENT {
    title: "SQL Queries and Joins",
    date: time::now() + 1d,
    duration_minutes: 90,
    average_duration: 90,
    status: "planned",
    class_id: $vincent_class_1[0].id,
    subject_id: $vincent_subject_3[0].id
};

CREATE lessons CONTENT {
    title: "Binary Trees and Graph Traversal",
    date: time::now() + 3d,
    duration_minutes: 100,
    average_duration: 100,
    status: "planned",
    class_id: $vincent_class_4[0].id,
    subject_id: $vincent_subject_4[0].id
};

CREATE lessons CONTENT {
    title: "Test-Driven Development Workshop",
    date: time::now() + 7d,
    duration_minutes: 120,
    average_duration: 120,
    status: "backlog",
    class_id: $vincent_class_5[0].id,
    subject_id: $vincent_subject_5[0].id
};

-- ------------------------------
-- COURSES PROGRESS - Sophie's Progress
-- ------------------------------

CREATE courses_progess CONTENT {
    class_id: $sophie_class_1[0].id,
    subject_id: $sophie_subject_1[0].id,
    hours_done: 24,
    hours_per_week: 4,
    hours_remaining: 36,
    progress_percent: 40,
    status: "in progress"
};

CREATE courses_progess CONTENT {
    class_id: $sophie_class_3[0].id,
    subject_id: $sophie_subject_2[0].id,
    hours_done: 45,
    hours_per_week: 5,
    hours_remaining: 30,
    progress_percent: 60,
    status: "in progress"
};

CREATE courses_progess CONTENT {
    class_id: $sophie_class_5[0].id,
    subject_id: $sophie_subject_3[0].id,
    hours_done: 15,
    hours_per_week: 3,
    hours_remaining: 30,
    progress_percent: 33,
    status: "in progress"
};

CREATE courses_progess CONTENT {
    class_id: $sophie_class_4[0].id,
    subject_id: $sophie_subject_4[0].id,
    hours_done: 5,
    hours_per_week: 3,
    hours_remaining: 45,
    progress_percent: 10,
    status: "planned"
};

CREATE courses_progess CONTENT {
    class_id: $sophie_class_2[0].id,
    subject_id: $sophie_subject_5[0].id,
    hours_done: 35,
    hours_per_week: 3,
    hours_remaining: 5,
    progress_percent: 87,
    status: "in progress"
};

-- ------------------------------
-- COURSES PROGRESS - Vincent's Progress
-- ------------------------------

CREATE courses_progess CONTENT {
    class_id: $vincent_class_3[0].id,
    subject_id: $vincent_subject_1[0].id,
    hours_done: 40,
    hours_per_week: 5,
    hours_remaining: 40,
    progress_percent: 50,
    status: "in progress"
};

CREATE courses_progess CONTENT {
    class_id: $vincent_class_2[0].id,
    subject_id: $vincent_subject_2[0].id,
    hours_done: 70,
    hours_per_week: 6,
    hours_remaining: 20,
    progress_percent: 78,
    status: "in progress"
};

CREATE courses_progess CONTENT {
    class_id: $vincent_class_1[0].id,
    subject_id: $vincent_subject_3[0].id,
    hours_done: 20,
    hours_per_week: 4,
    hours_remaining: 40,
    progress_percent: 33,
    status: "in progress"
};

CREATE courses_progess CONTENT {
    class_id: $vincent_class_4[0].id,
    subject_id: $vincent_subject_4[0].id,
    hours_done: 10,
    hours_per_week: 4,
    hours_remaining: 60,
    progress_percent: 14,
    status: "planned"
};

CREATE courses_progess CONTENT {
    class_id: $vincent_class_5[0].id,
    subject_id: $vincent_subject_5[0].id,
    hours_done: 0,
    hours_per_week: 4,
    hours_remaining: 65,
    progress_percent: 0,
    status: "backlog"
};
