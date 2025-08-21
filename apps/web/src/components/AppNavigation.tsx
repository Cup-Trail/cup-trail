import {
  AppBar,
  Avatar,
  Box,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link, Outlet } from 'react-router-dom';

export default function AppNavigation() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid #eee' }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 700 }}
          >
            Cup Trail
          </Typography>
          {/* TODO: add user avatar */}
          <Avatar>A</Avatar>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
