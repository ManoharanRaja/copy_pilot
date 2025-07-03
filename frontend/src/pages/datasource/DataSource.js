import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Stack,
} from "@mui/material";

function DataSource() {
  const [sources, setSources] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const res = await axios.get("/datasources");
    setSources(res.data);
  };

  const handleEditPage = (id) => {
    navigate(`/datasource/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this data source?")) {
      await axios.delete(`/datasources/${id}`);
      fetchSources();
    }
  };

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        bgcolor: "transparent",
        px: { xs: 2, md: 6 },
        py: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Data Sources</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/datasource/new")}
        >
          Add New Data Source
        </Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Config</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sources.map((src) => (
              <TableRow key={src.id}>
                <TableCell>{src.name}</TableCell>
                <TableCell>{src.type}</TableCell>
                <TableCell>
                  {src.type === "Azure Data Lake Storage"
                    ? `Account: ${src.config.account_name}, Container: ${src.config.container}`
                    : src.type === "local"
                    ? `Path: ${src.config.path}`
                    : "-"}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEditPage(src.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDelete(src.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {sources.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No data sources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default DataSource;
