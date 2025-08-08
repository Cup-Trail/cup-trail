import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 700 }}>
            Cup Trail
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}


