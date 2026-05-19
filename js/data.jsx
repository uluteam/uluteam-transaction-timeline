// data.jsx — central mock data for the buyer portal
// Single source of truth: when wiring real API/auth, swap this file.

const MOCK = {
  buyer: {
    firstName: "Daniel",
    fullName: "Jordan & Kaulanakai",
    email: "buyer@example.com",
  },
  property: {
    address: "94-1004 Kaukahi Pl. #K11",
    city: "Waipahu",
    state: "HI",
    zip: "96797",
    type: "Condominium",
    beds: 4,
    baths: 3,
    sqft: 2840,
    price: "$2.195M",
    status: "Under Contract",
  },
  closing: {
    date: "Tue, May 12",
    fullDate: "Tuesday, May 12",
    time: "11:00 AM",
    location: "Title Guaranty, Ala Moana",
    daysToClose: 20,
  },
  agent: {
    initials: "DU",
    name: "Daniel Ulu",
    title: "Team Leader",
    license: "RS-83724",
    org: "The Ulu Team · Keller Williams Honolulu",
    email: "kristina@uluteam.com",
    phone: "808-201-7751",
    available: "Always available",
  },
  brokerage: {
    name: "Keller Williams Honolulu",
    license: "RB-21303",
  },
  // Action items shown on dashboard
  actions: [
    { title: "Review & sign seller disclosures", sub: "SRPDS packet — 6 items to initial", due: "Today", urgent: true, done: false },
    { title: "Verify homeowner insurance quote", sub: "Island Insurance bound policy needed by Apr 25", due: "In 7 days", urgent: false, done: false },
    { title: "Upload last 2 bank statements", sub: "GEM needs for final underwriting conditions", due: "In 3 days", urgent: true, done: false },
    { title: "Confirm final walkthrough time", sub: "Daniel suggested Apr 30, 3:00 PM", due: "Flexible", urgent: false, done: false },
    { title: "Upload government-issued ID", sub: "Driver's license or passport", due: "Complete", urgent: false, done: true },
  ],
  // Recent activity
  activity: [
    { label: "Inspection report uploaded", time: "Today · 9:42 AM", tone: "red" },
    { label: "Earnest money received by escrow", time: "Apr 14 · 2:18 PM", tone: "green" },
    { label: "Appraisal scheduled — Apr 18", time: "Apr 13 · 11:04 AM", tone: "ink" },
  ],
  // Upcoming milestones
  steps: [
    { label: "Review & sign seller disclosures", date: "By Apr 16", urgent: true },
    { label: "Final walkthrough", date: "Apr 30 · 3:00 PM" },
    { label: "Closing day", date: "May 6 · 11:00 AM" },
  ],
  // Stats summary
  stats: {
    daysToClose: 22,
    openTasks: 3,
    tasksWaiting: 2,
    documents: 12,
    docsNeedingSignature: 2,
  },
};

window.MOCK = MOCK;
