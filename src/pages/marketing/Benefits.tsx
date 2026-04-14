import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

// Benefits content is now integrated into the main pages.
// This page redirects to the home page.
const Benefits = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
      <div className="text-center px-4">
        <span className="text-5xl mb-6 block">💎</span>
        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
          כל היתרונות נמצאים בדפים הראשיים
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          בקרו בדף בעלי אירועים או בעלי אולמות לפירוט מלא
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/event-owners">
            <Button variant="gold" size="lg">בעלי אירועים</Button>
          </Link>
          <Link to="/venues-page">
            <Button variant="outline" size="lg">בעלי אולמות</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="lg">
              <Gift className="w-4 h-4 ml-2" />
              דף הבית
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Benefits;
