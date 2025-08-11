import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import ProfileSetup from './pages/ProfileSetup';
import TutorSession from './pages/TutorSession';
import Exercises from './pages/Exercises';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Toaster position="top-center" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<ProfileSetup />} />
            <Route path="/session" element={<TutorSession />} />
            <Route path="/exercises" element={<Exercises />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;