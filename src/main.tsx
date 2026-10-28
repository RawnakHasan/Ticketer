import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "@/providers/ThemeProvider";
import AppLayout from "@/routes/Layout";
import Ticketer from "@/routes/Ticketer";
import "@/css/index.css";
import "@/lib/palette/sync";

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

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>,
);
