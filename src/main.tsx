import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "@/providers/ThemeProvider";
import AppLayout from "@/routes/Layout";
import Ticketer from "@/routes/Ticketer";
import "@/css/index.css";
import "@/lib/palette/sync";
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

// History starts once saved stickers are back, so putting them back is not an undo step
void startSession().then(startHistory);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>,
);
