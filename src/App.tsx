/** @format */

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/Search";

const router = createBrowserRouter([
	{ path: "/", element: <Home /> },
	{ path: "/search", element: <SearchPage /> },
	{ path: "*", element: <NotFound /> },
]);

export default function App() {
	return <RouterProvider router={router} />;
}
