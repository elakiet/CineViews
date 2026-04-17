import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => (
  <nav style={styles.nav}>
    <span style={styles.logo}>🎬 CineViews</span>
    <div style={styles.links}>
      <NavLink to="/"           style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.active : {}) })}>Predictor</NavLink>
      <NavLink to="/recommend"  style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.active : {}) })}>Recommend</NavLink>
      <NavLink to="/dashboard"  style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.active : {}) })}>Analytics</NavLink>
    </div>
  </nav>
);

const styles = {
  nav: {
    position: "fixed",
    top: 0, left: 0, right: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 32px",
    background: "rgba(10,12,18,0.88)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  logo: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: "22px",
    letterSpacing: "2px",
    background: "linear-gradient(135deg, #00e8b5, #ff7a3d)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  links: { display: "flex", gap: "8px" },
  link: {
    padding: "7px 18px",
    borderRadius: "30px",
    color: "#8892a4",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s",
    border: "1px solid transparent",
  },
  active: {
    color: "#00e8b5",
    background: "rgba(0,232,181,0.1)",
    border: "1px solid rgba(0,232,181,0.25)",
  },
};

export default Navbar;