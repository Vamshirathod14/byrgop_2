import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { hasPermission } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import Sessions from './pages/Sessions.jsx';
import KySessions from './pages/KySessions.jsx';
import Contacts from './pages/Contacts.jsx';
import WebsiteContacts from './pages/WebsiteContacts.jsx';
import OnboardingQuestions from './pages/OnboardingQuestions.jsx';
import KnowYourselfQuestions from './pages/KnowYourselfQuestions.jsx';
import KYCategories from './pages/KYCategories.jsx';
import Categories from './pages/Categories.jsx';
import Domains from './pages/Domains.jsx';
import BusinessTypes from './pages/BusinessTypes.jsx';
import Stages from './pages/Stages.jsx';
import Results from './pages/Results.jsx';
import Admins from './pages/Admins.jsx';
import ActivityLog from './pages/ActivityLog.jsx';
import Profile from './pages/Profile.jsx';

function Shell() {
  const { admin, loading } = useAuth();
  const [tab, setTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <p className="text-sm text-mist-muted">Loading…</p>
      </div>
    );
  }

  if (!admin) return <Login />;

  const can = (perm) => hasPermission(admin, perm);

  const section = (key, el) =>
    tab === key ? (
      <div key={key}>{el}</div>
    ) : null;

  return (
    <Layout active={tab} onNavigate={setTab}>
      {can('dashboard.view') && section('dashboard', <Dashboard />)}
      {can('dashboard.view') && section('analytics', <Analytics />)}
      {can('sessions.view') && section('assessments', <Sessions />)}
      {can('contacts.view') && section('kySessions', <KySessions />)}
      {can('contacts.view') && section('contacts', <Contacts />)}
      {can('contacts.view') && section('websiteContacts', <WebsiteContacts />)}
      {can('questions.view') && section('onboardingQuestions', <OnboardingQuestions />)}
      {can('questions.view') && section('kyQuestions', <KnowYourselfQuestions />)}
      {can('results.manage') && section('kyResultCategories', <KYCategories />)}
      {can('domains.view') && section('businessTypes', <BusinessTypes />)}
      {can('domains.view') && section('domains', <Domains />)}
      {can('domains.view') && section('categories', <Categories />)}
      {can('stages.manage') && section('stages', <Stages />)}
      {can('results.manage') && section('results', <Results />)}
      {section('profile', <Profile />)}
      {admin.role === 'SUPER_ADMIN' && can('admins.view') && section('admins', <Admins />)}
      {can('audit.view') && section('activity', <ActivityLog />)}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}