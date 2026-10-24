/**
 * FAQ content, used by both the page and its FAQPage structured data so they always match.
 * Answers describe only what the site and team actually offer; nothing here promises dates,
 * prices or merchandise that do not exist.
 */
export type FaqItem = { question: string; answer: string; link?: { href: string; label: string } };

export const FAQ: FaqItem[] = [
  {
    question: "Who are Epic Elites?",
    answer:
      "Epic Elites is a Free Fire esports team. This site is the official home for the roster, fixtures, results, team media and announcements.",
    link: { href: "/about", label: "About the team" },
  },
  {
    question: "Which game and formats does the team play?",
    answer:
      "Garena Free Fire. Fixtures are listed by format: Battle Royale tournaments are shown by event and stage, and Clash Squad matches are shown against their opponent.",
    link: { href: "/matches", label: "See the match center" },
  },
  {
    question: "Where can I see upcoming matches and results?",
    answer:
      "On the Matches page. Start times are shown in the event's own time zone, and results appear only after they have been verified.",
    link: { href: "/matches", label: "Open Matches" },
  },
  {
    question: "Who is on the roster?",
    answer:
      "The Roster page lists every active player with their role and jersey number. Open a card for the full profile. Names and roles are updated as the lineup is confirmed.",
    link: { href: "/roster", label: "Meet the roster" },
  },
  {
    question: "How do I invite Epic Elites to a tournament or scrim?",
    answer:
      "Use the contact form and choose Tournament invitation. Include the event name, format, dates and a link to the organizer's rules or registration page.",
    link: { href: "/contact", label: "Send an invitation" },
  },
  {
    question: "How can a brand partner with or sponsor the team?",
    answer:
      "Send a Partnership inquiry through the contact form with your company, what you have in mind and how to reach you. Confirmed partners are listed on the About page.",
    link: { href: "/contact", label: "Start a partnership inquiry" },
  },
  {
    question: "How do I contact the team for interviews or media?",
    answer: "Choose Media request on the contact form and include your outlet, deadline and what you need.",
    link: { href: "/contact", label: "Contact the team" },
  },
  {
    question: "Will I get a reply to my message?",
    answer:
      "Every message goes straight to the team inbox, and replies are sent to the email address you provide. Check that it is correct before sending.",
  },
  {
    question: "How can I join the team?",
    answer:
      "If the team opens recruitment, it will be announced on the News page. You can also introduce yourself with a General message through the contact form.",
    link: { href: "/news", label: "Read the news" },
  },
  {
    question: "Where can I see the team jersey?",
    answer: "The Media page has an interactive 3D view of the official jersey, front and back, plus team photos.",
    link: { href: "/media", label: "See the kit" },
  },
  {
    question: "Where can I follow Epic Elites?",
    answer:
      "Official social channels are linked in the site footer and on the Contact page as soon as they are live. Accounts not linked there are not run by the team.",
  },
];
