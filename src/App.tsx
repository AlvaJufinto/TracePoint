/** @format */

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./pages/Home";
import Investigation from "./pages/Investigation";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/Search";
import Trace from "./pages/Trace";

const router = createBrowserRouter([
	{ path: "/", element: <Home /> },
	{ path: "/search", element: <SearchPage /> },
	{ path: "/trace", element: <Trace /> },
	{ path: "/investigation", element: <Investigation /> },

	{ path: "*", element: <NotFound /> },
]);

export default function App() {
	return <RouterProvider router={router} />;
}
