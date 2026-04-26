import { RouterProvider } from 'react-router';
import { TitleScreen } from './components/TitleScreen';
import { CharacterCustomization } from './components/CharacterCustomization';
import { CityPage } from './components/CityPage';
import { Layout } from './components/Layout';
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: TitleScreen,
      },
      {
        path: "customization",
        Component: CharacterCustomization,
      },
      {
        path: "city",
        Component: CityPage,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
