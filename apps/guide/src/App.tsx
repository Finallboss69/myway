import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RolePage from "./pages/RolePage";
import TutorialPage from "./pages/TutorialPage";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/rol/:roleId" element={<RolePage />} />
			<Route path="/tutorial/:screenId" element={<TutorialPage />} />
		</Routes>
	);
}
