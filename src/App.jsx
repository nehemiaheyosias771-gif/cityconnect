import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import CommunityBoard from './pages/CommunityBoard';
import Analytics from './pages/Analytics';
import Map from './pages/Map';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path='/' element={<Login />} />
                <Route path='/signup' element={<Signup />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/report-issue' element={<ReportIssue />} />
                <Route path='/community-board' element={<CommunityBoard />} />
                <Route path='/analytics' element={<Analytics />} />
                <Route path='/map' element={<Map />} />
            </Routes>
        </Router>
    );
};

export default App;