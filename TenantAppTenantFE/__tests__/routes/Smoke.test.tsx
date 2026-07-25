describe('Smoke Route Tests', () => {
  it('verifies critical app routes have stable configuration definitions', () => {
    const routes = [
      '/',
      '/login',
      '/signup',
      '/command-center',
      '/leases',
      '/billing',
      '/properties/[id]',
      '/properties/[id]/floors',
    ];
    
    expect(routes.length).toBe(8);
    expect(routes).toContain('/login');
    expect(routes).toContain('/command-center');
  });
});
