import { supabase } from '@cuptrail/utils';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function AppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    // fetch curr session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      setSignedIn(Boolean(session));
      setUser(session?.user || null);
    });
    // updates when auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session));
      setUser(session?.user || null);
    });
    // cleanup if component unmounts
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (signedIn) {
    // if signed in, show avatar that links to profile
    const currentDisplayName = user?.user_metadata?.display_name || 'User';
    const initials = currentDisplayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

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
            <Avatar
              component={Link}
              to="/profile"
              sx={{
                cursor: 'pointer',
                bgcolor: 'primary.main',
                color: 'white',
                width: 40,
                height: 40,
                fontSize: '1rem',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              {initials}
            </Avatar>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    );
  }

  // if not signed in, show sign up and login buttons
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
          <Button
            component={Link}
            onClick={() => {
              if (location.pathname === '/auth') {
                navigate(0); // refresh the page
              } else {
                navigate('/auth'); // go to auth
              }
            }}
            to="/auth"
            variant="contained"
            size="small"
          >
            Login
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
