export async function POST() {
  const response = Response.json({ success: true, data: { message: 'Logged out' } });
  response.headers.set('Set-Cookie', 'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return response;
}
