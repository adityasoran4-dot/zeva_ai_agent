// pages/404.tsx
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
    </div>
  );
};

NotFoundPage.getLayout = (page: React.ReactNode) => page;

export default NotFoundPage;
