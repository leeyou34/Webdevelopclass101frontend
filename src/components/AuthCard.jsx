import { Alert, Box, Paper, Stack, Typography } from "@mui/material";

/** 로그인·회원가입 화면 공통 틀 */
export default function AuthCard({ title, subtitle, error, onSubmit, children, footer }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", px: 2, pt: { xs: 6, sm: 10 } }}>
      <Paper variant="outlined" sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 4 } }}>
        <Stack component="form" spacing={2.5} noValidate onSubmit={onSubmit}>
          <Box>
            <Typography variant="h5" component="h1" fontWeight={700}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          {children}
          {footer}
        </Stack>
      </Paper>
    </Box>
  );
}
