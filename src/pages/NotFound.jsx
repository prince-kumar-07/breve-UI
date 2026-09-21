import { Link } from "react-router-dom";
import s from "./NotFound.module.css";

export default function NotFound() {
  return (
    <main className={s.wrap} id="main">
      <div className={s.inner}>
        <p className={s.code}>404</p>

        <h1 className={s.title}>
          That link doesn't <em>fold</em> anywhere.
        </h1>

        <p className={s.lede}>
          It may have expired, been retired by its owner, or never existed. The
          short links you made yourself are all still on your dashboard.
        </p>

        <div className={s.actions}>
          <Link className={s.primary} to="/">
            Back to the front
          </Link>
          <Link className={s.secondary} to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
