import { useState } from "react";

function App() {
  const [page, setPage] = useState("home");

  return (
    <div style={{ padding: 20 }}>
      <h1>Hope Stride Foundation 5K</h1>

      {/* Navigation */}
      <nav style={{ marginBottom: 20 }}>
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("about")}>About</button>
        <button onClick={() => setPage("event")}>Event Info</button>
        <button onClick={() => setPage("register")}>Register</button>
      </nav>

      {/* Pages */}
      {page === "home" && (
        <div>
          <h2>Welcome</h2>
          <p>
            Join us on June 19th for our Charity 5K run to support families in
            need. Walk, run, or cheer—everyone is welcome!
          </p>
        </div>
      )}

      {page === "about" && (
        <div>
          <h2>About Us</h2>
          <p>
            Hope Stride Foundation is a nonprofit focused on helping local
            communities through outreach and support programs.
          </p>
        </div>
      )}

      {page === "event" && (
        <div>
          <h2>Event Info</h2>
          <p>Date: June 19th</p>
          <p>Location: City Park</p>
          <p>Time: 8:00 AM</p>
        </div>
      )}

      {page === "register" && <RegisterForm />}
    </div>
  );
}

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Registered: ${name} (${email})`);
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <br /><br />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}

export default App;
