import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import SurveyPage from "./pages/SurveyPage";
import ResultsPage from "./pages/ResultsPage";
import ThankYouPage from "./pages/ThankYouPage";
import LoginPage from "./pages/LoginPage";
import QuestionsPage from "./pages/admin/QuestionsPage";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<QuestionsPage />} />
        <Route path="/admin/questions" element={<QuestionsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
