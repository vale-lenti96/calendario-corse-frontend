import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch races dal backend
  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://backend-db-corse-v2.onrender.com/races");
        const data = await res.json();
        setRaces(data);
      } catch (err) {
        console.error("Errore fetch races:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRaces();
  }, []);

  return (
    <div className="App">

      {/* HERO con immagine */}
      <section
        className="hero"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          padding: "120px 40px",
          textAlign: "center"
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: "bold" }}>
          Corri. Scopri. Superati.
        </h1>
        <p style={{ fontSize: "1.5rem", marginTop: "20px" }}>
          Trova la tua prossima sfida, costruisci il tuo percorso e vivi l’avventura della corsa.
        </p>
        <div style={{ marginTop: "40px" }}>
          <button className="cta">Trova la tua gara</button>
          <button className="cta" style={{ marginLeft: "20px" }}>
            Esplora Trail
          </button>
        </div>
      </section>

      {/* SEZIONE GARE IN EVIDENZA */}
      <section
        style={{
          backgroundImage: "url('/section-bg.jpg')",
          backgroundSize: "cover",
          padding: "80px 40px"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "40px" }}>
          Gare in evidenza
        </h2>
        {loading ? (
          <p>Caricamento gare...</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px"
            }}
          >
            {races.slice(0, 6).map((r, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "20px",
                  background: "#fff"
                }}
              >
                <h3>{r.race_name}</h3>
                <p>{r.date}</p>
                <p>
                  {r.location_city}, {r.location_country}
                </p>
                <p>{r.distance_km} km • {r.race_type}</p>
                <button className="cta">Dettagli</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEZIONE PERCHE RUNSHIFT */}
      <section
        style={{
          backgroundImage: "url('/paper-texture.jpg')",
          backgroundSize: "cover",
          padding: "80px 40px"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "40px" }}>
          Perché Runshift
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "40px"
          }}
        >
          <div style={{ flex: "1 1 300px", textAlign: "center" }}>
            <h3>🌍 Esplora</h3>
            <p>Scopri gare in tutto il mondo e unisci sport, viaggi e avventura.</p>
          </div>
          <div style={{ flex: "1 1 300px", textAlign: "center" }}>
            <h3>🏔 Vivi l’avventura</h3>
            <p>Corri tra città storiche, montagne e paesaggi mozzafiato.</p>
          </div>
          <div style={{ flex: "1 1 300px", textAlign: "center" }}>
            <h3>⏱ Superati</h3>
            <p>Pianifica le tue gare e costruisci un percorso verso i tuoi obiettivi.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#0B5D41",
          color: "white",
          textAlign: "center",
          padding: "40px"
        }}
      >
        <p>© 2025 Runshift - Corri. Scopri. Superati.</p>
      </footer>
    </div>
  );
}

export default App;
