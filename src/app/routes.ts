import { createBrowserRouter } from "react-router";
import App from "./App";
import { TitleScreen } from "./components/TitleScreen";

// We'll use the App component as the layout or just route directly to TitleScreen
// The user asked for a "Title Screen", but also an "Interactive Experience"
// For now, the title screen IS the experience requested.
// I'll assume there might be a "Game" route later, but for now we just show the title screen.

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
]);
