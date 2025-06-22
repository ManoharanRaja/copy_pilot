import React from "react";

function Footer() {
  return (
    <footer
      style={{
        marginTop: 40,
        padding: "16px 0",
        background: "#f8f8f8",
        textAlign: "center",
        fontSize: 14,
        color: "#888",
        borderTop: "1px solid #eee",
      }}
    >
      © {new Date().getFullYear()} Developed by the Automation Team.
      <br />
      For support, contact:{" "}
      <a href="mailto:automation-team@example.com">
        automation-team@example.com
      </a>
    </footer>
  );
}

export default Footer;
