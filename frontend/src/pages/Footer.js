import React from "react";
import { Box, Typography, Link as MuiLink } from "@mui/material";

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 0, // No margin top
        py: 3,
        background: "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)",
        textAlign: "center",
        fontSize: 14,
        color: "#64748b",
        borderTop: "none",
        boxShadow: "none", // Remove shadow
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        © {new Date().getFullYear()} Developed by the Automation Team.
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        For support, contact:{" "}
        <MuiLink
          href="mailto:automation-team@example.com"
          underline="hover"
          color="inherit"
          sx={{ fontWeight: 500 }}
        >
          automation-team@example.com
        </MuiLink>
      </Typography>
    </Box>
  );
}

export default Footer;
