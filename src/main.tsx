import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "@/providers/ThemeProvider";
import AppLayout from "@/routes/Layout";
import Ticketer from "@/routes/Ticketer";
import "@/css/index.css";
import "@/lib/palette/sync";
import { importSharedLink } from "@/lib/ticket/share";
import { startSession } from "@/lib/ticket/session";
import { startHistory } from "@/stores/historyStore";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Ticketer />,
      },
    ],
  },
]);

// A shared link wins over what was saved. History starts last, so neither is an undo step.
void startSession().then(importSharedLink).then(startHistory);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>,
);
