// pages/login.tsx
const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-xl">Login Page (No Layout)</h1>
    </div>
  );
};

// 👇 Remove layout for this page
LoginPage.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};

export default LoginPage;
  