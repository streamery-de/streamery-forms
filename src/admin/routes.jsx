import { createHashRouter } from "react-router-dom";
import ApplicationLayout from "../components/application-layout/LayoutOne";
import Settings from "./pages/settings";
import ErrorPage from "./pages/error/Error";
import Inbox from "./pages/inbox";
import Dashboard from "./pages/dashboard";
import LoginPage from "./pages/login";
import Charts from "./pages/charts";
import MailboxesPage from "./pages/settings/mailboxes";
import ProvidersPage from "./pages/settings/providers";
import LabelsPage from "./pages/settings/labels";
import SmtpPage from "./pages/settings/smtp";
import CaptchaPage from "./pages/settings/captcha";
import WelcomePage from "./pages/welcome";
import FormsUsagePage from "./pages/forms-usage";

export const router = createHashRouter([

  {
    path: "/",
    element: <ApplicationLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <WelcomePage />,
        errorElement: <ErrorPage />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "inbox",
        element: <Inbox />,
      },
      {
        path: "forms-usage",
        element: <FormsUsagePage />,
      },
      {
        path: "settings",
        element: <Settings />,
        children: [
          {
            path: "mailboxes",
            element: <MailboxesPage />,
          },
          {
            path: "providers",
            element: <ProvidersPage />,
          },
          {
            path: "labels",
            element: <LabelsPage />,
          },
          {
            path: "smtp",
            element: <SmtpPage />,
          },
          {
            path: "captcha",
            element: <CaptchaPage />,
          },
        ],
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "charts",
        element: <Charts />,
      }
    ],
  },
]);
