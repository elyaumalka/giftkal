import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If running as installed PWA, redirect to saved kiosk page
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      const savedHallId = localStorage.getItem("kiosk_hall_id");
      if (savedHallId) {
        navigate(`/kiosk/${savedHallId}`, { replace: true });
        return;
      }
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;
