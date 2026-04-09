import React, { useEffect, useMemo, useState } from 'react'
import {
    getAdminRunners,
    getMyProfile,
    getMyTeammates,
    getPublicCharity,
    getPublicRace,
    getPublicSchedule,
    login,
    registerRunner,
} from './api'
import runImage from './assets/run.jpg'
import mapImage from './assets/map.jpg'

const pages = ['home', 'login', 'register', 'dashboard', 'admin']

export default function App() {
    const [page, setPage] = useState('home')
    const [token, setToken] = useState(localStorage.getItem('token') || '')
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('info')
    const [zoomedImage, setZoomedImage] = useState(false)

    const [charity, setCharity] = useState(null)
    const [race, setRace] = useState(null)
    const [schedule, setSchedule] = useState([])
    const [profile, setProfile] = useState(null)
    const [teammates, setTeammates] = useState([])
    const [adminRunners, setAdminRunners] = useState([])

    const [publicLoading, setPublicLoading] = useState(true)
    const [privateLoading, setPrivateLoading] = useState(false)
    const [loginLoading, setLoginLoading] = useState(false)
    const [registerLoading, setRegisterLoading] = useState(false)

    const [showPassword, setShowPassword] = useState(false)
    const [showRegisterPassword, setShowRegisterPassword] = useState(false)

    const [loginForm, setLoginForm] = useState({ email: '', password: '' })
    const [registerForm, setRegisterForm] = useState({
        name: '',
        email: '',
        age: '',
        emergencyPhone: '',
        password: '',
        teamName: '',
    })

    const [loginErrors, setLoginErrors] = useState({})
    const [registerErrors, setRegisterErrors] = useState({})

    useEffect(() => {
        loadPublicData()
    }, [])

    useEffect(() => {
        if (token) {
            loadPrivateData(token)
        } else {
            setProfile(null)
            setTeammates([])
            setAdminRunners([])
        }
    }, [token])

    function showMessage(text, type = 'info') {
        setMessage(text)
        setMessageType(type)
    }

    async function loadPublicData() {
        setPublicLoading(true)

        try {
            const [charityData, raceData, scheduleData] = await Promise.all([
                getPublicCharity(),
                getPublicRace(),
                getPublicSchedule(),
            ])

            setCharity(charityData)
            setRace(raceData)
            setSchedule(Array.isArray(scheduleData) ? scheduleData : [])
        } catch (error) {
            console.error('Public data load failed:', error)
            showMessage('Could not load public race information. Make sure the backend is running.', 'error')
            setCharity(null)
            setRace(null)
            setSchedule([])
        } finally {
            setPublicLoading(false)
        }
    }

    async function loadPrivateData(currentToken) {
        setPrivateLoading(true)

        try {
            const me = await getMyProfile(currentToken)
            setProfile(me)

            try {
                const mates = await getMyTeammates(currentToken)
                setTeammates(Array.isArray(mates) ? mates : [])
            } catch (error) {
                console.error('Teammate load failed:', error)
                setTeammates([])
            }

            if (me?.isAdmin) {
                try {
                    const runners = await getAdminRunners(currentToken)
                    setAdminRunners(Array.isArray(runners) ? runners : [])
                } catch (error) {
                    console.error('Admin runner load failed:', error)
                    setAdminRunners([])
                }
            } else {
                setAdminRunners([])
            }
        } catch (error) {
            console.error('Private data load failed:', error)
            localStorage.removeItem('token')
            setToken('')
            setProfile(null)
            setTeammates([])
            setAdminRunners([])
            showMessage('Your session could not be loaded. Please log in again.', 'error')
            setPage('login')
        } finally {
            setPrivateLoading(false)
        }
    }

    async function makeAdmin(id) {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/runners/${id}/make-admin`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await res.json()
            console.log(data)

            loadPrivateData() // refresh list
        } catch (err) {
            console.error(err)
        }
    }

    async function removeAdmin(id) {
        try {
            await fetch(`http://localhost:5000/api/admin/runners/${id}/remove-admin`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await res.json()
            console.log("demote result:", data)

            loadPrivateData(token)
        } catch (err) {
            console.error(err)
        }
    }
    function validateLogin() {
        const errors = {}

        if (!loginForm.email.trim()) {
            errors.email = 'Please enter your email.'
        }

        if (!loginForm.password.trim()) {
            errors.password = 'Please enter your password.'
        }

        return errors
    }

    function validateRegister() {
        const errors = {}

        if (!registerForm.name.trim()) {
            errors.name = 'Please enter your full name.'
        }

        if (!registerForm.email.trim()) {
            errors.email = 'Please enter your email.'
        } else if (!/^\S+@\S+\.\S+$/.test(registerForm.email.trim())) {
            errors.email = 'Please enter a valid email address.'
        }

        if (!registerForm.age.toString().trim()) {
            errors.age = 'Please enter your age.'
        } else if (Number.isNaN(Number(registerForm.age)) || Number(registerForm.age) <= 0) {
            errors.age = 'Age must be a positive number.'
        }

        if (!registerForm.emergencyPhone.trim()) {
            errors.emergencyPhone = 'Please enter an emergency phone number.'
        } else if (registerForm.emergencyPhone.trim().length < 7) {
            errors.emergencyPhone = 'Please enter a valid emergency phone number.'
        }

        if (!registerForm.password.trim()) {
            errors.password = 'Please create a password.'
        } else if (registerForm.password.length < 6) {
            errors.password = 'Password must be at least 6 characters.'
        }

        return errors
    }

    async function handleLogin(event) {
        event.preventDefault()
        setMessage('')
        const errors = validateLogin()
        setLoginErrors(errors)

        if (Object.keys(errors).length > 0) {
            showMessage('Please fix the login fields below.', 'error')
            return
        }

        setLoginLoading(true)

        try {
            const result = await login(loginForm.email.trim(), loginForm.password)

            if (result?.error) {
                showMessage(result.error, 'error')
                return
            }

            if (!result?.token) {
                showMessage('Login failed. No token was returned by the server.', 'error')
                return
            }

            localStorage.setItem('token', result.token)
            setToken(result.token)
            setLoginForm({ email: '', password: '' })
            showMessage('Login successful. Welcome back.', 'success')
            setPage('dashboard')
        } catch (error) {
            console.error('Login failed:', error)
            showMessage('Could not connect to the backend for login.', 'error')
        } finally {
            setLoginLoading(false)
        }
    }

    async function handleRegister(event) {
        event.preventDefault()
        setMessage('')
        const errors = validateRegister()
        setRegisterErrors(errors)

        if (Object.keys(errors).length > 0) {
            showMessage('Please fix the highlighted registration fields.', 'error')
            return
        }

        setRegisterLoading(true)

        try {
            const payload = {
                Name: registerForm.name.trim(),
                Email: registerForm.email.trim(),
                Age: Number(registerForm.age),
                EmergencyPhone: registerForm.emergencyPhone.trim(),
                Password: registerForm.password,
                TeamName: registerForm.teamName.trim() === '' ? null : registerForm.teamName.trim(),
            }

            const result = await registerRunner(payload)

            if (result?.error) {
                showMessage(result.error, 'error')
                return
            }

            if (Array.isArray(result?.errors) && result.errors.length > 0) {
                showMessage(result.errors.join(' '), 'error')
                return
            }

            setRegisterForm({
                name: '',
                email: '',
                age: '',
                emergencyPhone: '',
                password: '',
                teamName: '',
            })
            setRegisterErrors({})
            showMessage('Registration successful. You can now log in.', 'success')
            setPage('login')
        } catch (error) {
            console.error('Register failed:', error)
            showMessage('Could not connect to the backend for registration.', 'error')
        } finally {
            setRegisterLoading(false)
        }
    }

    function logout() {
        localStorage.removeItem('token')
        setToken('')
        setProfile(null)
        setTeammates([])
        setAdminRunners([])
        setPage('home')
        showMessage('Logged out.', 'info')
    }

    const messageStyle = useMemo(() => {
        if (messageType === 'success') {
            return {
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
            }
        }

        if (messageType === 'error') {
            return {
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
            }
        }

        return {
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e3a8a',
        }
    }, [messageType])

    const teamCount = teammates.length
    const scheduleItems = Array.isArray(schedule) ? schedule : []

    return (
        <div className="app-shell">
            <header
                className="topbar"
                style={{
                    background: 'white',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                }}
            >
                <div>
                    <h1 style={{ margin: 0 }}>
                        {charity?.charityName || charity?.CharityName || 'Run for Bright Futures'}
                    </h1>
                    <p className="subtitle" style={{ maxWidth: '700px' }}>
                        {charity?.description ||
                            charity?.Description ||
                            'A community 5K supporting children’s education and after-school programs.'}
                    </p>
                </div>

                <nav className="nav">
                    {pages.map((item) => (
                        <button
                            key={item}
                            onClick={() => setPage(item)}
                            className={page === item ? 'active' : ''}
                            type="button"
                        >
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                        </button>
                    ))}
                    {token && (
                        <button onClick={logout} type="button">
                            Logout
                        </button>
                    )}
                </nav>
            </header>

            {message && (
                <div className="message-box" style={messageStyle}>
                    {message}
                </div>
            )}

            <main className="main-grid">
                {page === 'home' && (
                    <div className="home-layout">

                        {/* LEFT SIDE */}
                        <section className="panel">
                            <div
                                style={{
                                    display: 'grid',
                                    gap: '1rem',
                                }}
                            >
                                <div
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '14px',
                                        padding: '1rem',
                                    }}
                                >
                                    <h2 style={{ marginTop: 0 }}>Welcome to the race</h2>
                                    <p style={{ marginTop: 0 }}>
                                        Register online, check race details, log in to view your runner dashboard, and
                                        organize with teammates before race day.
                                    </p>

                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <button type="button" onClick={() => setPage('register')}>
                                            Register Now
                                        </button>
                                        <button type="button" onClick={() => setPage('login')}>
                                            Runner Login
                                        </button>
                                    </div>
                                </div>

                                {publicLoading ? (
                                    <div className="panel" style={{ padding: '1rem' }}>
                                        Loading race information...
                                    </div>
                                ) : (
                                    <div className="card-grid">
                                        <article className="card">
                                            <h3 style={{ marginTop: 0 }}>Charity</h3>
                                            <p>
                                                <strong>Name:</strong>{' '}
                                                {charity?.charityName || charity?.CharityName || 'Not available'}
                                            </p>
                                            <p>
                                                <strong>Announcement:</strong>{' '}
                                                {charity?.publicAnnouncement || charity?.PublicAnnouncement || 'Not available'}
                                            </p>
                                            <p style={{ marginBottom: 0 }}>
                                                {charity?.description || charity?.Description || 'No description available.'}
                                            </p>
                                        </article>

                                        <article className="card">
                                            <h3 style={{ marginTop: 0 }}>Race Details</h3>
                                            <p>
                                                <strong>Date:</strong> {race?.raceDate || race?.RaceDate || 'Not available'}
                                            </p>
                                            <p>
                                                <strong>Location:</strong>{' '}
                                                {race?.location || race?.Location || 'Not available'}
                                            </p>
                                            <p>
                                                <strong>Distance:</strong>{' '}
                                                {race?.distance || race?.Distance || 'Not available'}
                                            </p>
                                            <p style={{ marginBottom: 0 }}>
                                                <strong>Start Time:</strong>{' '}
                                                {race?.startTime || race?.StartTime || 'Not available'}
                                                </p>

                                                <div style={{ marginTop: '1rem' }}>
                                                    <img
                                                        src={mapImage}
                                                        alt="Race Route Map"
                                                        onClick={() => {
                                                            console.log("clicked")
                                                            setZoomedImage(true)
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            borderRadius: '12px',
                                                            border: '1px solid #e5e7eb',
                                                            cursor: 'pointer'
                                                        }}
                                                    /> 
                                                    <p style={{ fontSize: '1rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                                        Race route through Charleston Waterfront Park
                                                    </p>
                                                </div>
                                        </article>

                                        <article className="card wide-card">
                                            <h3 style={{ marginTop: 0 }}>Race Day Schedule</h3>
                                            {scheduleItems.length === 0 ? (
                                                <p style={{ marginBottom: 0 }}>No schedule is available yet.</p>
                                            ) : (
                                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                    {scheduleItems.map((item, index) => (
                                                        <div
                                                            key={`${item.time || item.Time || 'time'}-${index}`}
                                                            style={{
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '10px',
                                                                padding: '0.75rem',
                                                                background: 'white',
                                                            }}
                                                        >
                                                            <strong>{item.time || item.Time || 'Time TBD'}</strong>
                                                            <div>{item.title || item.Title || 'Activity'}</div>
                                                            <div style={{ color: '#4b5563' }}>
                                                                {item.description || item.Description || ''}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </article>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* RIGHT SIDE IMAGE */}
                        <div className="side-image">
                            <img src={runImage} alt="Race" />
                        </div>

                    </div>
                )}

                {page === 'login' && (
                    <section className="panel narrow-panel">
                        <h2 style={{ marginTop: 0 }}>Runner Login</h2>
                        <p style={{ color: '#4b5563' }}>
                            Use the email and password you registered with to access your dashboard.
                        </p>

                        <form onSubmit={handleLogin} className="form-stack" noValidate>
                            <label>
                                Email
                                <input
                                    type="email"
                                    placeholder="runner@example.com"
                                    value={loginForm.email}
                                    onChange={(e) => {
                                        setLoginForm({ ...loginForm, email: e.target.value })
                                        if (loginErrors.email) {
                                            setLoginErrors({ ...loginErrors, email: '' })
                                        }
                                    }}
                                />
                                {loginErrors.email && (
                                    <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>{loginErrors.email}</span>
                                )}
                            </label>

                            <label>
                                Password
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={loginForm.password}
                                    onChange={(e) => {
                                        setLoginForm({ ...loginForm, password: e.target.value })
                                        if (loginErrors.password) {
                                            setLoginErrors({ ...loginErrors, password: '' })
                                        }
                                    }}
                                />
                                {loginErrors.password && (
                                    <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
                                        {loginErrors.password}
                                    </span>
                                )}
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={() => setShowPassword((value) => !value)}
                                />
                                Show password
                            </label>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button type="submit" disabled={loginLoading}>
                                    {loginLoading ? 'Logging in...' : 'Login'}
                                </button>
                                <button type="button" onClick={() => setPage('register')}>
                                    Need an account?
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {page === 'register' && (
                    <section className="panel narrow-panel">
                        <h2 style={{ marginTop: 0 }}>Register for the 5K</h2>
                        <p style={{ color: '#4b5563' }}>
                            Enter your runner information below. Team name is optional, and the emergency phone
                            helps race staff respond quickly if needed.
                        </p>

                        <form onSubmit={handleRegister} className="form-stack" noValidate>
                            <div
                                style={{
                                    display: 'grid',
                                    gap: '0.9rem',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                }}
                            >
                                <label>
                                    Name
                                    <input
                                        value={registerForm.name}
                                        placeholder="Jordan Lee"
                                        onChange={(e) => {
                                            setRegisterForm({ ...registerForm, name: e.target.value })
                                            if (registerErrors.name) {
                                                setRegisterErrors({ ...registerErrors, name: '' })
                                            }
                                        }}
                                    />
                                    {registerErrors.name && (
                                        <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
                                            {registerErrors.name}
                                        </span>
                                    )}
                                </label>

                                <label>
                                    Email
                                    <input
                                        type="email"
                                        value={registerForm.email}
                                        placeholder="runner@example.com"
                                        onChange={(e) => {
                                            setRegisterForm({ ...registerForm, email: e.target.value })
                                            if (registerErrors.email) {
                                                setRegisterErrors({ ...registerErrors, email: '' })
                                            }
                                        }}
                                    />
                                    {registerErrors.email && (
                                        <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
                                            {registerErrors.email}
                                        </span>
                                    )}
                                </label>

                                <label>
                                    Age
                                    <input
                                        value={registerForm.age}
                                        placeholder="21"
                                        onChange={(e) => {
                                            setRegisterForm({ ...registerForm, age: e.target.value })
                                            if (registerErrors.age) {
                                                setRegisterErrors({ ...registerErrors, age: '' })
                                            }
                                        }}
                                    />
                                    {registerErrors.age && (
                                        <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
                                            {registerErrors.age}
                                        </span>
                                    )}
                                </label>

                                <label>
                                    Emergency Phone
                                    <input
                                        value={registerForm.emergencyPhone}
                                        placeholder="843-555-1234"
                                        onChange={(e) => {
                                            setRegisterForm({ ...registerForm, emergencyPhone: e.target.value })
                                            if (registerErrors.emergencyPhone) {
                                                setRegisterErrors({ ...registerErrors, emergencyPhone: '' })
                                            }
                                        }}
                                    />
                                    {registerErrors.emergencyPhone && (
                                        <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
                                            {registerErrors.emergencyPhone}
                                        </span>
                                    )}
                                </label>

                                <label>
                                    Password
                                    <input
                                        type={showRegisterPassword ? 'text' : 'password'}
                                        value={registerForm.password}
                                        placeholder="At least 6 characters"
                                        onChange={(e) => {
                                            setRegisterForm({ ...registerForm, password: e.target.value })
                                            if (registerErrors.password) {
                                                setRegisterErrors({ ...registerErrors, password: '' })
                                            }
                                        }}
                                    />
                                    {registerErrors.password && (
                                        <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
                                            {registerErrors.password}
                                        </span>
                                    )}
                                </label>

                                <label>
                                    Team Name (optional)
                                    <input
                                        value={registerForm.teamName}
                                        placeholder="Fast Feet"
                                        onChange={(e) => setRegisterForm({ ...registerForm, teamName: e.target.value })}
                                    />
                                </label>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={showRegisterPassword}
                                    onChange={() => setShowRegisterPassword((value) => !value)}
                                />
                                Show password
                            </label>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button type="submit" disabled={registerLoading}>
                                    {registerLoading ? 'Creating Account...' : 'Create Account'}
                                </button>
                                <button type="button" onClick={() => setPage('home')}>
                                    Back to Home
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {page === 'dashboard' && (
                    <section className="panel">
                        <h2 style={{ marginTop: 0 }}>Runner Dashboard</h2>

                        {!token ? (
                            <div className="card">
                                <p>You are not logged in yet.</p>
                                <button type="button" onClick={() => setPage('login')}>
                                    Go to Login
                                </button>
                            </div>
                        ) : privateLoading ? (
                            <div className="card">Loading your runner information...</div>
                        ) : (
                            <div className="card-grid">
                                <article className="card">
                                    <h3 style={{ marginTop: 0 }}>Welcome</h3>
                                    <p>
                                        <strong>Name:</strong> {profile?.name || profile?.Name || 'Unknown'}
                                    </p>
                                    <p>
                                        <strong>Email:</strong> {profile?.email || profile?.Email || 'Unknown'}
                                    </p>
                                    <p>
                                        <strong>Team:</strong>{' '}
                                        {profile?.teamName || profile?.TeamName || 'No team selected'}
                                    </p>
                                    <p style={{ marginBottom: 0 }}>
                                        <strong>Status:</strong> {profile?.isAdmin || profile?.IsAdmin ? 'Admin' : 'Runner'}
                                    </p>
                                </article>

                                <article className="card">
                                    <h3 style={{ marginTop: 0 }}>My Team</h3>
                                    {teamCount === 0 ? (
                                        <p style={{ marginBottom: 0 }}>
                                            You do not have any teammates listed yet.
                                        </p>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                                            {teammates.map((mate, index) => (
                                                <div
                                                    key={`${mate.id || mate.Id || index}`}
                                                    style={{
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '10px',
                                                        padding: '0.75rem',
                                                        background: 'white',
                                                    }}
                                                >
                                                    <strong>{mate.name || mate.Name || 'Runner'}</strong>
                                                    <div>{mate.email || mate.Email || ''}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </article>

                                <article className="card">
                                    <h3 style={{ marginTop: 0 }}>Race Day Checklist</h3>
                                    <ul style={{ paddingLeft: '1.1rem', marginBottom: 0 }}>
                                        <li>Bring a photo ID.</li>
                                        <li>Arrive early for check-in.</li>
                                        <li>Keep your emergency contact current.</li>
                                        <li>Review the race schedule before race day.</li>
                                    </ul>
                                </article>

                                <article className="card wide-card">
                                    <h3 style={{ marginTop: 0 }}>Schedule</h3>
                                    {scheduleItems.length === 0 ? (
                                        <p style={{ marginBottom: 0 }}>No schedule available.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                                            {scheduleItems.map((item, index) => (
                                                <div
                                                    key={`${item.time || item.Time || 'schedule'}-${index}`}
                                                    style={{
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '10px',
                                                        padding: '0.75rem',
                                                        background: 'white',
                                                    }}
                                                >
                                                    <strong>{item.time || item.Time || 'Time TBD'}</strong>
                                                    <div>{item.title || item.Title || 'Event'}</div>
                                                    <div style={{ color: '#4b5563' }}>
                                                        {item.description || item.Description || ''}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            </div>
                        )}
                    </section>
                )}

                {page === 'admin' && (
                    <section className="panel">
                        <h2 style={{ marginTop: 0 }}>Admin</h2>

                        {!token ? (
                            <p>Please log in first.</p>
                        ) : privateLoading ? (
                            <p>Loading admin tools...</p>
                        ) : !profile?.isAdmin && !profile?.IsAdmin ? (
                            <p>You must be an admin to use this page.</p>
                        ) : (
                            <div className="card">
                                <h3 style={{ marginTop: 0 }}>Registered Runners</h3>

                                {adminRunners.length === 0 ? (
                                    <p style={{ marginBottom: 0 }}>No runner data available.</p>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table
                                            style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                background: 'white',
                                            }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th style={tableHeadStyle}>ID</th>
                                                    <th style={tableHeadStyle}>Name</th>
                                                    <th style={tableHeadStyle}>Email</th>
                                                    <th style={tableHeadStyle}>Age</th>
                                                    <th style={tableHeadStyle}>Team</th>
                                                    <th style={tableHeadStyle}>Admin</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {adminRunners.map((runner, index) => (
                                                    <tr key={`${runner.id || runner.Id || index}`}>
                                                        <td style={tableCellStyle}>{runner.id || runner.Id}</td>
                                                        <td style={tableCellStyle}>{runner.name || runner.Name}</td>
                                                        <td style={tableCellStyle}>{runner.email || runner.Email}</td>
                                                        <td style={tableCellStyle}>{runner.age || runner.Age}</td>
                                                        <td style={tableCellStyle}>
                                                            {runner.teamName || runner.TeamName || '—'}
                                                        
                                                        </td>
                                                        <td style={tableCellStyle}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                                                                {/* LEFT: Yes / No */}
                                                                <span>
                                                                    {runner.isAdmin || runner.IsAdmin ? 'Yes' : 'No'}
                                                                </span>

                                                                {/* RIGHT: BUTTON */}
                                                                <div>
                                                                    {runner.isAdmin || runner.IsAdmin ? (
                                                                        <button
                                                                            onClick={() => removeAdmin(runner.id || runner.Id)}
                                                                            style={{
                                                                                marginLeft: '10px',
                                                                                background: '#7f1d1d',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                padding: '6px 10px',
                                                                                borderRadius: '6px',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            Demote
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => makeAdmin(runner.id || runner.Id)}
                                                                            style={{
                                                                                marginLeft: '10px',
                                                                                background: '#065f46',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                padding: '6px 10px',
                                                                                borderRadius: '6px',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            Make Admin
                                                                        </button>
                                                                    )}
                                                                </div>

                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </main>
            {zoomedImage && (
                <div
                    onClick={() => setZoomedImage(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 999
                    }}
                >
                    <img
                        src={mapImage}
                        alt="Zoomed Map"
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            borderRadius: '12px'
                        }}
                    />
                </div>
            )}
        </div>
    )
}

const tableHeadStyle = {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
    background: '#f8fafc',
}

const tableCellStyle = {
    padding: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
}