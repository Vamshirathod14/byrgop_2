// Member directory — seeds the "member" dropdown on the registration form.
//
// Each member carries the display info sent to the registration system:
//   {
//     key,     // stable identifier sent to the backend as `memberKey`
//     name,    // display name shown in the dropdown
//     company, // company auto-filled for the selected member (never typed by visitors)
//     email,   // member/registration email context sent with the payload
//   }
//
// The first record is the REAL member and must be preserved exactly.
// The remaining 11 are clearly-marked DUMMY / LOCAL-TEST records with realistic
// dummy names/companies and random test-only email addresses. Replace them with
// real members when the directory is finalized (the backend member lookup must
// then include the same keys).
export const MEMBERS = [
  // ── Real member ──
  {
    key: 'vamshi',
    name: 'Vamshi',
    company: 'V Soft',
    email: 'vamshinaikramavath@gmail.com',
  },

  // ── DUMMY / LOCAL-TEST members below (do not deploy as real records) ──
  {
    key: 'arjun',
    name: 'Arjun Reddy',
    company: 'Reddy Engineering Works',
    email: 'arjun.reddy@example.test',
  },
  {
    key: 'priya',
    name: 'Priya Sharma',
    company: 'Sharma Textiles',
    email: 'priya.sharma@example.test',
  },
  {
    key: 'rahul',
    name: 'Rahul Nair',
    company: 'Nair Food Products',
    email: 'rahul.nair@example.test',
  },
  {
    key: 'sneha',
    name: 'Sneha Iyer',
    company: 'Iyer Consulting',
    email: 'sneha.iyer@example.test',
  },
  {
    key: 'karthik',
    name: 'Karthik Rao',
    company: 'Rao Logistics',
    email: 'karthik.rao@example.test',
  },
  {
    key: 'divya',
    name: 'Divya Menon',
    company: 'Menon Retail',
    email: 'divya.menon@example.test',
  },
  {
    key: 'vivek',
    name: 'Vivek Joshi',
    company: 'Joshi Infotech',
    email: 'vivek.joshi@example.test',
  },
  {
    key: 'anita',
    name: 'Anita Desai',
    company: 'Desai Hospitality',
    email: 'anita.desai@example.test',
  },
  {
    key: 'suresh',
    name: 'Suresh Babu',
    company: 'Babu Constructions',
    email: 'suresh.babu@example.test',
  },
  {
    key: 'kiran',
    name: 'Kiran Patel',
    company: 'Patel Pharma',
    email: 'kiran.patel@example.test',
  },
  {
    key: 'deepa',
    name: 'Deepa Krishnan',
    company: 'Krishnan Agro',
    email: 'deepa.krishnan@example.test',
  },
];

export function memberByKey(key) {
  return MEMBERS.find((m) => m.key === key) || null;
}