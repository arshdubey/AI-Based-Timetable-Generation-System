export type CourseBucket = 'Major' | 'Minor' | 'MDC' | 'AEC' | 'SEC' | 'VAC';

export interface ScheduleEvent {
  id: string;
  courseId: string;
  title: string;
  department: string;
  faculty: string;
  classroom: string;
  students: string[]; // List of Student ABC IDs
  bucket: CourseBucket;
  dayOfWeek: number; // 1 (Monday) to 5 (Friday)
  startSlot: number; // 0 to 7 (8 slots a day)
  endSlot: number;
}

// Map slots to times. E.g., slot 0 is 09:00, slot 7 is 16:00
export const slotToTime = (slot: number) => {
  const startHour = 9 + slot;
  return `${startHour.toString().padStart(2, '0')}:00:00`;
}

export const mockEvents: ScheduleEvent[] = [
  {
    id: "1",
    courseId: "CS101",
    title: "Intro to Computer Science",
    department: "Computer Science",
    faculty: "Dr. Smith",
    classroom: "Room 301",
    students: ["ABC001", "ABC002", "ABC003"],
    bucket: "Major",
    dayOfWeek: 1, // Monday
    startSlot: 0, // 09:00 AM
    endSlot: 1,   // 10:00 AM
  },
  {
    id: "2",
    courseId: "MA201",
    title: "Linear Algebra",
    department: "Mathematics",
    faculty: "Prof. Johnson",
    classroom: "Room 102",
    students: ["ABC001", "ABC004"],
    bucket: "Minor",
    dayOfWeek: 1, // Monday
    startSlot: 1, // 10:00 AM
    endSlot: 2,
  },
  {
    id: "3",
    courseId: "HU105",
    title: "Environmental Studies",
    department: "Humanities",
    faculty: "Dr. Green",
    classroom: "Room 205",
    students: ["ABC002", "ABC003"],
    bucket: "AEC",
    dayOfWeek: 2, // Tuesday
    startSlot: 2, // 11:00 AM
    endSlot: 3,
  },
  {
    id: "4",
    courseId: "CS305",
    title: "Data Structures",
    department: "Computer Science",
    faculty: "Dr. Smith", // Same faculty
    classroom: "Room 301", // Same room
    students: ["ABC005"],
    bucket: "Major",
    dayOfWeek: 1,
    startSlot: 0, // Deliberate clash with Intro to CS for demonstration
    endSlot: 1,
  },
  {
    id: "5",
    courseId: "EE201",
    title: "Basic Electronics",
    department: "Electrical",
    faculty: "Prof. Watt",
    classroom: "Room 404",
    students: ["ABC001"], // Deliberate clash for student ABC001 on Tuesday 11:00
    bucket: "MDC",
    dayOfWeek: 2, // Tuesday
    startSlot: 2, // 11:00 AM
    endSlot: 3,
  }
];
