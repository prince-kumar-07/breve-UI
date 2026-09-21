import { NavLink } from "react-router-dom";
import s from "./SectionTabs.module.css";

const TABS = [
  ["/dashboard", "Links"],
  ["/pages", "Bio pages"],
];

/** Links and bio pages are deliberately separate resources — own model,
 *  own list, own creation flow — but someone still needs an easy way to
 *  move between the two without hunting through the main nav for it. */
export default function SectionTabs() {
  return (
    <nav className={s.tabs} aria-label="Dashboard section">
      {TABS.map(([to, label]) => (
        <NavLink key={to} to={to} className={({ isActive }) => `${s.tab} ${isActive ? s.tabActive : ""}`}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
