import { useState } from 'react';
import Logo from './components/Logo.jsx';
import RegistrationScreen from './screens/RegistrationScreen.jsx';
import SuccessScreen from './screens/SuccessScreen.jsx';
import CheckInScreen from './screens/CheckInScreen.jsx';
import { useRoute } from './lib/router.js';

function Header({ mode }) {
  return (
    <div className="topbar">
      <Logo src="/assets/bni.jpeg" alt="BNI" side="left" />
      <div className="header-center">
        {mode === 'checkin' ? (
          <>
            <h1 className="event-heading event-heading-sm">Visitor Check-in</h1>
          </>
        ) : (
          <>
            <h1 className="event-heading">12th Anniversary Visitor</h1>
            <p className="event-sub">Member</p>
          </>
        )}
      </div>
      <Logo src="/assets/aces.jpeg" alt="ACES" side="right" />
    </div>
  );
}

export default function App() {
  const { route } = useRoute();
  const [registration, setRegistration] = useState(null);

  const onRegistered = (data) => {
    setRegistration(data);
  };

  const onRegistrationDone = () => {
    setRegistration(null);
  };

  return (
    <>
      <div className={route === 'checkin' ? 'page page-checkin' : 'page'}>
        <Header mode={route} />
        {route === 'checkin' ? (
          <CheckInScreen />
        ) : registration ? (
          <SuccessScreen registration={registration} onDone={onRegistrationDone} />
        ) : (
          <RegistrationScreen onRegistered={onRegistered} />
        )}
      </div>
    </>
  );
}