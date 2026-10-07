/** The members' newsletter list, for the render test. */
const sections = [
  { heading: "Where we are", points: ["The licence application is with the Central Bank of Lesotho.", "The platform is in testing with the board."] },
  { heading: "Next steps", points: ["Complete the data room", "Board meeting in November"] },
];
export default {
  "GET /api/newsletters/members": [
    { id: 5, slug: "monthly-oct-2026", issue_no: 5, series: "Monthly", title: "Monthly update, October 2026", published_on: "2026-10-01", period_label: "October 2026", summary: "Progress on the licence application and the platform.", sections, has_file: true, file_bytes: 1_240_000, external_url: null },
    { id: 4, slug: "quarterly-aug-2026", issue_no: 4, series: "Quarterly Review", title: "Quarterly review, August 2026", published_on: "2026-08-15", period_label: "Q2 2026", summary: "A look at the quarter.", sections: [], has_file: false, file_bytes: null, external_url: "https://drive.example.test/q2-review" },
    { id: 3, slug: "monthly-jul-2026", issue_no: 3, series: "Monthly", title: "Monthly update, July 2026", published_on: "2026-07-01", period_label: null, summary: "", sections: [], has_file: false, file_bytes: null, external_url: null },
  ],
} as Record<string, unknown>;
