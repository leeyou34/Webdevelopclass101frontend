import { Alert, Box, Link, Paper, Stack, Typography } from "@mui/material";
import { HOME_LABEL, HOME_URL } from "../homeLink.js";

/** 로그인·회원가입 화면 공통 틀 */
export default function AuthCard({ title, subtitle, error, onSubmit, children, footer }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", px: 2, pt: { xs: 4, sm: 8 } }}>
      {HOME_URL && (
        <Link href={HOME_URL} underline="hover" sx={{ alignSelf: "center", mb: 2, width: "100%", maxWidth: 420 }}>
          ← {HOME_LABEL}로 돌아가기
        </Link>
      )}
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
